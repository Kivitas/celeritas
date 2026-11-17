/**
 * @license
 * SPDX-License-Identifier: MIT
 */

export interface MaterialPreset {
  id: string;
  name: string;
  refractiveIndexStatic: number;
  sellmeierCoeffs?: { B1: number; C1: number; B2?: number; C2?: number; B3?: number; C3?: number; B4?: number; C4?: number }; // Sellmeier terms, C in um^2
  mu_a_base: number; // UNUSED: not read by the engine (see plan T2.2)
  mu_s_base: number; // UNUSED: not read by the engine (see plan T2.2)
  anisotropyG: number; // Henyey-Greenstein g factor
  // Provenance (docs/IMPROVEMENT_PLAN.md T2.2). Materials without verified: true are hidden by default in the UI.
  verified?: boolean;
  source?: string;
  // Sourced absorption spectrum (plan T2.3). When present it replaces the unsourced coefficients in transport.
  absorptionTable?: AbsorptionPoint[];
  // Stopping-power data (plan T3.4). Present only where the density and I value are sourced.
  stopping?: { zOverA: number; iMeV: number; densityGcm3: number };
}

export interface AbsorptionPoint {
  wavelengthNm: number;
  /** Absorption coefficient alpha in 1/m (Beer-Lambert: I = I0 exp(-alpha x)). Must be > 0. */
  alphaPerM: number;
}

export interface IsotopeProfile {
  id: string;
  name: string;
  type: "e-" | "beta-" | "beta+" | "alpha" | "proton" | "heavy-ion" | "neutron" | "meson" | "ec" | "custom";
  baseEnergyMeV: number;
  fluxIntensity: number; // particles/cm2/s
  pdgId: number;
  polarization: number; // 0 to 1
  halfLife?: string;
}

export interface DetectorSettings {
  quantumEfficiencyPct: number; // photon detection efficiency, percent (user input; no sourced default)
  darkCountRateHz: number; // dark counts per second over the whole sensor
  frameRateHz: number; // readout frame rate, used to scale dark counts per frame
}

export interface SimulationParams {
  isotopeId: string;
  customIsotopeName: string;
  beamEnergyMeV: number; // kinetic energy, in the unit given by energyUnit
  energyUnit: "MeV" | "GeV" | "TeV";
  beamCharge: number; // Z of the incident particle, in units of e
  customRestMassMeV: number; // used when isotopeId is "custom"
  customChargeE: number; // used when isotopeId is "custom"
  magneticFieldT: number; // only for the Larmor-radius helper in the details panel
  beamFwhmUm: number; // beam spot FWHM, used for the fluence estimate
  trackLengthMm: number; // path length through the radiator for emission
  numberFiredParticles: number; // particles per run
  chamberTemperatureK: number;
  materialId: string;
  radiatorThicknessMm: number;
  spectralRangeStartNm: number;
  spectralRangeEndNm: number;
  binResolutionNm: number;
  componentsActive: { primaryCherenkov?: boolean };
  daq: { deadtimeFraction: number };
}

export interface SimulationResultPoint {
  wavelengthNm: number;
  primaryCherenkov: number; // Frank-Tamm photons per particle in this bin, before transport and detection
  totalYield: number; // photons per particle in this bin reaching the detector (transport and detector coupling applied)
  transmission: number; // path-averaged optical transmission, 0..1
}

export interface SimulationSummary {
  beta: number; // v/c
  betaThreshold: number; // 1/n at the reference wavelength
  isCherenkovGenerated: boolean;
  cherenkovAngleDeg: number; // yield-weighted mean emission angle over the spectrum
  cherenkovAngleSpreadDeg: number; // yield-weighted standard deviation of the angle (chromatic spread)
  // PER RUN (per-particle value * numberFiredParticles). Detected photons include detector QE and DAQ deadtime.
  totalPhotonsEmitted: number;
  totalPhotonsDetected: number;
  // Per particle, Frank-Tamm, before optical transport and detection.
  photonsPerParticle: number;
  peakWavelengthNm: number;
  // 10*log10(S / sqrt(S + B)), S = detected photons per run, B = dark counts per run. 0 when no signal.
  signalToNoiseRatio: number; // S / sqrt(S + B): detected photons per run over sqrt(photons + dark counts per run)
  cherenkovThresholdEnergyMeV: number; // at the 500 nm reference index
  cherenkovThresholdBandMeV: [number, number]; // lowest and highest threshold over the spectral range (dispersion)
  firedParticles: number;
  energyLossModelled: boolean; // true when the particle slows down along the emission length
  kineticAtExitMeV: number; // kinetic energy at the end of the emission length (initial energy when no loss model)
  fluencePhotonsPerMm2: number; // detected photons per run over the beam spot area
}

export interface BatchRow {
  id: string;
  sampleName: string;
  beta: number;
  refractiveIndex: number;
  energyMeV: number;
  radiatorThicknessMm: number;
  angleDeg?: number;
  photonYield?: number;
}

