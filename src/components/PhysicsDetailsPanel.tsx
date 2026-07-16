/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { SimulationParams, SimulationSummary, MaterialPreset } from "../types";
import { Atom, Zap, Radio, Flame, Sun, Waves, CircleDot, Bomb, Sparkles, Activity } from "lucide-react";

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

  return (
    <div className={`border rounded-xl p-6 shadow-lg ${cardBg}`}>
      <div className="flex items-center space-x-2 mb-4 border-b border-slate-800/50 pb-3">
        <Atom className="w-5 h-5 text-orange-500" />
        <h3 className={`text-xs font-extrabold tracking-wider uppercase ${textTitle}`}>
          Complete Physics Interaction Analysis
        </h3>
        <span className="ml-auto px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          ALL SYSTEMS ACTIVE
        </span>
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
              <span className={`block ${textLabel}`}>Photon Yield</span>
              <span className={`font-bold ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                {summary.totalPhotonsEmitted.toLocaleString()} /cm
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

        {/* Secondary Cherenkov */}
        <div className={`p-3 rounded-lg border ${isDarkMode ? "bg-cyan-950/20 border-cyan-800/30" : "bg-cyan-50 border-cyan-200"}`}>
          <div className="flex items-center space-x-2 mb-2">
            <Radio className="w-4 h-4 text-cyan-500" />
            <h4 className={`text-[10px] font-bold uppercase tracking-wider ${textTitle}`}>
              Secondary Cherenkov (Scattered)
            </h4>
          </div>
          <p className={`text-[9px] leading-relaxed ${textLabel}`}>
            Generated by Compton-scattered electrons from primary γ-ray interactions. Occurs at distances of{" "}
            <span className={`font-bold ${isDarkMode ? "text-cyan-400" : "text-cyan-600"}`}>
              {(params.radiatorThicknessMm * 0.3).toFixed(1)}-{(params.radiatorThicknessMm * 0.7).toFixed(1)} mm
            </span>{" "}
            into the radiator medium. Reduced intensity due to energy degradation of secondary electrons.
          </p>
        </div>

        {/* Bremsstrahlung */}
        <div className={`p-3 rounded-lg border ${isDarkMode ? "bg-red-950/20 border-red-800/30" : "bg-red-50 border-red-200"}`}>
          <div className="flex items-center space-x-2 mb-2">
            <Flame className="w-4 h-4 text-red-500" />
            <h4 className={`text-[10px] font-bold uppercase tracking-wider ${textTitle}`}>
              Bremsstrahlung (Braking Radiation)
            </h4>
          </div>
          <p className={`text-[9px] leading-relaxed ${textLabel}`}>
            Occurs when charged particles decelerate in the Coulomb field of atomic nuclei. Dominant at:
          </p>
          <ul className={`mt-1 space-y-1 text-[9px] ${textLabel}`}>
            <li>• <span className={`font-bold ${isDarkMode ? "text-red-400" : "text-red-600"}`}>High-Z materials</span> (Pb, W) - scales as Z²</li>
            <li>• <span className={`font-bold ${isDarkMode ? "text-red-400" : "text-red-600"}`}>Initial entry point</span> - first {(params.radiatorThicknessMm * 0.1).toFixed(1)} mm</li>
            <li>• <span className={`font-bold ${isDarkMode ? "text-red-400" : "text-red-600"}`}>Critical energy</span> ~{(params.beamEnergyMeV * 0.15).toFixed(2)} MeV for this radiator</li>
          </ul>
        </div>

        {/* Fluorescence */}
        <div className={`p-3 rounded-lg border ${isDarkMode ? "bg-purple-950/20 border-purple-800/30" : "bg-purple-50 border-purple-200"}`}>
          <div className="flex items-center space-x-2 mb-2">
            <Sun className="w-4 h-4 text-purple-500" />
            <h4 className={`text-[10px] font-bold uppercase tracking-wider ${textTitle}`}>
              Scintillation Fluorescence
            </h4>
          </div>
          <p className={`text-[9px] leading-relaxed ${textLabel}`}>
            De-excitation of excited molecular/atomic states. Emission occurs at:
          </p>
          <ul className={`mt-1 space-y-1 text-[9px] ${textLabel}`}>
            <li>• <span className={`font-bold ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>Peak wavelength</span> ~{params.nanoparticlePeakNm} nm (if dopants active)</li>
            <li>• <span className={`font-bold ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>Decay time</span> ~{(params.radiatorThicknessMm * 0.05).toFixed(1)}-{(params.radiatorThicknessMm * 0.2).toFixed(1)} ns</li>
            <li>• <span className={`font-bold ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>Light yield</span> proportional to deposited energy dE/dx</li>
          </ul>
        </div>

        {/* Rayleigh Scattering */}
        <div className={`p-3 rounded-lg border ${isDarkMode ? "bg-teal-950/20 border-teal-800/30" : "bg-teal-50 border-teal-200"}`}>
          <div className="flex items-center space-x-2 mb-2">
            <Waves className="w-4 h-4 text-teal-500" />
            <h4 className={`text-[10px] font-bold uppercase tracking-wider ${textTitle}`}>
              Optical Rayleigh Scattering
            </h4>
          </div>
          <p className={`text-[9px] leading-relaxed ${textLabel}`}>
            Elastic scattering by particles much smaller than wavelength. Significant in:
          </p>
          <ul className={`mt-1 space-y-1 text-[9px] ${textLabel}`}>
            <li>• <span className={`font-bold ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}>UV range</span> (300-400 nm) - scattering enhanced 10-100x</li>
            <li>• <span className={`font-bold ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}>Colloidal media</span> - depends on particle size distribution</li>
            <li>• <span className={`font-bold ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}>Attenuation length</span> ~{(100 / (params.radiatorThicknessMm + 1)).toFixed(1)} cm</li>
          </ul>
        </div>

        {/* Compton Scattering */}
        <div className={`p-3 rounded-lg border ${isDarkMode ? "bg-amber-950/20 border-amber-800/30" : "bg-amber-50 border-amber-200"}`}>
          <div className="flex items-center space-x-2 mb-2">
            <CircleDot className="w-4 h-4 text-amber-500" />
            <h4 className={`text-[10px] font-bold uppercase tracking-wider ${textTitle}`}>
              Compton Scattering
            </h4>
          </div>
          <p className={`text-[9px] leading-relaxed ${textLabel}`}>
            Inelastic scattering of photons by quasi-free electrons. Klein-Nishina cross-section dominates at:
          </p>
          <ul className={`mt-1 space-y-1 text-[9px] ${textLabel}`}>
            <li>• <span className={`font-bold ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>Photon energies</span> greater than {(params.beamEnergyMeV * 0.1).toFixed(2)} MeV</li>
            <li>• <span className={`font-bold ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>Scattering angle</span> maximum at 90° in lab frame</li>
            <li>• <span className={`font-bold ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>Energy transfer</span> ΔE/E ~{(1 - Math.cos(90 * Math.PI / 180)).toFixed(3)} at 90°</li>
          </ul>
        </div>

        {/* Photoelectric Effect */}
        <div className={`p-3 rounded-lg border ${isDarkMode ? "bg-indigo-950/20 border-indigo-800/30" : "bg-indigo-50 border-indigo-200"}`}>
          <div className="flex items-center space-x-2 mb-2">
            <Bomb className="w-4 h-4 text-indigo-500" />
            <h4 className={`text-[10px] font-bold uppercase tracking-wider ${textTitle}`}>
              Photoelectric Ionization
            </h4>
          </div>
          <p className={`text-[9px] leading-relaxed ${textLabel}`}>
            Complete photon absorption with electron ejection. Dominant at:
          </p>
          <ul className={`mt-1 space-y-1 text-[9px] ${textLabel}`}>
            <li>• <span className={`font-bold ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}>Low energies</span> {(params.beamEnergyMeV * 0.05).toFixed(2)} MeV</li>
            <li>• <span className={`font-bold ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}>High-Z media</span> - cross-section proportional to Z^4-5</li>
            <li>• <span className={`font-bold ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}>Edge energies</span> K-shell binding ~{(activeMaterialPreset.refractiveIndexStatic * 10).toFixed(1)} keV</li>
          </ul>
        </div>

        {/* Transition Radiation */}
        <div className={`p-3 rounded-lg border ${isDarkMode ? "bg-pink-950/20 border-pink-800/30" : "bg-pink-50 border-pink-200"}`}>
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="w-4 h-4 text-pink-500" />
            <h4 className={`text-[10px] font-bold uppercase tracking-wider ${textTitle}`}>
              Transition Radiation (TR)
            </h4>
          </div>
          <p className={`text-[9px] leading-relaxed ${textLabel}`}>
            X-ray emission at dielectric boundaries when Lorentz factor gamma much greater than 1. Observable at:
          </p>
          <ul className={`mt-1 space-y-1 text-[9px] ${textLabel}`}>
            <li>• <span className={`font-bold ${isDarkMode ? "text-pink-400" : "text-pink-600"}`}>Lorentz factor</span> γ = {(1 + params.beamEnergyMeV / 0.511).toFixed(1)} (relativistic)</li>
            <li>• <span className={`font-bold ${isDarkMode ? "text-pink-400" : "text-pink-600"}`}>Photon energy</span> ~{(params.beamEnergyMeV * 0.01).toFixed(2)} MeV in X-ray band</li>
            <li>• <span className={`font-bold ${isDarkMode ? "text-pink-400" : "text-pink-600"}`}>Angular spread</span> ~1/γ = {(1 / (1 + params.beamEnergyMeV / 0.511)).toFixed(4)} rad</li>
          </ul>
        </div>

        {/* Synchrotron Radiation */}
        {params.magneticFieldTesla > 0 && (
          <div className={`p-3 rounded-lg border ${isDarkMode ? "bg-violet-950/20 border-violet-800/30" : "bg-violet-50 border-violet-200"}`}>
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-violet-500" />
              <h4 className={`text-[10px] font-bold uppercase tracking-wider ${textTitle}`}>
                Synchrotron Radiation
              </h4>
            </div>
            <p className={`text-[9px] leading-relaxed ${textLabel}`}>
              Curvature radiation in magnetic field B = {params.magneticFieldTesla} T:
            </p>
            <ul className={`mt-1 space-y-1 text-[9px] ${textLabel}`}>
              <li>• <span className={`font-bold ${isDarkMode ? "text-violet-400" : "text-violet-600"}`}>Critical energy</span> ~{(params.magneticFieldTesla * params.beamEnergyMeV * 0.001).toFixed(2)} keV</li>
              <li>• <span className={`font-bold ${isDarkMode ? "text-violet-400" : "text-violet-600"}`}>Radius of curvature</span> ρ = {(params.beamEnergyMeV / (0.3 * params.magneticFieldTesla)).toFixed(2)} m</li>
              <li>• <span className={`font-bold ${isDarkMode ? "text-violet-400" : "text-violet-600"}`}>Power loss</span> P proportional to gamma^4/rho^2</li>
            </ul>
          </div>
        )}

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
            <div>
              <div className={`text-[8px] uppercase ${textLabel}`}>Radiation Class</div>
              <div className={`text-sm font-bold font-mono ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                {summary.radSafetyClassification.split(' ')[0]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}