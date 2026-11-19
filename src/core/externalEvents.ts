/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import type { ExternalParticle } from "./monteCarlo";
import { particleMassMeV } from "../data/particles";

export const EXTERNAL_LIMITS = { maxRows: 200000 };

export interface ParsedEvents {
  events: ExternalParticle[][];
  rows: number;
}

/**
 * Parses charged secondaries exported from an event generator or transport code (PYTHIA 8, HERWIG, Geant4, ...).
 * CSV with a header row and columns: event, pdgId, kineticMeV, xMm. Lines starting with # are comments.
 * xMm is the birth depth in the radiator. Unknown particles, negative energies and out-of-range depths are errors.
 */
export function parseExternalEvents(text: string): ParsedEvents {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  if (lines.length < 2) throw new Error("File needs a header row and at least one particle row.");
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name.toLowerCase());
  const cols = { event: idx("event"), pdg: idx("pdgid"), t: idx("kineticmev"), x: idx("xmm") };
  if (Object.values(cols).some((c) => c < 0)) throw new Error("Header must contain: event, pdgId, kineticMeV, xMm.");
  if (lines.length - 1 > EXTERNAL_LIMITS.maxRows) throw new Error(`At most ${EXTERNAL_LIMITS.maxRows} rows.`);
  const byEvent = new Map<string, ExternalParticle[]>();
  for (let i = 1; i < lines.length; i++) {
    const f = lines[i].split(",").map((v) => v.trim());
    const pdgId = Number(f[cols.pdg]);
    const kineticMeV = Number(f[cols.t]);
    const xMm = Number(f[cols.x]);
    if (!Number.isInteger(pdgId) || particleMassMeV(Math.abs(pdgId)) === undefined) throw new Error(`Row ${i}: unsupported PDG id ${f[cols.pdg]}.`);
    if (!(kineticMeV >= 0) || !Number.isFinite(kineticMeV)) throw new Error(`Row ${i}: kinetic energy must be a non-negative number.`);
    if (!(xMm >= 0) || !Number.isFinite(xMm)) throw new Error(`Row ${i}: depth must be a non-negative number.`);
    const key = f[cols.event];
    if (!byEvent.has(key)) byEvent.set(key, []);
    byEvent.get(key)!.push({ pdgId, kineticMeV, xMm });
  }
  return { events: [...byEvent.values()], rows: lines.length - 1 };
}
