/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cherenkov emission model.
 *
 * Scope (this is an analytic model, not a Monte Carlo):
 *  - Frank-Tamm emission is the only light-production channel. Earlier heuristic channels
 *    (bremsstrahlung, fluorescence, Compton, transition radiation, secondary cascades) were removed
 *    because they had no physical basis in this code.
 *  - Single slab of thickness d = radiatorThicknessMm. Emission length L = min(trackLength, d) is
 *    treated as constant beta (no energy loss yet; see docs/IMPROVEMENT_PLAN.md T3.4).
 *  - sin^2(theta_c) is evaluated without catastrophic cancellation near beta = 1 and n = 1
 *    (see sin2ThetaFromDelta).
 *  - Transport uses the medium coefficients in getMediumCoefficients. These are still
 *    unsourced approximations and are flagged as such in docs/IMPROVEMENT_PLAN.md (T2.3).
 *  - Summary totals are per run (per-particle value times numberFiredParticles); spectra are per particle.
 */

import { SimulationParams, SimulationResultPoint, SimulationSummary, IsotopeProfile, MaterialPreset, DetectorSettings } from "../types";
import { PARTICLES, particleMassMeV } from "../data/particles";

// Particle masses (MeV/c^2). Electron, muon, pion, proton and neutron are PDG-verified; see data/particles.ts.
export const ELECTRON_MASS_MEV = PARTICLES[11].massMeV;
export const MUON_MASS_MEV = PARTICLES[13].massMeV;
export const PROTON_MASS_MEV = PARTICLES[2212].massMeV;
export const NEUTRON_MASS_MEV = PARTICLES[2112].massMeV;
export const PION_MASS_MEV = PARTICLES[211].massMeV;
export const ALPHA_MASS_MEV = PARTICLES[1000020040].massMeV; // not yet PDG-verified
export const CARBON_ION_MASS_MEV = PARTICLES[1000060120].massMeV; // not yet PDG-verified

// Physical constants
export const SPEED_OF_LIGHT = 299792458; // m/s
export const FINE_STRUCTURE_CONSTANT = 1 / 137.035999139; // alpha

// Thermal model (single global coefficient, see plan T3.2 for the per-material replacement)
export const STANDARD_TEMP_K = 293.15; // 20 degC
export const THERMAL_COEFFICIENT_DN_DT = -1.4e-4; // K^-1, applied to every material
export const THRESHOLD_REFERENCE_WAVELENGTH_NM = 500;

// Numerical settings
export const MAX_SPECTRAL_POINTS = 5000;
export const DEFAULT_BIN_RESOLUTION_NM = 10;
export const DEFAULT_FIRED_PARTICLES = 100;
export const RAYLEIGH_SCATTERING_BASE_NM = 400.0; // used by the transport model only

/** Elementary charge-independent constant used in Larmor / synchrotron formulas (0.3 * B * rho = p in GeV/c). */
const LARMOR_FACTOR = 0.3;
/** Synchrotron critical energy coefficient for electrons: eps_c = 665 * E^2[GeV] * B[T] keV. */
const SYNCHROTRON_CRITICAL_COEFF_KEV = 665;

/**
 * Relativistic beta = v/c for kinetic energy T and rest mass m (both MeV).
 * beta = sqrt(T (T + 2m)) / (T + m). No upper clamp: beta approaches 1 smoothly at any energy.
 */
export function calculateRelativisticBeta(energyMeV: number, particleMassMeV: number): number {
  if (!(energyMeV > 0) || !(particleMassMeV > 0)) return 0;
  return Math.sqrt(energyMeV * (energyMeV + 2 * particleMassMeV)) / (energyMeV + particleMassMeV);
}

/**
 * delta = 1 - beta, computed directly from kinetic energy T and mass m (MeV) to avoid losing
 * precision when beta is within 1e-12 of 1: delta = 1 / (gamma^2 (1 + beta)).
 */
export function oneMinusBetaFromEnergy(energyMeV: number, particleMassMeV: number): number {
  if (!(energyMeV > 0)) return 1;
  const gamma = 1 + energyMeV / particleMassMeV;
  const beta = calculateRelativisticBeta(energyMeV, particleMassMeV);
  return 1 / (gamma * gamma * (1 + beta));
}

