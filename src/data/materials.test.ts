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

import { tabulatedAbsorptionPerMm } from "../core/transport";

describe("PMMA and water absorption (plan T2.2, T2.3)", () => {
  const get = (id: string) => MATERIAL_PRESETS.find((m) => m.id === id)!;

  it("PMMA (Sultanova 2009) reproduces the reproduced n(589.3 nm) = 1.490536", () => {
    expect(Math.abs(getRefractiveIndexAt(589.3, get("acrylic"), 293.15) - 1.490536)).toBeLessThan(1e-5);
  });

  it("water absorption at 450 nm is 4 pi k / lambda with k = 1.02e-9 from Hale and Querry (0.0285 1/m)", () => {
    const alphaPerM = tabulatedAbsorptionPerMm(450, get("water").absorptionTable!)! * 1000;
    expect(alphaPerM).toBeCloseTo((4 * Math.PI * 1.02e-9) / 450e-9, 3);
  });

  it("the water absorption table is positive and covers 400-650 nm, as its source states", () => {
    const table = get("water").absorptionTable!;
    expect(table.every((p) => p.alphaPerM > 0)).toBe(true);
    expect(table[0].wavelengthNm).toBe(400);
    expect(table[table.length - 1].wavelengthNm).toBe(650);
  });
});
