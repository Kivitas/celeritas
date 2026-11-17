/**
 * @license
 * SPDX-License-Identifier: MIT
 */

/**
 * Particle rest masses keyed by PDG Monte Carlo particle number.
 *
 * Only entries with `verified: true` were retrieved from the PDG listings (pdgLive, PDG 2026
 * edition, Int. J. Mod. Phys. A 41, 2630011 (2026)) on 2026-11-17. Entries with `verified: false`
 * are carried over from earlier code and have NOT been checked against the PDG yet; see
 * docs/IMPROVEMENT_PLAN.md task T2.1. Do not treat them as validated.
 */

export interface ParticleInfo {
  pdgId: number;
  name: string;
  massMeV: number;
  /** Absolute uncertainty in MeV/c^2, when the source gives one. */
  massUncertaintyMeV?: number;
  source: string;
  verified: boolean;
}

const PDG_PAGE = "https://pdglive.lbl.gov";

export const PARTICLES: Record<number, ParticleInfo> = {
  11: { pdgId: 11, name: "electron", massMeV: 0.51099895069, massUncertaintyMeV: 0.00000000016, source: `PDG 2026, ${PDG_PAGE}/Particle.action?node=S003`, verified: true },
  [-11]: { pdgId: -11, name: "positron", massMeV: 0.51099895069, massUncertaintyMeV: 0.00000000016, source: `PDG 2026, ${PDG_PAGE}/Particle.action?node=S003`, verified: true },
  13: { pdgId: 13, name: "muon", massMeV: 105.6583755, massUncertaintyMeV: 0.0000023, source: `PDG 2026, ${PDG_PAGE}/Particle.action?node=S004`, verified: true },
  211: { pdgId: 211, name: "pion (charged)", massMeV: 139.57039, massUncertaintyMeV: 0.00017, source: `PDG 2026, ${PDG_PAGE}/Particle.action?node=S008`, verified: true },
  2212: { pdgId: 2212, name: "proton", massMeV: 938.27208943, massUncertaintyMeV: 0.00000029, source: `PDG 2026, ${PDG_PAGE}/Particle.action?node=S016`, verified: true },
  [-2212]: { pdgId: -2212, name: "antiproton", massMeV: 938.27208943, massUncertaintyMeV: 0.00000029, source: `PDG 2026, ${PDG_PAGE}/Particle.action?node=S016`, verified: true },
  2112: { pdgId: 2112, name: "neutron", massMeV: 939.5654219, massUncertaintyMeV: 0.0000005, source: `PDG 2026, ${PDG_PAGE}/Particle.action?node=S017`, verified: true },
  // Not yet verified against the PDG (plan T2.1). Values below are retained from earlier code.
  1000020040: { pdgId: 1000020040, name: "alpha (He-4 nucleus)", massMeV: 3727.3794, source: "earlier code, not checked against PDG", verified: false },
  1000060120: { pdgId: 1000060120, name: "carbon-12 ion", massMeV: 11177.928, source: "earlier code, not checked; this is the neutral-atom mass, a bare nucleus is lighter", verified: false },
};

/** Rest mass in MeV/c^2 for a PDG id, or undefined when the particle is not in the table. */
export function particleMassMeV(pdgId: number): number | undefined {
  return PARTICLES[pdgId]?.massMeV;
}
