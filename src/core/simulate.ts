/**
 * @license
 * SPDX-License-Identifier: MIT
 */

/**
 * Cherenkov emission and transport orchestration.
 *
 * Scope (this is an analytic model, not a Monte Carlo):
 *  - Frank-Tamm emission is the only light-production channel.
 *  - Single slab of thickness d = radiatorThicknessMm. Emission length L = min(trackLength, d) is
 *    treated as constant beta (no energy loss yet; see docs/IMPROVEMENT_PLAN.md T3.4).
 *  - Transport uses the medium coefficients in transport.ts, which are unsourced approximations (T2.3).
 *  - Summary totals are per run (per-particle value times numberFiredParticles); spectra are per particle.
 */

import { SimulationParams, SimulationResultPoint, SimulationSummary, IsotopeProfile, MaterialPreset, DetectorSettings } from "../types";
import { particleMassMeV } from "../data/particles";
import {
  ELECTRON_MASS_MEV,
  FINE_STRUCTURE_CONSTANT,
  DEFAULT_BIN_RESOLUTION_NM,
  DEFAULT_FIRED_PARTICLES,
  MAX_SPECTRAL_POINTS,
  STANDARD_TEMP_K,
  THRESHOLD_REFERENCE_WAVELENGTH_NM,
} from "./constants";
import { calculateRelativisticBeta, oneMinusBetaFromEnergy, getCherenkovThresholdEnergy } from "./kinematics";
import { sin2ThetaFromDelta, cherenkovAngleDeg } from "./cherenkov";
import { getRefractiveIndexAt } from "./dispersion";
import { getMediumCoefficients, calculateEffectiveAttenuation, pathAveragedTransmission, tabulatedAbsorptionPerMm } from "./transport";

/**
 * Mass in MeV/c^2 for the simulated particle.
 * Custom isotopes use the user-supplied mass. Presets use their PDG id. Presets whose particle is not
 * in the table fall back to the user-supplied mass (default electron) rather than silently to the muon.
 */
export function resolveParticleMassMeV(params: SimulationParams, isotopePreset: IsotopeProfile | undefined): number {
  if (params.isotopeId === "custom") {
    return params.customRestMassMeV || ELECTRON_MASS_MEV;
  }
  if (isotopePreset) {
    const fromTable = particleMassMeV(isotopePreset.pdgId);
    if (fromTable !== undefined) return fromTable;
  }
  return params.customRestMassMeV || ELECTRON_MASS_MEV;
}

/**
 * Runs Cherenkov emission and transport.
 *
 * Returned spectra are per particle. Summary totals (totalPhotonsEmitted, totalPhotonsDetected) are per run,
 * i.e. the per-particle value times numberFiredParticles. The optional detector applies quantum efficiency
 * and the DAQ deadtime to detected (not emitted) photons.
 */
