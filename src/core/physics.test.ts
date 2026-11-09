/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  runCherenkovSimulation,
  getRefractiveIndexAt,
  getCherenkovThresholdEnergy,
  calculateRelativisticBeta,
  frankTammPhotonsPerMm,
  cherenkovAngleDeg,
  momentumMeV,
  larmorRadiusM,
  synchrotronCriticalEnergyKeV,
  ELECTRON_MASS_MEV,
} from './physics';
import { MATERIAL_PRESETS, ISOTOPE_PRESETS } from '../data/presets';
import type { DetectorSettings, SimulationParams } from '../types';

const heavyWater = MATERIAL_PRESETS.find((m) => m.id === 'heavy_water')!;
const quartz = MATERIAL_PRESETS.find((m) => m.id === 'quartz')!;
const sr90 = ISOTOPE_PRESETS.find((i) => i.id === 'sr90');

/** Builds a SimulationParams object with sane defaults; overrides win. */
function makeParams(overrides: Partial<SimulationParams> = {}): SimulationParams {
  const base = {
    isotopeId: 'sr90',
    customIsotopeName: '',
    beamEnergyMeV: 0.546,
    energyUnit: 'MeV',
    isRelativisticCalculated: true,
    intensityFlux: 1000,
    incidenceAngleDeg: 0,
    magneticFieldT: 1.5,
    beamProfile: 'Gaussian',
    beamFwhmUm: 200,
    beamDivergenceMrad: 0,
    beamCharge: -1,
    beamPulseWidthNs: 1,
    trackLengthMm: 10,
    particleSpin: '1/2',
    baryonNumber: 0,
    leptonNumber: 1,
    customRestMassMeV: ELECTRON_MASS_MEV,
    customChargeE: -1,
    numberFiredParticles: 100,
    labFacility: 'SPS-Synchrotron',
    chamberShape: 'Cylindrical-Beam-Pipe',
    dimensionMode: '2D-Orthogonal-Projectors',
    chamberTemperatureK: 293.15,
    chamberLengthCm: 10,
    magneticFieldTesla: 1.5,
    electricFieldKvM: 0,
    monteCarloGenerator: 'NONE',
    eventGenerator: 'Standalone',
    mcEventsPerRun: 100,
    cosmicRaysActive: false,
    ambientCosmicRays: false,
    gravitationalLensingActive: false,
    triggerLevel1Active: false,
    mlJetReconstruction: false,
    daqDeadTimeFraction: 0,
    experimentalModeActive: false,
    experimentalApplication: 'none',
    fluenceRateGyMin: 0,
    cumulativeFluenceGy: 0,
    materialId: 'heavy_water',
    nanoparticlePeakNm: 420,
    nanoparticlesActive: false,
    nanoparticleConcentrationPpm: 0,
    radiatorThicknessMm: 15,
    spectralRangeStartNm: 300,
    spectralRangeEndNm: 800,
    binResolutionNm: 10,
    chamberMaterial: 'Vacuum',
    detectorSubsystems: {
      pixelTracker: false, stripTracker: false, tpc: false, driftChamber: false,
      ecal: false, hcal: false, muonSpectrometer: false, rich: true,
    },
    reconstruction: {
      kalmanFilter: false, helixFitting: false, vertexReconstruction: false,
      mlJetClassification: false, mlAnomalyDetection: false,
    },
    simulationMode: 'deterministic',
    daq: {
      l1Trigger: false, highLevelTrigger: false, deadtimeFraction: 0,
      radiationDamagePercent: 0, sensorDefects: 'none',
    },
    exoticPhysics: {
      supersymmetry: false, darkMatter: false, magneticMonopoles: false,
      axions: false, sterileNeutrinos: false, extraDimensions: false,
    },
    componentsActive: {
      primaryCherenkov: true,
      secondaryCherenkov: true,
      bremsstrahlung: false,
      fluorescence: false,
      detectorBackground: false,
      opticalRayleighScattering: false,
      comptonScattering: false,
      photoelectricIonization: false,
      transitionRadiation: false,
    },
    ...overrides,
  };
  return base as unknown as SimulationParams;
}

function makeDetector(overrides: Partial<DetectorSettings> = {}): DetectorSettings {
  const base = {
    chipset: 'PMT',
    geometry: '64x64',
    pixelPitchUm: 55,
    thresholdKeV: 1,
    noiseRmsKeV: 0.5,
    coincidenceNs: 10,
    chargeSharingActive: false,
    clusteringAlgo: 'None',
    detectorTemperatureC: -20,
    leakageCurrentNa: 1,
    depletionVoltageV: 100,
    substrateThicknessUm: 300,
    quantumEfficiencyPct: 30,
    pixelDeadTimeNs: 10,
    activeCoolingType: 'None',
    biasVoltageV: 1000,
    dopingDensityPtype: 1,
    readoutMode: 'Counting',
    gainMode: 'Medium',
    frameRateHz: 1000,
    dynamicRangeBits: 12,
    energyResolutionPercent: 10,
    timingResolutionPs: 100,
    spatialResolutionUm: 50,
    darkCountRateHz: 20,
    afterpulsingProbability: 0,
    crosstalkPercent: 0,
    ...overrides,
  };
  return base as unknown as DetectorSettings;
}

