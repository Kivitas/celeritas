/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React from "react";
import { SimulationParams, SimulationSummary, MaterialPreset } from "../types";
import { ISOTOPE_PRESETS } from "../data/presets";
import { Atom, Zap, Radio, Flame, Sun, Waves, CircleDot, Bomb, Sparkles, Activity } from "lucide-react";
import {
  calculateEffectiveAttenuation,
  getMediumCoefficients,
  larmorRadiusM,
  momentumMeV,
  synchrotronCriticalEnergyKeV, resolveParticleMassMeV } from "../core/physics";

interface PhysicsDetailsPanelProps {
  params: SimulationParams;
  summary: SimulationSummary;
  isDarkMode: boolean;
  activeMaterialPreset: MaterialPreset;
}

export default function PhysicsDetailsPanel({ params, summary, isDarkMode, activeMaterialPreset }: PhysicsDetailsPanelProps) {
  const allActive = Object.values(params.componentsActive).every(v => v === true);
  
  if (!allActive) {
    return (
      <div className={`border rounded-xl p-6 ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Activity className={`w-5 h-5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
          <h3 className={`text-xs font-extrabold tracking-wider uppercase ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
            Physics Components Analysis
          </h3>
        </div>
        <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
          Enable all physics components to view detailed interaction analysis and radiation process distances.
        </p>
        <div className="mt-4 space-y-2">
          {Object.entries(params.componentsActive).map(([key, active]) => (
            <div key={key} className="flex items-center justify-between">
              <span className={`text-[10px] ${active ? (isDarkMode ? "text-emerald-400" : "text-emerald-600") : (isDarkMode ? "text-slate-600" : "text-slate-400")}`}>
                {key.replace(/([A-Z])/g, " $1").trim()}
              </span>
              <span className={`text-[9px] font-mono ${active ? "text-emerald-500" : "text-slate-500"}`}>
                {active ? "✓ ACTIVE" : "○ DISABLED"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cardBg = isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200";
  const textTitle = isDarkMode ? "text-slate-100" : "text-slate-800";
  const textLabel = isDarkMode ? "text-slate-400" : "text-slate-500";

  // Real formulas for the synchrotron, radius and attenuation values
  const hasField = params.magneticFieldT > 0;
  const particleMassMeV = resolveParticleMassMeV(params, ISOTOPE_PRESETS.find((p) => p.id === params.isotopeId));
  const radiusText = hasField
    ? `${larmorRadiusM(momentumMeV(params.beamEnergyMeV, particleMassMeV), params.magneticFieldT).toPrecision(4)} m`
    : "n/a";
  const criticalEnergyText = hasField
    ? `${synchrotronCriticalEnergyKeV(params.beamEnergyMeV / 1000, params.magneticFieldT).toFixed(2)} keV`
    : "n/a";
  const { mu_a, mu_s } = getMediumCoefficients(500, activeMaterialPreset.id);
  const muEffPerMm = calculateEffectiveAttenuation(mu_a, mu_s, activeMaterialPreset.anisotropyG);
  const attenuationLengthText = !Number.isFinite(muEffPerMm)
    ? "n/a"
    : muEffPerMm <= 0
      ? "infinite"
      : `${(10 / muEffPerMm).toFixed(1)} cm`;

  return (
    <div className={`border rounded-xl p-6 shadow-lg ${cardBg}`}>
      <div className="flex items-center space-x-2 mb-4 border-b border-slate-800/50 pb-3">
        <Atom className="w-5 h-5 text-orange-500" />
        <h3 className={`text-xs font-extrabold tracking-wider uppercase ${textTitle}`}>
          Physics details
        </h3>
      </div>

      <div className="space-y-4">
        {/* Primary Cherenkov */}
        <div className={`p-3 rounded-lg border ${isDarkMode ? "bg-blue-950/20 border-blue-800/30" : "bg-blue-50 border-blue-200"}`}>
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <h4 className={`text-[10px] font-bold uppercase tracking-wider ${textTitle}`}>
              Primary Cherenkov Radiation
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div>
              <span className={`block ${textLabel}`}>Emission Distance</span>
              <span className={`font-bold ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                {params.trackLengthMm} mm
              </span>
            </div>
            <div>
              <span className={`block ${textLabel}`}>Cone Angle (θc)</span>
              <span className={`font-bold ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                {summary.cherenkovAngleDeg.toFixed(2)}°
              </span>
            </div>
            <div>
              <span className={`block ${textLabel}`}>Photons / particle</span>
              <span className={`font-bold ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                {summary.photonsPerParticle.toLocaleString()}
              </span>
            </div>
            <div>
              <span className={`block ${textLabel}`}>Threshold β</span>
              <span className={`font-bold ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                {summary.betaThreshold.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* Channels not modelled here (secondary, bremsstrahlung, fluorescence, Rayleigh, Compton,
            photoelectric, transition radiation, synchrotron) were removed from this panel. */}

        {/* Summary Statistics */}
        <div className={`mt-4 p-3 rounded-lg border ${isDarkMode ? "bg-slate-950/50 border-slate-700" : "bg-slate-100 border-slate-300"}`}>
          <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${textTitle}`}>
            Integrated System Performance
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className={`text-[8px] uppercase ${textLabel}`}>Total Processes</div>
              <div className={`text-sm font-bold font-mono ${isDarkMode ? "text-orange-400" : "text-orange-600"}`}>
                {Object.values(params.componentsActive).filter(Boolean).length}
              </div>
            </div>
            <div>
              <div className={`text-[8px] uppercase ${textLabel}`}>SNR Level</div>
              <div className={`text-sm font-bold font-mono ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                {summary.signalToNoiseRatioDb.toFixed(1)} dB
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}