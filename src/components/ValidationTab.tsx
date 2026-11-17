/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React from "react";
import { SimulationParams, SimulationSummary } from "../types";
import { ShieldCheck } from "lucide-react";
import {
  calculateRelativisticBeta,
  cherenkovAngleDeg,
  getCherenkovThresholdEnergy,
  getRefractiveIndexAt,
  ELECTRON_MASS_MEV,
} from "../core/physics";
import { MATERIAL_PRESETS } from "../data/presets";

interface ValidationCheck {
  name: string;
  reference: number;
  computed: number;
  tolerance: number;
  unit: string;
  decimals: number;
}

const isCheckPass = (check: ValidationCheck) => Math.abs(check.computed - check.reference) <= check.tolerance;

interface ValidationTabProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  summary: SimulationSummary;
  isDarkMode: boolean;
}

// These are ARITHMETIC CONSISTENCY checks: each reference is a number evaluated from the same
// formula the code uses. They catch coding slips. They are not external validation; that is
// planned in docs/IMPROVEMENT_PLAN.md Phase 5 against NIST, PDG and published measurements.
export default function ValidationTab({ summary, isDarkMode }: ValidationTabProps) {
  const quartzPreset = MATERIAL_PRESETS.find((m) => m.id === "quartz");
  const checks: ValidationCheck[] = [
    {
      name: "Electron Cherenkov threshold in D2O (n = 1.328)",
      reference: 0.2656,
      computed: getCherenkovThresholdEnergy(ELECTRON_MASS_MEV, 1.328),
      tolerance: 0.002,
      unit: "MeV",
      decimals: 4,
    },
    {
      name: "Cherenkov angle, lead glass (beta = 1, n = 1.673)",
      reference: 53.29,
      computed: cherenkovAngleDeg(1, 1.673),
      tolerance: 0.05,
      unit: "deg",
      decimals: 2,
    },
    {
      name: "Cherenkov angle, water (beta = 1, n = 1.333)",
      reference: 41.39,
      computed: cherenkovAngleDeg(1, 1.333),
      tolerance: 0.1,
      unit: "deg",
      decimals: 2,
    },
    {
      name: "Fused silica refractive index at 500 nm (293.15 K)",
      reference: 1.4628,
      computed: quartzPreset ? getRefractiveIndexAt(500, quartzPreset, 293.15) : NaN,
      tolerance: 0.001,
      unit: "",
      decimals: 4,
    },
    {
      name: "Electron beta at kinetic energy 0.546 MeV",
      reference: 0.8754,
      computed: calculateRelativisticBeta(0.546, ELECTRON_MASS_MEV),
      tolerance: 0.001,
      unit: "",
      decimals: 4,
    },
  ];

  const passCount = checks.filter(isCheckPass).length;
  const cardBg = isDarkMode ? "bg-slate-900/90 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800";

  return (
    <div className="space-y-6" id="validation-tab">
      <div className={`border rounded-xl p-5 shadow-lg ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100/10 pb-3 mb-4 gap-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="text-emerald-400 w-5 h-5" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Arithmetic consistency checks</h3>
          </div>
          <span className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono font-bold rounded-full uppercase tracking-wider">
            {passCount} of {checks.length} pass
          </span>
        </div>
        <p className="text-xs opacity-70 mb-4 font-sans leading-relaxed">
          Each reference is evaluated from the same formula as the code, so these detect coding errors only. They are
          <strong> not external validation</strong>. External comparison is planned (docs/IMPROVEMENT_PLAN.md, Phase 5).
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {checks.map((check) => {
            const pass = isCheckPass(check);
            return (
              <div key={check.name} className={`flex justify-between items-center border p-3 rounded-lg text-xs font-mono ${isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50/60 border-slate-200"}`}>
                <div className="space-y-0.5 max-w-[70%]">
                  <span className="text-[10px] text-slate-500 block tracking-wide font-sans">{check.name}</span>
                  <span className="font-semibold text-[11px] block">
                    Computed: {Number.isFinite(check.computed) ? check.computed.toFixed(check.decimals) : "n/a"} {check.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 border text-[10px] rounded-md font-bold ${pass ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/20" : "bg-red-950/30 text-red-400 border-red-500/20"}`}>
                    {pass ? "PASS" : "FAIL"}
                  </span>
                  <span className="block text-[9px] text-slate-500 mt-0.5 font-sans whitespace-nowrap">
                    Ref: {check.reference} {check.unit} ± {check.tolerance}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`border rounded-xl p-4 shadow-lg ${cardBg}`}>
        <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-3">Current run (not a validation check)</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div>
            <span className="block text-[9px] text-slate-500 uppercase font-sans">Beta</span>
            <span className="font-bold">{summary.beta.toFixed(5)}</span>
          </div>
          <div>
            <span className="block text-[9px] text-slate-500 uppercase font-sans">Cherenkov angle</span>
            <span className="font-bold">{summary.cherenkovAngleDeg.toFixed(2)} deg</span>
          </div>
          <div>
            <span className="block text-[9px] text-slate-500 uppercase font-sans">Threshold energy</span>
            <span className="font-bold">{summary.cherenkovThresholdEnergyMeV.toFixed(4)} MeV</span>
          </div>
        </div>
      </div>
    </div>
  );
}
