/**
 * @license
 * SPDX-License-Identifier: MIT
 */

// Particle masses (MeV/c^2) from src/data/particles.ts (PDG-sourced where verified).
import { PARTICLES } from "../data/particles";

export const ELECTRON_MASS_MEV = PARTICLES[11].massMeV;
export const MUON_MASS_MEV = PARTICLES[13].massMeV;
export const PROTON_MASS_MEV = PARTICLES[2212].massMeV;
export const NEUTRON_MASS_MEV = PARTICLES[2112].massMeV;
export const PION_MASS_MEV = PARTICLES[211].massMeV;
export const ALPHA_MASS_MEV = PARTICLES[1000020040].massMeV; // not yet PDG-verified
export const CARBON_ION_MASS_MEV = PARTICLES[1000060120].massMeV; // not yet PDG-verified

// Physical constants
export const SPEED_OF_LIGHT = 299792458; // m/s
export const FINE_STRUCTURE_CONSTANT = 1 / 137.035999139; // alpha

// Thermal model (single global coefficient, see plan T3.2 for the per-material replacement)
export const STANDARD_TEMP_K = 293.15; // 20 degC
export const THERMAL_COEFFICIENT_DN_DT = -1.4e-4; // K^-1, applied to every material
export const THRESHOLD_REFERENCE_WAVELENGTH_NM = 500;

// Numerical settings
export const MAX_SPECTRAL_POINTS = 5000;
export const DEFAULT_BIN_RESOLUTION_NM = 10;
export const DEFAULT_FIRED_PARTICLES = 100;
export const RAYLEIGH_SCATTERING_BASE_NM = 400.0; // used by the transport model only

/** Elementary charge-independent constant used in Larmor / synchrotron formulas (0.3 * B * rho = p in GeV/c). */
export const LARMOR_FACTOR = 0.3;
/** Synchrotron critical energy coefficient for electrons: eps_c = 665 * E^2[GeV] * B[T] keV. */
export const SYNCHROTRON_CRITICAL_COEFF_KEV = 665;
