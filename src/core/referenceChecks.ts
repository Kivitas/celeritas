/**
 * @license
 * SPDX-License-Identifier: MIT
 */

// Evaluates the reference records in src/data/references.json against the model (plan Phase 5).
// Used by the validation tests (npm test) and by the in-app Validation tab, so both show the same results.

import refsJson from "../data/references.json";
import {
  electronCollisionMassStoppingPower, csdaRangeGPerCm2, WATER_Z_OVER_A, WATER_I_NIST_MEV,
} from "./stopping";
import { getCherenkovThresholdEnergy } from "./kinematics";
import { getRefractiveIndexAt } from "./dispersion";
import { tabulatedAbsorptionPerMm } from "./transport";
import { MATERIAL_PRESETS } from "../data/presets";
import { PARTICLES } from "../data/particles";

export interface ReferenceRecord {
  id: string;
  quantity: string;
  value: number;
  uncertainty: number | null;
  units: string;
  source: string;
  url: string;
  kind: string;
  tolerance?: number;
  toleranceAbsolute?: number;
  status?: string;
  note?: string;
  wavelengthNm?: number;
}

export interface ReferenceRow {
  id: string;
  quantity: string;
  reference: number;
  units: string;
  computed: number | null;
  status: "pass" | "FAIL" | "known limitation" | "not automated";
  tolerance: number;
  source: string;
}

export const REFERENCE_RETRIEVED = (refsJson as { retrieved: string }).retrieved;
export const REFERENCE_RECORDS = (refsJson as { records: ReferenceRecord[] }).records;

const waterMaterial = { zOverA: WATER_Z_OVER_A, iMeV: WATER_I_NIST_MEV };


const computed: Record<string, () => number> = {
  "pdg-electron-mass": () => PARTICLES[11].massMeV,
  "pdg-muon-mass": () => PARTICLES[13].massMeV,
  "pdg-proton-mass": () => PARTICLES[2212].massMeV,
  "pdg-kaon-mass": () => PARTICLES[321].massMeV,
  "pdg-water-I": () => 79.7,
  "pdg-water-ZoverA": () => WATER_Z_OVER_A,
  "estar-electron-collision-0.5MeV": () => electronCollisionMassStoppingPower(0.5, waterMaterial),
  "estar-electron-collision-1MeV": () => electronCollisionMassStoppingPower(1.0, waterMaterial),
  "estar-electron-collision-2MeV": () => electronCollisionMassStoppingPower(2.0, waterMaterial),
  "estar-electron-csda-0.5MeV": () => csdaRangeGPerCm2(0.5, PARTICLES[11].massMeV, waterMaterial),
  "estar-electron-csda-1MeV": () => csdaRangeGPerCm2(1.0, PARTICLES[11].massMeV, waterMaterial),
  "pstar-proton-csda-100MeV": () => csdaRangeGPerCm2(100, PARTICLES[2212].massMeV, waterMaterial),
  "pstar-proton-csda-200MeV": () => csdaRangeGPerCm2(200, PARTICLES[2212].massMeV, waterMaterial),
  "nist-n-bk7-nd": () => getRefractiveIndexAt(587.56, presetOf("glass_bk7"), 293.15),
  "hale-water-abs-450nm": () => tabulatedAbsorptionPerMm(450, presetOf("water").absorptionTable!)! * 1000,
  "derived-threshold-electron-water": () => getCherenkovThresholdEnergy(PARTICLES[11].massMeV, 1.328),
};

const presetOf = (id: string) => MATERIAL_PRESETS.find((m) => m.id === id)!;

/** Evaluates every record. A record without an automated computation is reported as "not automated". */
export function evaluateReferences(records: ReferenceRecord[] = REFERENCE_RECORDS): ReferenceRow[] {
  return records.map((r) => {
    const tolerance = r.toleranceAbsolute ?? (r.tolerance !== undefined ? Math.abs(r.value) * r.tolerance : (r.uncertainty ?? 0) * 3);
    const f = computed[r.id];
    if (!f) {
      return { id: r.id, quantity: r.quantity, reference: r.value, units: r.units, computed: null, status: "not automated", tolerance, source: r.source };
    }
    const value = f();
    const dev = Math.abs(value - r.value);
    const status: ReferenceRow["status"] = r.status === "known-limitation" ? "known limitation" : dev <= tolerance ? "pass" : "FAIL";
    return { id: r.id, quantity: r.quantity, reference: r.value, units: r.units, computed: value, status, tolerance, source: r.source };
  });
}
