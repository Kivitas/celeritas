/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MaterialPreset {
  id: string;
  name: string;
  refractiveIndexStatic: number;
  sellmeierCoeffs?: { B1: number; C1: number; B2: number; C2: number }; // Dispersion model parameters
  mu_a_base: number; // base absorption coefficient
  mu_s_base: number; // base scattering coefficient
  anisotropyG: number; // Henyey-Greenstein g factor
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
  chipset: "Medipix3" | "Timepix3" | "SiPM" | "EMCCD" | "Hybrid" | "APD" | "PMT" | "CMOS" | "JUNGFRAU" | "VERITAS" | "HPGe" | "CZT" | "LaBr3" | "ATLAS-ITk" | "CMS-HGCAL" | "ALICE-ITS3" | "LHCb-VELO" | "DEPFET" | "Monolithic-Active-Pixel" | "SPAD-Array";
  geometry: "256x256" | "512x512" | "1024x1024" | "2048x2048" | "4096x4096" | "64x64" | "128x128";
  pixelPitchUm: number; // Micrometers
  thresholdKeV: number;
  noiseRmsKeV: number;
  coincidenceNs: number;
  chargeSharingActive: boolean;
  clusteringAlgo: "None" | "Connected-Components" | "Center-of-Gravity" | "DBSCAN" | "Neural" | "Maximum Likelihood" | "Expectation Maximization";

  // Highly scientific extended silicon matrix & chipset options
  detectorTemperatureC: number; // -273.15 to 100 °C
  leakageCurrentNa: number; // 0.01 to 500 nA
  depletionVoltageV: number; // 10 to 300 V
  substrateThicknessUm: number; // 50 to 1000 um
  quantumEfficiencyPct: number; // 10 to 100 %
  pixelDeadTimeNs: number; // dead recovery clock
  activeCoolingType: "None" | "Thermoelectric Peltier" | "Liquid Nitrogen Cryo" | "Helium Loop" | "Liquid Helium" | "Pulse Tube";
  biasVoltageV: number; // detector operating voltage
  dopingDensityPtype: number; // bulk substrate doping density e12/cm3
  readoutMode: "ToA (Time of Arrival)" | "ToT (Time over Threshold)" | "Counting" | "Triggered Spectrometry" | "Waveform" | "Photon Counting" | "Energy Integrating";
  gainMode: "Low" | "Medium" | "High Gain" | "Variable" | "Ultra-High";
  frameRateHz: number; // Frame rate for continuous readout
  dynamicRangeBits: number; // ADC resolution (8, 12, 14, 16 bits)
  energyResolutionPercent: number; // FWHM at 511 keV for gamma
  timingResolutionPs: number; // Timing resolution in picoseconds
  spatialResolutionUm: number; // Spatial resolution in micrometers
  darkCountRateHz: number; // Dark count rate per pixel
  afterpulsingProbability: number; // Afterpulsing probability
  crosstalkPercent: number; // Optical/electrical crosstalk percentage
}

export interface SimulationParams {
  isotopeId: string;
  customIsotopeName: string;
  beamEnergyMeV: number;
  energyUnit: "MeV" | "GeV" | "TeV"; // Scalable energy unit support
  isRelativisticCalculated: boolean;
  intensityFlux: number;
  incidenceAngleDeg: number;
  magneticFieldT: number;
  beamProfile: "Gaussian" | "Uniform" | "Pencil";
  beamFwhmUm: number; // For Gaussian FWHM
  
  // Advanced beam properties
  beamDivergenceMrad: number; // Beam dispersion/divergence in milliradians
  beamCharge: number; // Particle charge in elementary charges e
  beamPulseWidthNs: number; // Temporal pulse width in nanoseconds
  trackLengthMm: number; // Interactive target path/track length
  
  // Extra detailed particle info
  particleSpin: "0" | "1/2" | "1" | "2"; // Spin property
  baryonNumber: number; // Baryon conservation number
  leptonNumber: number; // Lepton conservation number
  customRestMassMeV: number; // Custom mass
  customChargeE: number; // Custom charge e

  // Particle Trigger options
  numberFiredParticles: number; // Particles per batch trigger

  // Lab setup properties
  labFacility: "SPS-Synchrotron" | "SuperKEKB" | "DESY-II" | "Brookhaven-RHIC" | "BioExperimental-Proton-Suite";
  chamberShape: "Cylindrical-Beam-Pipe" | "Spherical-Reaction-Vessel" | "Toroidal-fusion-Ring" | "Hexagonal-Cubic-Chamber" | "TPC-Cylindrical" | "Calorimeter-Block" | "Muon-Spectrometer";
  dimensionMode: "2D-Orthogonal-Projectors" | "3D-Isometric-Chambers" | "4D-Spacetime-Minkowski";
  chamberTemperatureK: number; // Cryo to high temp
  chamberLengthCm?: number; // Chamber length in centimeters
  
  // Macroscopic Electromagnetic Fields
  magneticFieldTesla: number; // For synchrotron curvature calculations
  electricFieldKvM: number; // For acceleration vectors

  // Monte Carlo Generation
  monteCarloGenerator: "PYTHIA8" | "HERWIG" | "GEANT4_FAST" | "FLUKA" | "MCNP" | "NONE";
  eventGenerator: "MadGraph5" | "EvtGen" | "Corsika" | "Sherpa" | "Standalone";
  mcEventsPerRun: number;
  
