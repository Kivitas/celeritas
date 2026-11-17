/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import { runCherenkovSimulation, frankTammPhotonsPerMm, calculateRelativisticBeta, ELECTRON_MASS_MEV } from "./physics";
import type { MaterialPreset, SimulationParams } from "../types";

// A material whose index does not depend on wavelength: n^2 - 1 = B1 with a negligible pole.
function constantIndex(n: number): MaterialPreset {
  return {
    id: "const", name: "constant index", refractiveIndexStatic: n,
    sellmeierCoeffs: { B1: n * n - 1, C1: 1e-12 },
    mu_a_base: 0, mu_s_base: 0, anisotropyG: 0,
  };
}

const baseParams = (overrides: Partial<SimulationParams>): SimulationParams => ({
  isotopeId: "custom", customIsotopeName: "", beamEnergyMeV: 1.0, energyUnit: "MeV",
  beamCharge: -1, customRestMassMeV: ELECTRON_MASS_MEV, customChargeE: -1, magneticFieldT: 0,
  beamFwhmUm: 200, trackLengthMm: 10, numberFiredParticles: 1, chamberTemperatureK: 293.15,
  materialId: "const", radiatorThicknessMm: 10, spectralRangeStartNm: 300, spectralRangeEndNm: 800,
  binResolutionNm: 10, componentsActive: { primaryCherenkov: true }, daq: { deadtimeFraction: 0 },
  ...overrides,
} as SimulationParams);

describe("spectral integration with constant index (plan T3.3)", () => {
  const n = 1.4;
  const material = constantIndex(n);
  const beta = calculateRelativisticBeta(1.0, ELECTRON_MASS_MEV);

  // Analytic photons per particle over the bins' full span, [start - w/2, end + w/2], emission length L.
  const analytic = (startNm: number, endNm: number, binNm: number, lengthMm: number) =>
    frankTammPhotonsPerMm(beta, n, startNm - binNm / 2, endNm + binNm / 2) * lengthMm;

  for (const binNm of [10, 1]) {
    it(`integrated yield converges to the analytic result within 0.1% at ${binNm} nm bins`, () => {
      const params = baseParams({ binResolutionNm: binNm, trackLengthMm: 10, radiatorThicknessMm: 10 });
      const { spectra } = runCherenkovSimulation(params, material, undefined);
      const numeric = spectra.reduce((s, p) => s + p.primaryCherenkov, 0);
      const exact = analytic(300, 800, binNm, 10);
      expect(Math.abs(numeric / exact - 1)).toBeLessThan(1e-3);
    });
  }

  it("below-threshold energy emits nothing", () => {
    const { summary } = runCherenkovSimulation(baseParams({ beamEnergyMeV: 0.1 }), material, undefined);
    expect(summary.isCherenkovGenerated).toBe(false);
    expect(summary.cherenkovAngleSpreadDeg).toBe(0);
  });
});

describe("outputs are not rounded inside the core (plan T3.6)", () => {
  it("photonsPerParticle equals the unrounded sum of the spectrum", () => {
    const material = constantIndex(1.4);
    const { spectra, summary } = runCherenkovSimulation(
      baseParams({ binResolutionNm: 10, trackLengthMm: 10, radiatorThicknessMm: 10 }), material, undefined
    );
    const sum = spectra.reduce((s, p) => s + p.primaryCherenkov, 0);
    expect(summary.photonsPerParticle).toBeCloseTo(sum, 12);
  });
});
