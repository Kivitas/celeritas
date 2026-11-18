/**
 * @license
 * SPDX-License-Identifier: MIT
 */

// Runs a Monte Carlo request in a Web Worker and returns a promise. Cancelling terminates the worker.
// Falls back to the main thread only where Workers are unavailable (for example some test environments).

import type { McRequest, McResponse } from "../core/monteCarloRequest";
import { runMonteCarloRequest } from "../core/monteCarloRequest";

export interface McHandle {
  promise: Promise<McResponse>;
  cancel: () => void;
}

export function startMonteCarlo(req: McRequest): McHandle {
  if (typeof Worker === "undefined") {
    return { promise: Promise.resolve().then(() => runMonteCarloRequest(req)), cancel: () => {} };
  }
  const worker = new Worker(new URL("../workers/monteCarlo.worker.ts", import.meta.url), { type: "module" });
  let cancelled = false;
  const promise = new Promise<McResponse>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<{ ok: boolean; response?: McResponse; error?: string }>) => {
      worker.terminate();
      if (event.data.ok && event.data.response) resolve(event.data.response);
      else reject(new Error(event.data.error ?? "Monte Carlo failed"));
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(cancelled ? "cancelled" : event.message || "Worker error"));
    };
  });
  worker.postMessage(req);
  return {
    promise,
    cancel: () => {
      cancelled = true;
      worker.terminate();
    },
  };
}