/**
 * sin^2(theta_c) = 1 - 1/(beta n)^2 evaluated from delta = 1 - beta and eta = n - 1.
 * With x = beta n: x - 1 = (n - 1) - n * delta and x + 1 = 2 + (n - 1) - n * delta, so
 * sin^2 = (x - 1)(x + 1) / x^2. Positive exactly when beta n > 1, which is the Cherenkov threshold.
 * Returns 0 below threshold.
 */
export function sin2ThetaFromDelta(delta: number, refractiveIndex: number): number {
  const n = refractiveIndex;
  const xMinus1 = (n - 1) - n * delta;
  if (!(xMinus1 > 0)) return 0;
  const x = n - n * delta; // beta * n
  return (xMinus1 * (x + 1)) / (x * x);
}

/**
 * Relativistic momentum p = sqrt(T^2 + 2 T m) in MeV/c, for kinetic energy T and rest mass m (MeV/c^2).
 */
export function momentumMeV(kineticMeV: number, massMeV: number): number {
  return Math.sqrt(kineticMeV * kineticMeV + 2 * kineticMeV * massMeV);
}

/**
 * Larmor (gyro) radius in metres for a charged particle of momentum p (MeV/c) in a field B (T).
 * rho [m] = p[GeV/c] / (0.3 * B). Returns Infinity when B <= 0.
 */
export function larmorRadiusM(momentumMeVc: number, magneticFieldT: number): number {
  if (!(magneticFieldT > 0)) return Infinity;
  const pGeV = momentumMeVc / 1000;
  return pGeV / (LARMOR_FACTOR * magneticFieldT);
}

/**
 * Synchrotron critical energy in keV for an electron of energy E (GeV) in a field B (T):
 * eps_c = 665 * E^2 * B keV.
 */
export function synchrotronCriticalEnergyKeV(energyGeV: number, magneticFieldT: number): number {
  return SYNCHROTRON_CRITICAL_COEFF_KEV * energyGeV * energyGeV * magneticFieldT;
}

/**
 * Analytic Frank-Tamm photon yield per particle per mm of path (Z = 1), integrated over [startNm, endNm]:
 *   N/L = 2 * pi * alpha * (1/lambda1 - 1/lambda2) * sin^2(theta_c)   [per metre]
 * Returned in photons per mm. Returns 0 when beta * n <= 1 (below threshold).
 */
export function frankTammPhotonsPerMm(beta: number, refractiveIndex: number, startNm: number, endNm: number): number {
  if (!(startNm > 0) || !(endNm > startNm)) return 0;
  const sin2 = sin2ThetaFromDelta(1 - beta, refractiveIndex);
  if (sin2 <= 0) return 0;
  const invLambda1 = 1 / (startNm * 1e-9);
  const invLambda2 = 1 / (endNm * 1e-9);
  const perMetre = 2 * Math.PI * FINE_STRUCTURE_CONSTANT * (invLambda1 - invLambda2) * sin2;
  return perMetre / 1000;
}

/**
 * Cherenkov emission angle in degrees: cos(theta) = 1 / (beta n). Returns 0 when beta * n <= 1.
 */
export function cherenkovAngleDeg(beta: number, refractiveIndex: number): number {
  const betaN = beta * refractiveIndex;
  if (!(betaN > 1)) return 0;
  return Math.acos(1 / betaN) * (180.0 / Math.PI);
}

/**
 * Refractive index from a Sellmeier model, n^2 - 1 = sum_i B_i lambda^2 / (lambda^2 - C_i),
 * with lambda in micrometres and C_i in micrometres^2 (the convention used by Malitson 1965).
 * Temperature enters only through the linear term n(T) = n_ref + dn/dT * (T - 293.15).
 */
export function getRefractiveIndexAt(wavelengthNm: number, preset: MaterialPreset, tempK: number = STANDARD_TEMP_K): number {
  const wlUm = wavelengthNm / 1000.0;
  let n = preset.refractiveIndexStatic;

  if (preset.sellmeierCoeffs) {
    const { B1, C1, B2, C2, B3, C3 } = preset.sellmeierCoeffs;
    const wlSq = wlUm * wlUm;
    let nSq = 1.0 + (B1 * wlSq) / (wlSq - C1) + (B2 * wlSq) / (wlSq - C2);
    if (B3 !== undefined && C3 !== undefined) nSq += (B3 * wlSq) / (wlSq - C3);
    if (nSq > 0) n = Math.sqrt(nSq);
  } else {
    // Fallback for materials without Sellmeier coefficients. This is an unsourced approximation.
    n = preset.refractiveIndexStatic + (1500.0 / (wavelengthNm * wavelengthNm));
  }

  const deltaT = tempK - STANDARD_TEMP_K;
  return n + deltaT * THERMAL_COEFFICIENT_DN_DT;
}

