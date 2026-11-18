/**
 * @license
 * SPDX-License-Identifier: MIT
 */

// Validation against external references (plan Phase 5). The records and the evaluation live in
// src/data/references.json and src/core/referenceChecks.ts, which the in-app Validation tab also uses.
// "status": "known-limitation" documents a target the model does not meet; its assertion is that the
// deviation stays bounded, so the model cannot drift further unnoticed.

import { describe, it, expect, afterAll } from "vitest";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { evaluateReferences, REFERENCE_RECORDS, REFERENCE_RETRIEVED, type ReferenceRow } from "../src/core/referenceChecks";

const rows: ReferenceRow[] = evaluateReferences();

describe("validation records", () => {
  for (const row of rows) {
    if (row.status === "not automated") {
      it.skip(`${row.id}: ${row.quantity} (not automated)`, () => {});
      continue;
    }
    it(`${row.id}: ${row.quantity}`, () => {
      const dev = Math.abs((row.computed as number) - row.reference);
      if (row.status === "known limitation") {
        expect(dev / Math.abs(row.reference)).toBeLessThan(0.2);
      } else {
        expect(dev, `${row.id}: computed ${row.computed} vs reference ${row.reference} (tolerance ${row.tolerance})`).toBeLessThanOrEqual(row.tolerance);
      }
    });
  }
});

afterAll(() => {
  if (process.env.VALIDATE_REPORT !== "1") return;
  const header = [
    "# Validation report",
    "",
    `Generated from src/data/references.json (retrieved ${REFERENCE_RETRIEVED}). Regenerate with \`npm run validate\`.`,
    `${REFERENCE_RECORDS.length} records.`,
    "",
    "| id | quantity | reference | computed | status | source |",
    "|---|---|---|---|---|---|",
  ];
  const body = rows.map((r) =>
    `| ${r.id} | ${r.quantity} | ${r.reference} ${r.units} | ${r.computed === null ? "-" : r.computed.toPrecision(6)} | ${r.status} | ${r.source} |`
  );
  writeFileSync(resolve(__dirname, "report.md"), header.concat(body).join("\n") + "\n");
});
