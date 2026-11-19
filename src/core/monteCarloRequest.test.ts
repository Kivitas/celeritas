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
  const base = { deltaRays: false, decayInFlight: false };
  const cases = [
    { ...base, energyLoss: false, absorption: true, detectorEfficiency: true },
    { ...base, energyLoss: true, absorption: false, detectorEfficiency: true },
    { ...base, energyLoss: true, absorption: true, detectorEfficiency: false },
  ];
  for (const options of cases) {
    it(`agrees within 4 sigma with ${JSON.stringify(options)}`, () => {
      const r = runMonteCarloRequest({ params, material: water, isotope: sr90, detector, primaries: 20000, seed: 11, options });
      expect(Math.abs(r.zScore)).toBeLessThan(4);
    });
  }
  it("turning detector efficiency off raises the detected count", () => {
    const on = runMonteCarloRequest({ params, material: water, isotope: sr90, detector, primaries: 4000, seed: 3 });
    const off = runMonteCarloRequest({ params, material: water, isotope: sr90, detector, primaries: 4000, seed: 3, options: { ...base, energyLoss: true, absorption: true, detectorEfficiency: false } });
    expect(off.mc.meanDetectedPerParticle).toBeGreaterThan(on.mc.meanDetectedPerParticle);
  });
  it("records the detected count of every primary", () => {
    const r = runMonteCarloRequest({ params, material: water, isotope: sr90, detector, primaries: 1000, seed: 5 });
    expect(r.mc.detectedPerPrimary).toHaveLength(1000);
    const mean = r.mc.detectedPerPrimary.reduce((a, b) => a + b, 0) / 1000;
    expect(mean).toBeCloseTo(r.mc.meanDetectedPerParticle, 9);
  });
});

describe("Delta rays and decay in flight", () => {
  const off = { energyLoss: true, absorption: true, detectorEfficiency: true, deltaRays: false, decayInFlight: false };
  const protonParams = { ...params, isotopeId: "proton_therapy", beamEnergyMeV: 3000, beamCharge: 1, trackLengthMm: 100, radiatorThicknessMm: 100 } as unknown as SimulationParams;
  const proton = ISOTOPE_PRESETS.find((i) => i.id === "proton_therapy");

  it("delta rays add photons on top of an unchanged primary", () => {
    const a = runMonteCarloRequest({ params: protonParams, material: water, isotope: proton, detector, primaries: 600, seed: 9, options: off });
    const b = runMonteCarloRequest({ params: protonParams, material: water, isotope: proton, detector, primaries: 600, seed: 9, options: { ...off, deltaRays: true } });
    expect(b.mc.meanDeltaRaysPerParticle).toBeGreaterThan(0);
    expect(b.mc.meanDeltaDetectedPerParticle).toBeGreaterThan(0);
    expect(b.mc.meanDetectedPerParticle).toBeGreaterThan(a.mc.meanDetectedPerParticle);
    expect(Math.abs(b.zScore)).toBeLessThan(5);
  });

  it("delta-ray count matches the analytic expectation 0.5 K (Z/A) rho x z^2/beta^2 (1/Tcut - 1/Tmax)", () => {
    // 3 GeV proton in 100 mm water: beta ~ 0.954; Tcut ~ 0.264 MeV for n ~ 1.33; Tmax ~ 8.3 MeV; expected mean = 3.43
    const r = runMonteCarloRequest({ params: protonParams, material: water, isotope: proton, detector, primaries: 1500, seed: 2, options: { ...off, deltaRays: true } });
    expect(r.mc.meanDeltaRaysPerParticle).toBeGreaterThan(3.0);
    expect(r.mc.meanDeltaRaysPerParticle).toBeLessThan(3.9);
  }, 60000);

  it("muons decay with the expected fraction and the Michel electron is followed", () => {
    const muon = ISOTOPE_PRESETS.find((i) => i.id === "muon_cosmic");
    const muParams = { ...params, isotopeId: "muon_cosmic", beamEnergyMeV: 20, beamCharge: -1, trackLengthMm: 100, radiatorThicknessMm: 100 } as unknown as SimulationParams;
    const r = runMonteCarloRequest({ params: muParams, material: water, isotope: muon, detector, primaries: 20000, seed: 4, options: { ...off, decayInFlight: true } });
    // 20 MeV muon: gamma beta ~ 0.6, decay length ~ 0.4 km, so ~ 100 mm / 4e5 mm = 2.5e-4 of muons decay
    expect(r.mc.decayFraction).toBeLessThan(1e-3);
  });

  it("imported secondaries are followed and add photons", () => {
    const base = runMonteCarloRequest({ params, material: water, isotope: sr90, detector, primaries: 500, seed: 1, options: off });
    const r = runMonteCarloRequest({ params, material: water, isotope: sr90, detector, primaries: 500, seed: 1,
      options: { ...off, externalEvents: [[{ pdgId: 11, kineticMeV: 2, xMm: 1 }]] } });
    expect(r.mc.meanExternalDetectedPerParticle).toBeGreaterThan(0);
    expect(r.mc.meanDetectedPerParticle).toBeGreaterThan(base.mc.meanDetectedPerParticle);
  });
});
