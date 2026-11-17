/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import { BEAMLINE_PRESETS } from "./beamlinePresets";
import { MATERIAL_PRESETS, ISOTOPE_PRESETS } from "./presets";

describe("beamline presets reference real data", () => {
  for (const preset of BEAMLINE_PRESETS) {
    it(`${preset.id} uses an existing material and isotope`, () => {
      expect(MATERIAL_PRESETS.some((m) => m.id === preset.params.materialId)).toBe(true);
      expect(ISOTOPE_PRESETS.some((i) => i.id === preset.params.isotopeId)).toBe(true);
    });
  }
});
