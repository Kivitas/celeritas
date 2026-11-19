/**
 * @license
 * SPDX-License-Identifier: MIT
 */

/**
 * Photon-level Monte Carlo for the Cherenkov yield (plan T4.1, partial).
 *
 * Each primary is stepped along its path (energy loss where the material has stopping data). In
 * each step the number of emitted photons is Poisson with the analytic mean for that step. Each
 * photon gets a wavelength sampled from the Frank-Tamm distribution on the spectral bins, and is
 * detected with probability = absorption transmission from its emission point times detector
 * efficiency. Results are per primary, with statistical standard errors.
 *
 * Not included yet (plan T4.1): multiple scattering, delta rays, Fresnel reflection and total
 * internal reflection at the exit face, and angular distributions for the detector.
 * Same-seed runs are bit-identical. The generator is seeded; Math.random is not used.
 */

import type { SimulationParams, MaterialPreset, IsotopeProfile, DetectorSettings } from "../types";
import { Rng } from "./rng";
import { ELECTRON_MASS_MEV, FINE_STRUCTURE_CONSTANT, STANDARD_TEMP_K, DEFAULT_FIRED_PARTICLES, DEFAULT_BIN_RESOLUTION_NM } from "./constants";
import { oneMinusBetaFromEnergy } from "./kinematics";
import { sin2ThetaFromDelta } from "./cherenkov";
import { getRefractiveIndexAt } from "./dispersion";
import { DECAY_LENGTH_M, particleMassMeV } from "../data/particles";
import { tabulatedAbsorptionPerMm, getMediumCoefficients, calculateEffectiveAttenuation } from "./transport";
import { sampleEnergyLossPath, BETHE_K_MEV_CM2_PER_MOL } from "./stopping";
import { resolveParticleMassMeV } from "./simulate";

/** Switches for the physics included in a run. All default to on. */
export interface McOptions {
  /** Step the primary through the radiator with collision energy loss (only where the material has stopping data). */
  energyLoss: boolean;
  /** Apply optical absorption between the emission point and the exit face. */
  absorption: boolean;
  /** Apply detector quantum efficiency and DAQ dead time. */
  detectorEfficiency: boolean;
  /** Knock-on electrons above the Cherenkov threshold, each followed with its own energy loss. Needs stopping data. */
  deltaRays: boolean;
  /** Decay in flight for muons, charged pions and kaons. A decaying muon's Michel electron is followed. */
  decayInFlight: boolean;
  /**
   * Charged secondaries produced elsewhere, for example by PYTHIA 8, HERWIG or Geant4, grouped by event.
   * Each primary draws one event at random and its particles are followed through the radiator.
   */
  externalEvents?: ExternalParticle[][];
}

export interface ExternalParticle {
  pdgId: number;
  kineticMeV: number;
  /** Birth depth inside the radiator, mm from the entrance face. */
  xMm: number;
}

export const MC_DEFAULT_OPTIONS: McOptions = {
  energyLoss: true,
  absorption: true,
  detectorEfficiency: true,
  deltaRays: true,
  decayInFlight: true,
};

export interface McResult {
  primaries: number;
  /** Detected photons for each primary, in run order (for distributions). */
  detectedPerPrimary: number[];
  seed: number;
  /** Mean detected photons per primary. */
  meanDetectedPerParticle: number;
  /** Standard error of the mean. */
  stdErrDetectedPerParticle: number;
  /** Detected photons per primary from the primary alone (what the analytic engine predicts). */
  meanPrimaryDetectedPerParticle: number;
  stdErrPrimaryDetectedPerParticle: number;
  /** Mean number of delta rays above the Cherenkov threshold per primary, and the detected photons they add. */
  meanDeltaRaysPerParticle: number;
  meanDeltaDetectedPerParticle: number;
  /** Fraction of primaries that decayed inside the radiator, and detected photons from Michel electrons. */
  decayFraction: number;
  meanDecayDetectedPerParticle: number;
  /** Detected photons per primary from imported external secondaries. */
  meanExternalDetectedPerParticle: number;
  /** Mean emitted photons per primary (before transport and detection). */
  meanEmittedPerParticle: number;
  /** Standard error of the mean emitted count. */
  stdErrEmittedPerParticle: number;
}

interface Step {
  xMm: number;
  kineticMeV: number;
  dxMm: number;
}

