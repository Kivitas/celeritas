/**
 * @license
 * SPDX-License-Identifier: MIT
 */

/**
 * Medium optical coefficients used by the transport model.
 * Returns { mu_a: absorption, mu_s: scattering } in mm^-1.
 * Hard-coded approximations for eight materials; all other materials use the default below.
 * These are NOT sourced and are scheduled for replacement (docs/IMPROVEMENT_PLAN.md T2.3).
 */
export function getMediumCoefficients(wavelengthNm: number, materialId: string): { mu_a: number; mu_s: number } {
  let mu_a = 0.05;
  let mu_s = 5.0;

  if (materialId === "water") {
    mu_a = 0.00001 + (wavelengthNm > 600 ? 0.001 * Math.pow((wavelengthNm - 600) / 100, 2) : 0);
    mu_s = 0.001;
  } else if (materialId === "heavy_water") {
    mu_a = 5e-6 + (wavelengthNm > 650 ? 0.0005 * Math.pow((wavelengthNm - 650) / 100, 2) : 0);
    mu_s = 0.0008;
  } else if (materialId === "lead_glass") {
    const uvFalloff = wavelengthNm < 400 ? 2.5 * Math.exp(-(wavelengthNm - 300) / 30) : 0;
    mu_a = 0.001 + uvFalloff;
    mu_s = 0.012 * Math.pow(wavelengthNm / 500, -1.8);
  } else if (materialId === "liquid_argon") {
    mu_a = 0.0002;
    mu_s = 0.04 * Math.pow(wavelengthNm / 500, -4.0);
  } else if (materialId === "plastic_scintillator") {
    const cutoff = wavelengthNm < 415 ? 1.8 * Math.exp(-(wavelengthNm - 320) / 35) : 0;
    mu_a = 0.015 + cutoff;
    mu_s = 0.08 * Math.pow(wavelengthNm / 500, -1.5);
  } else if (materialId === "quartz") {
    mu_a = 1e-6;
    mu_s = 2e-4 * Math.pow(wavelengthNm / 500, -4.0);
  } else if (materialId === "lyso") {
    const cePeak = 0.15 * Math.exp(-Math.pow((wavelengthNm - 365) / 25, 2));
    mu_a = 0.001 + cePeak;
    mu_s = 0.01 * Math.pow(wavelengthNm / 500, -1.2);
  } else if (materialId === "aerogel") {
    mu_a = 1e-5;
    mu_s = 0.025 * Math.pow(wavelengthNm / 500, -4.0);
  }

  return { mu_a, mu_s };
}

import type { AbsorptionPoint } from "../types";

/**
 * Absorption coefficient in mm^-1 from a tabulated, sourced spectrum (plan T2.3).
 * Log-linear interpolation in alpha between table points sorted by wavelength. Outside the table the
 * nearest endpoint is used; the table's range is documented on the material. Returns undefined when
 * the table is empty.
 */
export function tabulatedAbsorptionPerMm(wavelengthNm: number, table: AbsorptionPoint[]): number | undefined {
  if (table.length === 0) return undefined;
  if (wavelengthNm <= table[0].wavelengthNm) return table[0].alphaPerM / 1000;
  const last = table[table.length - 1];
  if (wavelengthNm >= last.wavelengthNm) return last.alphaPerM / 1000;
  for (let i = 1; i < table.length; i++) {
    const hi = table[i];
    if (wavelengthNm <= hi.wavelengthNm) {
      const lo = table[i - 1];
      const f = (wavelengthNm - lo.wavelengthNm) / (hi.wavelengthNm - lo.wavelengthNm);
      const logAlpha = Math.log(lo.alphaPerM) + f * (Math.log(hi.alphaPerM) - Math.log(lo.alphaPerM));
      return Math.exp(logAlpha) / 1000;
    }
  }
  return last.alphaPerM / 1000;
}

/**
 * Effective attenuation coefficient from isotropic diffusion theory:
 * mu_eff = sqrt(3 * mu_a * (mu_a + mu_s')), with mu_s' = mu_s * (1 - g).
 */
export function calculateEffectiveAttenuation(mu_a: number, mu_s: number, g: number): number {
  const mu_s_prime = mu_s * (1.0 - g);
  return Math.sqrt(Math.max(0, 3.0 * mu_a * (mu_a + mu_s_prime)));
}

/**
 * Path-averaged transmission for photons emitted uniformly over [0, L] in a slab of thickness d:
 *   T_avg = exp(-mu d) * (exp(mu L) - 1) / (mu L)
 * mu in mm^-1, lengths in mm. Falls back to exp(-mu d) when mu * L is negligible.
 */
export function pathAveragedTransmission(mu: number, emissionLengthMm: number, thicknessMm: number): number {
  const x = mu * emissionLengthMm;
  if (x > 1e-9) {
    return Math.exp(-mu * (thicknessMm - emissionLengthMm)) * (-Math.expm1(-x)) / x;
  }
  return Math.exp(-mu * thicknessMm);
}
