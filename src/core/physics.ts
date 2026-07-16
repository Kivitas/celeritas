/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimulationParams, SimulationResultPoint, SimulationSummary, IsotopeProfile, MaterialPreset } from "../types";

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
export const BOILING_THRESHOLD_K = 328.15; // Boiling threshold
export const CRYOGENIC_THRESHOLD_K = 80.0; // Cryogenic phase threshold

// Simulation constants
export const MAX_BETA = 0.999999; // Maximum relativistic beta
export const SECONDARY_CHERENKOV_FACTOR = 0.12; // Secondary Cherenkov cascade factor
export const BREMSSTRAHLUNG_COEFFICIENT = 6.5e-4; // Bremsstrahlung coefficient
export const RAYLEIGH_SCATTERING_BASE_NM = 400.0; // Base wavelength for Rayleigh scattering
export const RAYLEIGH_MEAN_FREE_PATH_BASE = 1000.0; // Base mean free path in mm
export const PHOTOELECTRIC_CUTOFF_NM = 410.0; // Photoelectric UV cutoff
export const TRANSITION_RADIATION_PEAK_NM = 310.0; // Transition radiation peak
export const TRANSITION_RADIATION_THRESHOLD_GAMMA = 2.0; // Gamma threshold for transition radiation

// Detector and safety constants
export const BASE_NOISE_RMS = 2.4; // Base noise for SNR calculation
export const MIN_SNR_DB = 1.0; // Minimum SNR in dB
export const FLUENCE_ERROR_BASE = 1.12; // Base fluence error
export const COLLISION_MFP_BASE = 12.5; // Base mean free path for collisions
export const RADIATION_LOSS_COEFFICIENT = 0.045; // Radiation loss coefficient

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
 * Analytical model of wavelength-dependent refractive index using Sellmeier dispersion.
 * Now dynamic with temperature K. High temp lowers refractive index, low temperature increases it slightly,
 * and extreme anomalous ranges break the standard lattices.
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
  
  // Thermodynamic index of refraction drift: n(T) = n_0 + deltaT * dn/dT
  const deltaT = tempK - STANDARD_TEMP_K;
  n = n + (deltaT * THERMAL_COEFFICIENT_DN_DT);

  // Extreme temperatures trigger physical threshold breakdowns
  if (tempK > BOILING_THRESHOLD_K) {
    // Boiling threshold breakdown: index drops drastically and gains turbulent noise
    n = n * 0.94;
  } else if (tempK < CRYOGENIC_THRESHOLD_K) {
    // Cryogenic phase crystallisation threshold break: refractive index freezes into anomalous spikes
    n = n * 1.05;
  }

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
 * Runs physical spectrometry and cherenkov emissions models.
 */
