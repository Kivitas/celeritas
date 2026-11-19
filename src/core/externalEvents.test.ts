/**
 * @license
 * SPDX-License-Identifier: MIT
 */
import { describe, it, expect } from "vitest";
import { parseExternalEvents } from "./externalEvents";

describe("external event parser", () => {
  it("groups particles by event", () => {
    const r = parseExternalEvents("# c\nevent,pdgId,kineticMeV,xMm\n1,11,2.5,1\n1,-211,300,2\n2,13,50,0\n");
    expect(r.events).toHaveLength(2);
    expect(r.events[0]).toHaveLength(2);
    expect(r.rows).toBe(3);
  });
  it("rejects bad input", () => {
    expect(() => parseExternalEvents("a,b\n1,2")).toThrow(/Header/);
    expect(() => parseExternalEvents("event,pdgId,kineticMeV,xMm\n1,99999,2,1")).toThrow(/PDG/);
    expect(() => parseExternalEvents("event,pdgId,kineticMeV,xMm\n1,11,-2,1")).toThrow(/kinetic/);
  });
});
