/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SimulationParams, DetectorSettings } from "./../types";

/**
 * Beamline quick-setup presets.
 *
 * Applying a preset (see loadPresetSetup in App.tsx):
 *  - `params` are spread over the previous simulation parameters.
 *  - `componentsActive` is merged over the previous component flags.
 *  - `detector` is merged over the previous detector settings.
 */
export interface BeamlinePreset {
  id: string;
  label: string;
  icon: string;
  params: Partial<SimulationParams>;
  componentsActive?: Partial<SimulationParams["componentsActive"]>;
  detector?: Partial<DetectorSettings>;
}

export const BEAMLINE_PRESETS: BeamlinePreset[] = [
  {
    id: "timepix3-beta",
    label: "SPS Beta Test",
    icon: "🚀",
    params: {
      isotopeId: "sr90",
      beamEnergyMeV: 0.546,
      intensityFlux: 350000,
      materialId: "quartz",
      radiatorThicknessMm: 5.0,
    },
    componentsActive: {
      primaryCherenkov: true,
      secondaryCherenkov: true,
      bremsstrahlung: true,
      fluorescence: false,
      detectorBackground: true,
    },
    detector: {
      chipset: "Timepix3",
      geometry: "256x256",
      pixelPitchUm: 55.0,
      chargeSharingActive: true,
    },
  },
  {
    id: "hpge-gamma",
    label: "HPGe Gamma",
    icon: "💥",
    params: {
      isotopeId: "co60",
      beamEnergyMeV: 1.173,
      intensityFlux: 500000,
      materialId: "hpge",
      radiatorThicknessMm: 8.0,
    },
    componentsActive: {
      primaryCherenkov: true,
      secondaryCherenkov: false,
      bremsstrahlung: true,
      fluorescence: true,
      detectorBackground: true,
      photoelectricIonization: true,
      comptonScattering: true,
    },
    detector: {
      chipset: "HPGe",
      geometry: "512x512",
      pixelPitchUm: 110.0,
      thresholdKeV: 0.5,
      noiseRmsKeV: 0.3,
      activeCoolingType: "Liquid Nitrogen Cryo",
      detectorTemperatureC: -196,
    },
  },
  {
    id: "sipm-cosmic",
    label: "Cosmic Muon",
    icon: "🌠",
    params: {
      isotopeId: "cosmic_muon",
      beamEnergyMeV: 4000.0,
      intensityFlux: 10000,
      materialId: "water",
      radiatorThicknessMm: 50.0,
    },
    componentsActive: {
      primaryCherenkov: true,
      secondaryCherenkov: true,
      bremsstrahlung: false,
      fluorescence: false,
      detectorBackground: true,
    },
    detector: {
      chipset: "SiPM",
      geometry: "256x256",
      pixelPitchUm: 50.0,
      thresholdKeV: 0.8,
    },
  },
  {
    id: "medipix-aerogel",
    label: "Aerogel RICH",
    icon: "🧊",
    params: {
      isotopeId: "proton_sps",
      beamEnergyMeV: 450.0,
      intensityFlux: 1200000,
      materialId: "aerogel",
      radiatorThicknessMm: 10.0,
    },
    componentsActive: {
      primaryCherenkov: true,
      secondaryCherenkov: false,
      bremsstrahlung: false,
      fluorescence: false,
      detectorBackground: true,
    },
    detector: {
      chipset: "Medipix3",
      geometry: "512x512",
      pixelPitchUm: 110.0,
      chargeSharingActive: false,
    },
  },
  {
    id: "scifi-fiber",
    label: "SciFi Tracker",
    icon: "✨",
    params: {
      isotopeId: "heavy_ion",
      beamEnergyMeV: 120.0,
      intensityFlux: 180000,
      materialId: "lyso",
      radiatorThicknessMm: 5.0,
    },
    componentsActive: {
      primaryCherenkov: true,
      secondaryCherenkov: true,
      bremsstrahlung: false,
      fluorescence: true,
      detectorBackground: true,
    },
    detector: {
      chipset: "SiPM",
      geometry: "256x256",
      pixelPitchUm: 50.0,
    },
  },
  {
    // Reference configuration: the standard reactor core simulator setup,
    // kept as a baseline for comparing the other presets against.
    id: "Experimental-eye",
    label: "Core Simulator (reference)",
    icon: "👁️",
    params: {
      isotopeId: "sr90",
      beamEnergyMeV: 0.546,
      intensityFlux: 370000,
      materialId: "heavy_water",
      radiatorThicknessMm: 15.0,
    },
    componentsActive: {
      primaryCherenkov: true,
      secondaryCherenkov: true,
      bremsstrahlung: false,
      fluorescence: false,
      detectorBackground: true,
    },
    detector: {
      chipset: "Timepix3",
      geometry: "256x256",
      pixelPitchUm: 55.0,
      chargeSharingActive: false,
    },
  },
  {
    id: "superkamiokande",
    label: "Super-K Neutrino",
    icon: "🌊",
    params: { isotopeId: "neutrino_beam", beamEnergyMeV: 5000.0, intensityFlux: 1000000, materialId: "heavy_water", radiatorThicknessMm: 1000.0 },
    componentsActive: { neutrinoOscillation: true, primaryCherenkov: true },
    detector: { chipset: "PMT", geometry: "256x256" },
  },
  {
    id: "icecube",
    label: "IceCube Obs.",
    icon: "❄️",
    params: { isotopeId: "muon_cosmic", beamEnergyMeV: 10000.0, intensityFlux: 500, materialId: "heavy_water", radiatorThicknessMm: 2000.0 },
    componentsActive: { primaryCherenkov: true, hadronicShower: true },
    detector: { chipset: "PMT", geometry: "256x256" },
  },
  {
    id: "cern-lhc-atlas",
    label: "ATLAS Exp.",
    icon: "🔬",
    params: { isotopeId: "proton_sps", beamEnergyMeV: 13000000.0, intensityFlux: 1e9, materialId: "lead_glass", radiatorThicknessMm: 50.0 },
    componentsActive: { hadronicShower: true, pairProduction: true },
    detector: { chipset: "ATLAS-ITk", geometry: "1024x1024", activeCoolingType: "Liquid Nitrogen Cryo" },
  },
  {
    id: "cern-lhc-cms",
    label: "CMS Exp.",
    icon: "⚛️",
    params: { isotopeId: "proton_sps", beamEnergyMeV: 13000000.0, intensityFlux: 1e9, materialId: "lead_glass", radiatorThicknessMm: 45.0 },
    componentsActive: { bremsstrahlung: true, muonDecay: true },
    detector: { chipset: "CMS-HGCAL", geometry: "1024x1024", activeCoolingType: "Pulse Tube" },
  },
  {
    id: "fermilab-dune",
    label: "DUNE Far Det.",
    icon: "🌌",
    params: { isotopeId: "neutrino_beam", beamEnergyMeV: 3000.0, intensityFlux: 2e8, materialId: "liquid_argon", radiatorThicknessMm: 500.0 },
    componentsActive: { neutrinoOscillation: true, primaryCherenkov: false },
    detector: { chipset: "CMOS", geometry: "512x512", activeCoolingType: "Liquid Nitrogen Cryo" },
  },
  {
    id: "kekb-belle",
    label: "Belle II",
    icon: "🦋",
    params: { isotopeId: "electron_linac", beamEnergyMeV: 7000.0, intensityFlux: 5e7, materialId: "csi_tl", radiatorThicknessMm: 30.0 },
    componentsActive: { bMesonDecay: true, fluorescence: true },
    detector: { chipset: "Timepix3", geometry: "256x256" },
  },
  {
    id: "slac-babar",
    label: "BaBar Exp.",
    icon: "🐘",
    params: { isotopeId: "positron", beamEnergyMeV: 3100.0, intensityFlux: 3e7, materialId: "csi_tl", radiatorThicknessMm: 25.0 },
    componentsActive: { bMesonDecay: true, comptonScattering: true },
    detector: { chipset: "Timepix3", geometry: "256x256" },
  },
  {
    id: "jlab-clas12",
    label: "CLAS12",
    icon: "🎯",
    params: { isotopeId: "electron_linac", beamEnergyMeV: 11000.0, intensityFlux: 4e7, materialId: "quartz", radiatorThicknessMm: 15.0 },
    componentsActive: { primaryCherenkov: true, bremsstrahlung: true },
    detector: { chipset: "PMT", geometry: "256x256" },
  },
  {
    id: "snolab-sudo",
    label: "SNOLAB Dark",
    icon: "🌑",
    params: { isotopeId: "dark_matter_wimp", beamEnergyMeV: 50000.0, intensityFlux: 10, materialId: "liquid_xenon", radiatorThicknessMm: 800.0 },
    componentsActive: { darkMatterScattering: true, detectorBackground: false },
    detector: { chipset: "SiPM", geometry: "512x512", activeCoolingType: "Liquid Nitrogen Cryo" },
  },
  {
    id: "bno-neutrino",
    label: "Baksan Neutrino",
    icon: "⛰️",
    params: { isotopeId: "neutrino_beam", beamEnergyMeV: 1000.0, intensityFlux: 50000, materialId: "heavy_water", radiatorThicknessMm: 1500.0 },
    componentsActive: { neutrinoOscillation: true },
    detector: { chipset: "PMT", geometry: "256x256" },
  },
  {
    id: "kamioka-kamland",
    label: "KamLAND",
    icon: "💧",
    params: { isotopeId: "neutrino_beam", beamEnergyMeV: 3.0, intensityFlux: 100000, materialId: "heavy_water", radiatorThicknessMm: 600.0 },
    componentsActive: { neutrinoOscillation: true, fluorescence: true },
    detector: { chipset: "PMT", geometry: "256x256" },
  },
  {
    id: "bnl-rhic-star",
    label: "RHIC STAR",
    icon: "⭐",
    params: { isotopeId: "heavy_ion", beamEnergyMeV: 200000.0, intensityFlux: 1e6, materialId: "argon_co2_gas", radiatorThicknessMm: 200.0 },
    componentsActive: { hadronicShower: true, pairProduction: true },
    detector: { chipset: "Timepix3", geometry: "512x512" },
  },
  {
    id: "gsi-hades",
    label: "HADES Spec.",
    icon: "🔥",
    params: { isotopeId: "proton_sps", beamEnergyMeV: 3500.0, intensityFlux: 2e6, materialId: "quartz", radiatorThicknessMm: 20.0 },
    componentsActive: { primaryCherenkov: true, pairProduction: true },
    detector: { chipset: "Medipix3", geometry: "512x512" },
  },
  {
    id: "desy-hera",
    label: "HERA Collider",
    icon: "⚡",
    params: { isotopeId: "electron_linac", beamEnergyMeV: 27500.0, intensityFlux: 8e6, materialId: "lead_glass", radiatorThicknessMm: 35.0 },
    componentsActive: { bremsstrahlung: true, synchrotronRadiation: true },
    detector: { chipset: "CMS-HGCAL", geometry: "1024x1024" },
  },
];
