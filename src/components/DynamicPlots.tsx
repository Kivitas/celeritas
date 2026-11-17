/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { SimulationResultPoint, SimulationSummary, DetectorSettings } from "../types";
import { Activity } from "lucide-react";

interface DynamicPlotsProps {
  spectra: SimulationResultPoint[];
  summary: SimulationSummary;
  detector: DetectorSettings;
  beamEnergyMeV: number;
  isDarkMode: boolean;
}

// Only plots whose every point is a field of the engine output are shown here.
// Synthetic or decorative charts were removed (docs/IMPROVEMENT_PLAN.md T1.1).
export default React.memo(function DynamicPlots({ spectra, summary, isDarkMode }: DynamicPlotsProps) {
  const tooltipStyle = {
    backgroundColor: isDarkMode ? "#090d16" : "#ffffff",
    border: `1px solid ${isDarkMode ? "#1e293b" : "#e2e8f0"}`,
    borderRadius: "8px",
    color: isDarkMode ? "#f1f5f9" : "#0f172a",
  };
  const gridStroke = isDarkMode ? "#1e293b" : "#f1f5f9";
  const panel = "w-full min-h-[320px] flex flex-col bg-slate-900/30 rounded-lg p-2 border border-slate-800/50";

  const spectraChartData = useMemo(
    () => spectra.map((p) => ({ wavelength: p.wavelengthNm, primary: p.primaryCherenkov, detected: p.totalYield, transmission: p.transmission })),
    [spectra]
  );

  return (
    <div className={`border rounded-xl p-6 shadow-sm ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`}>
      <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-3 mb-4">
        <Activity className="text-orange-500 w-5 h-5" />
        <h2 className="text-xs font-extrabold font-sans tracking-tight uppercase">Computed spectra and results</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={panel}>
          <h3 className="text-[11px] font-bold mb-2 uppercase text-slate-400 text-center tracking-widest">Frank-Tamm yield per bin (per particle)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={spectraChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
              <XAxis dataKey="wavelength" stroke="#64748b" fontSize={11} unit="nm" />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="primary" name="Emitted (before transport)" stroke="#f97316" fill="rgba(249, 115, 22, 0.25)" />
              <Area type="monotone" dataKey="detected" name="Reaching detector" stroke="#22d3ee" fill="rgba(34, 211, 238, 0.15)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={panel}>
          <h3 className="text-[11px] font-bold mb-2 uppercase text-slate-400 text-center tracking-widest">Optical transmission</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={spectraChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
              <XAxis dataKey="wavelength" stroke="#64748b" fontSize={11} unit="nm" />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 1]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="transmission" name="Transmission (0-1)" stroke="#ea580c" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-center">
        <Stat label="Cherenkov threshold" value={summary.isCherenkovGenerated ? `${summary.cherenkovThresholdEnergyMeV.toFixed(3)} MeV` : "not reached"} />
        <Stat label="Cone angle (mean)" value={summary.isCherenkovGenerated ? `${summary.cherenkovAngleDeg.toFixed(2)}°` : "—"} />
        <Stat label="Photons per particle" value={summary.photonsPerParticle.toLocaleString()} />
        <Stat label="SNR (S/√(S+B))" value={`${summary.signalToNoiseRatio.toFixed(2)}`} />
      </div>
      <p className="text-[10px] text-slate-500 mt-4">
        Analytic Frank-Tamm model with constant beta along the emission length. Energy loss is not yet modelled, so
        yields for particles that slow down in the radiator are overestimated (docs/IMPROVEMENT_PLAN.md T3.4).
      </p>
    </div>
  );
});

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] opacity-60 uppercase tracking-widest font-bold mb-1">{label}</div>
      <div className="text-sm font-bold font-mono">{value}</div>
    </div>
  );
}