function allNumbersFinite(obj: Record<string, unknown>): string[] {
  const bad: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'number' && !Number.isFinite(value)) bad.push(key);
  }
  return bad;
}

describe('relativistic kinematics', () => {
  it('computes beta for a 0.546 MeV electron', () => {
    const beta = calculateRelativisticBeta(0.546, ELECTRON_MASS_MEV);
    expect(Math.abs(beta - 0.8754)).toBeLessThan(1e-3);
  });

  it('computes the Cherenkov angle for beta=1, n=1.673', () => {
    expect(Math.abs(cherenkovAngleDeg(1, 1.673) - 53.29)).toBeLessThan(0.05);
  });

  it('returns 0 Cherenkov angle below threshold', () => {
    expect(cherenkovAngleDeg(0.5, 1.2)).toBe(0);
  });

  it('computes the electron Cherenkov threshold in heavy water', () => {
    const threshold = getCherenkovThresholdEnergy(0.51099895, 1.328);
    expect(Math.abs(threshold - 0.2656)).toBeLessThan(0.002);
  });

  it('computes relativistic momentum', () => {
    // p = sqrt(T^2 + 2 T m) with T = 0.546, m = 0.51099895
    expect(Math.abs(momentumMeV(0.546, 0.51099895) - 0.925271)).toBeLessThan(1e-5);
  });
});

describe('Frank-Tamm analytic yield', () => {
  it('matches the specified formula for beta=0.8754, n=1.328 over 300-800 nm', () => {
    // Formula: 2*pi*alpha*(1/l1 - 1/l2)*(1 - 1/(beta n)^2) per metre, /1000 for per mm.
    // Evaluates to ~24.84 photons/mm, i.e. ~248.4 per 10 mm.
    // NOTE: the brief expected ~266 in a 250-290 window; the specified formula does not produce that.
    // The formula was kept as specified and this test checks the formula's actual value.
    const perMm = frankTammPhotonsPerMm(0.8754, 1.328, 300, 800);
    expect(Math.abs(perMm * 10 - 248.4)).toBeLessThan(0.1);
  });

  it('returns 0 below threshold', () => {
    expect(frankTammPhotonsPerMm(0.5, 1.2, 300, 800)).toBe(0);
  });
});

describe('refractive index and temperature', () => {
  it('is continuous across the former 328.15 K boiling break', () => {
    const below = getRefractiveIndexAt(500, heavyWater, 328.14);
    const above = getRefractiveIndexAt(500, heavyWater, 328.16);
    expect(Math.abs(above - below)).toBeLessThan(1e-3);
  });

  it('matches the quartz Sellmeier value at 500 nm', () => {
    expect(Math.abs(getRefractiveIndexAt(500, quartz, 293.15) - 1.4628)).toBeLessThan(0.001);
  });
});

describe('gyration and synchrotron helpers', () => {
  it('computes the Larmor radius of a 0.546 MeV electron in 1.5 T', () => {
    const rho = larmorRadiusM(momentumMeV(0.546, 0.51099895), 1.5);
    expect(Math.abs(rho - 0.00206)).toBeLessThan(1e-4);
  });

  it('returns Infinity for zero field', () => {
    expect(larmorRadiusM(100, 0)).toBe(Infinity);
  });

  it('computes synchrotron critical energy for 1 GeV in 1.5 T', () => {
    expect(Math.abs(synchrotronCriticalEnergyKeV(1, 1.5) - 997.5)).toBeLessThan(1);
  });
});

