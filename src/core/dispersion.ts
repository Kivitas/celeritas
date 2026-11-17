/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { MaterialPreset } from "../types";
import { STANDARD_TEMP_K, THERMAL_COEFFICIENT_DN_DT } from "./constants";

/**
 * Refractive index from a Sellmeier model, n^2 - 1 = sum_i B_i lambda^2 / (lambda^2 - C_i),
 * with lambda in micrometres and C_i in micrometres^2. Up to four terms (B1..B4, C1..C4).
 * Temperature enters only through the linear term n(T) = n_ref + dn/dT * (T - 293.15).
 */
export function getRefractiveIndexAt(wavelengthNm: number, preset: MaterialPreset, tempK: number = STANDARD_TEMP_K): number {
  const wlUm = wavelengthNm / 1000.0;
  let n = preset.refractiveIndexStatic;

  if (preset.sellmeierCoeffs) {
    const c = preset.sellmeierCoeffs;
    const wlSq = wlUm * wlUm;
    let nSq = 1.0 + (c.B1 * wlSq) / (wlSq - c.C1) + (c.B2 * wlSq) / (wlSq - c.C2);
    if (c.B3 !== undefined && c.C3 !== undefined) nSq += (c.B3 * wlSq) / (wlSq - c.C3);
    if (c.B4 !== undefined && c.C4 !== undefined) nSq += (c.B4 * wlSq) / (wlSq - c.C4);
    if (nSq > 0) n = Math.sqrt(nSq);
  } else {
    // Fallback for materials without Sellmeier coefficients. This is an unsourced approximation.
    n = preset.refractiveIndexStatic + (1500.0 / (wavelengthNm * wavelengthNm));
  }

  const deltaT = tempK - STANDARD_TEMP_K;
  return n + deltaT * THERMAL_COEFFICIENT_DN_DT;
}
