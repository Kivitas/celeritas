/**
 * @license
 * SPDX-License-Identifier: MIT
 */

/**
 * Versioned run configuration and provenance (plan T6.1, T6.2).
 *
 * A run configuration is the complete set of user inputs for one simulation: the beam, radiator,
 * spectrum, detector and seed. Loading validates every field with its range and unit, and rejects
 * unknown fields rather than ignoring them. A result carries the configuration, the software version
 * and the data versions used, so it can be reproduced from the file alone.
 */

import type { SimulationParams, DetectorSettings, SimulationSummary, SimulationResultPoint, MaterialPreset, IsotopeProfile } from "../types";
import { runCherenkovSimulation } from "./simulate";
import { MATERIAL_PRESETS, ISOTOPE_PRESETS } from "../data/presets";

export const RUN_CONFIG_SCHEMA_VERSION = 1;

/** Version of the physics model. Increment when a change alters results (see CHANGELOG). */
export const MODEL_VERSION = "2026.11-phase3";

/** Versions of the data the model used, recorded in every result. */
export const DATA_VERSIONS = {
  pdgEdition: "PDG 2026 (data release 2026-05-30)",
  nistStar: "NIST ESTAR and PSTAR, retrieved 2026-11-17",
  refractiveIndexInfo: "refractiveindex.info, retrieved 2026-11-17",
  ensdf: "ENSDF via NuDat 3, retrieved 2026-11-17",
} as const;

export interface RunConfig {
  schemaVersion: typeof RUN_CONFIG_SCHEMA_VERSION;
  name?: string;
  isotopeId: string;
  beamEnergyMeV: number;
  energyUnit: "MeV" | "GeV" | "TeV";
  beamCharge: number;
  customRestMassMeV: number;
  customChargeE: number;
  beamFwhmUm: number;
  trackLengthMm: number;
  numberFiredParticles: number;
  chamberTemperatureK: number;
  materialId: string;
  radiatorThicknessMm: number;
  spectralRangeStartNm: number;
  spectralRangeEndNm: number;
  binResolutionNm: number;
  deadtimeFraction: number;
  detector: { quantumEfficiencyPct: number; darkCountRateHz: number; frameRateHz: number };
}

export interface ConfigProblem {
  field: string;
  message: string;
}

const FIELD_RULES: Record<Exclude<keyof RunConfig, "schemaVersion" | "name" | "detector" | "isotopeId" | "materialId" | "energyUnit">, { min: number; max: number; unit: string }> = {
  beamEnergyMeV: { min: 0, max: 1e6, unit: "in the unit given by energyUnit" },
  beamCharge: { min: -10, max: 10, unit: "e" },
  customRestMassMeV: { min: 0, max: 1e6, unit: "MeV/c^2" },
  customChargeE: { min: -10, max: 10, unit: "e" },
  beamFwhmUm: { min: 0, max: 1e6, unit: "um" },
  trackLengthMm: { min: 0, max: 1e5, unit: "mm" },
  numberFiredParticles: { min: 1, max: 1e9, unit: "particles" },
  chamberTemperatureK: { min: 1, max: 1000, unit: "K" },
  radiatorThicknessMm: { min: 0, max: 1e5, unit: "mm" },
  spectralRangeStartNm: { min: 10, max: 1e6, unit: "nm" },
  spectralRangeEndNm: { min: 10, max: 1e6, unit: "nm" },
  binResolutionNm: { min: 0.001, max: 1e4, unit: "nm" },
  deadtimeFraction: { min: 0, max: 1, unit: "fraction" },
};

const DETECTOR_RULES = {
  quantumEfficiencyPct: { min: 0, max: 100, unit: "%" },
  darkCountRateHz: { min: 0, max: 1e12, unit: "Hz" },
  frameRateHz: { min: 1e-3, max: 1e9, unit: "Hz" },
} as const;

const ALLOWED_KEYS = new Set([
  "schemaVersion", "name", "isotopeId", "beamEnergyMeV", "energyUnit", "beamCharge", "customRestMassMeV",
  "customChargeE", "beamFwhmUm", "trackLengthMm", "numberFiredParticles", "chamberTemperatureK", "materialId",
  "radiatorThicknessMm", "spectralRangeStartNm", "spectralRangeEndNm", "binResolutionNm", "deadtimeFraction", "detector",
]);

/** Returns every problem found; an empty array means the configuration is valid. */
export function validateRunConfig(input: unknown): ConfigProblem[] {
  const problems: ConfigProblem[] = [];
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return [{ field: "(root)", message: "configuration must be a JSON object" }];
  }
  const c = input as Record<string, unknown>;
  for (const key of Object.keys(c)) {
    if (!ALLOWED_KEYS.has(key)) problems.push({ field: key, message: "unknown field (rejected, not ignored)" });
  }
  if (c.schemaVersion !== RUN_CONFIG_SCHEMA_VERSION) {
    problems.push({ field: "schemaVersion", message: `must be ${RUN_CONFIG_SCHEMA_VERSION}` });
  }
  if (typeof c.isotopeId !== "string" || !(c.isotopeId === "custom" || ISOTOPE_PRESETS.some((i) => i.id === c.isotopeId))) {
    problems.push({ field: "isotopeId", message: "must be \"custom\" or a known isotope id" });
  }
  if (typeof c.materialId !== "string" || !MATERIAL_PRESETS.some((m) => m.id === c.materialId)) {
    problems.push({ field: "materialId", message: "must be a known material id" });
  }
  if (c.energyUnit !== "MeV" && c.energyUnit !== "GeV" && c.energyUnit !== "TeV") {
    problems.push({ field: "energyUnit", message: "must be MeV, GeV or TeV" });
  }
  for (const [field, rule] of Object.entries(FIELD_RULES)) {
    const v = c[field];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      problems.push({ field, message: "must be a finite number" });
    } else if (v < rule.min || v > rule.max) {
      problems.push({ field, message: `must be between ${rule.min} and ${rule.max} ${rule.unit}` });
    }
  }
  if (typeof c.spectralRangeStartNm === "number" && typeof c.spectralRangeEndNm === "number" && c.spectralRangeEndNm <= c.spectralRangeStartNm) {
    problems.push({ field: "spectralRangeEndNm", message: "must be greater than spectralRangeStartNm" });
  }
  const d = c.detector as Record<string, unknown> | undefined;
  if (typeof d !== "object" || d === null) {
    problems.push({ field: "detector", message: "must be an object" });
  } else {
    for (const [field, rule] of Object.entries(DETECTOR_RULES)) {
      const v = d[field];
      if (typeof v !== "number" || !Number.isFinite(v) || v < rule.min || v > rule.max) {
        problems.push({ field: `detector.${field}`, message: `must be between ${rule.min} and ${rule.max} ${rule.unit}` });
      }
    }
  }
  return problems;
}

