/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { LARMOR_FACTOR, SYNCHROTRON_CRITICAL_COEFF_KEV } from "./constants";

/**
 * Relativistic beta = v/c for kinetic energy T and rest mass m (both MeV).
 * beta = sqrt(T (T + 2m)) / (T + m). No upper clamp: beta approaches 1 smoothly at any energy.
 */
export function calculateRelativisticBeta(energyMeV: number, particleMassMeV: number): number {
  if (!(energyMeV > 0) || !(particleMassMeV > 0)) return 0;
  return Math.sqrt(energyMeV * (energyMeV + 2 * particleMassMeV)) / (energyMeV + particleMassMeV);
}

/**
 * delta = 1 - beta, computed directly from kinetic energy T and mass m (MeV) to avoid losing
 * precision when beta is within 1e-12 of 1: delta = 1 / (gamma^2 (1 + beta)).
 */
export function oneMinusBetaFromEnergy(energyMeV: number, particleMassMeV: number): number {
  if (!(energyMeV > 0) || !(particleMassMeV > 0)) return 1;
  const gamma = 1 + energyMeV / particleMassMeV;
  const beta = calculateRelativisticBeta(energyMeV, particleMassMeV);
  return 1 / (gamma * gamma * (1 + beta));
}

/**
 * Relativistic momentum p = sqrt(T^2 + 2 T m) in MeV/c, for kinetic energy T and rest mass m (MeV/c^2).
 */
export function momentumMeV(kineticMeV: number, massMeV: number): number {
  return Math.sqrt(kineticMeV * kineticMeV + 2 * kineticMeV * massMeV);
}

/**
 * Larmor (gyro) radius in metres for a charged particle of momentum p (MeV/c) in a field B (T).
 * rho [m] = p[GeV/c] / (0.3 * B). Returns Infinity when B <= 0.
 */
export function larmorRadiusM(momentumMeVc: number, magneticFieldT: number): number {
  if (!(magneticFieldT > 0)) return Infinity;
  const pGeV = momentumMeVc / 1000;
  return pGeV / (LARMOR_FACTOR * magneticFieldT);
}

/**
 * Synchrotron critical energy in keV for an electron of energy E (GeV) in a field B (T):
 * eps_c = 665 * E^2 * B keV.
 */
export function synchrotronCriticalEnergyKeV(energyGeV: number, magneticFieldT: number): number {
  return SYNCHROTRON_CRITICAL_COEFF_KEV * energyGeV * energyGeV * magneticFieldT;
}

/**
 * Threshold kinetic energy in MeV: E = m (gamma_thr - 1), with beta_thr = 1/n.
 * gamma_thr = n / sqrt(n^2 - 1). Returns Infinity when n <= 1 (no threshold).
 */
export function getCherenkovThresholdEnergy(massMeV: number, refractiveIndex: number): number {
  if (!(refractiveIndex > 1)) return Infinity;
  const gammaThr = refractiveIndex / Math.sqrt(refractiveIndex * refractiveIndex - 1);
  return massMeV * (gammaThr - 1.0);
}
