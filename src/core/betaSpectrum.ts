/**
 * @license
 * SPDX-License-Identifier: MIT
 */

/**
 * Beta-decay electron spectrum and spectrum-averaged Cherenkov yield (plan T3.5).
 *
 * Shape: allowed-transition form without the Fermi function (Coulomb correction omitted, F = 1):
 *   N(E) dE  proportional to  p E (E0 - E)^2 dE,   p = sqrt(E (E + 2 m_e)),
 * with E kinetic energy and E0 the endpoint. The Fermi function matters for high-Z daughters
 * (Y-90 has Z = 39); its omission is a known error that the mean-energy test below reports.
 *
 * Endpoints and mean energies: ENSDF (Basu and McCutchan 2020 for Sr-90 and Y-90; Browne and Tuli
 * 2007 for Cs-137), read from NuDat 3 pages on 2026-11-17 (see the tests for the exact values).
 */

import { ELECTRON_MASS_MEV } from "./constants";

/** Unnormalised allowed-shape weight for an electron of kinetic energy E in a spectrum with endpoint E0 (MeV). */
export function allowedShapeWeight(kineticMeV: number, endpointMeV: number): number {
  if (!(kineticMeV > 0) || kineticMeV >= endpointMeV) return 0;
  const p = Math.sqrt(kineticMeV * (kineticMeV + 2 * ELECTRON_MASS_MEV));
  const d = endpointMeV - kineticMeV;
  return p * kineticMeV * d * d;
}

/** Mean kinetic energy of the allowed-shape spectrum in MeV, by midpoint integration. */
export function allowedShapeMeanEnergy(endpointMeV: number, steps = 20000): number {
  let num = 0;
  let den = 0;
  const h = endpointMeV / steps;
  for (let i = 0; i < steps; i++) {
    const E = (i + 0.5) * h;
    const w = allowedShapeWeight(E, endpointMeV);
    num += w * E;
    den += w;
  }
  return den > 0 ? num / den : 0;
}

/**
 * Spectrum-averaged value of f(E) over the beta spectrum: sum over midpoint energies of N(E) f(E)
 * divided by sum of N(E). f is typically the per-particle Cherenkov yield for an electron of energy E.
 */
export function betaSpectrumAverage(endpointMeV: number, f: (kineticMeV: number) => number, bins = 200): number {
  let num = 0;
  let den = 0;
  const h = endpointMeV / bins;
  for (let i = 0; i < bins; i++) {
    const E = (i + 0.5) * h;
    const w = allowedShapeWeight(E, endpointMeV);
    if (w <= 0) continue;
    num += w * f(E);
    den += w;
  }
  return den > 0 ? num / den : 0;
}