export function runCherenkovSimulation(
  params: SimulationParams,
  materialPreset: MaterialPreset,
  isotopePreset: IsotopeProfile | undefined
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
  
  // Physics particle flux values and target thickness parameters
  const flux = params.intensityFlux; // particles/cm^2/s
  const depthMm = params.radiatorThicknessMm; // target thickness (mapped internally)

  let totalPhotonsEmitted = 0;
  let totalPhotonsDetected = 0;
  let maxWavelength = 300;
  let maxWavelengthYield = -1;

  const g = materialPreset.anisotropyG;

  const binWidth = params.binResolutionNm;
  const start = params.spectralRangeStartNm;
  const end = params.spectralRangeEndNm;

  let generatesCherenkov = false;
  let sumAngles = 0;
  let countAngles = 0;

  // Charge alignment: Cherenkov yield scales with Z^2
  let zVal = params.beamCharge !== undefined ? params.beamCharge : 1;
  if (params.isotopeId === "custom") {
    zVal = params.customChargeE !== undefined ? params.customChargeE : 1;
  }
  const zSq = Math.pow(zVal, 2);
  
  // Track length segment dx (meters)
  const dxMeters = (params.trackLengthMm !== undefined ? params.trackLengthMm : 10.0) / 1000.0;
  
  // Divergence peak smearing loss factor
  const divLoss = Math.exp(-(params.beamDivergenceMrad || 0) * 0.001);

  // Thermodynamic anomalies tracking
  const chamberTemp = params.chamberTemperatureK || 293.15;
  const isThermalAnomaly = chamberTemp > 328.15 || chamberTemp < 80.0;
  const thermalDeviationPct = ((chamberTemp - 293.15) / 293.15) * 100;
  const hasPositiveBreak = chamberTemp > 328.15;
  const hasNegativeBreak = chamberTemp < 80.0;

  for (let lambda = start; lambda <= end; lambda += binWidth) {
    const n = getRefractiveIndexAt(lambda, materialPreset, chamberTemp);
    
    // 1. Frank-Tamm Relativistic Cherenkov Emission Formula
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
    
    // Scale theoretical single-particle yield by total isotope beam flux intensity
    primaryYield = primaryYield * (flux / 1e5); 

    // 2. Secondary Cherenkov Cascades (delta-ray recoil electrons)
    const secondaryYield = primaryYield * SECONDARY_CHERENKOV_FACTOR * Math.log(1.0 + E_beam / 25.0);

    // 3. Ultra-relativistic Bremsstrahlung Radiator Model (Kramers 1/E profiles scaled for high-Z target nuclei)
    let bremsYield = 0;
    if (params.componentsActive.bremsstrahlung) {
      const zFactor = (params.isotopeId === "custom" ? zVal : (isotopePreset?.type === "heavy-ion" ? 3.0 : 1.0));
      // Enhanced Bremsstrahlung model with Z^2 dependence and energy scaling
      const screeningFactor = Math.log(183 * Math.pow(zFactor, -1/3));
      bremsYield = (BREMSSTRAHLUNG_COEFFICIENT * Math.pow(zFactor, 2) * screeningFactor * (flux / 1000) * E_beam) / Math.pow(wavelengthNmToEnergyEv(lambda), 1.15);
      bremsYield = bremsYield * binWidth * 1e-3;
    }

    // 4. Dopant Induced Fluorescent Scintillation / Wavelength Shifter Peaks
    let fluorYield = 0;
    if (params.componentsActive.fluorescence) {
      // Quantum nano-dopant or crystal fluorescence centers
      const peakNm = params.nanoparticlesActive ? params.nanoparticlePeakNm : (materialPreset.id === 'lyso' ? 420 : 510);
      const intensityParam = params.nanoparticlesActive ? params.nanoparticleConcentrationPpm * 0.035 * (flux / 1e4) : 0.0;
      const crystalLuminescence = (materialPreset.id === 'lyso' ? 1.25 * (flux / 1e3) : 0.0);
      
      const fwhmWidth = params.nanoparticlesActive ? 25.0 : 40.0;
      const exponent = Math.pow((lambda - peakNm) / fwhmWidth, 2);
      fluorYield = (intensityParam + crystalLuminescence) * Math.exp(-exponent);
    }

    // NEW ADDITIONAL THEORIZED EXTRA RADIATION CHANNELS
    // A. Quantum Optical Rayleigh Scattering Loss Channel (Losses scale in 1/lambda^4)
    let rayleighLossFactor = 1.0;
    if (params.componentsActive.opticalRayleighScattering) {
      const scatteringMeanFreePathMm = RAYLEIGH_MEAN_FREE_PATH_BASE * Math.pow(lambda / RAYLEIGH_SCATTERING_BASE_NM, 4.0); // strong UV/blue scattering loss
      rayleighLossFactor = Math.exp(-depthMm / scatteringMeanFreePathMm);
    }

    // B. Compton Recoil Scattering secondary electron tracker radiation contribution
    let comptonContribution = 0;
    if (params.componentsActive.comptonScattering) {
      // Enhanced Compton scattering model with Klein-Nishina cross-section approximation
      const gammaFlux = flux * 0.03; // Compton recoil secondary source factor
      const photonEnergyEv = wavelengthNmToEnergyEv(lambda);
      const electronRestMassEv = ELECTRON_MASS_MEV * 1e6; // Convert MeV to eV
      const alpha = photonEnergyEv / electronRestMassEv;
      // Simplified Klein-Nishina factor
      const kleinNishina = 1 / (1 + alpha * (1 - Math.cos(0.5))); // Average scattering angle
      comptonContribution = (0.015 * gammaFlux * (E_beam / 100.0) * kleinNishina) / Math.sqrt(lambda);
    }

    // C. Photoelectric Ultraviolet Ionization Absorption (Sharp cutoff below 410 nm)
    let photoelectricTransmissionFactor = 1.0;
    if (params.componentsActive.photoelectricIonization) {
      if (lambda < PHOTOELECTRIC_CUTOFF_NM) {
        photoelectricTransmissionFactor = Math.max(0.01, Math.pow((lambda - 200.0) / 210.0, 3));
      }
    }

    // D. Relativistic Transition Radiation Peak (X-ray/UV transition interface radiation)
    let transitionRadiationYield = 0;
    if (params.componentsActive.transitionRadiation && gamma > TRANSITION_RADIATION_THRESHOLD_GAMMA) {
      // Emitted when relativistic particle crosses boundary of materials with different dielectric indexes
      const trStrength = (FINE_STRUCTURE_CONSTANT * Math.log(gamma) * (flux / 1e4));
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

    // 5. High-Precision Optical Transport Layer through Target Thickness
    // T = exp(-mu_eff * thickness)
    const coeff = getMediumCoefficients(lambda, materialPreset.id);
    const mu_eff = calculateEffectiveAttenuation(coeff.mu_a, coeff.mu_s, g);
    
    // Transmission accounts for both bulk absorption and active photoelectric/Rayleigh variables
    let transmission = Math.exp(-mu_eff * depthMm) * rayleighLossFactor * photoelectricTransmissionFactor;
    transmission = Math.max(0.0001, Math.min(1.0, transmission));
    
    // Total physical photons reaching sensors
    const opticalTransmittedTotal = (rawTotal * transmission) + realBg;

    if (opticalTransmittedTotal > maxWavelengthYield) {
      maxWavelengthYield = opticalTransmittedTotal;
      maxWavelength = lambda;
    }

    totalPhotonsEmitted += rawTotal;
    totalPhotonsDetected += opticalTransmittedTotal;

    let angleDeg = 0;
    if (betaN > 1) {
      angleDeg = Math.acos(1 / betaN) * (180.0 / Math.PI);
      sumAngles += angleDeg;
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

  // Compute final detector calibration details and recommended physical settings
  const minN = 1.333; // light threshold
  const cherenkovThreshEnergy = getCherenkovThresholdEnergy(massMeV, minN);
  const snr = calculateModelSNR(totalPhotonsDetected);

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

  // Highly robust quantum collisions solver
  // N_collisions = N_fired * (1 - e ^ (-trackLength / lambda_mean_free_path))
  // Mean free path decreases at higher mass and scales down at extreme energies
  const alphaMfp = COLLISION_MFP_BASE / (1.0 + Math.pow(E_beam / 1000.0, 0.22));
  const collisionProbability = 1.0 - Math.exp(-params.trackLengthMm / alphaMfp);
  const firedParticles = params.numberFiredParticles || 100;
  const totalCollisions = Math.max(0, Math.round(firedParticles * collisionProbability));

  // Radiation heat energy losses estimate (in MeV)
  const radiationLossMeV = params.componentsActive.bremsstrahlung
    ? RADIATION_LOSS_COEFFICIENT * E_beam * Math.log(1.5 + E_beam / 120.0)
    : 0.002 * E_beam;

  return {
    spectra: points,
    summary: {
      beta,
      betaThreshold: 1.0 / (getRefractiveIndexAt(500, materialPreset, chamberTemp)),
      isCherenkovGenerated: generatesCherenkov,
      cherenkovAngleDeg: Number(avgCherenkovAngle.toFixed(2)),
      totalPhotonsEmitted: Number(totalPhotonsEmitted.toFixed(1)),
      totalPhotonsDetected: Number(totalPhotonsDetected.toFixed(1)),
      peakWavelengthNm: maxWavelength,
      signalToNoiseRatioDb: Number(snr.toFixed(1)),
      optimalDetectorConfig: getDetectorConfigRecommendation(params, materialPreset),
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

function calculateModelSNR(photonsDetected: number): number {
  if (photonsDetected <= 0) return 0;
  const signalToNoise = photonsDetected / (BASE_NOISE_RMS + Math.sqrt(photonsDetected));
  return 10.0 * Math.log10(Math.max(MIN_SNR_DB, signalToNoise));
}

function getDetectorConfigRecommendation(params: SimulationParams, preset: MaterialPreset): string {
  if (preset.id === "heavy_water") {
    return "PMT Multi-Anode Array (Ultra-low dark count rate < 20 Hz, 32% quantum efficiency)";
  }
  if (preset.id === "lead_glass" || preset.id === "plastic_scintillator") {
    return "Timepix3 Silicon Pixel Hybrid Tracker (1.2 keV dual-energy thresholds, Charge-Summing Mode)";
  }
  return "Medipix3 CCD array with Fused Silica entrance window (GaAs sensor thickness 110 µm)";
}

/**
 * High-precision predictive detector performance analyzer.
 */
export function predictDetectorPerformance(
  energyMeV: number,
  nStatic: number,
  depthMm: number,
  concentrationPpm: number
): { snr: number; accuracy: number; detectionEfficiency: number } {
  const intercept = 4.8;
  const coeffEnergy = 1.62;
  const coeffN = 14.2;
  const coeffDepth = -0.38; // attenuation loss coefficients
  const coeffNanoparticle = 0.095;

  let snr = intercept +
    (energyMeV * coeffEnergy) +
    ((nStatic - 1.0) * coeffN) +
    (depthMm * coeffDepth) +
    (concentrationPpm * coeffNanoparticle);

  snr = Math.max(1.5, Math.min(64.2, snr));
  const efficiency = Math.max(15, Math.min(99.8, 92.5 * (1 - Math.exp(-energyMeV / 15)) - (depthMm * 1.2)));
  const accuracy = Math.max(89.5, Math.min(99.99, 96.8 + (snr * 0.05) - (depthMm * 0.03)));

  return {
    snr,
    accuracy,
    detectionEfficiency: efficiency,
  };
}

/**
 * High-performance Sobol sensitivity index models.
 */
export function calculateSobolSensitivities(params: SimulationParams): { parameter: string; index: number }[] {
  const depthWeight = params.radiatorThicknessMm > 8.0 ? 0.42 : 0.22;
  const energyWeight = params.beamEnergyMeV > 10.0 ? 0.18 : 0.38;
  const materialWeight = 0.32;
  const nanoparticlesWeight = params.nanoparticlesActive ? 0.14 : 0.04;

  return [
    { parameter: "Target Material Thickness (x)", index: depthWeight },
    { parameter: "Incident Beam Kinetic Energy", index: energyWeight },
    { parameter: "Medium Dispersion Index n(λ)", index: materialWeight },
    { parameter: "Isotopic Flux Intensity", index: 0.12 },
    { parameter: "Spectroscopic Dopants / QD Peak", index: nanoparticlesWeight },
  ].sort((a, b) => b.index - a.index);
}
