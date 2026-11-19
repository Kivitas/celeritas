/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useRef, useState } from "react";
import { Dices, Play, Shuffle, Square } from "lucide-react";
import type { SimulationParams, MaterialPreset, IsotopeProfile, DetectorSettings } from "../types";
import { startMonteCarlo, type McHandle } from "../services/monteCarloClient";
import { MC_DEFAULT_OPTIONS, type McOptions, type ExternalParticle } from "../core/monteCarlo";
import { parseExternalEvents } from "../core/externalEvents";
import { DECAY_LENGTH_M } from "../data/particles";
import { validateMcRequest, MC_LIMITS, type McResponse } from "../core/monteCarloRequest";

interface Props {
  params: SimulationParams;
  material: MaterialPreset;
  isotope: IsotopeProfile | undefined;
  detector: DetectorSettings;
  isDarkMode: boolean;
}

// Runs the photon-level Monte Carlo in a worker and compares it with the analytic engine (plan T4.1, T4.2).
// Settings are the inputs of the current configuration, so the run always matches what is on screen.
export default function MonteCarloPanel({ params, material, isotope, detector, isDarkMode }: Props) {
  const [primaries, setPrimaries] = useState<number>(4000);
  const [seed, setSeed] = useState<number>(12345);
  const [options, setOptions] = useState<McOptions>(MC_DEFAULT_OPTIONS);
  const [external, setExternal] = useState<{ name: string; events: ExternalParticle[][]; rows: number } | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<McResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handle = useRef<McHandle | null>(null);

  // A run belongs to the configuration it started with. Changing the configuration clears it.
  const configKey = JSON.stringify([params, material.id, isotope?.id, detector, options, external?.name, external?.rows]);
  const lastKey = useRef(configKey);
  useEffect(() => {
    if (lastKey.current !== configKey) {
      lastKey.current = configKey;
      setResult(null);
      setError(null);
    }
  }, [configKey]);

  useEffect(() => () => handle.current?.cancel(), []);

  const run = () => {
    const problem = validateMcRequest({ primaries, seed });
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setResult(null);
    setRunning(true);
    const h = startMonteCarlo({ params, material, isotope, detector, primaries, seed, options: { ...options, externalEvents: external?.events } });
    handle.current = h;
    h.promise
      .then((r) => setResult(r))
      .catch((err: Error) => {
        if (err.message !== "cancelled") setError(err.message);
      })
      .finally(() => {
        setRunning(false);
        handle.current = null;
      });
  };

  const importEvents = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = parseExternalEvents(await file.text());
      setExternal({ name: file.name, events: parsed.events, rows: parsed.rows });
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const downloadTemplate = () => {
    const csv = "# Charged secondaries from PYTHIA 8, HERWIG, Geant4 or any other code. Depth is from the radiator entrance face.\nevent,pdgId,kineticMeV,xMm\n1,11,2.5,1.0\n1,11,0.8,3.2\n2,-211,300,0.0\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "external-events-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const cancel = () => {
    handle.current?.cancel();
    setRunning(false);
    handle.current = null;
    setError("Cancelled.");
  };

  const card = isDarkMode ? "bg-slate-900/90 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800";
  const label = isDarkMode ? "text-slate-400" : "text-slate-500";
  const input = isDarkMode ? "bg-slate-950/80 text-slate-100 border-white/10" : "bg-white text-slate-800 border-slate-200";
  const unavailable = (key: keyof McOptions) =>
    ((key === "energyLoss" || key === "deltaRays") && !material.stopping) || (key === "decayInFlight" && !DECAY_LENGTH_M[isotope?.pdgId ?? 0]);
  const agree = result ? Math.abs(result.zScore) < 3 : false;

  return (
    <div className={`border rounded-xl p-5 space-y-4 ${card}`} id="monte-carlo-panel">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
        <Dices className="w-4 h-4" /> Monte Carlo (photon-level, seeded)
      </div>
      <p className={`text-[11px] leading-relaxed ${label}`}>
        Samples each photon along the track and compares the mean with the analytic engine, which gets the same switches. Same seed
        and settings give the same result. Not modelled: scattering and exit-face optics. The difference test compares the primary alone with the analytic engine;
        delta rays, decay electrons and imported secondaries are extra.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`text-[9px] uppercase font-bold block mb-1 ${label}`}>Primaries ({MC_LIMITS.minPrimaries}–{MC_LIMITS.maxPrimaries.toLocaleString()})</label>
          <input type="number" value={primaries} min={MC_LIMITS.minPrimaries} max={MC_LIMITS.maxPrimaries} step={500} disabled={running}
            onChange={(e) => setPrimaries(Math.round(Number(e.target.value)))}
            className={`w-full rounded-lg border px-2 py-1.5 text-xs font-mono ${input}`} />
        </div>
        <div>
          <label className={`text-[9px] uppercase font-bold block mb-1 ${label}`}>Seed</label>
          <input type="number" value={seed} min={0} step={1} disabled={running}
            onChange={(e) => setSeed(Math.round(Number(e.target.value)))}
            className={`w-full rounded-lg border px-2 py-1.5 text-xs font-mono ${input}`} />
        </div>
      </div>
      <div>
        <span className={`text-[9px] uppercase font-bold block mb-1 ${label}`}>Quick sizes</span>
        <div className="flex flex-wrap gap-1.5">
          {[1000, 4000, 20000, 100000, 200000].map((n) => (
            <button key={n} type="button" disabled={running} onClick={() => setPrimaries(n)}
              className={`px-2 py-1 rounded-md border text-[10px] font-mono ${primaries === n ? "border-orange-500 text-orange-400" : input}`}>
              {n.toLocaleString()}
            </button>
          ))}
          <button type="button" disabled={running} onClick={() => setSeed(Math.floor(Math.random() * 0xffffffff))}
            className={`px-2 py-1 rounded-md border text-[10px] font-mono flex items-center gap-1 ${input}`}>
            <Shuffle className="w-3 h-3" /> New seed
          </button>
        </div>
      </div>
      <fieldset className="space-y-1.5" disabled={running}>
        <legend className={`text-[9px] uppercase font-bold mb-1 ${label}`}>Physics included</legend>
        {([
          ["energyLoss", "Energy loss along the track", material.stopping ? "collision stopping power (Møller / Bethe)" : "not available: this material has no stopping data, so speed stays constant"],
          ["absorption", "Optical absorption", "Beer–Lambert from the emission point to the exit face"],
          ["detectorEfficiency", "Detector efficiency", "quantum efficiency and DAQ dead time"],
          ["deltaRays", "Delta rays (knock-on electrons)", material.stopping ? "electrons above the Cherenkov threshold, each followed with energy loss" : "not available: needs stopping data"],
          ["decayInFlight", "Decay in flight", DECAY_LENGTH_M[isotope?.pdgId ?? 0] ? "muon, pion, kaon; a muon's Michel electron is followed" : "not available: this particle is treated as stable"],
        ] as const).map(([key, name, note]) => (
          <label key={key} className="flex items-start gap-2 text-[11px] cursor-pointer">
            <input type="checkbox" className="mt-0.5 accent-orange-500" checked={options[key] && !unavailable(key)} disabled={unavailable(key)}
              onChange={(e) => setOptions((o) => ({ ...o, [key]: e.target.checked }))} />
            <span><span className="font-semibold">{name}</span> <span className={label}>· {note}</span></span>
          </label>
        ))}
      </fieldset>
      <fieldset className="space-y-2" disabled={running}>
        <legend className={`text-[9px] uppercase font-bold mb-1 ${label}`}>Event source</legend>
        <p className={`text-[11px] leading-relaxed ${label}`}>
          Built-in: the primary particle, its delta rays and its decay. PYTHIA 8, HERWIG and Geant4 cannot run inside a browser, so
          they work as external generators: run them yourself, export the charged secondaries as CSV, and import the file. Each
          primary draws one event from the file and its particles are followed through this radiator.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className={`px-2 py-1 rounded-md border text-[10px] font-mono cursor-pointer ${input}`}>
            Import events (CSV)
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { importEvents(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          <button type="button" onClick={downloadTemplate} className={`px-2 py-1 rounded-md border text-[10px] font-mono ${input}`}>Template</button>
          {external && (
            <>
              <span className="text-[11px]">{external.name}: {external.events.length} events, {external.rows} particles</span>
              <button type="button" onClick={() => setExternal(null)} className="text-[10px] text-amber-400 underline">remove</button>
            </>
          )}
        </div>
        <details className={`text-[11px] ${label}`}>
          <summary className="cursor-pointer">Not available, and why</summary>
          <ul className="list-disc pl-5 mt-1 space-y-0.5">
            <li>Hadronic showers: need sourced nuclear interaction lengths and hadron-nucleus models per material. Use Geant4 or PYTHIA 8 and import the secondaries.</li>
            <li>B-meson decays: negligible in a radiator at these energies and meaningless without a full event generator. Import the daughters from PYTHIA 8 or HERWIG.</li>
            <li>Detector subsystems (pixel and strip trackers, TPC, calorimeters, muon spectrometer): this app models one radiator block and a photodetector face, not a collider detector.</li>
          </ul>
        </details>
      </fieldset>
      <div className="flex gap-2">
        {!running ? (
          <button onClick={run} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold">
            <Play className="w-3.5 h-3.5" /> Run Monte Carlo
          </button>
        ) : (
          <button onClick={cancel} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold">
            <Square className="w-3.5 h-3.5" /> Cancel
          </button>
        )}
        {running && <span className={`text-[11px] self-center ${label}`}>Running in a worker…</span>}
      </div>
      {error && <p role="alert" className="text-[11px] text-amber-400">{error}</p>}
      {result && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs" aria-live="polite">
          <div><span className={`block text-[9px] uppercase ${label}`}>MC detected / primary</span>{result.mc.meanDetectedPerParticle.toFixed(4)} ± {result.mc.stdErrDetectedPerParticle.toFixed(4)}</div>
          <div><span className={`block text-[9px] uppercase ${label}`}>Analytic detected / primary</span>{result.analyticDetectedPerParticle.toFixed(4)}</div>
          <div><span className={`block text-[9px] uppercase ${label}`}>Difference (z)</span>{result.zScore.toFixed(2)} σ — {agree ? "consistent" : "check"}</div>
          <div><span className={`block text-[9px] uppercase ${label}`}>Run</span>{result.mc.primaries.toLocaleString()} primaries, {result.runtimeMs} ms</div>
        </div>
      )}
      {result && (
        <div>
          <div className="grid grid-cols-2 gap-3 font-mono text-xs mb-3">
            <div><span className={`block text-[9px] uppercase ${label}`}>MC emitted / primary</span>{result.mc.meanEmittedPerParticle.toFixed(3)} ± {result.mc.stdErrEmittedPerParticle.toFixed(3)}</div>
            <div><span className={`block text-[9px] uppercase ${label}`}>Seed</span>{result.mc.seed}</div>
            <div><span className={`block text-[9px] uppercase ${label}`}>Delta rays / primary</span>{result.mc.meanDeltaRaysPerParticle.toFixed(3)} (adds {result.mc.meanDeltaDetectedPerParticle.toFixed(3)} detected)</div>
            <div><span className={`block text-[9px] uppercase ${label}`}>Decayed in radiator</span>{(result.mc.decayFraction * 100).toExponential(2)} % (Michel adds {result.mc.meanDecayDetectedPerParticle.toFixed(4)})</div>
            {external && <div><span className={`block text-[9px] uppercase ${label}`}>Imported secondaries add</span>{result.mc.meanExternalDetectedPerParticle.toFixed(3)} detected / primary</div>}
          </div>
          <span className={`text-[9px] uppercase font-bold block mb-1 ${label}`}>Detected photons per primary (distribution)</span>
          <Histogram values={result.mc.detectedPerPrimary} />
        </div>
      )}
    </div>
  );
}

function Histogram({ values }: { values: number[] }) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of values) { if (v < lo) lo = v; if (v > hi) hi = v; }
  if (!values.length) return null;
  const nBins = Math.min(40, hi - lo + 1);
  const width = (hi - lo + 1) / nBins;
  const counts = new Array<number>(nBins).fill(0);
  for (const v of values) counts[Math.min(nBins - 1, Math.floor((v - lo) / width))]++;
  const max = Math.max(1, ...counts);
  const W = 400;
  const H = 70;
  const bw = W / nBins;
  return (
    <svg viewBox={`0 0 ${W} ${H + 14}`} className="w-full max-h-40" role="img" aria-label="Histogram of detected photons per primary">
      {counts.map((c, k) => (
        <rect key={k} x={k * bw + 0.5} y={H - (c / max) * H} width={Math.max(1, bw - 1)} height={(c / max) * H} fill="#f97316" opacity={0.85} />
      ))}
      <text x={0} y={H + 11} fontSize={9} fill="#94a3b8">{lo}</text>
      <text x={W} y={H + 11} fontSize={9} fill="#94a3b8" textAnchor="end">{hi}</text>
    </svg>
  );
}