export function runCherenkovSimulation(
  params: SimulationParams,
  materialPreset: MaterialPreset,
  isotopePreset: IsotopeProfile | undefined,
  detector?: DetectorSettings
): { spectra: SimulationResultPoint[]; summary: SimulationSummary } {
  const points: SimulationResultPoint[] = [];

  const massMeV = resolveParticleMassMeV(params, isotopePreset);

  // Energy in MeV (kinetic)
  let E_beam = params.beamEnergyMeV;
  if (params.energyUnit === "GeV") E_beam = params.beamEnergyMeV * 1000;
  else if (params.energyUnit === "TeV") E_beam = params.beamEnergyMeV * 1000000;

  const beta = calculateRelativisticBeta(E_beam, massMeV);
  const delta = oneMinusBetaFromEnergy(E_beam, massMeV);

  const depthMm = params.radiatorThicknessMm;
  const firedParticles = Number.isFinite(params.numberFiredParticles) && params.numberFiredParticles > 0
    ? params.numberFiredParticles
    : DEFAULT_FIRED_PARTICLES;

  // Emission length: photons can only be produced inside the radiator
  const trackMm = params.trackLengthMm !== undefined ? params.trackLengthMm : 10.0;
  const emissionLengthMm = Math.max(0, Math.min(trackMm, depthMm));
  const dxMeters = emissionLengthMm / 1000.0;

  // Detector coupling applies to detected photons only
  let detectionFactor = 1.0;
  if (detector) {
    const qe = Math.min(1, Math.max(0, (detector.quantumEfficiencyPct || 0) / 100));
    const deadFactor = params.daq ? 1 - Math.min(1, Math.max(0, params.daq.deadtimeFraction || 0)) : 1;
    detectionFactor = qe * deadFactor;
  }

  let perParticleEmitted = 0;
  let perParticleDetected = 0;
  let maxWavelength = 300;
  let maxWavelengthYield = -1;

  const g = materialPreset.anisotropyG;

  // Wavelength grid
  let binWidth = Number.isFinite(params.binResolutionNm) && params.binResolutionNm > 0
    ? params.binResolutionNm
    : DEFAULT_BIN_RESOLUTION_NM;
  const start = params.spectralRangeStartNm;
  const end = params.spectralRangeEndNm;
  const span = end - start;
  let nPoints = Number.isFinite(span) && span >= 0 ? Math.floor(span / binWidth) + 1 : 0;
  if (nPoints > MAX_SPECTRAL_POINTS) {
    binWidth = span / (MAX_SPECTRAL_POINTS - 1);
    nPoints = Math.min(MAX_SPECTRAL_POINTS, Math.floor(span / binWidth) + 1);
  }

  let generatesCherenkov = false;
  let sumAngles = 0;
  let countAngles = 0;

  // Charge scaling: Frank-Tamm yield scales with Z^2
  let zVal = params.beamCharge !== undefined ? params.beamCharge : 1;
  if (params.isotopeId === "custom") {
    zVal = params.customChargeE !== undefined ? params.customChargeE : 1;
  }
  const zSq = zVal * zVal;

  const chamberTemp = params.chamberTemperatureK || STANDARD_TEMP_K;
  // Honour the user toggle for the primary Frank-Tamm channel (the only remaining channel).
  const primaryOn = params.componentsActive?.primaryCherenkov !== false;

  for (let i = 0; i < nPoints; i++) {
    const lambda = start + i * binWidth;
    const n = getRefractiveIndexAt(lambda, materialPreset, chamberTemp);

    // Frank-Tamm differential yield per particle, integrated over one bin:
    // d^2N/(dx dlambda) = (2 pi alpha / lambda^2) sin^2(theta_c) Z^2
    const sin2 = sin2ThetaFromDelta(delta, n);
    let primaryYield = 0;
    if (sin2 > 0 && primaryOn) {
      generatesCherenkov = true;
      const lambdaMeters = lambda * 1e-9;
      const binMeters = binWidth * 1e-9;
      primaryYield = (2.0 * Math.PI * FINE_STRUCTURE_CONSTANT * dxMeters) / (lambdaMeters * lambdaMeters) * sin2 * binMeters * zSq;
    }

    // Optical transport: path-averaged transmission over the emission length
    // A sourced absorption table gives Beer-Lambert attenuation of ballistic photons. Otherwise the
    // unsourced diffusion-based approximation is used (plan T2.3).
    const tabulatedMu = materialPreset.absorptionTable ? tabulatedAbsorptionPerMm(lambda, materialPreset.absorptionTable) : undefined;
    const coeff = getMediumCoefficients(lambda, materialPreset.id);
    const mu_eff = tabulatedMu !== undefined ? tabulatedMu : calculateEffectiveAttenuation(coeff.mu_a, coeff.mu_s, g);
    const transmission = Math.min(1, Math.max(0, pathAveragedTransmission(mu_eff, emissionLengthMm, depthMm)));

    const detectedPerParticle = primaryYield * transmission * detectionFactor;

    if (detectedPerParticle > maxWavelengthYield) {
      maxWavelengthYield = detectedPerParticle;
      maxWavelength = lambda;
    }

    perParticleEmitted += primaryYield;
    perParticleDetected += detectedPerParticle;

    const betaN = beta * n;
    if (betaN > 1) {
      sumAngles += cherenkovAngleDeg(beta, n);
      countAngles++;
    }

    points.push({
      wavelengthNm: lambda,
      primaryCherenkov: primaryYield,
      totalYield: detectedPerParticle,
      transmission,
    });
  }

  const avgCherenkovAngle = countAngles === 0 ? 0 : sumAngles / countAngles;

  // Per-run totals
  const totalPhotonsEmitted = perParticleEmitted * firedParticles;
  const totalPhotonsDetected = perParticleDetected * firedParticles;

  // Threshold uses the material index at the reference wavelength and chamber temperature
  const minN = getRefractiveIndexAt(THRESHOLD_REFERENCE_WAVELENGTH_NM, materialPreset, chamberTemp);
  const cherenkovThreshEnergy = getCherenkovThresholdEnergy(massMeV, minN);

  // Signal-to-noise: S / sqrt(S + B), with dark counts per frame scaled to the run
  let darkCountsPerRun = 0;
  if (detector) {
    const darkRate = Math.max(0, detector.darkCountRateHz || 0);
    const frameRate = Math.max(1, detector.frameRateHz || 0);
    darkCountsPerRun = (darkRate / frameRate) * firedParticles;
  }
  const snrDb = signalToNoiseDb(totalPhotonsDetected, darkCountsPerRun);

  // Fluence at the detector face (photons per mm^2) over the beam spot
  const spotAreaMm2 = Math.PI * Math.pow((params.beamFwhmUm || 200.0) / 2000.0, 2);
  const fluence = spotAreaMm2 > 0 ? (totalPhotonsDetected / spotAreaMm2) : 0.0;

  return {
    spectra: points,
    summary: {
      beta,
      betaThreshold: 1.0 / minN,
      isCherenkovGenerated: generatesCherenkov,
      cherenkovAngleDeg: Number(avgCherenkovAngle.toFixed(2)),
      totalPhotonsEmitted: Number(totalPhotonsEmitted.toFixed(1)),
      totalPhotonsDetected: Number(totalPhotonsDetected.toFixed(1)),
      photonsPerParticle: Number(perParticleEmitted.toFixed(3)),
      peakWavelengthNm: maxWavelength,
      signalToNoiseRatioDb: snrDb,
      cherenkovThresholdEnergyMeV: Number(cherenkovThreshEnergy.toFixed(3)),
      fluencePhotonsPerMm2: Number(fluence.toFixed(2)),
      firedParticles,
    },
  };
}

/**
 * SNR = S / sqrt(S + B) in dB, where S is detected signal photons per run and B is dark counts per run.
 * Returns 0 dB when there is no signal.
 */
function signalToNoiseDb(signalPhotons: number, darkCounts: number): number {
  if (!(signalPhotons > 0)) return 0;
  const snr = Math.max(1e-6, signalPhotons / Math.sqrt(signalPhotons + Math.max(0, darkCounts)));
  return Number((10.0 * Math.log10(snr)).toFixed(1));
}
