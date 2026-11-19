/**
 * @license
 * SPDX-License-Identifier: MIT
 */

// The single entry point for a Monte Carlo run from the app or a worker. It runs the photon-level
// Monte Carlo and the analytic engine with the same inputs, so the two can be compared directly.

import type { SimulationParams, MaterialPreset, IsotopeProfile, DetectorSettings } from "../types";
import { runMonteCarlo, MC_DEFAULT_OPTIONS, type McOptions, type McResult } from "./monteCarlo";
import { runCherenkovSimulation } from "./simulate";

export interface McRequest {
  params: SimulationParams;
  material: MaterialPreset;
  isotope: IsotopeProfile | undefined;
  detector: DetectorSettings;
  primaries: number;
  seed: number;
  options?: McOptions;
}

export interface McResponse {
  mc: McResult;
  /** Analytic detected photons per primary, with the same detector settings. */
  analyticDetectedPerParticle: number;
  /** (MC primary-only - analytic) / standard error. Within about +-3 is consistent. */
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
  const options = req.options ?? MC_DEFAULT_OPTIONS;
  const mc = runMonteCarlo(req.params, req.material, req.isotope, req.detector, req.primaries, req.seed, options);
  const runtimeMs = Date.now() - started;
  // The analytic engine gets the same switches: no stopping data means constant speed, a near-zero
  // absorption table means no absorption, and a perfect detector means no efficiency factor.
  const material = { ...req.material };
  if (!options.energyLoss) delete material.stopping;
  if (!options.absorption) {
    material.absorptionTable = [
      { wavelengthNm: 1, alphaPerM: 1e-12 },
      { wavelengthNm: 100000, alphaPerM: 1e-12 },
    ];
  }
  const params = { ...req.params, numberFiredParticles: 1 };
  if (!options.detectorEfficiency) params.daq = { ...params.daq, deadtimeFraction: 0 };
  const detector = options.detectorEfficiency ? req.detector : { ...req.detector, quantumEfficiencyPct: 100 };
  const analytic = runCherenkovSimulation(params, material, req.isotope, detector).summary;
  const analyticDetectedPerParticle = analytic.totalPhotonsDetected / analytic.firedParticles;
  // The analytic engine models the primary only, so the test uses the primary's own photons. Delta rays and
  // decay electrons are extra and are reported separately.
  const zScore = mc.stdErrPrimaryDetectedPerParticle > 0
    ? (mc.meanPrimaryDetectedPerParticle - analyticDetectedPerParticle) / mc.stdErrPrimaryDetectedPerParticle
    : 0;
  return { mc, analyticDetectedPerParticle, zScore, runtimeMs };
}
