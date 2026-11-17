/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import type { SimulationParams, DetectorSettings } from "../types";

/**
 * Quick-setup examples. Each one only sets engine inputs; none of them claims to reproduce a
 * specific facility. Radiator thicknesses and detector values are example settings, not measured
 * configurations. Every material id here exists in MATERIAL_PRESETS (checked by a test).
 *
 * Applying a preset (see loadPresetSetup in App.tsx) merges `params` and `detector` over the
 * current values.
 */
export interface BeamlinePreset {
  id: string;
  label: string;
  description: string;
  params: Partial<SimulationParams>;
  detector?: Partial<DetectorSettings>;
}

export const BEAMLINE_PRESETS: BeamlinePreset[] = [
  {
    id: "sr90-quartz",
    label: "Sr-90 beta in fused silica",
    description: "Beta source electrons (0.546 MeV endpoint) in a 5 mm fused-silica radiator. Example setting.",
    params: { isotopeId: "sr90", beamEnergyMeV: 0.546, energyUnit: "MeV", materialId: "quartz", radiatorThicknessMm: 5, trackLengthMm: 5 },
  },
  {
    id: "co60-quartz",
    label: "Co-60 Compton electrons in fused silica",
    description: "Co-60 recoil-electron energy (0.963 MeV) in a 10 mm fused-silica radiator. Example setting.",
    params: { isotopeId: "co60", beamEnergyMeV: 0.963, energyUnit: "MeV", materialId: "quartz", radiatorThicknessMm: 10, trackLengthMm: 10 },
  },
  {
    id: "proton-water",
    label: "200 MeV proton in water",
    description: "200 MeV proton in a 30 mm water radiator. Energy loss is not modelled, so this setting is not reliable for protons that slow down. Example setting.",
    params: { isotopeId: "proton_sps", beamEnergyMeV: 200, energyUnit: "MeV", materialId: "water", radiatorThicknessMm: 30, trackLengthMm: 30 },
  },
  {
    id: "muon-water",
    label: "1 GeV muon in water",
    description: "1 GeV kinetic-energy muon in a 100 mm water radiator. Example setting.",
    params: { isotopeId: "muon_cosmic", beamEnergyMeV: 1, energyUnit: "GeV", materialId: "water", radiatorThicknessMm: 100, trackLengthMm: 100 },
  },
];
