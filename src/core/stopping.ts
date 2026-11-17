/**
 * @license
 * SPDX-License-Identifier: MIT
 */

/**
 * Collision stopping power and CSDA range (plan T3.4).
 *
 * Formulas (PDG 2026, "Passage of particles through matter", Eq. 34.5 heavy particles and Eq. 34.23
 * Moller electrons). Units: MeV, MeV g^-1 cm^2 for mass stopping power, g cm^-2 for ranges.
 *
 * Not included: density-effect correction delta (no sourced parameters for water; delta is set to 0),
 * shell corrections, radiative losses for electrons, and any material other than those given explicitly.
 * Heavy-particle form is valid for 0.1 < beta gamma < 1000 to "a few percent" (PDG). Results must be
 * compared with NIST ESTAR / PSTAR in tests and the residuals reported, not tuned away.
 */

import { ELECTRON_MASS_MEV } from "./constants";
import { calculateRelativisticBeta } from "./kinematics";

/** K = 4 pi N_A r_e^2 m_e c^2 in MeV mol^-1 cm^2 (PDG 2026 passage review, Table 34.1: 0.307 075). */
export const BETHE_K_MEV_CM2_PER_MOL = 0.307075;

/** Z/A of liquid water in mol g^-1 (PDG 2026 Atomic and Nuclear Properties, water liquid: 0.55509). */
export const WATER_Z_OVER_A = 0.55509;
/** Mean excitation energy of liquid water in MeV (PDG 2026: 79.7 eV). */
export const WATER_I_PDG_MEV = 79.7e-6;
/** Mean excitation energy of liquid water in MeV as used by NIST ESTAR (75.0 eV). */
export const WATER_I_NIST_MEV = 75.0e-6;

export interface StoppingMaterial {
  /** Z/A in mol g^-1. */
  zOverA: number;
  /** Mean excitation energy in MeV. */
  iMeV: number;
}

/**
 * Collision mass stopping power of an electron (or positron), Moller form, PDG Eq. 34.23 with delta = 0.
 * @param kineticMeV kinetic energy T in MeV (> 0)
 * @returns MeV g^-1 cm^2 (positive)
 */
export function electronCollisionMassStoppingPower(kineticMeV: number, material: StoppingMaterial): number {
  if (!(kineticMeV > 0)) return 0;
  const m = ELECTRON_MASS_MEV;
  const gamma = 1 + kineticMeV / m;
  const beta2 = 1 - 1 / (gamma * gamma);
  const I = material.iMeV;
  const logArg = m * beta2 * gamma * gamma * (m * (gamma - 1) / 2) / (I * I);
  if (!(logArg > 0)) return 0;
  const bracket =
    Math.log(logArg) +
    (1 - beta2) -
    ((2 * gamma - 1) / (gamma * gamma)) * Math.LN2 +
    (1 / 8) * Math.pow((gamma - 1) / gamma, 2);
  return BETHE_K_MEV_CM2_PER_MOL * 0.5 * material.zOverA * (1 / beta2) * bracket;
}

/**
 * Mass stopping power of a heavy charged particle (charge z = 1), PDG Eq. 34.5 with delta = 0.
 * @param kineticMeV kinetic energy in MeV
 * @param massMeV rest mass in MeV/c^2
 * @returns MeV g^-1 cm^2 (positive); 0 below the validity lower bound beta gamma = 0.1
 */
export function heavyCollisionMassStoppingPower(kineticMeV: number, massMeV: number, material: StoppingMaterial): number {
  if (!(kineticMeV > 0) || !(massMeV > 0)) return 0;
  const m = ELECTRON_MASS_MEV;
  const gamma = 1 + kineticMeV / massMeV;
  const beta2 = 1 - 1 / (gamma * gamma);
  const betaGamma = Math.sqrt(beta2 * gamma * gamma);
  if (betaGamma < 0.1) return 0;
  // Maximum energy transfer to a free electron, PDG Eq. 34.4 (point particle, M >> m_e form kept in full).
  const wMax = 2 * m * beta2 * gamma * gamma / (1 + 2 * gamma * m / massMeV + (m / massMeV) * (m / massMeV));
  const I = material.iMeV;
  const logArg = 2 * m * beta2 * gamma * gamma * wMax / (I * I);
  if (!(logArg > 0)) return 0;
  const bracket = 0.5 * Math.log(logArg) - beta2;
  return BETHE_K_MEV_CM2_PER_MOL * material.zOverA * bracket / beta2;
}

