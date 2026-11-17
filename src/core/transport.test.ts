/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import { tabulatedAbsorptionPerMm, pathAveragedTransmission } from "./transport";

// These tests check the interpolation arithmetic on a synthetic table. They say nothing about physics.
describe("tabulated absorption (interpolation mechanics)", () => {
  const table = [
    { wavelengthNm: 400, alphaPerM: 1 },
    { wavelengthNm: 500, alphaPerM: 0.01 },
  ];

  it("returns the table value at a tabulated wavelength, converted to 1/mm", () => {
    expect(tabulatedAbsorptionPerMm(400, table)).toBeCloseTo(1e-3, 12);
    expect(tabulatedAbsorptionPerMm(500, table)).toBeCloseTo(1e-5, 12);
  });

  it("interpolates log-linearly between points", () => {
    // Midpoint in wavelength gives the geometric mean of the two alphas: sqrt(1 * 0.01) = 0.1 /m.
    expect(tabulatedAbsorptionPerMm(450, table)).toBeCloseTo(1e-4, 12);
  });

  it("uses the nearest endpoint outside the table", () => {
    expect(tabulatedAbsorptionPerMm(300, table)).toBeCloseTo(1e-3, 12);
    expect(tabulatedAbsorptionPerMm(900, table)).toBeCloseTo(1e-5, 12);
  });

  it("returns undefined for an empty table", () => {
    expect(tabulatedAbsorptionPerMm(450, [])).toBeUndefined();
  });
});

describe("Beer-Lambert path averaging", () => {
  it("gives exp(-mu d) when there is no absorption", () => {
    expect(pathAveragedTransmission(0, 10, 10)).toBeCloseTo(1, 12);
  });

  it("averages exp(-mu x) over the emission length", () => {
    // Emission uniform over [0, L] with L = d: mean of exp(-mu x) over [0, d] = (1 - exp(-mu d)) / (mu d).
    const mu = 0.05;
    const d = 20;
    const expected = (1 - Math.exp(-mu * d)) / (mu * d);
    expect(pathAveragedTransmission(mu, d, d)).toBeCloseTo(expected, 10);
  });
});
