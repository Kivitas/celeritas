/**
 * @license
 * SPDX-License-Identifier: MIT
 */

/**
 * Public entry point of the physics core. The implementation is split across:
 *   constants.ts   masses and constants
 *   kinematics.ts  beta, momentum, threshold energy, Larmor radius
 *   cherenkov.ts   Frank-Tamm yield and emission angle
 *   dispersion.ts  refractive index from Sellmeier coefficients
 *   transport.ts   medium coefficients and path-averaged transmission
 *   simulate.ts    runCherenkovSimulation orchestration
 * Import from here so callers do not depend on the internal split.
 */

export * from "./constants";
export * from "./kinematics";
export * from "./cherenkov";
export * from "./dispersion";
export * from "./transport";
export * from "./simulate";
export * from "./stopping";
