/**
 * @license
 * SPDX-License-Identifier: MIT
 */

// Headless runner (plan T6.3). Usage: node dist-cli/cli.mjs config.json > result.json
// Build with `npm run cli:build`. This file is a thin wrapper around src/core/runConfig.ts.

import { readFileSync } from "node:fs";
import { runConfig, validateRunConfig } from "./core/runConfig";

const path = process.argv[2];
if (!path) {
  process.stderr.write("usage: celeritas-cli <config.json>\n");
  process.exit(2);
}
let input: unknown;
try {
  input = JSON.parse(readFileSync(path, "utf8"));
} catch (err) {
  process.stderr.write(`cannot read ${path}: ${(err as Error).message}\n`);
  process.exit(2);
}
const problems = validateRunConfig(input);
if (problems.length > 0) {
  for (const p of problems) process.stderr.write(`${p.field}: ${p.message}\n`);
  process.exit(1);
}
process.stdout.write(JSON.stringify(runConfig(input), null, 2) + "\n");