/** Converts a valid configuration into the engine's parameter objects. */
export function configToEngine(cfg: RunConfig): { params: SimulationParams; detector: DetectorSettings; material: MaterialPreset; isotope: IsotopeProfile | undefined } {
  const material = MATERIAL_PRESETS.find((m) => m.id === cfg.materialId)!;
  const isotope = ISOTOPE_PRESETS.find((i) => i.id === cfg.isotopeId);
  const params = {
    isotopeId: cfg.isotopeId,
    customIsotopeName: "",
    beamEnergyMeV: cfg.beamEnergyMeV,
    energyUnit: cfg.energyUnit,
    beamCharge: cfg.beamCharge,
    customRestMassMeV: cfg.customRestMassMeV,
    customChargeE: cfg.customChargeE,
    magneticFieldT: 0,
    beamFwhmUm: cfg.beamFwhmUm,
    trackLengthMm: cfg.trackLengthMm,
    numberFiredParticles: cfg.numberFiredParticles,
    chamberTemperatureK: cfg.chamberTemperatureK,
    materialId: cfg.materialId,
    radiatorThicknessMm: cfg.radiatorThicknessMm,
    spectralRangeStartNm: cfg.spectralRangeStartNm,
    spectralRangeEndNm: cfg.spectralRangeEndNm,
    binResolutionNm: cfg.binResolutionNm,
    componentsActive: { primaryCherenkov: true },
    daq: { deadtimeFraction: cfg.deadtimeFraction },
  } as SimulationParams;
  return { params, detector: { ...cfg.detector }, material, isotope };
}

export interface RunResult {
  provenance: {
    modelVersion: string;
    dataVersions: typeof DATA_VERSIONS;
    schemaVersion: typeof RUN_CONFIG_SCHEMA_VERSION;
    materialSource: string | undefined;
    materialVerified: boolean;
  };
  config: RunConfig;
  summary: SimulationSummary;
  spectrum: SimulationResultPoint[];
}

/** Runs a validated configuration and returns a result with its provenance. Throws on an invalid config. */
export function runConfig(input: unknown): RunResult {
  const problems = validateRunConfig(input);
  if (problems.length > 0) {
    throw new Error("Invalid run configuration: " + problems.map((p) => `${p.field}: ${p.message}`).join("; "));
  }
  const cfg = input as RunConfig;
  const { params, detector, material, isotope } = configToEngine(cfg);
  const { summary, spectra } = runCherenkovSimulation(params, material, isotope, detector);
  return {
    provenance: {
      modelVersion: MODEL_VERSION,
      dataVersions: DATA_VERSIONS,
      schemaVersion: RUN_CONFIG_SCHEMA_VERSION,
      materialSource: material.source,
      materialVerified: material.verified === true,
    },
    config: cfg,
    summary,
    spectrum: spectra,
  };
}

/** CSV of the spectrum with units in the column names (plan T6.2). */
export function spectrumToCsv(spectrum: SimulationResultPoint[]): string {
  const header = "wavelength_nm,primary_cherenkov_per_particle,detected_per_particle,transmission";
  const rows = spectrum.map((p) => [p.wavelengthNm, p.primaryCherenkov, p.totalYield, p.transmission].join(","));
  return [header, ...rows].join("\n") + "\n";
}

/** Builds a run configuration from the app's current state (inverse of configToEngine). */
export function toRunConfig(params: SimulationParams, detector: DetectorSettings, name?: string): RunConfig {
  return {
    schemaVersion: RUN_CONFIG_SCHEMA_VERSION,
    name,
    isotopeId: params.isotopeId,
    beamEnergyMeV: params.beamEnergyMeV,
    energyUnit: params.energyUnit,
    beamCharge: params.beamCharge,
    customRestMassMeV: params.customRestMassMeV,
    customChargeE: params.customChargeE,
    beamFwhmUm: params.beamFwhmUm,
    trackLengthMm: params.trackLengthMm,
    numberFiredParticles: params.numberFiredParticles,
    chamberTemperatureK: params.chamberTemperatureK,
    materialId: params.materialId,
    radiatorThicknessMm: params.radiatorThicknessMm,
    spectralRangeStartNm: params.spectralRangeStartNm,
    spectralRangeEndNm: params.spectralRangeEndNm,
    binResolutionNm: params.binResolutionNm,
    deadtimeFraction: params.daq.deadtimeFraction,
    detector: {
      quantumEfficiencyPct: detector.quantumEfficiencyPct,
      darkCountRateHz: detector.darkCountRateHz,
      frameRateHz: detector.frameRateHz,
    },
  };
}
