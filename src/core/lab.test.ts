/**
 * @license
 * SPDX-License-Identifier: MIT
 */
import { describe, it, expect } from "vitest";
import { buildLabModel } from "./lab";

describe("lab model", () => {
  it("emits nothing below threshold", () => {
    const m = buildLabModel(0, 1.46, 15, 10, false, 100, 1);
    expect(m.rays).toHaveLength(0);
  });
  it("rays leave the emission point at the Cherenkov angle", () => {
    const m = buildLabModel(46.8, 1.46, 15, 10, true, 50, 7);
    for (const r of m.rays) {
      const [a, b] = [r.points[0], r.points[1]];
      const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const len = Math.hypot(d[0], d[1], d[2]);
      expect((Math.acos(d[2] / len) * 180) / Math.PI).toBeCloseTo(46.8, 6);
    }
  });
  it("traps everything at the back face when thetaC exceeds the critical angle", () => {
    // n = 1.46 gives critical angle ~43.2 deg; 46.8 deg is above it
    const m = buildLabModel(46.8, 1.46, 15, 10, true, 200, 3);
    expect(m.trappedAtBackFace).toBe(true);
    expect(m.detectorFraction).toBe(0);
  });
  it("lets forward rays out of the back face for a small angle", () => {
    const m = buildLabModel(20, 1.46, 15, 10, true, 200, 3);
    expect(m.trappedAtBackFace).toBe(false);
    expect(m.detectorFraction).toBeGreaterThan(0.5);
  });
  it("is deterministic for a seed", () => {
    expect(buildLabModel(30, 1.4, 15, 10, true, 20, 5)).toEqual(buildLabModel(30, 1.4, 15, 10, true, 20, 5));
  });
});
