/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React from "react";
import { DetectorSettings, SimulationParams, SimulationSummary } from "../types";

interface LabTabProps {
  params: SimulationParams;
  detector: DetectorSettings;
  summary: SimulationSummary;
  isDarkMode: boolean;
}

// Geometry illustration only. Positions are scaled to fit the drawing; nothing here is a simulated
// trajectory. The cone opening angle is the computed mean Cherenkov angle.
export default function LabTab({ params, detector, summary, isDarkMode }: LabTabProps) {
  const W = 640;
  const H = 360;
  const boxX = 180;
  const boxY = 90;
  const boxW = 280;
  const boxH = 180;
  const apexX = boxX + boxW * 0.5;
  const apexY = boxY + 20;
  const angleRad = (summary.cherenkovAngleDeg * Math.PI) / 180;
  const coneLen = 200;
  const stroke = isDarkMode ? "#94a3b8" : "#475569";
  const label = isDarkMode ? "#cbd5e1" : "#334155";

  const radiatorMm = params.radiatorThicknessMm;
  const trackMm = params.trackLengthMm;
  const emissionMm = Math.min(trackMm, radiatorMm);

  return (
    <div className={`border rounded-xl p-5 shadow-lg ${isDarkMode ? "bg-slate-900/90 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`} id="lab-tab">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider">Geometry illustration</h2>
        <span className="text-[10px] font-mono uppercase opacity-70">Illustration, not simulation output</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Radiator geometry with Cherenkov cone">
        {/* Beam axis */}
        <line x1={20} y1={apexY} x2={apexX} y2={apexY} stroke="#f97316" strokeWidth={2} markerEnd="url(#arrow)" />
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#f97316" />
          </marker>
        </defs>
        <text x={20} y={apexY - 8} fill={label} fontSize={11}>beam</text>

        {/* Radiator block */}
        <rect x={boxX} y={boxY} width={boxW} height={boxH} fill={isDarkMode ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.08)"} stroke="#3b82f6" strokeWidth={2} />
        <text x={boxX + 8} y={boxY + boxH - 8} fill={label} fontSize={11}>
          radiator {radiatorMm} mm, emission length {emissionMm} mm
        </text>

        {/* Cherenkov cone, computed opening angle, drawn from the entry point */}
        {summary.isCherenkovGenerated && (
          <>
            <line x1={apexX} y1={apexY} x2={apexX - coneLen * Math.sin(angleRad)} y2={apexY + coneLen * Math.cos(angleRad)} stroke="#22d3ee" strokeWidth={2} />
            <line x1={apexX} y1={apexY} x2={apexX + coneLen * Math.sin(angleRad)} y2={apexY + coneLen * Math.cos(angleRad)} stroke="#22d3ee" strokeWidth={2} />
            <text x={apexX + 6} y={apexY + 40} fill={label} fontSize={11}>θc = {summary.cherenkovAngleDeg.toFixed(2)}°</text>
          </>
        )}
        {!summary.isCherenkovGenerated && (
          <text x={boxX + 8} y={boxY - 8} fill="#f59e0b" fontSize={11}>below Cherenkov threshold: no cone</text>
        )}
        <circle cx={apexX} cy={apexY} r={3} fill="#f97316" />
      </svg>

      <p className="text-[10px] opacity-70 mt-3 font-sans leading-relaxed">
        Track length and radiator thickness set the drawn emission length; the cone shows the computed mean angle. Particle
        paths, scattering and detector hits are not drawn because they are not simulated.
      </p>
      <p className="text-[10px] opacity-50 mt-1 font-mono">Detector: QE {detector.quantumEfficiencyPct}%</p>
    </div>
  );
}
