/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { MaterialPreset } from "../types";
import { STANDARD_TEMP_K, THERMAL_COEFFICIENT_DN_DT } from "./constants";

/**
 * Refractive index from a Sellmeier model, n^2 - 1 = sum_i B_i lambda^2 / (lambda^2 - C_i),
 * with lambda in micrometres and C_i in micrometres^2 (the convention used by Malitson 1965).
 * Temperature enters only through the linear term n(T) = n_ref + dn/dT * (T - 293.15).
 */
export function getRefractiveIndexAt(wavelengthNm: number, preset: MaterialPreset, tempK: number = STANDARD_TEMP_K): number {
  const wlUm = wavelengthNm / 1000.0;
  let n = preset.refractiveIndexStatic;

  if (preset.sellmeierCoeffs) {
    const { B1, C1, B2, C2, B3, C3 } = preset.sellmeierCoeffs;
    const wlSq = wlUm * wlUm;
    let nSq = 1.0 + (B1 * wlSq) / (wlSq - C1) + (B2 * wlSq) / (wlSq - C2);
    if (B3 !== undefined && C3 !== undefined) nSq += (B3 * wlSq) / (wlSq - C3);
    if (nSq > 0) n = Math.sqrt(nSq);
  } else {
    // Fallback for materials without Sellmeier coefficients. This is an unsourced approximation.
    n = preset.refractiveIndexStatic + (1500.0 / (wavelengthNm * wavelengthNm));
  }

  const deltaT = tempK - STANDARD_TEMP_K;
  return n + deltaT * THERMAL_COEFFICIENT_DN_DT;
}
