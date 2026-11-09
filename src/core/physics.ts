/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cherenkov emission model.
 *
 * Assumptions (this is a simplified model, not a full Monte Carlo):
 *  - Single-slab radiator of thickness d = radiatorThicknessMm, with a single refractive index
 *    profile per material (Sellmeier dispersion plus a linear thermal term).
 *  - Cherenkov photons are emitted uniformly along the emission length L = min(trackLength, d),
 *    and transported to the detector with the path-averaged transmission for that slab.
 *  - The Cherenkov threshold uses the refractive index at 500 nm (reference wavelength) at the
 *    chamber temperature.
 *  - Bremsstrahlung, fluorescence, Compton and transition-radiation channels are heuristic
 *    scalings, not first-principles calculations.
 *  - Summary totals are per run (per-particle value times numberFiredParticles); spectra are per particle.
 */

import { SimulationParams, SimulationResultPoint, SimulationSummary, IsotopeProfile, MaterialPreset, DetectorSettings } from "../types";

// Standard atomic and particle physics constants
export const SPEED_OF_LIGHT = 299792458; // m/s
export const FINE_STRUCTURE_CONSTANT = 1 / 137.035999139; // alpha
export const ELECTRON_MASS_MEV = 0.51099895; // e-/e+ rest mass
export const MUON_MASS_MEV = 105.658375; // Muon rest mass
export const PROTON_MASS_MEV = 938.272088; // Proton rest mass
export const ALPHA_MASS_MEV = 3727.3794; // Alpha particle rest mass (He-4 nucleus)
export const CARBON_ION_MASS_MEV = 11177.928; // Carbon-12 ion rest mass (12 * proton mass - binding energy)
export const NEUTRON_MASS_MEV = 939.565413; // Neutron rest mass
export const PION_MASS_MEV = 139.57039; // Pion+ rest mass

// Optical and thermal constants
export const STANDARD_TEMP_K = 293.15; // Standard room temperature (20°C)
export const REFRACTIVE_INDEX_MIN = 1.0001; // Minimum physical refractive index
export const THERMAL_COEFFICIENT_DN_DT = -1.4e-4; // Index degradation per Kelvin
export const BOILING_THRESHOLD_K = 328.15; // Boiling threshold (informational flag only)
export const CRYOGENIC_THRESHOLD_K = 80.0; // Cryogenic phase threshold (informational flag only)
export const THRESHOLD_REFERENCE_WAVELENGTH_NM = 500; // Reference wavelength for the Cherenkov threshold

// Simulation constants
export const MAX_BETA = 0.999999; // Maximum relativistic beta
export const MAX_SPECTRAL_POINTS = 5000; // Upper bound on wavelength grid size
export const DEFAULT_BIN_RESOLUTION_NM = 10; // Fallback wavelength bin width
export const DEFAULT_FIRED_PARTICLES = 100; // Fallback particle count per run
export const SECONDARY_CHERENKOV_FACTOR = 0.12; // Secondary Cherenkov cascade factor
export const BREMSSTRAHLUNG_COEFFICIENT = 6.5e-4; // Bremsstrahlung coefficient
export const RAYLEIGH_SCATTERING_BASE_NM = 400.0; // Base wavelength for Rayleigh scattering
export const RAYLEIGH_MEAN_FREE_PATH_BASE = 1000.0; // Base mean free path in mm
export const PHOTOELECTRIC_CUTOFF_NM = 410.0; // Photoelectric UV cutoff
export const TRANSITION_RADIATION_PEAK_NM = 310.0; // Transition radiation peak
export const TRANSITION_RADIATION_THRESHOLD_GAMMA = 2.0; // Gamma threshold for transition radiation

// Detector and safety constants
export const BASE_NOISE_RMS = 2.4; // Legacy noise constant (no longer used by the SNR model)
export const MIN_SNR_DB = 1.0; // Legacy minimum SNR constant (no longer used by the SNR model)
export const FLUENCE_ERROR_BASE = 1.12; // Base fluence error
export const COLLISION_MFP_BASE = 12.5; // Base mean free path for collisions
export const RADIATION_LOSS_COEFFICIENT = 0.045; // Radiation loss coefficient