  // Advanced Interactions / Astrophysics
  cosmicRaysActive: boolean;
  ambientCosmicRays: boolean;
  gravitationalLensingActive: boolean;
  
  // Data Acquisition & ML Reconstruction
  triggerLevel1Active: boolean;
  mlJetReconstruction: boolean;
  daqDeadTimeFraction: number;

  // Experimental Mode parameters
  experimentalModeActive: boolean;
  experimentalApplication: "imrt" | "proton_therapy_verify" | "nuclear_dosimetry" | "ophthalmic_dosimetry" | "molecular_imaging" | "none";
  fluenceRateGyMin: number; // Experimental radiation Fluence rate in Gy/min
  cumulativeFluenceGy: number; // Cumulative radiation Fluence in Grays (Gy)

  materialId: string;
  nanoparticlePeakNm: number;
  nanoparticlesActive: boolean;
  nanoparticleConcentrationPpm: number;
  radiatorThicknessMm: number; // Radiator Thickness (d)

  spectralRangeStartNm: number;
  spectralRangeEndNm: number;
  binResolutionNm: number;

  // Detector Geometry & Materials
  chamberMaterial: "Vacuum" | "Silicon" | "Germanium" | "Lead" | "LiquidArgon" | "LiquidXenon" | "Aerogel" | "Water";
  
  detectorSubsystems: {
    pixelTracker: boolean;
    stripTracker: boolean;
    tpc: boolean;
    driftChamber: boolean;
    ecal: boolean;
    hcal: boolean;
    muonSpectrometer: boolean;
    rich: boolean;
  };
  
  // Advanced Reconstructions
  reconstruction: {
    kalmanFilter: boolean;
    helixFitting: boolean;
    vertexReconstruction: boolean;
    mlJetClassification: boolean;
    mlAnomalyDetection: boolean;
  };

  // Run Mode
  simulationMode: "deterministic" | "stochastic";
  
  // DAQ & Trigger Effects
  daq: {
    l1Trigger: boolean;
    highLevelTrigger: boolean;
    deadtimeFraction: number;
    radiationDamagePercent: number; 
    sensorDefects: "none" | "low" | "high";
  };

  // Exotic Physics
  exoticPhysics: {
    supersymmetry: boolean;
    darkMatter: boolean;
    magneticMonopoles: boolean;
    axions: boolean;
    sterileNeutrinos: boolean;
    extraDimensions: boolean;
  };

  componentsActive: {
    primaryCherenkov?: boolean;
    secondaryCherenkov?: boolean;
    bremsstrahlung?: boolean;
    fluorescence?: boolean;
    detectorBackground?: boolean;
    opticalRayleighScattering?: boolean;
    comptonScattering?: boolean;
    photoelectricIonization?: boolean;
    transitionRadiation?: boolean;
    synchrotronRadiation?: boolean;
    pairProduction?: boolean;
    hadronicShower?: boolean;
    neutrinoOscillation?: boolean;
    muonDecay?: boolean;
    kaonDecay?: boolean;
    bMesonDecay?: boolean;
    crystalChanneling?: boolean;
    lowEnergyNeutrons?: boolean;
    darkMatterScattering?: boolean;
    axionConversion?: boolean;
    gravitationalWaveLensing?: boolean;
    planckScaleEffects?: boolean;
    magneticMonopoleSignatures?: boolean;
    hawkingRadiation?: boolean;
    [key: string]: boolean | undefined;
  };
}

export interface SimulationResultPoint {
  wavelengthNm: number;
  primaryCherenkov: number;
  secondaryCherenkov: number;
  bremsstrahlung: number;
  fluorescence: number;
  background: number;
  totalYield: number;
  transmission: number;
}

export interface SimulationSummary {
  beta: number; // Particle speed fraction (v/c)
  betaThreshold: number; // Cherenkov threshold velocity
  isCherenkovGenerated: boolean;
  cherenkovAngleDeg: number;
  totalPhotonsEmitted: number;
  totalPhotonsDetected: number;
  peakWavelengthNm: number;
  signalToNoiseRatioDb: number;
  optimalDetectorConfig: string;
  cherenkovThresholdEnergyMeV: number;

  // Highly advanced custom thermodynamic & collision parameters
  isThermalAnomaly: boolean;
  thermalDeviationPct: number;
  hasPositiveBreak: boolean;
  hasNegativeBreak: boolean;
  firedParticles: number;
  totalCollisions: number;
  radiationLossMeV: number;

  // New highly scientific metrics
  fluencePhotonsPerMm2: number; // Photon fluence at the detector face
  experimentalFluencePercentError: number; // Discrepancy for Experimental treatment planning
  radSafetyClassification: string; // "Negligible", "Controlled Area", "High Radiation Field", "Extremely Lethal Beam"
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

export interface CorrelationItem {
  paramA: string;
  paramB: string;
  rValue: number;
}

export interface SensitivityMetric {
  parameter: string;
  sobolFirstOrder: number; // Sobol sensitivity index
  sobolTotalOrder: number;
  lowValue: number;
  highValue: number;
}
