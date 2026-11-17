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
import { FINE_STRUCTURE_CONSTANT, STANDARD_TEMP_K, DEFAULT_FIRED_PARTICLES, DEFAULT_BIN_RESOLUTION_NM } from "./constants";
import { oneMinusBetaFromEnergy } from "./kinematics";
import { sin2ThetaFromDelta } from "./cherenkov";
import { getRefractiveIndexAt } from "./dispersion";
import { tabulatedAbsorptionPerMm, getMediumCoefficients, calculateEffectiveAttenuation } from "./transport";
import { sampleEnergyLossPath } from "./stopping";
import { resolveParticleMassMeV } from "./simulate";

export interface McResult {
  primaries: number;
  seed: number;
  /** Mean detected photons per primary. */
  meanDetectedPerParticle: number;
  /** Standard error of the mean. */
  stdErrDetectedPerParticle: number;
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
  seed: number
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

  const detectionFactor = detector
    ? Math.min(1, Math.max(0, (detector.quantumEfficiencyPct || 0) / 100)) * (params.daq ? 1 - Math.min(1, Math.max(0, params.daq.deadtimeFraction || 0)) : 1)
    : 1;
  const zSq = (params.isotopeId === "custom" ? (params.customChargeE ?? 1) : (params.beamCharge ?? 1)) ** 2;
  const prefactor = 2 * Math.PI * FINE_STRUCTURE_CONSTANT * zSq; // per metre of path, before the bin integral

  const steps = (): Step[] => {
    if (material.stopping) {
      return sampleEnergyLossPath(E, massMeV, material.stopping, emissionLengthMm).samples;
    }
    return [{ xMm: emissionLengthMm / 2, kineticMeV: E, dxMm: emissionLengthMm }];
  };

  let sumDet = 0;
  let sumDet2 = 0;
  let sumEmit = 0;
  let sumEmit2 = 0;
  const pathSteps = steps();
  // For each step, cumulative bin weights of the Frank-Tamm integral, plus the step's Poisson mean.
  const stepTables = pathSteps.map((step) => {
    const delta = oneMinusBetaFromEnergy(step.kineticMeV, massMeV);
    const weights: number[] = [];
    let total = 0;
    for (let b = 0; b < nBins; b++) {
      const sin2 = sin2ThetaFromDelta(delta, binN[b]);
      const w = sin2 > 0 ? sin2 * (1 / (binLo[b] * 1e-9) - 1 / (binHi[b] * 1e-9)) : 0;
      total += w;
      weights.push(total);
    }
    const mean = prefactor * (step.dxMm / 1000) * total;
    return { step, cum: weights, total, mean };
  });

  for (let p = 0; p < primaries; p++) {
    let emitted = 0;
    let detected = 0;
    for (const table of stepTables) {
      if (table.total <= 0) continue;
      const n = rng.poisson(table.mean);
      emitted += n;
      for (let k = 0; k < n; k++) {
        // Choose a bin in proportion to its Frank-Tamm weight.
        const u = rng.uniform() * table.total;
        let b = 0;
        while (b < nBins - 1 && table.cum[b] < u) b++;
        // Sample a wavelength within the bin, with pdf proportional to 1/lambda^2.
        const invLo = 1 / (binLo[b] * 1e-9);
        const invHi = 1 / (binHi[b] * 1e-9);
        // The sampled wavelength is not yet used (no angular or detector-geometry model).
        rng.uniform();
        // Transport from the emission point (x) to the exit face, then detection.
        const muPerMm = binMu[b];
        const survive = Math.exp(-muPerMm * (depthMm - table.step.xMm));
        if (rng.uniform() < survive * detectionFactor) detected++;
      }
    }
    sumDet += detected;
    sumDet2 += detected * detected;
    sumEmit += emitted;
    sumEmit2 += emitted * emitted;
  }

  const meanDet = sumDet / primaries;
  const variance = Math.max(0, sumDet2 / primaries - meanDet * meanDet) * (primaries / Math.max(1, primaries - 1));
  return {
    primaries,
    seed,
    meanDetectedPerParticle: meanDet,
    stdErrDetectedPerParticle: Math.sqrt(variance / primaries),
    meanEmittedPerParticle: sumEmit / primaries,
    stdErrEmittedPerParticle: Math.sqrt(Math.max(0, sumEmit2 / primaries - (sumEmit / primaries) ** 2) * (primaries / Math.max(1, primaries - 1)) / primaries),
  };
}

/** Convenience: the number of primaries and seed defaults used by the UI and CLI. */
export const MC_DEFAULTS = { primaries: 2000, seed: 12345, firedParticles: DEFAULT_FIRED_PARTICLES };

