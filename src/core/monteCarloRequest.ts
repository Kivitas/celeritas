/**
 * @license
 * SPDX-License-Identifier: MIT
 */

// The single entry point for a Monte Carlo run from the app or a worker. It runs the photon-level
// Monte Carlo and the analytic engine with the same inputs, so the two can be compared directly.

import type { SimulationParams, MaterialPreset, IsotopeProfile, DetectorSettings } from "../types";
import { runMonteCarlo, type McResult } from "./monteCarlo";
import { runCherenkovSimulation } from "./simulate";

export interface McRequest {
  params: SimulationParams;
  material: MaterialPreset;
  isotope: IsotopeProfile | undefined;
  detector: DetectorSettings;
  primaries: number;
  seed: number;
}

export interface McResponse {
  mc: McResult;
  /** Analytic detected photons per primary, with the same detector settings. */
  analyticDetectedPerParticle: number;
  /** (MC - analytic) / standard error. Within about +-3 is consistent. */
  zScore: number;
  /** Wall-clock time of the Monte Carlo run in milliseconds. */
  runtimeMs: number;
}

export const MC_LIMITS = { minPrimaries: 100, maxPrimaries: 200000 };

/** Validates a request. Returns a message for the first problem, or null. */
export function validateMcRequest(req: Pick<McRequest, "primaries" | "seed">): string | null {
  if (!Number.isInteger(req.primaries) || req.primaries < MC_LIMITS.minPrimaries || req.primaries > MC_LIMITS.maxPrimaries) {
    return `Primaries must be an integer from ${MC_LIMITS.minPrimaries} to ${MC_LIMITS.maxPrimaries}.`;
  }
  if (!Number.isInteger(req.seed) || req.seed < 0 || req.seed > 0xffffffff) {
    return "Seed must be an integer from 0 to 4294967295.";
  }
  return null;
}

export function runMonteCarloRequest(req: McRequest): McResponse {
  const problem = validateMcRequest(req);
  if (problem) throw new Error(problem);
  const started = Date.now();
  const mc = runMonteCarlo(req.params, req.material, req.isotope, req.detector, req.primaries, req.seed);
  const runtimeMs = Date.now() - started;
  const analytic = runCherenkovSimulation(
    { ...req.params, numberFiredParticles: 1 },
    req.material,
    req.isotope,
    req.detector
  ).summary;
  const analyticDetectedPerParticle = analytic.totalPhotonsDetected / analytic.firedParticles;
  const zScore = mc.stdErrDetectedPerParticle > 0
    ? (mc.meanDetectedPerParticle - analyticDetectedPerParticle) / mc.stdErrDetectedPerParticle
    : 0;
  return { mc, analyticDetectedPerParticle, zScore, runtimeMs };
}