/** Elementary charge-independent constant used in Larmor / synchrotron formulas (0.3 * B * rho = p in GeV/c). */
const LARMOR_FACTOR = 0.3;
/** Synchrotron critical energy coefficient for electrons: eps_c = 665 * E^2[GeV] * B[T] keV. */
const SYNCHROTRON_CRITICAL_COEFF_KEV = 665;

/**
 * Calculates relativistic Beta (v/c) for a given kinetic energy and particle rest mass.
 */
export function calculateRelativisticBeta(energyMeV: number, particleMassMeV: number): number {
  if (energyMeV <= 0) return 0;
  // Relativistic gamma = 1 + T/mc^2, where T is kinetic energy
  const gamma = 1 + (energyMeV / particleMassMeV);
  const betaSq = 1 - (1 / (gamma * gamma));
  return Math.min(MAX_BETA, Math.sqrt(Math.max(0, betaSq)));
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
 *   N/L = 2 * pi * alpha * (1/lambda1 - 1/lambda2) * (1 - 1/(beta^2 n^2))   [per metre]
 * Returned in photons per mm. Returns 0 when beta * n <= 1 (below threshold).
 */
export function frankTammPhotonsPerMm(beta: number, refractiveIndex: number, startNm: number, endNm: number): number {
  const betaN = beta * refractiveIndex;
  if (!(betaN > 1) || !(startNm > 0) || !(endNm > startNm)) return 0;
  const invLambda1 = 1 / (startNm * 1e-9);
  const invLambda2 = 1 / (endNm * 1e-9);
  const perMetre = 2 * Math.PI * FINE_STRUCTURE_CONSTANT * (invLambda1 - invLambda2) * (1 - 1 / (betaN * betaN));
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
 * Analytical model of wavelength-dependent refractive index using Sellmeier dispersion.
 * Temperature enters only through the linear model n(T) = n_ref(lambda) + dn/dT * (T - 293.15),
 * clamped to REFRACTIVE_INDEX_MIN. The boiling / cryogenic thresholds are informational only.
 */
export function getRefractiveIndexAt(wavelengthNm: number, preset: MaterialPreset, tempK: number = 293.15): number {
  const wlUm = wavelengthNm / 1000.0; // Sellmeier formulas use micrometers
  let n = preset.refractiveIndexStatic;

  if (preset.sellmeierCoeffs) {
    const { B1, C1, B2, C2 } = preset.sellmeierCoeffs;
    const wlSq = wlUm * wlUm;
    // Standard 2-term Sellmeier equation: n^2 - 1 = B1*w^2/(w^2 - C1) + B2*w^2/(w^2 - C2)
    const term1 = (B1 * wlSq) / (wlSq - C1);
    const term2 = (B2 * wlSq) / (wlSq - C2);
    const nSq = 1.0 + term1 + term2;
    if (nSq > 0) {
      n = Math.sqrt(nSq);
    }
  } else {
    // Dispersion falloff approximation if Sellmeier parameters are missing
    n = preset.refractiveIndexStatic + (1500.0 / (wavelengthNm * wavelengthNm));
  }

  // Linear thermal drift: n(T) = n_ref + dn/dT * (T - 293.15)
  const deltaT = tempK - STANDARD_TEMP_K;
  n = n + (deltaT * THERMAL_COEFFICIENT_DN_DT);

  return Math.max(REFRACTIVE_INDEX_MIN, n);
}

/**
 * Analytical target medium optical coefficients.
 * Returns { mu_a: absorption, mu_s: scattering } in mm^-1.
 */
export function getMediumCoefficients(wavelengthNm: number, materialId: string): { mu_a: number; mu_s: number } {
  let mu_a = 0.05;
  let mu_s = 5.0;

  if (materialId === "water") {
    // Water has extremely high UV-blue transparency, absorbing mostly in the infra-red
    mu_a = 0.00001 + (wavelengthNm > 600 ? 0.001 * Math.pow((wavelengthNm - 600) / 100, 2) : 0);
    mu_s = 0.001; // extremely low Rayleigh scattering
  } else if (materialId === "heavy_water") {
    // Heavy water (D2O) has even higher optical transparency
    mu_a = 5e-6 + (wavelengthNm > 650 ? 0.0005 * Math.pow((wavelengthNm - 650) / 100, 2) : 0);
    mu_s = 0.0008;
  } else if (materialId === "lead_glass") {
    // High-Z electromagnetic calorimeter lead glass: high absorption below 380nm (UV cutoff)
    const uvFalloff = wavelengthNm < 400 ? 2.5 * Math.exp(-(wavelengthNm - 300) / 30) : 0;
    mu_a = 0.001 + uvFalloff;
    mu_s = 0.012 * Math.pow(wavelengthNm / 500, -1.8);
  } else if (materialId === "liquid_argon") {
    // Cryogenic LAr deep UV absorption window
    mu_a = 0.0002;
    mu_s = 0.04 * Math.pow(wavelengthNm / 500, -4.0); // pure Rayleigh power law
  } else if (materialId === "plastic_scintillator") {
    // PVT copolymer absorbs strongly below its organic scintillation threshold (400nm)
    const cutoff = wavelengthNm < 415 ? 1.8 * Math.exp(-(wavelengthNm - 320) / 35) : 0;
    mu_a = 0.015 + cutoff;
    mu_s = 0.08 * Math.pow(wavelengthNm / 500, -1.5);
  } else if (materialId === "quartz") {
    // Extremely transparent ultra-pure synthetic fused silica
    mu_a = 1e-6;
    mu_s = 2e-4 * Math.pow(wavelengthNm / 500, -4.0);
  } else if (materialId === "lyso") {
    // High-Z crystal: Ce3+ absorption band creates local peak around 350-380nm
    const cePeak = 0.15 * Math.exp(-Math.pow((wavelengthNm - 365) / 25, 2));
    mu_a = 0.001 + cePeak;
    mu_s = 0.01 * Math.pow(wavelengthNm / 500, -1.2);
  } else if (materialId === "aerogel") {
    // Aerogel has massive forward scattering due to nanostructured SiO2 skeletons
    mu_a = 1e-5;
    mu_s = 0.025 * Math.pow(wavelengthNm / 500, -4.0); // classic Rayleigh scattering dominant
  }

  return { mu_a, mu_s };
}

/**
 * Evaluates the effective attenuation coefficient mu_eff according to isotropic diffusion theory:
 * mu_eff = sqrt(3 * mu_a * (mu_a + mu_s' )) where mu_s' = mu_s * (1 - g)
 */
export function calculateEffectiveAttenuation(mu_a: number, mu_s: number, g: number): number {
  const mu_s_prime = mu_s * (1.0 - g);
  return Math.sqrt(Math.max(0, 3.0 * mu_a * (mu_a + mu_s_prime)));
}

/**
 * Path-averaged transmission for photons emitted uniformly over [0, L] in a slab of thickness d:
 *   T_avg = exp(-mu d) * (exp(mu L) - 1) / (mu L)
 * Evaluated as exp(-mu (d - L)) * (1 - exp(-mu L)) / (mu L), which is the same value without overflow.
 * mu in mm^-1, lengths in mm. Falls back to exp(-mu d) when mu * L is negligible.
 */
function pathAveragedTransmission(mu: number, emissionLengthMm: number, thicknessMm: number): number {
  const x = mu * emissionLengthMm;
  if (x > 1e-9) {
    return Math.exp(-mu * (thicknessMm - emissionLengthMm)) * (-Math.expm1(-x)) / x;
  }
  return Math.exp(-mu * thicknessMm);
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/**
 * Runs Cherenkov emission and transport models.
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

  // Decide particle rest mass based on physics standard profiles or custom mass
  let massMeV = ELECTRON_MASS_MEV;
  if (params.isotopeId === "custom") {
    massMeV = params.customRestMassMeV || ELECTRON_MASS_MEV;
  } else if (isotopePreset) {
    if (isotopePreset.type === "proton") massMeV = PROTON_MASS_MEV;
    else if (isotopePreset.type === "heavy-ion") {
      if (isotopePreset.id === "carbon_ion") massMeV = CARBON_ION_MASS_MEV;
      else massMeV = ALPHA_MASS_MEV;
    }
    else if (isotopePreset.type === "alpha") massMeV = ALPHA_MASS_MEV;
    else if (isotopePreset.type === "neutron") massMeV = NEUTRON_MASS_MEV;
    else if (isotopePreset.type === "meson") massMeV = PION_MASS_MEV;
    else if (isotopePreset.id === "muon_cosmic" || isotopePreset.type === "custom") massMeV = MUON_MASS_MEV;
  }

  // Apply scalable energy units (GeV, TeV) converting safely to standard internal MeV metric
  let E_beam = params.beamEnergyMeV;
  if (params.energyUnit === "GeV") {
    E_beam = params.beamEnergyMeV * 1000;
  } else if (params.energyUnit === "TeV") {
    E_beam = params.beamEnergyMeV * 1000000;
  }

  const beta = calculateRelativisticBeta(E_beam, massMeV);
  const gamma = 1 + (E_beam / massMeV);

  const depthMm = params.radiatorThicknessMm; // radiator thickness d (mm)
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
    const qe = clamp01((detector.quantumEfficiencyPct || 0) / 100);
    const deadFactor = params.daq ? 1 - clamp01(params.daq.deadtimeFraction || 0) : 1;
    detectionFactor = qe * deadFactor;
  }

  let perParticleEmitted = 0;
  let perParticleDetected = 0;
  let perParticlePhotons = 0;
  let maxWavelength = 300;
  let maxWavelengthYield = -1;

  const g = materialPreset.anisotropyG;

  // Wavelength grid: guard against non-finite / non-positive bin widths and unbounded grids
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

  // Charge alignment: Cherenkov yield scales with Z^2
  let zVal = params.beamCharge !== undefined ? params.beamCharge : 1;
  if (params.isotopeId === "custom") {
    zVal = params.customChargeE !== undefined ? params.customChargeE : 1;
  }
  const zSq = Math.pow(zVal, 2);

  // Divergence peak smearing loss factor
  const divLoss = Math.exp(-(params.beamDivergenceMrad || 0) * 0.001);

  // Thermodynamic anomaly flags (informational)
  const chamberTemp = params.chamberTemperatureK || STANDARD_TEMP_K;
  const isThermalAnomaly = chamberTemp > BOILING_THRESHOLD_K || chamberTemp < CRYOGENIC_THRESHOLD_K;
  const thermalDeviationPct = ((chamberTemp - STANDARD_TEMP_K) / STANDARD_TEMP_K) * 100;
  const hasPositiveBreak = chamberTemp > BOILING_THRESHOLD_K;
  const hasNegativeBreak = chamberTemp < CRYOGENIC_THRESHOLD_K;

  for (let i = 0; i < nPoints; i++) {
    const lambda = start + i * binWidth;
    const n = getRefractiveIndexAt(lambda, materialPreset, chamberTemp);

    // 1. Frank-Tamm Relativistic Cherenkov Emission Formula (per particle)
    // d^2N / (dx d\lambda) = (2 * \pi * \alpha / \lambda^2) * (1 - 1 / (\beta^2 * n^2)) * Z^2 * divergence_factors
    let primaryYield = 0;
    const betaN = beta * n;

    if (betaN > 1.0) {
      generatesCherenkov = true;
      const factor = 1.0 - (1.0 / (betaN * betaN));
      const lambdaMeters = lambda * 1e-9;
      const binMeters = binWidth * 1e-9;

      primaryYield = ((2.0 * Math.PI * FINE_STRUCTURE_CONSTANT * dxMeters) / Math.pow(lambdaMeters, 2)) * factor * binMeters * zSq * divLoss;
    }

    // 2. Secondary Cherenkov Cascades (delta-ray recoil electrons)
    const secondaryYield = primaryYield * SECONDARY_CHERENKOV_FACTOR * Math.log(1.0 + E_beam / 25.0);

    // 3. Bremsstrahlung radiator model
    // heuristic model, not a first-principles calculation
    let bremsYield = 0;
    if (params.componentsActive.bremsstrahlung) {
      const zFactor = (params.isotopeId === "custom" ? zVal : (isotopePreset?.type === "heavy-ion" ? 3.0 : 1.0));
      // Enhanced Bremsstrahlung model with Z^2 dependence and energy scaling
      const screeningFactor = Math.log(183 * Math.pow(zFactor, -1/3));
      bremsYield = (BREMSSTRAHLUNG_COEFFICIENT * Math.pow(zFactor, 2) * screeningFactor * (1 / 1000) * E_beam) / Math.pow(wavelengthNmToEnergyEv(lambda), 1.15);
      bremsYield = bremsYield * binWidth * 1e-3;
    }

    // 4. Dopant induced fluorescent scintillation / wavelength shifter peaks
    // heuristic model, not a first-principles calculation
    let fluorYield = 0;
    if (params.componentsActive.fluorescence) {
      // Quantum nano-dopant or crystal fluorescence centers
      const peakNm = params.nanoparticlesActive ? params.nanoparticlePeakNm : (materialPreset.id === 'lyso' ? 420 : 510);
      const intensityParam = params.nanoparticlesActive ? params.nanoparticleConcentrationPpm * 0.035 * (1 / 1e4) : 0.0;
      const crystalLuminescence = (materialPreset.id === 'lyso' ? 1.25 * (1 / 1e3) : 0.0);

      const fwhmWidth = params.nanoparticlesActive ? 25.0 : 40.0;
      const exponent = Math.pow((lambda - peakNm) / fwhmWidth, 2);
      fluorYield = (intensityParam + crystalLuminescence) * Math.exp(-exponent);
    }

    // Optical Rayleigh scattering loss channel (losses scale in 1/lambda^4)
    let rayleighLossFactor = 1.0;
    if (params.componentsActive.opticalRayleighScattering) {
      const scatteringMeanFreePathMm = RAYLEIGH_MEAN_FREE_PATH_BASE * Math.pow(lambda / RAYLEIGH_SCATTERING_BASE_NM, 4.0); // strong UV/blue scattering loss
      rayleighLossFactor = Math.exp(-depthMm / scatteringMeanFreePathMm);
    }

    // 5. Compton recoil secondary electron contribution
    // heuristic model, not a first-principles calculation
    let comptonContribution = 0;
    if (params.componentsActive.comptonScattering) {
      // Enhanced Compton scattering model with Klein-Nishina cross-section approximation
      const gammaFlux = 1 * 0.03; // Compton recoil secondary source factor
      const photonEnergyEv = wavelengthNmToEnergyEv(lambda);
      const electronRestMassEv = ELECTRON_MASS_MEV * 1e6; // Convert MeV to eV
      const alpha = photonEnergyEv / electronRestMassEv;
      // Simplified Klein-Nishina factor
      const kleinNishina = 1 / (1 + alpha * (1 - Math.cos(0.5))); // Average scattering angle
      comptonContribution = (0.015 * gammaFlux * (E_beam / 100.0) * kleinNishina) / Math.sqrt(lambda);
    }

    // Photoelectric UV ionization absorption (sharp cutoff below 410 nm)
    let photoelectricTransmissionFactor = 1.0;
    if (params.componentsActive.photoelectricIonization) {
      if (lambda < PHOTOELECTRIC_CUTOFF_NM) {
        photoelectricTransmissionFactor = Math.max(0.01, Math.pow((lambda - 200.0) / 210.0, 3));
      }
    }

    // 6. Transition radiation peak (X-ray/UV interface radiation)
    // heuristic model, not a first-principles calculation
    let transitionRadiationYield = 0;
    if (params.componentsActive.transitionRadiation && gamma > TRANSITION_RADIATION_THRESHOLD_GAMMA) {
      // Emitted when relativistic particle crosses boundary of materials with different dielectric indexes
      const trStrength = (FINE_STRUCTURE_CONSTANT * Math.log(gamma) * (1 / 1e4));
      // Highly blue/UV skewed
      transitionRadiationYield = trStrength * Math.exp(-(lambda - TRANSITION_RADIATION_PEAK_NM) / 15) * (lambda < 380 ? 1 : 0.1);
    }

    const realPrimary = params.componentsActive.primaryCherenkov ? primaryYield : 0;
    const realSecondary = params.componentsActive.secondaryCherenkov ? secondaryYield : 0;
    const realBrems = params.componentsActive.bremsstrahlung ? bremsYield : 0;
    const realFluor = params.componentsActive.fluorescence ? fluorYield : 0;
    const realCompton = params.componentsActive.comptonScattering ? comptonContribution : 0;
    const realTransition = params.componentsActive.transitionRadiation ? transitionRadiationYield : 0;

    // Base physical detector grid background
    const realBg = params.componentsActive.detectorBackground ? 0.015 * Math.sin(lambda / 120) + 0.02 : 0;

    const rawTotal = (realPrimary + realSecondary + realBrems + realFluor + realCompton + realTransition);

    // Optical transport: path-averaged transmission over the emission length, times scattering/photoelectric factors
    const coeff = getMediumCoefficients(lambda, materialPreset.id);
    const mu_eff = calculateEffectiveAttenuation(coeff.mu_a, coeff.mu_s, g); // mm^-1
    let transmission = pathAveragedTransmission(mu_eff, emissionLengthMm, depthMm) * rayleighLossFactor * photoelectricTransmissionFactor;
    transmission = Math.max(0.0001, Math.min(1.0, transmission));

    // Photons per particle reaching the detector, after detector coupling
    const opticalTransmittedTotal = ((rawTotal * transmission) + realBg) * detectionFactor;

    if (opticalTransmittedTotal > maxWavelengthYield) {
      maxWavelengthYield = opticalTransmittedTotal;
      maxWavelength = lambda;
    }

    perParticleEmitted += rawTotal;
    perParticleDetected += opticalTransmittedTotal;
    perParticlePhotons += realPrimary + realSecondary;

    if (betaN > 1) {
      sumAngles += cherenkovAngleDeg(beta, n);
      countAngles++;
    }

    points.push({
      wavelengthNm: lambda,
      primaryCherenkov: Number(realPrimary.toFixed(3)),
      secondaryCherenkov: Number(realSecondary.toFixed(3)),
      bremsstrahlung: Number(realBrems.toFixed(3)),
      fluorescence: Number(realFluor.toFixed(3)),
      background: Number((realBg + realCompton + realTransition).toFixed(3)),
      totalYield: Number(opticalTransmittedTotal.toFixed(3)),
      transmission: Number(transmission.toFixed(4)),
    });
  }

  const avgCherenkovAngle = listMeanFromAngleCount(sumAngles, countAngles);

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

  // Fluence computation: photons / mm^2
  const spotAreaMm2 = Math.PI * Math.pow((params.beamFwhmUm || 200.0) / 2000.0, 2);
  const fluence = spotAreaMm2 > 0 ? (totalPhotonsDetected / spotAreaMm2) : 0.0;

  // Experimental mode simulated plan validation index
  let FluenceError = 0.0;
  if (params.experimentalModeActive) {
    FluenceError = FLUENCE_ERROR_BASE + ((params.beamDivergenceMrad || 0) * 0.045) - ((params.nanoparticlesActive ? params.nanoparticleConcentrationPpm : 0) * 0.005);
    FluenceError = Math.max(0.15, Number(FluenceError.toFixed(2)));
  }

  // Radiation Safety
  let safetyClass = "Minimal Exposure / Research Grade";
  const FluenceRate = params.fluenceRateGyMin || 0;
  const cumFluence = params.cumulativeFluenceGy || 0;

  if (cumFluence >= 50.0 || FluenceRate >= 10.0) {
    safetyClass = "Extremely Lethal Beam Zone (High Fluence)";
  } else if (cumFluence >= 5.0 || FluenceRate >= 1.0) {
    safetyClass = "High Radiation Field (Biohazard Control Required)";
  } else if (cumFluence >= 0.1 || FluenceRate > 0.001) {
    safetyClass = "Controlled Active Beamline Area (Occupational Watch)";
  } else {
    safetyClass = "Radio-Safe / Research Minimal Influx";
  }

  // Collision solver
  // N_collisions = N_fired * (1 - e ^ (-trackLength / lambda_mean_free_path))
  // Mean free path decreases at higher mass and scales down at extreme energies
  const alphaMfp = COLLISION_MFP_BASE / (1.0 + Math.pow(E_beam / 1000.0, 0.22));
  const collisionProbability = 1.0 - Math.exp(-trackMm / alphaMfp);
  const totalCollisions = Math.max(0, Math.round(firedParticles * collisionProbability));

  // Radiation heat energy losses estimate (in MeV)
  const radiationLossMeV = params.componentsActive.bremsstrahlung
    ? RADIATION_LOSS_COEFFICIENT * E_beam * Math.log(1.5 + E_beam / 120.0)
    : 0.002 * E_beam;

  return {
    spectra: points,
    summary: {
      beta,
      betaThreshold: 1.0 / minN,
      isCherenkovGenerated: generatesCherenkov,
      cherenkovAngleDeg: Number(avgCherenkovAngle.toFixed(2)),
      totalPhotonsEmitted: Number(totalPhotonsEmitted.toFixed(1)),
      totalPhotonsDetected: Number(totalPhotonsDetected.toFixed(1)),
      photonsPerParticle: Number(perParticlePhotons.toFixed(3)),
      peakWavelengthNm: maxWavelength,
      signalToNoiseRatioDb: snrDb,
      cherenkovThresholdEnergyMeV: Number(cherenkovThreshEnergy.toFixed(3)),
      fluencePhotonsPerMm2: Number(fluence.toFixed(2)),
      experimentalFluencePercentError: FluenceError,
      radSafetyClassification: safetyClass,

      // Dynamic extended properties returned to render
      isThermalAnomaly,
      thermalDeviationPct: Number(thermalDeviationPct.toFixed(2)),
      hasPositiveBreak,
      hasNegativeBreak,
      firedParticles,
      totalCollisions,
      radiationLossMeV: Number(radiationLossMeV.toFixed(3)),
    },
  };
}

function listMeanFromAngleCount(sum: number, count: number): number {
  if (count === 0) return 0.0;
  return sum / count;
}

function wavelengthNmToEnergyEv(wlNm: number): number {
  return 1239.84193 / wlNm;
}

/**
 * Calculates theoretical minimum energy required for Cherenkov threshold in MeV
 * E_thresh = m_0*c^2 * ( 1/sqrt(1 - beta_thresh^2) - 1 ) where beta_thresh = 1/n
 */
export function getCherenkovThresholdEnergy(massMeV: number, refractiveIndex: number): number {
  if (refractiveIndex <= 1.0) return Infinity;
  const beta_thr = 1.0 / refractiveIndex;
  const gamma_thr = 1.0 / Math.sqrt(1.0 - beta_thr * beta_thr);
  return massMeV * (gamma_thr - 1.0);
}

/**
 * SNR = S / sqrt(S + B) in dB, where S is detected signal photons per run and B is dark counts per run.
 * Returns 0 dB when there is no signal. SNR is floored at 1e-6 before the log.
 */
function signalToNoiseDb(signalPhotons: number, darkCounts: number): number {
  if (!(signalPhotons > 0)) return 0;
  const snr = Math.max(1e-6, signalPhotons / Math.sqrt(signalPhotons + Math.max(0, darkCounts)));
  return Number((10.0 * Math.log10(snr)).toFixed(1));
}
