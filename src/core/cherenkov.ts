/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { FINE_STRUCTURE_CONSTANT } from "./constants";

/**
 * sin^2(theta_c) = 1 - 1/(beta n)^2 evaluated from delta = 1 - beta and eta = n - 1.
 * With x = beta n: x - 1 = (n - 1) - n * delta and x + 1 = 2 + (n - 1) - n * delta, so
 * sin^2 = (x - 1)(x + 1) / x^2. Positive exactly when beta n > 1, which is the Cherenkov threshold.
 * Returns 0 below threshold.
 */
export function sin2ThetaFromDelta(delta: number, refractiveIndex: number): number {
  const n = refractiveIndex;
  const xMinus1 = (n - 1) - n * delta;
  if (!(xMinus1 > 0)) return 0;
  const x = n - n * delta; // beta * n
  return (xMinus1 * (x + 1)) / (x * x);
}

/**
 * Analytic Frank-Tamm photon yield per particle per mm of path (Z = 1), integrated over [startNm, endNm]:
 *   N/L = 2 * pi * alpha * (1/lambda1 - 1/lambda2) * sin^2(theta_c)   [per metre]
 * Returned in photons per mm. Returns 0 when beta * n <= 1 (below threshold).
 */
export function frankTammPhotonsPerMm(beta: number, refractiveIndex: number, startNm: number, endNm: number): number {
  if (!(startNm > 0) || !(endNm > startNm)) return 0;
  const sin2 = sin2ThetaFromDelta(1 - beta, refractiveIndex);
  if (sin2 <= 0) return 0;
  const invLambda1 = 1 / (startNm * 1e-9);
  const invLambda2 = 1 / (endNm * 1e-9);
  const perMetre = 2 * Math.PI * FINE_STRUCTURE_CONSTANT * (invLambda1 - invLambda2) * sin2;
  return perMetre / 1000;
}

/**
 * Cherenkov emission angle in degrees: cos(theta) = 1 / (beta n). Returns 0 when beta * n <= 1.
 */
export function cherenkovAngleDeg(beta: number, refractiveIndex: number): number {
  const betaN = beta * refractiveIndex;
  if (!(betaN > 1)) return 0;
  return Math.acos(1 / betaN) * (180.0 / Math.PI);
}
