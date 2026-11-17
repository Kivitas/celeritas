/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import { runMonteCarlo } from "./monteCarlo";
import { runCherenkovSimulation } from "./physics";
import { Rng } from "./rng";
import { MATERIAL_PRESETS, ISOTOPE_PRESETS } from "../data/presets";
import type { SimulationParams } from "../types";

const water = MATERIAL_PRESETS.find((m) => m.id === "water")!;
const sr90 = ISOTOPE_PRESETS.find((i) => i.id === "sr90")!;
const params = {
  isotopeId: "sr90", beamEnergyMeV: 0.546, energyUnit: "MeV", beamCharge: -1, customRestMassMeV: 0.511,
  customChargeE: -1, magneticFieldT: 0, beamFwhmUm: 200, trackLengthMm: 10, numberFiredParticles: 1,
  chamberTemperatureK: 293.15, materialId: "water", radiatorThicknessMm: 10, spectralRangeStartNm: 300,
  spectralRangeEndNm: 800, binResolutionNm: 10, componentsActive: { primaryCherenkov: true }, daq: { deadtimeFraction: 0 },
} as unknown as SimulationParams;

describe("random number generator (T4.1 prerequisite)", () => {
  it("is deterministic for a given seed", () => {
    const a = new Rng(7);
    const b = new Rng(7);
    for (let i = 0; i < 100; i++) expect(a.nextU32()).toBe(b.nextU32());
  });

  it("different seeds give different sequences", () => {
    const a = new Rng(7);
    const b = new Rng(8);
    expect(a.nextU32()).not.toBe(b.nextU32());
  });

  it("uniform() is in [0, 1) with mean close to 0.5", () => {
    const r = new Rng(42);
    let sum = 0;
    const n = 100000;
    for (let i = 0; i < n; i++) {
      const u = r.uniform();
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
      sum += u;
    }
    expect(Math.abs(sum / n - 0.5)).toBeLessThan(0.005);
  });

  it("poisson() has mean close to mu for small and large mu", () => {
    for (const mu of [2.5, 60]) {
      const r = new Rng(3);
      let sum = 0;
      const n = 20000;
      for (let i = 0; i < n; i++) sum += r.poisson(mu);
      expect(Math.abs(sum / n / mu - 1)).toBeLessThan(0.02);
    }
  });
});

describe("photon Monte Carlo vs analytic engine (T4.1)", () => {
  const analytic = runCherenkovSimulation(params, water, sr90).summary;
  const mc = runMonteCarlo(params, water, sr90, undefined, 6000, 2024);

  it("mean detected photons per particle agree with the analytic engine within 4 standard errors", () => {
    const expected = analytic.totalPhotonsDetected / analytic.firedParticles;
    expect(Math.abs(mc.meanDetectedPerParticle - expected)).toBeLessThan(4 * mc.stdErrDetectedPerParticle);
  });

  it("mean emitted photons per particle agree with the analytic engine within 4 standard errors", () => {
    expect(Math.abs(mc.meanEmittedPerParticle - analytic.photonsPerParticle)).toBeLessThan(4 * mc.stdErrEmittedPerParticle);
  });

  it("the same seed reproduces the result exactly", () => {
    const again = runMonteCarlo(params, water, sr90, undefined, 6000, 2024);
    expect(again.meanDetectedPerParticle).toBe(mc.meanDetectedPerParticle);
  });

  it("a different seed gives a different result", () => {
    const other = runMonteCarlo(params, water, sr90, undefined, 6000, 99);
    expect(other.meanDetectedPerParticle).not.toBe(mc.meanDetectedPerParticle);
  });
});