/**
 * Medium optical coefficients used by the transport model.
 * Returns { mu_a: absorption, mu_s: scattering } in mm^-1.
 * Hard-coded approximations for eight materials; all other materials use the default below.
 * These are NOT sourced and are scheduled for replacement (docs/IMPROVEMENT_PLAN.md T2.3).
 */
export function getMediumCoefficients(wavelengthNm: number, materialId: string): { mu_a: number; mu_s: number } {
  let mu_a = 0.05;
  let mu_s = 5.0;

  if (materialId === "water") {
    mu_a = 0.00001 + (wavelengthNm > 600 ? 0.001 * Math.pow((wavelengthNm - 600) / 100, 2) : 0);
    mu_s = 0.001;
  } else if (materialId === "heavy_water") {
    mu_a = 5e-6 + (wavelengthNm > 650 ? 0.0005 * Math.pow((wavelengthNm - 650) / 100, 2) : 0);
    mu_s = 0.0008;
  } else if (materialId === "lead_glass") {
    const uvFalloff = wavelengthNm < 400 ? 2.5 * Math.exp(-(wavelengthNm - 300) / 30) : 0;
    mu_a = 0.001 + uvFalloff;
    mu_s = 0.012 * Math.pow(wavelengthNm / 500, -1.8);
  } else if (materialId === "liquid_argon") {
    mu_a = 0.0002;
    mu_s = 0.04 * Math.pow(wavelengthNm / 500, -4.0);
  } else if (materialId === "plastic_scintillator") {
    const cutoff = wavelengthNm < 415 ? 1.8 * Math.exp(-(wavelengthNm - 320) / 35) : 0;
    mu_a = 0.015 + cutoff;
    mu_s = 0.08 * Math.pow(wavelengthNm / 500, -1.5);
  } else if (materialId === "quartz") {
    mu_a = 1e-6;
    mu_s = 2e-4 * Math.pow(wavelengthNm / 500, -4.0);
  } else if (materialId === "lyso") {
    const cePeak = 0.15 * Math.exp(-Math.pow((wavelengthNm - 365) / 25, 2));
    mu_a = 0.001 + cePeak;
    mu_s = 0.01 * Math.pow(wavelengthNm / 500, -1.2);
  } else if (materialId === "aerogel") {
    mu_a = 1e-5;
    mu_s = 0.025 * Math.pow(wavelengthNm / 500, -4.0);
  }

  return { mu_a, mu_s };
}

/**
 * Effective attenuation coefficient from isotropic diffusion theory:
 * mu_eff = sqrt(3 * mu_a * (mu_a + mu_s')), with mu_s' = mu_s * (1 - g).
 */
export function calculateEffectiveAttenuation(mu_a: number, mu_s: number, g: number): number {
  const mu_s_prime = mu_s * (1.0 - g);
  return Math.sqrt(Math.max(0, 3.0 * mu_a * (mu_a + mu_s_prime)));
}

/**
 * Path-averaged transmission for photons emitted uniformly over [0, L] in a slab of thickness d:
 *   T_avg = exp(-mu d) * (exp(mu L) - 1) / (mu L)
 * mu in mm^-1, lengths in mm. Falls back to exp(-mu d) when mu * L is negligible.
 */
function pathAveragedTransmission(mu: number, emissionLengthMm: number, thicknessMm: number): number {
  const x = mu * emissionLengthMm;
  if (x > 1e-9) {
    return Math.exp(-mu * (thicknessMm - emissionLengthMm)) * (-Math.expm1(-x)) / x;
  }
  return Math.exp(-mu * thicknessMm);
}

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
    const coeff = getMediumCoefficients(lambda, materialPreset.id);
    const mu_eff = calculateEffectiveAttenuation(coeff.mu_a, coeff.mu_s, g);
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
 * Threshold kinetic energy in MeV: E = m (gamma_thr - 1), with beta_thr = 1/n.
 * gamma_thr = n / sqrt(n^2 - 1). Returns Infinity when n <= 1 (no threshold).
 */
export function getCherenkovThresholdEnergy(massMeV: number, refractiveIndex: number): number {
  if (!(refractiveIndex > 1)) return Infinity;
  const gammaThr = refractiveIndex / Math.sqrt(refractiveIndex * refractiveIndex - 1);
  return massMeV * (gammaThr - 1.0);
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