describe('runCherenkovSimulation', () => {
  it('has no NaN or Infinity in numeric summary fields for default heavy_water / sr90 params', () => {
    const { summary, spectra } = runCherenkovSimulation(makeParams(), heavyWater, sr90);
    expect(allNumbersFinite(summary as unknown as Record<string, unknown>)).toEqual([]);
    for (const point of spectra) {
      expect(allNumbersFinite(point as unknown as Record<string, unknown>)).toEqual([]);
    }
    expect(summary.isCherenkovGenerated).toBe(true);
    expect(summary.photonsPerParticle).toBeGreaterThan(0);
  });

  it('caps emission length at the radiator thickness', () => {
    const long = runCherenkovSimulation(makeParams({ trackLengthMm: 2000, radiatorThicknessMm: 15 }), heavyWater, sr90);
    const matched = runCherenkovSimulation(makeParams({ trackLengthMm: 15, radiatorThicknessMm: 15 }), heavyWater, sr90);
    const ratio = long.summary.totalPhotonsDetected / matched.summary.totalPhotonsDetected;
    expect(Math.abs(ratio - 1)).toBeLessThan(0.01);
  });

  it('returns a finite, bounded spectrum when binResolutionNm is 0', () => {
    const { spectra } = runCherenkovSimulation(makeParams({ binResolutionNm: 0 }), heavyWater, sr90);
    expect(spectra.length).toBeGreaterThan(0);
    expect(spectra.length).toBeLessThanOrEqual(5000);
  });

  it('caps the wavelength grid at 5000 points', () => {
    const { spectra } = runCherenkovSimulation(makeParams({ binResolutionNm: 0.001 }), heavyWater, sr90);
    expect(spectra.length).toBeLessThanOrEqual(5000);
    expect(spectra.length).toBeGreaterThan(4000);
  });

  it('scales per-run totals with numberFiredParticles', () => {
    const one = runCherenkovSimulation(makeParams({ numberFiredParticles: 1 }), heavyWater, sr90);
    const hundred = runCherenkovSimulation(makeParams({ numberFiredParticles: 100 }), heavyWater, sr90);
    expect(Math.abs(hundred.summary.totalPhotonsEmitted / one.summary.totalPhotonsEmitted - 100)).toBeLessThan(0.5);
    expect(one.summary.photonsPerParticle).toBeCloseTo(hundred.summary.photonsPerParticle, 6);
  });

  it('applies detector quantum efficiency to detected photons only', () => {
    const bare = runCherenkovSimulation(makeParams(), heavyWater, sr90);
    const withDet = runCherenkovSimulation(makeParams(), heavyWater, sr90, makeDetector({ quantumEfficiencyPct: 50, darkCountRateHz: 0 }));
    expect(Math.abs(withDet.summary.totalPhotonsDetected / bare.summary.totalPhotonsDetected - 0.5)).toBeLessThan(0.001);
    expect(withDet.summary.totalPhotonsEmitted).toBe(bare.summary.totalPhotonsEmitted);
  });

  it('reports 0 dB SNR when no photons are detected', () => {
    const { summary } = runCherenkovSimulation(makeParams({ componentsActive: { primaryCherenkov: false, secondaryCherenkov: false } as SimulationParams['componentsActive'] }), heavyWater, sr90);
    expect(summary.totalPhotonsDetected).toBe(0);
    expect(summary.signalToNoiseRatioDb).toBe(0);
  });

  it('heuristic channels do not depend on intensityFlux', () => {
    const heuristics = { bremsstrahlung: true, fluorescence: true };
    const lowFlux = runCherenkovSimulation(
      makeParams({ intensityFlux: 1e3, componentsActive: { ...makeParams().componentsActive, ...heuristics } as SimulationParams['componentsActive'] }),
      heavyWater, sr90
    );
    const highFlux = runCherenkovSimulation(
      makeParams({ intensityFlux: 1e6, componentsActive: { ...makeParams().componentsActive, ...heuristics } as SimulationParams['componentsActive'] }),
      heavyWater, sr90
    );
    const relDiff = (a: number, b: number) => Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), Number.MIN_VALUE);

    expect(relDiff(lowFlux.summary.photonsPerParticle, highFlux.summary.photonsPerParticle)).toBeLessThan(1e-9);

    // Per-run totals with many particles so the 0.1-photon output rounding is negligible.
    // Compare the per-particle emitted value, and confirm the heuristic channel contributes at all.
    const bigRun = { numberFiredParticles: 1e6 };
    const withHeuristics = (flux: number) => runCherenkovSimulation(
      makeParams({ ...bigRun, intensityFlux: flux, componentsActive: { ...makeParams().componentsActive, ...heuristics } as SimulationParams['componentsActive'] }),
      heavyWater, sr90
    );
    const withoutHeuristics = runCherenkovSimulation(makeParams(bigRun), heavyWater, sr90);
    const lowPerParticle = withHeuristics(1e3).summary.totalPhotonsEmitted / 1e6;
    const highPerParticle = withHeuristics(1e6).summary.totalPhotonsEmitted / 1e6;
    const basePerParticle = withoutHeuristics.summary.totalPhotonsEmitted / 1e6;
    expect(basePerParticle).toBeLessThan(lowPerParticle);
    expect(relDiff(lowPerParticle, highPerParticle)).toBeLessThan(1e-9);
  });
});
