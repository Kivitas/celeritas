/**
 * @license
 * SPDX-License-Identifier: MIT
 */

// Regression snapshot, NOT validation. It records what the engine currently returns so that any
// change to outputs is visible in review. Update the snapshot deliberately, and state the physics
// reason for the change in the commit message.

import { describe, it, expect } from 'vitest';
import { runCherenkovSimulation } from './physics';
import { MATERIAL_PRESETS, ISOTOPE_PRESETS } from '../data/presets';
import type { SimulationParams } from '../types';
import { ELECTRON_MASS_MEV } from './physics';

const base = {
  isotopeId: 'sr90', customIsotopeName: '', beamEnergyMeV: 0.546, energyUnit: 'MeV',
  isRelativisticCalculated: true, intensityFlux: 1000, incidenceAngleDeg: 0, magneticFieldT: 1.5,
  beamProfile: 'Gaussian', beamFwhmUm: 200, beamDivergenceMrad: 0, beamCharge: -1, beamPulseWidthNs: 1,
  trackLengthMm: 10, particleSpin: '1/2', baryonNumber: 0, leptonNumber: 1,
  customRestMassMeV: ELECTRON_MASS_MEV, customChargeE: -1, numberFiredParticles: 100,
  labFacility: 'SPS-Synchrotron', chamberShape: 'Cylindrical-Beam-Pipe', dimensionMode: '2D-Orthogonal-Projectors',
  chamberTemperatureK: 293.15, chamberLengthCm: 10, magneticFieldTesla: 1.5, electricFieldKvM: 0,
  monteCarloGenerator: 'NONE', eventGenerator: 'Standalone', mcEventsPerRun: 100,
  cosmicRaysActive: false, ambientCosmicRays: false, gravitationalLensingActive: false,
  triggerLevel1Active: false, mlJetReconstruction: false, daqDeadTimeFraction: 0,
  experimentalModeActive: false, experimentalApplication: 'none', fluenceRateGyMin: 0, cumulativeFluenceGy: 0,
  materialId: 'heavy_water', nanoparticlePeakNm: 420, nanoparticlesActive: false, nanoparticleConcentrationPpm: 0,
  radiatorThicknessMm: 15, spectralRangeStartNm: 300, spectralRangeEndNm: 800, binResolutionNm: 10,
  chamberMaterial: 'Vacuum', detectorSubsystems: {}, reconstruction: {}, simulationMode: 'deterministic',
  daq: { l1Trigger: false, highLevelTrigger: false, deadtimeFraction: 0, radiationDamagePercent: 0, sensorDefects: 'none' },
  exoticPhysics: {},
  componentsActive: { primaryCherenkov: true, secondaryCherenkov: true },
};

const CONFIGS: Array<[string, Partial<SimulationParams>, string, string]> = [
  ['electron in heavy water, sr90 default', {}, 'heavy_water', 'sr90'],
  ['electron in quartz, 2 MeV', { beamEnergyMeV: 2.0, materialId: 'quartz', isotopeId: 'custom', radiatorThicknessMm: 20 }, 'quartz', 'custom'],
  ['muon in water, 1 GeV', { beamEnergyMeV: 1000, energyUnit: 'MeV', materialId: 'water', radiatorThicknessMm: 50, isotopeId: 'custom', customRestMassMeV: 105.658375 }, 'water', 'custom'],
  ['proton in water, 200 MeV', { beamEnergyMeV: 200, materialId: 'water', radiatorThicknessMm: 30, isotopeId: 'custom', customRestMassMeV: 938.272088 }, 'water', 'custom'],
  ['electron in lead glass, 0.5 GeV', { beamEnergyMeV: 0.5, energyUnit: 'GeV', materialId: 'lead_glass', radiatorThicknessMm: 25, isotopeId: 'custom' }, 'lead_glass', 'custom'],
  ['electron in aerogel-like index (quartz), 5 MeV', { beamEnergyMeV: 5, materialId: 'quartz', radiatorThicknessMm: 5, isotopeId: 'custom' }, 'quartz', 'custom'],
];

describe('regression snapshot (not validation)', () => {
  for (const [name, overrides, materialId, isotopeId] of CONFIGS) {
    it(name, () => {
      const material = MATERIAL_PRESETS.find((m) => m.id === materialId)!;
      const isotope = ISOTOPE_PRESETS.find((i) => i.id === isotopeId);
      const params = { ...base, ...overrides } as unknown as SimulationParams;
      const { spectra, summary } = runCherenkovSimulation(params, material, isotope);
      const pick = (i: number) => spectra[i];
      expect({
        summary,
        sample: [pick(0), pick(Math.floor(spectra.length / 2)), pick(spectra.length - 1)],
      }).toMatchSnapshot();
    });
  }
});