/** Runs the photon-level Monte Carlo. Deterministic for a given seed. */
export function runMonteCarlo(
  params: SimulationParams,
  material: MaterialPreset,
  isotope: IsotopeProfile | undefined,
  detector: DetectorSettings | undefined,
  primaries: number,
  seed: number,
  options: McOptions = MC_DEFAULT_OPTIONS
): McResult {
  const rng = new Rng(seed);
  const massMeV = resolveParticleMassMeV(params, isotope);
  let E = params.beamEnergyMeV;
  if (params.energyUnit === "GeV") E *= 1000;
  else if (params.energyUnit === "TeV") E *= 1000000;

  const depthMm = params.radiatorThicknessMm;
  const trackMm = params.trackLengthMm !== undefined ? params.trackLengthMm : 10.0;
  const emissionLengthMm = Math.max(0, Math.min(trackMm, depthMm));
  const chamberTemp = params.chamberTemperatureK || STANDARD_TEMP_K;

  // Wavelength bins, the same as the analytic engine.
  const binWidth = Number.isFinite(params.binResolutionNm) && params.binResolutionNm > 0 ? params.binResolutionNm : DEFAULT_BIN_RESOLUTION_NM;
  const start = params.spectralRangeStartNm;
  const nBins = Math.max(0, Math.floor((params.spectralRangeEndNm - start) / binWidth) + 1);
  const binCentres: number[] = [];
  const binLo: number[] = [];
  const binHi: number[] = [];
  const binN: number[] = [];
  const binMu: number[] = [];
  for (let i = 0; i < nBins; i++) {
    const c = start + i * binWidth;
    const lo = c - binWidth / 2 > 0 ? c - binWidth / 2 : c;
    const hi = c + binWidth / 2;
    binCentres.push(c);
    binLo.push(lo);
    binHi.push(hi);
    binN.push(getRefractiveIndexAt(c, material, chamberTemp));
    const mu = material.absorptionTable ? tabulatedAbsorptionPerMm(c, material.absorptionTable) : undefined;
    const coeff = getMediumCoefficients(c, material.id);
    binMu.push(mu !== undefined ? mu : calculateEffectiveAttenuation(coeff.mu_a, coeff.mu_s, material.anisotropyG));
  }

  const detectionFactor = detector && options.detectorEfficiency
    ? Math.min(1, Math.max(0, (detector.quantumEfficiencyPct || 0) / 100)) * (params.daq ? 1 - Math.min(1, Math.max(0, params.daq.deadtimeFraction || 0)) : 1)
    : 1;
  const zSq = (params.isotopeId === "custom" ? (params.customChargeE ?? 1) : (params.beamCharge ?? 1)) ** 2;

  interface Table { step: Step; cum: number[]; total: number; mean: number }

  /** Frank-Tamm tables for a list of path steps of a particle of a given mass (charge z = 1 for secondaries). */
  const tablesFor = (pathSteps: Step[], mass: number, zSquared: number): Table[] =>
    pathSteps.map((step) => {
      const delta = oneMinusBetaFromEnergy(step.kineticMeV, mass);
      const weights: number[] = [];
      let total = 0;
      for (let b = 0; b < nBins; b++) {
        const sin2 = sin2ThetaFromDelta(delta, binN[b]);
        const w = sin2 > 0 ? sin2 * (1 / (binLo[b] * 1e-9) - 1 / (binHi[b] * 1e-9)) : 0;
        total += w;
        weights.push(total);
      }
      const mean = 2 * Math.PI * FINE_STRUCTURE_CONSTANT * zSquared * (step.dxMm / 1000) * total;
      return { step, cum: weights, total, mean };
    });

  /** Emits photons for the tables whose step lies before cutMm (path coordinate), with xShiftMm added for transport. */
  const emit = (tables: Table[], xShiftMm: number, cutMm: number): { emitted: number; detected: number } => {
    let emitted = 0;
    let detected = 0;
    for (const table of tables) {
      if (table.total <= 0 || table.step.xMm > cutMm) continue;
      const n = rng.poisson(table.mean);
      emitted += n;
      for (let k = 0; k < n; k++) {
        const u = rng.uniform() * table.total;
        let b = 0;
        while (b < nBins - 1 && table.cum[b] < u) b++;
        // The wavelength within the bin is not used (no angular or detector-geometry model).
        rng.uniform();
        const survive = options.absorption ? Math.exp(-binMu[b] * Math.max(0, depthMm - (table.step.xMm + xShiftMm))) : 1;
        if (rng.uniform() < survive * detectionFactor) detected++;
      }
    }
    return { emitted, detected };
  };

  const stopping = material.stopping;
  const primaryPath: Step[] =
    stopping && options.energyLoss
      ? sampleEnergyLossPath(E, massMeV, stopping, emissionLengthMm).samples
      : [{ xMm: emissionLengthMm / 2, kineticMeV: E, dxMm: emissionLengthMm }];
  const primaryTables = tablesFor(primaryPath, massMeV, zSq);

  // Delta rays: spectrum dN/dT = 0.5 K z^2 (Z/A) rho / beta^2 / T^2 per cm, from the Cherenkov-threshold kinetic energy
  // of an electron up to the kinematic maximum. Delta electrons go forward along the beam axis (no angular model).
  const nRef = getRefractiveIndexAt(500, material, chamberTemp);
  const tCutMeV = nRef > 1 ? ELECTRON_MASS_MEV * (1 / Math.sqrt(1 - 1 / (nRef * nRef)) - 1) : Infinity;
  const deltaOn = options.deltaRays && !!stopping && Number.isFinite(tCutMeV);
  const isElectronPrimary = massMeV <= ELECTRON_MASS_MEV * 1.0000001;
  const deltaMeans = primaryPath.map((step) => {
    if (!deltaOn || !stopping) return 0;
    const beta2 = 1 - (massMeV / (step.kineticMeV + massMeV)) ** 2;
    const gamma = (step.kineticMeV + massMeV) / massMeV;
    const tMax = isElectronPrimary
      ? step.kineticMeV / 2
      : (2 * ELECTRON_MASS_MEV * beta2 * gamma * gamma) / (1 + (2 * gamma * ELECTRON_MASS_MEV) / massMeV + (ELECTRON_MASS_MEV / massMeV) ** 2);
    if (!(tMax > tCutMeV) || !(beta2 > 0)) return 0;
    const dxCm = step.dxMm / 10;
    return 0.5 * BETHE_K_MEV_CM2_PER_MOL * stopping.zOverA * (stopping.densityGcm3 ?? 1) * dxCm * zSq / beta2 * (1 / tCutMeV - 1 / tMax);
  });
  const deltaTMax = primaryPath.map((step) => {
    const gamma = (step.kineticMeV + massMeV) / massMeV;
    const beta2 = 1 - (massMeV / (step.kineticMeV + massMeV)) ** 2;
    return isElectronPrimary
      ? step.kineticMeV / 2
      : (2 * ELECTRON_MASS_MEV * beta2 * gamma * gamma) / (1 + (2 * gamma * ELECTRON_MASS_MEV) / massMeV + (ELECTRON_MASS_MEV / massMeV) ** 2);
  });

  // Secondary-electron path tables are cached on a 2% energy grid: they depend only on the energy, and are cut at the exit face.
  const electronCache = new Map<number, Table[]>();
  /** A secondary electron born at xBirthMm travelling forward until it stops or leaves the radiator. */
  const electronPhotons = (kineticMeV: number, xBirthMm: number): { emitted: number; detected: number } => {
    const room = depthMm - xBirthMm;
    if (!(room > 0) || !(kineticMeV > tCutMeV)) return { emitted: 0, detected: 0 };
    const key = Math.round(Math.log(kineticMeV) / 0.02);
    let tables = electronCache.get(key);
    if (!tables) {
      const tq = Math.exp(key * 0.02);
      const path: Step[] =
        stopping && options.energyLoss
          ? sampleEnergyLossPath(tq, ELECTRON_MASS_MEV, stopping, depthMm).samples
          : [{ xMm: depthMm / 2, kineticMeV: tq, dxMm: depthMm }];
      tables = tablesFor(path, ELECTRON_MASS_MEV, 1);
      electronCache.set(key, tables);
    }
    // Without an energy-loss model the single step spans the whole depth; scale it to the room available.
    if (!(stopping && options.energyLoss)) {
      const t0 = tables[0];
      const scaled: Table = { ...t0, step: { ...t0.step, xMm: room / 2, dxMm: room }, mean: t0.mean * (room / depthMm) };
      return emit([scaled], xBirthMm, Infinity);
    }
    return emit(tables, xBirthMm, room);
  };

  /** Photons from an imported charged particle (any mass in the particle table), born at xBirthMm. */
  const externalPhotons = (pt: ExternalParticle): { emitted: number; detected: number } => {
    const mass = particleMassMeV(Math.abs(pt.pdgId));
    const room = depthMm - pt.xMm;
    if (mass === undefined || !(room > 0) || !(pt.kineticMeV > 0)) return { emitted: 0, detected: 0 };
    const path: Step[] =
      stopping && options.energyLoss
        ? sampleEnergyLossPath(pt.kineticMeV, mass, stopping, room).samples
        : [{ xMm: room / 2, kineticMeV: pt.kineticMeV, dxMm: room }];
    return emit(tablesFor(path, mass, 1), pt.xMm, Infinity);
  };
  const externalEvents = options.externalEvents && options.externalEvents.length > 0 ? options.externalEvents : undefined;

  // Decay in flight
  const decayData = options.decayInFlight ? DECAY_LENGTH_M[params.isotopeId === "custom" ? 0 : isotope?.pdgId ?? 0] : undefined;
  const gammaPrimary = (E + massMeV) / massMeV;
  const betaPrimary = Math.sqrt(Math.max(0, 1 - 1 / (gammaPrimary * gammaPrimary)));
  const decayLengthMm = decayData ? decayData.cTauM * 1000 * gammaPrimary * betaPrimary : Infinity;
  const isMuon = !!isotope && isotope.pdgId === 13;

  const MUON_E_MAX = massMeV / 2; // Michel end point in the muon rest frame (electron mass neglected)

  const detectedPerPrimary = new Array<number>(primaries);
  let sumDet = 0, sumDet2 = 0, sumEmit = 0, sumEmit2 = 0;
  let sumExtDet = 0, sumPrim = 0, sumPrim2 = 0, sumDeltaN = 0, sumDeltaDet = 0, nDecayed = 0, sumDecayDet = 0;

  for (let p = 0; p < primaries; p++) {
    // Where, if anywhere, the primary decays
    let cut = Infinity;
    let decayX = -1;
    if (isFinite(decayLengthMm)) {
      const x = -decayLengthMm * Math.log(Math.max(rng.uniform(), 1e-300));
      if (x < depthMm) {
        decayX = x;
        cut = x;
        nDecayed++;
      }
    }
    const prim = emit(primaryTables, 0, cut);
    let emitted = prim.emitted;
    let detected = prim.detected;

    let deltaDet = 0;
    if (deltaOn) {
      for (let s = 0; s < primaryPath.length; s++) {
        if (primaryPath[s].xMm > cut) continue;
        const nDelta = rng.poisson(deltaMeans[s]);
        sumDeltaN += nDelta;
        const tMax = deltaTMax[s];
        for (let d = 0; d < nDelta; d++) {
          // Inverse-CDF sampling of 1/T^2 between the cut and the maximum
          const T = 1 / (1 / tCutMeV - rng.uniform() * (1 / tCutMeV - 1 / tMax));
          const e = electronPhotons(T, primaryPath[s].xMm);
          emitted += e.emitted;
          deltaDet += e.detected;
        }
      }
      detected += deltaDet;
      sumDeltaDet += deltaDet;
    }

    let decayDet = 0;
    if (decayX >= 0 && isMuon) {
      // Michel spectrum f(x) = 2 x^2 (3 - 2 x) in x = E*/E*max, by rejection (max of f is 1 at x = 1)
      let x = 0;
      for (;;) {
        x = rng.uniform();
        if (rng.uniform() <= x * x * (3 - 2 * x)) break;
      }
      const eStar = x * MUON_E_MAX;
      const cosTheta = 2 * rng.uniform() - 1;
      const eLab = gammaPrimary * (eStar + betaPrimary * eStar * cosTheta);
      const e = electronPhotons(Math.max(0, eLab - ELECTRON_MASS_MEV), decayX);
      emitted += e.emitted;
      decayDet = e.detected;
      detected += decayDet;
      sumDecayDet += decayDet;
    }

    if (externalEvents) {
      const ev = externalEvents[Math.min(externalEvents.length - 1, Math.floor(rng.uniform() * externalEvents.length))];
      for (const pt of ev) {
        const e = externalPhotons(pt);
        emitted += e.emitted;
        detected += e.detected;
        sumExtDet += e.detected;
      }
    }

    detectedPerPrimary[p] = detected;
    sumDet += detected;
    sumDet2 += detected * detected;
    sumEmit += emitted;
    sumEmit2 += emitted * emitted;
    sumPrim += prim.detected;
    sumPrim2 += prim.detected * prim.detected;
  }

  const meanDet = sumDet / primaries;
  const variance = Math.max(0, sumDet2 / primaries - meanDet * meanDet) * (primaries / Math.max(1, primaries - 1));
  return {
    primaries,
    detectedPerPrimary,
    meanPrimaryDetectedPerParticle: sumPrim / primaries,
    stdErrPrimaryDetectedPerParticle: Math.sqrt(Math.max(0, sumPrim2 / primaries - (sumPrim / primaries) ** 2) * (primaries / Math.max(1, primaries - 1)) / primaries),
    meanDeltaRaysPerParticle: sumDeltaN / primaries,
    meanDeltaDetectedPerParticle: sumDeltaDet / primaries,
    decayFraction: nDecayed / primaries,
    meanDecayDetectedPerParticle: sumDecayDet / primaries,
    meanExternalDetectedPerParticle: sumExtDet / primaries,
    seed,
    meanDetectedPerParticle: meanDet,
    stdErrDetectedPerParticle: Math.sqrt(variance / primaries),
    meanEmittedPerParticle: sumEmit / primaries,
    stdErrEmittedPerParticle: Math.sqrt(Math.max(0, sumEmit2 / primaries - (sumEmit / primaries) ** 2) * (primaries / Math.max(1, primaries - 1)) / primaries),
  };
}

/** Convenience: the number of primaries and seed defaults used by the UI and CLI. */
export const MC_DEFAULTS = { primaries: 2000, seed: 12345, firedParticles: DEFAULT_FIRED_PARTICLES };

