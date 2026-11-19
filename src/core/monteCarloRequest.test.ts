/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import { runMonteCarloRequest, validateMcRequest } from "./monteCarloRequest";
import { MATERIAL_PRESETS, ISOTOPE_PRESETS } from "../data/presets";
import type { SimulationParams, DetectorSettings } from "../types";

const water = MATERIAL_PRESETS.find((m) => m.id === "water")!;
const sr90 = ISOTOPE_PRESETS.find((i) => i.id === "sr90");
const params = {
  isotopeId: "sr90", beamEnergyMeV: 0.546, energyUnit: "MeV", beamCharge: -1, customRestMassMeV: 0.511,
  customChargeE: -1, magneticFieldT: 0, beamFwhmUm: 200, trackLengthMm: 10, numberFiredParticles: 100,
  chamberTemperatureK: 293.15, materialId: "water", radiatorThicknessMm: 10, spectralRangeStartNm: 300,
  spectralRangeEndNm: 800, binResolutionNm: 10, componentsActive: { primaryCherenkov: true }, daq: { deadtimeFraction: 0 },
} as unknown as SimulationParams;
const detector: DetectorSettings = { quantumEfficiencyPct: 30, darkCountRateHz: 0, frameRateHz: 1000 };

describe("Monte Carlo request validation", () => {
  it("rejects too few or too many primaries and bad seeds", () => {
    expect(validateMcRequest({ primaries: 10, seed: 1 })).toMatch(/Primaries/);
    expect(validateMcRequest({ primaries: 1e7, seed: 1 })).toMatch(/Primaries/);
    expect(validateMcRequest({ primaries: 1000, seed: -1 })).toMatch(/Seed/);
    expect(validateMcRequest({ primaries: 1000, seed: 42 })).toBeNull();
  });
});

describe("Monte Carlo request end to end (wired to the analytic engine)", () => {
  const res = runMonteCarloRequest({ params, material: water, isotope: sr90, detector, primaries: 4000, seed: 7 });

  it("returns a result whose mean is consistent with the analytic engine (|z| < 4)", () => {
    expect(Math.abs(res.zScore)).toBeLessThan(4);
    expect(res.analyticDetectedPerParticle).toBeGreaterThan(0);
  });

  it("the same request gives the same result (reproducible)", () => {
    const again = runMonteCarloRequest({ params, material: water, isotope: sr90, detector, primaries: 4000, seed: 7 });
    expect(again.mc.meanDetectedPerParticle).toBe(res.mc.meanDetectedPerParticle);
  });

  it("throws on invalid input rather than running", () => {
    expect(() => runMonteCarloRequest({ params, material: water, isotope: sr90, detector, primaries: 5, seed: 7 })).toThrow(/Primaries/);
  });
});

describe("Monte Carlo switches stay consistent with the analytic engine", () => {
  const cases = [
    { energyLoss: false, absorption: true, detectorEfficiency: true },
    { energyLoss: true, absorption: false, detectorEfficiency: true },
    { energyLoss: true, absorption: true, detectorEfficiency: false },
  ];
  for (const options of cases) {
    it(`agrees within 4 sigma with ${JSON.stringify(options)}`, () => {
      const r = runMonteCarloRequest({ params, material: water, isotope: sr90, detector, primaries: 20000, seed: 11, options });
      expect(Math.abs(r.zScore)).toBeLessThan(4);
    });
  }
  it("turning detector efficiency off raises the detected count", () => {
    const on = runMonteCarloRequest({ params, material: water, isotope: sr90, detector, primaries: 4000, seed: 3 });
    const off = runMonteCarloRequest({ params, material: water, isotope: sr90, detector, primaries: 4000, seed: 3, options: { energyLoss: true, absorption: true, detectorEfficiency: false } });
    expect(off.mc.meanDetectedPerParticle).toBeGreaterThan(on.mc.meanDetectedPerParticle);
  });
  it("records the detected count of every primary", () => {
    const r = runMonteCarloRequest({ params, material: water, isotope: sr90, detector, primaries: 1000, seed: 5 });
    expect(r.mc.detectedPerPrimary).toHaveLength(1000);
    const mean = r.mc.detectedPerPrimary.reduce((a, b) => a + b, 0) / 1000;
    expect(mean).toBeCloseTo(r.mc.meanDetectedPerParticle, 9);
  });
});
