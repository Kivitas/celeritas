/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import { MATERIAL_PRESETS } from "./presets";
import { PARTICLES } from "./particles";

describe("material provenance (plan T2.2)", () => {
  it("every verified material cites a source", () => {
    for (const m of MATERIAL_PRESETS.filter((x) => x.verified)) {
      expect(m.source, `${m.id} is verified but has no source`).toBeTruthy();
    }
  });

  it("the default radiator used by the app is verified", () => {
    const quartz = MATERIAL_PRESETS.find((m) => m.id === "quartz");
    expect(quartz?.verified).toBe(true);
  });
});

describe("particle table provenance (plan T2.1)", () => {
  it("every verified particle cites a PDG source", () => {
    for (const p of Object.values(PARTICLES).filter((x) => x.verified)) {
      expect(p.source, `${p.name} is verified but has no source`).toMatch(/PDG/);
    }
  });

  it("unverified particle masses are flagged, not presented as verified", () => {
    const unverified = Object.values(PARTICLES).filter((x) => !x.verified);
    expect(unverified.length).toBeGreaterThan(0);
    for (const p of unverified) expect(p.source).not.toMatch(/PDG 2026/);
  });
});

import { getRefractiveIndexAt } from "../core/dispersion";

describe("dispersion checks against fetched sources (plan T2.2)", () => {
  const get = (id: string) => MATERIAL_PRESETS.find((m) => m.id === id)!;

  it("N-BK7 reproduces the printed nd = 1.5168 at 587.56 nm (refractiveindex.info, SCHOTT)", () => {
    expect(Math.abs(getRefractiveIndexAt(587.56, get("glass_bk7"), 293.15) - 1.5168)).toBeLessThan(5e-5);
  });

  // The 589.3 nm values below are the ones reproduced from the fetched coefficients.
  // They guard against transcription errors in presets.ts. They are not independent of the source.
  const reproduced589: Record<string, number> = {
    glass_bk7: 1.516728,
    calcium_fluoride: 1.433808,
    sapphire: 1.768138,
    magnesium_fluoride: 1.377712,
    lithium_fluoride: 1.392109,
    water: 1.333349,
  };
  for (const [id, n] of Object.entries(reproduced589)) {
    it(`${id} gives n(589.3 nm) = ${n} from its fetched coefficients`, () => {
      expect(Math.abs(getRefractiveIndexAt(589.3, get(id), 293.15) - n)).toBeLessThan(1e-5);
    });
  }
});
