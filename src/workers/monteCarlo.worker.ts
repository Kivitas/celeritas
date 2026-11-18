/**
 * @license
 * SPDX-License-Identifier: MIT
 */

// Web Worker wrapper for the Monte Carlo run, so a long run does not block the interface (plan T4.1).
// Receives an McRequest, posts back { ok: true, response } or { ok: false, error }.

import { runMonteCarloRequest, type McRequest } from "../core/monteCarloRequest";

self.onmessage = (event: MessageEvent<McRequest>) => {
  try {
    const response = runMonteCarloRequest(event.data);
    self.postMessage({ ok: true, response });
  } catch (err) {
    self.postMessage({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
