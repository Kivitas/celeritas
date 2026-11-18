/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useMemo } from "react";
import { SimulationParams, SimulationSummary } from "../types";
import { ShieldCheck } from "lucide-react";
import { evaluateReferences, REFERENCE_RETRIEVED } from "../core/referenceChecks";

interface ValidationTabProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  summary: SimulationSummary;
  isDarkMode: boolean;
}

const STATUS_STYLE: Record<string, string> = {
  pass: "bg-emerald-950/30 text-emerald-400 border-emerald-500/20",
  FAIL: "bg-red-950/30 text-red-400 border-red-500/20",
  "known limitation": "bg-amber-950/30 text-amber-300 border-amber-500/20",
  "not automated": "bg-slate-800 text-slate-300 border-slate-600",
};

// Shows the reference records in src/data/references.json, evaluated by the same code as the test suite
// (plan T5.3). Each row names its source. Known limitations are shown as such, not as passes.
export default function ValidationTab({ summary, isDarkMode }: ValidationTabProps) {
  const rows = useMemo(() => evaluateReferences(), []);
  const counts = rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});
  const cardBg = isDarkMode ? "bg-slate-900/90 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800";

  return (
    <div className="space-y-6" id="validation-tab">
      <div className={`border rounded-xl p-5 shadow-lg ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100/10 pb-3 mb-4 gap-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="text-emerald-400 w-5 h-5" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">External reference checks</h3>
          </div>
          <span className="text-[10px] font-mono opacity-80">
            {counts.pass ?? 0} pass · {counts["known limitation"] ?? 0} known limitation · {counts.FAIL ?? 0} fail · {counts["not automated"] ?? 0} not automated
          </span>
        </div>
        <p className="text-xs opacity-70 mb-4 font-sans leading-relaxed">
          Each reference has a named source (retrieved {REFERENCE_RETRIEVED}). The same records are checked by the test suite.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="text-left text-[9px] uppercase tracking-wider opacity-70">
                <th className="py-2 pr-3">Quantity</th>
                <th className="py-2 pr-3">Reference</th>
                <th className="py-2 pr-3">Computed</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-700/40 align-top">
                  <td className="py-2 pr-3 font-sans">{r.quantity}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{r.reference} {r.units}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{r.computed === null ? "—" : `${r.computed.toPrecision(6)} ${r.units}`}</td>
                  <td className="py-2 pr-3">
                    <span className={`px-2 py-0.5 border text-[10px] rounded-md font-bold whitespace-nowrap ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="py-2 font-sans opacity-80">{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`border rounded-xl p-4 shadow-lg ${cardBg}`}>
        <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-3">Current run (not a validation check)</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div><span className="block text-[9px] text-slate-500 uppercase font-sans">Beta</span><span className="font-bold">{summary.beta.toFixed(5)}</span></div>
          <div><span className="block text-[9px] text-slate-500 uppercase font-sans">Cherenkov angle</span><span className="font-bold">{summary.cherenkovAngleDeg.toFixed(2)} deg</span></div>
          <div><span className="block text-[9px] text-slate-500 uppercase font-sans">Threshold energy</span><span className="font-bold">{summary.cherenkovThresholdEnergyMeV.toFixed(4)} MeV</span></div>
        </div>
      </div>
    </div>
  );
}