/** Stopping power for any supported particle: electrons use the Moller form, heavier particles Bethe. */
export function collisionMassStoppingPower(kineticMeV: number, massMeV: number, material: StoppingMaterial): number {
  if (massMeV <= ELECTRON_MASS_MEV * 1.0000001) return electronCollisionMassStoppingPower(kineticMeV, material);
  return heavyCollisionMassStoppingPower(kineticMeV, massMeV, material);
}

/**
 * CSDA range in g cm^-2: integral of dT / S(T) from 0 to T0, with a logarithmic grid in T.
 * Integrates the collision stopping power only.
 */
export function csdaRangeGPerCm2(kineticMeV: number, massMeV: number, material: StoppingMaterial, stepsPerDecade = 2000): number {
  if (!(kineticMeV > 0)) return 0;
  const tMin = kineticMeV * 1e-6;
  const decades = Math.log10(kineticMeV / tMin);
  const n = Math.max(2, Math.ceil(decades * stepsPerDecade));
  const logMin = Math.log(tMin);
  const logMax = Math.log(kineticMeV);
  const h = (logMax - logMin) / n;
  // Trapezoid in u = ln T: range = integral of (T / S(T)) du.
  let sum = 0;
  let prev = null as number | null;
  for (let i = 0; i <= n; i++) {
    const T = Math.exp(logMin + i * h);
    const S = collisionMassStoppingPower(T, massMeV, material);
    const f = S > 0 ? T / S : 0;
    if (prev !== null) sum += 0.5 * h * (prev + f);
    prev = f;
  }
  // Below tMin the contribution is negligible (range scales roughly as T^1.7).
  return sum;
}

/** Beta for a kinetic energy, re-exported for callers that work in stopping-power units. */
export function betaFromKinetic(kineticMeV: number, massMeV: number): number {
  return calculateRelativisticBeta(kineticMeV, massMeV);
}

export interface PathSample {
  /** Distance from the radiator entrance to the step midpoint, mm. */
  xMm: number;
  /** Kinetic energy at the step midpoint, MeV. */
  kineticMeV: number;
  /** Step length, mm. */
  dxMm: number;
}

/**
 * Steps a particle through a slab with the collision stopping power, limiting each step to a fixed
 * fraction of the current kinetic energy. Returns midpoint samples up to maxLengthMm or until the
 * particle drops below tStopMeV. Energy straggling and radiative losses are not modelled.
 */
export function sampleEnergyLossPath(
  kineticMeV: number,
  massMeV: number,
  material: StoppingMaterial & { densityGcm3: number },
  maxLengthMm: number,
  relStep = 0.005,
  tStopMeV = 1e-4
): { samples: PathSample[]; exitKineticMeV: number } {
  const samples: PathSample[] = [];
  let x = 0;
  let T = kineticMeV;
  while (x < maxLengthMm && T > tStopMeV) {
    const dEdxMeVPerCm = collisionMassStoppingPower(T, massMeV, material) * material.densityGcm3;
    if (!(dEdxMeVPerCm > 0)) break;
    const dTTarget = relStep * T;
    let dxMm = (dTTarget / dEdxMeVPerCm) * 10;
    if (x + dxMm > maxLengthMm) dxMm = maxLengthMm - x;
    const dT = dEdxMeVPerCm * (dxMm / 10);
    samples.push({ xMm: x + dxMm / 2, kineticMeV: Math.max(tStopMeV, T - dT / 2), dxMm });
    x += dxMm;
    T = Math.max(0, T - dT);
  }
  return { samples, exitKineticMeV: T };
}
