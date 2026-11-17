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
