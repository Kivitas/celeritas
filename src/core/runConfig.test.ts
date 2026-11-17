/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import { validateRunConfig, runConfig, spectrumToCsv, RUN_CONFIG_SCHEMA_VERSION, MODEL_VERSION } from "./runConfig";

const good = () => ({
  schemaVersion: RUN_CONFIG_SCHEMA_VERSION,
  name: "test",
  isotopeId: "sr90",
  beamEnergyMeV: 0.546,
  energyUnit: "MeV",
  beamCharge: -1,
  customRestMassMeV: 0.511,
  customChargeE: -1,
  beamFwhmUm: 200,
  trackLengthMm: 10,
  numberFiredParticles: 100,
  chamberTemperatureK: 293.15,
  materialId: "water",
  radiatorThicknessMm: 10,
  spectralRangeStartNm: 300,
  spectralRangeEndNm: 800,
  binResolutionNm: 10,
  deadtimeFraction: 0,
  detector: { quantumEfficiencyPct: 30, darkCountRateHz: 20, frameRateHz: 1000 },
});

describe("run configuration validation (plan T6.1)", () => {
  it("accepts a valid configuration", () => {
    expect(validateRunConfig(good())).toEqual([]);
  });

  it("rejects an unknown field instead of ignoring it", () => {
    const problems = validateRunConfig({ ...good(), fooBar: 1 });
    expect(problems.some((p) => p.field === "fooBar")).toBe(true);
  });

  it("rejects out-of-range values with the allowed range in the message", () => {
    const problems = validateRunConfig({ ...good(), deadtimeFraction: 2 });
    expect(problems).toContainEqual({ field: "deadtimeFraction", message: "must be between 0 and 1 fraction" });
  });

  it("rejects a wrong schema version", () => {
    expect(validateRunConfig({ ...good(), schemaVersion: 99 }).some((p) => p.field === "schemaVersion")).toBe(true);
  });

  it("rejects an unknown material id", () => {
    expect(validateRunConfig({ ...good(), materialId: "unobtainium" }).some((p) => p.field === "materialId")).toBe(true);
  });

  it("rejects a spectral range that ends before it starts", () => {
    expect(validateRunConfig({ ...good(), spectralRangeStartNm: 800, spectralRangeEndNm: 300 }).some((p) => p.field === "spectralRangeEndNm")).toBe(true);
  });

  it("throws from runConfig for an invalid configuration", () => {
    expect(() => runConfig({ ...good(), numberFiredParticles: 0 })).toThrow(/numberFiredParticles/);
  });
});

describe("results carry their provenance (plan T6.2)", () => {
  it("records the model version, data versions and material source", () => {
    const r = runConfig(good());
    expect(r.provenance.modelVersion).toBe(MODEL_VERSION);
    expect(r.provenance.schemaVersion).toBe(RUN_CONFIG_SCHEMA_VERSION);
    expect(r.provenance.dataVersions.pdgEdition).toMatch(/PDG 2026/);
    expect(r.provenance.materialVerified).toBe(true);
    expect(r.provenance.materialSource).toMatch(/Daimon|Hale/);
  });

  it("the same configuration gives an identical result (reproducible from the file)", () => {
    const a = runConfig(good());
    const b = runConfig(JSON.parse(JSON.stringify(good())));
    expect(b.summary).toEqual(a.summary);
    expect(b.spectrum).toEqual(a.spectrum);
  });

  it("the spectrum CSV has units in its column names", () => {
    const csv = spectrumToCsv(runConfig(good()).spectrum);
    expect(csv.split("\n")[0]).toBe("wavelength_nm,primary_cherenkov_per_particle,detected_per_particle,transmission");
  });
});
