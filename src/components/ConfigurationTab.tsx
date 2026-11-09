/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SimulationParams, DetectorSettings } from "../types";
import { ISOTOPE_PRESETS, MATERIAL_PRESETS } from "../data/presets";
import { EXPERIMENT_PRESETS } from "../data/experimentPresets";
import { Settings, Cpu, Sliders, Info, Sparkles, Compass, Atom, Layers, BookOpen, Calculator, Download, Upload } from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { motion, AnimatePresence } from "motion/react";

interface ConfigurationTabProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  detector: DetectorSettings;
  setDetector: React.Dispatch<React.SetStateAction<DetectorSettings>>;
  onLoadPreset: (presetId: string) => void;
  isDarkMode: boolean;
}

export default function ConfigurationTab({
  params,
  setParams,
  detector,
  setDetector,
  onLoadPreset,
  isDarkMode,
}: ConfigurationTabProps) {

  // Relativistic particle solver local states
  const [calcMassPreset, setCalcMassPreset] = useState<string>("electron");
  const [calcMass, setCalcMass] = useState<number>(0.51099895);
  const [calcEnergy, setCalcEnergy] = useState<number>(1.2);
  const [calcRefIndex, setCalcRefIndex] = useState<number>(1.333);
  const [activeSection, setActiveSection] = useState<string>("beam");

  // Form state updaters
  const updateParam = <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const updateDetector = <K extends keyof DetectorSettings>(key: K, detectorVal: DetectorSettings[K]) => {
    setDetector((prev) => ({ ...prev, [key]: detectorVal }));
  };

  // Automatically adjust kinetic energy when preset isotope is updated
  const handleIsotopeChange = (id: string) => {
    const preset = ISOTOPE_PRESETS.find((p) => p.id === id);
    if (preset) {
      setParams((prev) => ({
        ...prev,
        isotopeId: id,
        beamEnergyMeV: preset.baseEnergyMeV,
        intensityFlux: preset.fluxIntensity,
      }));
    } else {
      updateParam("isotopeId", id);
    }
  };

  // Theme support
  const cardBg = isDarkMode ? "bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-white/5" : "bg-white border-slate-200";
  const textTitle = isDarkMode ? "text-slate-100" : "text-slate-800";
  const textLabel = isDarkMode ? "text-slate-400" : "text-slate-500";
  const textSub = isDarkMode ? "text-slate-500" : "text-slate-400";
  const inputBg = isDarkMode ? "bg-slate-950/80 text-slate-100 border-white/10" : "bg-white text-slate-800 border-slate-200";

  return (
    <div className="space-y-6" id="configuration-tab">
      <p className={`text-[10px] ${textSub}`}>Research and teaching simulator. Results are not for clinical, dosimetric, or radiation-safety decisions.</p>

      {/* Presets Panel */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-white/5 shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative p-5">
          <label className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-4">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>Quick Load: Reference Beamlines & Particle Radiators</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <button
              onClick={() => onLoadPreset("timepix3-beta")}
              className="px-3.5 py-2.5 border border-white/5 text-xs font-semibold rounded-xl transition-all cursor-pointer text-left flex items-start gap-2 bg-white/5 hover:bg-orange-500/10 hover:border-orange-500/30 text-slate-300 hover:text-orange-400"
            >
            <span className="text-sm">🛰️</span>
            <div>
              <div className="font-bold">SPS Beta Test</div>
              <div className="text-[10px] opacity-70 mt-0.5">Timepix3 Tracker</div>
            </div>
          </button>
          <button
            onClick={() => onLoadPreset("medipix-aerogel")}
            className="px-3.5 py-2.5 border border-white/5 text-xs font-semibold rounded-xl transition-all cursor-pointer text-left flex items-start gap-2 bg-white/5 hover:bg-orange-500/10 hover:border-orange-500/30 text-slate-300 hover:text-orange-400"
          >
            <span className="text-sm">🌌</span>
            <div>
              <div className="font-bold">Aerogel RICH</div>
              <div className="text-[10px] opacity-70 mt-0.5">Medipix Spectrometer</div>
            </div>
          </button>
          <button
            onClick={() => onLoadPreset("scifi-fiber")}
            className="px-3.5 py-2.5 border border-white/5 text-xs font-semibold rounded-xl transition-all cursor-pointer text-left flex items-start gap-2 bg-white/5 hover:bg-orange-500/10 hover:border-orange-500/30 text-slate-300 hover:text-orange-400"
          >
            <span className="text-sm">🧪</span>
            <div>
              <div className="font-bold">SCIFI Fiber</div>
              <div className="text-[10px] opacity-70 mt-0.5">LYSO Scintillation</div>
            </div>
          </button>
          <button
            onClick={() => onLoadPreset("Experimental-eye")}
            className="px-3.5 py-2.5 border border-white/5 text-xs font-semibold rounded-xl transition-all cursor-pointer text-left flex items-start gap-2 bg-white/5 hover:bg-orange-500/10 hover:border-orange-500/30 text-slate-300 hover:text-orange-400"
          >
            <span className="text-sm">⚛️</span>
            <div>
              <div className="font-bold">Reactor Core Model</div>
              <div className="text-[10px] opacity-70 mt-0.5">Heavy Water D2O</div>
            </div>
          </button>
          <button
            onClick={() => onLoadPreset("hpge-gamma")}
            className="px-3.5 py-2.5 border border-white/5 text-xs font-semibold rounded-xl transition-all cursor-pointer text-left flex items-start gap-2 bg-white/5 hover:bg-orange-500/10 hover:border-orange-500/30 text-slate-300 hover:text-orange-400"
          >
            <span className="text-sm">☢️</span>
            <div>
              <div className="font-bold">HPGe Gamma</div>
              <div className="text-[10px] opacity-70 mt-0.5">High-Purity Germanium</div>
            </div>
          </button>
          <button
            onClick={() => onLoadPreset("sipm-cosmic")}
            className="px-3.5 py-2.5 border border-white/5 text-xs font-semibold rounded-xl transition-all cursor-pointer text-left flex items-start gap-2 bg-white/5 hover:bg-orange-500/10 hover:border-orange-500/30 text-slate-300 hover:text-orange-400"
          >
            <span className="text-sm">🌍</span>
            <div>
              <div className="font-bold">Cosmic Muon</div>
              <div className="text-[10px] opacity-70 mt-0.5">SiPM Array</div>
            </div>
          </button>
        </div>
      </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-4 mb-4 border-b border-white/5">
        {[
          { id: "beam", label: "Beam Characteristics", icon: <Atom className="w-4 h-4" /> },
          { id: "radiator", label: "Radiator & Material", icon: <Layers className="w-4 h-4" /> },
          { id: "detector", label: "Detector & Readout", icon: <Cpu className="w-4 h-4" /> },
          { id: "toggles", label: "Optional Toggles", icon: <Sliders className="w-4 h-4" /> },
          { id: "calculator", label: "Kinematics Calculator", icon: <Calculator className="w-4 h-4" /> },
          { id: "formulas", label: "Reference Manual", icon: <BookOpen className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
              activeSection === tab.id
                ? "bg-gradient-to-r from-orange-500/20 to-orange-500/10 text-orange-400 border border-orange-500/30 shadow-md"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300 border border-transparent"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="w-full mx-auto max-w-5xl">

        {activeSection === "beam" && (
        <div className={`border p-6 md:p-8 rounded-xl shadow-sm space-y-8 ${cardBg}`}>
          <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-3">
            <Atom className="w-5 h-5 text-orange-500" />
            <h3 className={`text-xs font-extrabold tracking-wider uppercase font-sans ${textTitle}`}>
              Beam Characteristics
            </h3>
          </div>

          {/* Particle Source selection */}
          <div className="space-y-1.5">
            <label className={`block text-[10px] font-bold uppercase tracking-wider ${textLabel}`}>
              Particle Emission Source
            </label>
            <SearchableSelect
              value={params.isotopeId}
              onChange={(id) => handleIsotopeChange(id)}
              options={ISOTOPE_PRESETS.map(p => ({ id: p.id, name: p.name }))}
              placeholder="Search isotopes..."
              isDarkMode={isDarkMode}
              label=""
            />
          </div>

          {/* Beam Kinetic Energy Input & Unit Selector */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className={`text-[10px] font-bold uppercase tracking-wider ${textLabel}`}>
                Incident Beam Kinetic Energy
              </label>
              <div className="flex items-center space-x-1">
                <span className="text-orange-500 font-mono font-bold text-xs">{params.beamEnergyMeV}</span>
                <select
                  value={params.energyUnit || "MeV"}
                  onChange={(e) => updateParam("energyUnit", e.target.value as "MeV" | "GeV" | "TeV")}
                  className={`rounded px-1.5 py-0.5 text-[9px] font-mono outline-none border cursor-pointer border-orange-500/30 ${inputBg}`}
                >
                  <option value="MeV">MeV</option>
                  <option value="GeV">GeV</option>
                  <option value="TeV">TeV</option>
                </select>
              </div>
            </div>
            <input
              type="number"
              step="0.001"
              min="0.001"
              max={params.energyUnit === "TeV" ? 100.0 : params.energyUnit === "GeV" ? 1000.0 : 5000.0}
              value={params.beamEnergyMeV}
              onChange={(e) => {
                const maxVal = params.energyUnit === "TeV" ? 100.0 : params.energyUnit === "GeV" ? 1000.0 : 5000.0;
                updateParam("beamEnergyMeV", Math.max(0.001, Math.min(maxVal, parseFloat(e.target.value) || 0.1)));
              }}
              className={`w-full rounded-lg px-3 py-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-orange-500 transition-all ${inputBg}`}
              id="beam-energy-input"
            />
          </div>

          {/* Particle Trigger Count (Advanced Option for scientific simulations) */}
          <div className="space-y-1.5">
            <label className={`flex justify-between text-[10px] font-bold uppercase tracking-wider ${textLabel}`}>
              <span>Fired Particle Trigger Count</span>
              <span className="text-orange-500 font-mono font-semibold">{params.numberFiredParticles || 150} particles</span>
            </label>
            <input
              type="number"
              min="1"
              max="100000"
              value={params.numberFiredParticles || 150}
              onChange={(e) => updateParam("numberFiredParticles", Math.max(1, parseInt(e.target.value) || 100))}
              className={`w-full rounded-lg px-3 py-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-orange-500 transition-all ${inputBg}`}
            />
          </div>

          {/* Extended Custom Beam Characteristics Sub-Panel */}
          {params.isotopeId === "custom" && (
            <div className={`p-3 rounded-lg border space-y-3 ${isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-orange-500 border-b border-orange-500/20 pb-1">
                Custom Quantum Alignments
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                    Rest Mass (MeV)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={params.customRestMassMeV || 105.658}
                    onChange={(e) => updateParam("customRestMassMeV", Math.max(0.001, parseFloat(e.target.value) || 0.511))}
                    className={`w-full rounded px-2 py-1 text-[10px] font-mono outline-none ${inputBg}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                    Charge State (e)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="-10"
                    max="10"
                    value={params.customChargeE !== undefined ? params.customChargeE : -1}
                    onChange={(e) => updateParam("customChargeE", parseInt(e.target.value) || 1)}
                    className={`w-full rounded px-2 py-1 text-[10px] font-mono outline-none ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div className="space-y-1">
                  <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                    Spin Parity
                  </label>
                  <select
                    value={params.particleSpin || "1/2"}
                    onChange={(e) => updateParam("particleSpin", e.target.value as "0" | "1/2" | "1" | "2")}
                    className={`w-full rounded px-1.5 py-1 text-[10px] outline-none ${inputBg}`}
                  >
                    <option value="0">0 (Boson)</option>
                    <option value="1/2">1/2 (Fermi)</option>
                    <option value="1">1 (Vector)</option>
                    <option value="2">2 (Tensor)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                    Baryon No.
                  </label>
                  <input
                    type="number"
                    min="-1"
                    max="1"
                    value={params.baryonNumber !== undefined ? params.baryonNumber : 0}
                    onChange={(e) => updateParam("baryonNumber", parseInt(e.target.value) || 0)}
                    className={`w-full rounded px-1 py-1 text-[10px] font-mono outline-none ${inputBg}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                    Lepton No.
                  </label>
                  <input
                    type="number"
                    min="-1"
                    max="1"
                    value={params.leptonNumber !== undefined ? params.leptonNumber : 1}
                    onChange={(e) => updateParam("leptonNumber", parseInt(e.target.value) || 0)}
                    className={`w-full rounded px-1 py-1 text-[10px] font-mono outline-none ${inputBg}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Particle intensity / Fluence flux */}
          <div className="space-y-1.5">
            <label className={`flex justify-between text-[10px] font-bold uppercase tracking-wider ${textLabel}`}>
              <span>Isotopic Particle Flux</span>
              <span className="text-orange-500 font-mono font-semibold">{params.intensityFlux.toLocaleString()} /cm²/s</span>
            </label>
            <input
              type="range"
              min="100"
              max="2000000"
              step="1000"
              value={params.intensityFlux}
              onChange={(e) => updateParam("intensityFlux", parseInt(e.target.value) || 1000)}
              className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg border-none"
            />
          </div>

          {/* Deflection B-Field Strength and incident angles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={`block text-[9px] font-bold uppercase tracking-wider ${textLabel}`}>
                Incidence Angle
              </label>
              <input
                type="number"
                min="0"
                max="90"
                value={params.incidenceAngleDeg}
                onChange={(e) => updateParam("incidenceAngleDeg", Math.max(0, Math.min(90, parseInt(e.target.value) || 0)))}
                className={`w-full rounded-lg px-2 py-1 text-xs outline-none font-mono ${inputBg}`}
              />
            </div>
            <div className="space-y-1">
              <label className={`block text-[9px] font-bold uppercase tracking-wider ${textLabel}`}>
                B-Field (Tesla)
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="12"
                value={params.magneticFieldT}
                onChange={(e) => updateParam("magneticFieldT", Math.max(0, Math.min(12, parseFloat(e.target.value) || 0)))}
                className={`w-full rounded-lg px-2 py-1 text-xs outline-none font-mono ${inputBg}`}
              />
            </div>
          </div>

          {/* Particle charge Z and Beam Divergence */}
          <div className="grid grid-cols-2 gap-3 border-t border-slate-150/10 pt-3">
            <div className="space-y-1">
              <label className={`block text-[9px] font-bold uppercase tracking-wider ${textLabel}`}>
                Charge State (Z)
              </label>
              <select
                value={params.beamCharge}
                onChange={(e) => updateParam("beamCharge", parseInt(e.target.value, 10))}
                className={`w-full rounded-lg px-2 py-1 text-xs outline-none font-mono font-semibold ${inputBg}`}
              >
                <option value="-1">-1 e (Beta/Mu-)</option>
                <option value="0">0 e (Neutral)</option>
                <option value="1">+1 e (Protons)</option>
                <option value="2">+2 e (Alpha/He-4)</option>
                <option value="6">+6 e (Carbon Ions)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={`block text-[9px] font-bold uppercase tracking-wider ${textLabel}`}>
                Divergence (mrad)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="25"
                value={params.beamDivergenceMrad}
                onChange={(e) => updateParam("beamDivergenceMrad", Math.max(0, Math.min(25, parseFloat(e.target.value) || 0)))}
                className={`w-full rounded-lg px-2 py-1 text-xs outline-none font-mono ${inputBg}`}
              />
            </div>
          </div>

          {/* Track segment length dx & pulse width */}
          <div className="grid grid-cols-2 gap-3 border-t border-slate-150/10 pt-3">
            <div className="space-y-1">
              <label className={`block text-[9px] font-bold uppercase tracking-wider ${textLabel}`}>
                Track Length (dx)
              </label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="100.0"
                  value={params.trackLengthMm}
                  onChange={(e) => updateParam("trackLengthMm", Math.max(0.5, Math.min(100.0, parseFloat(e.target.value) || 10.0)))}
                  className={`w-full rounded-lg px-2 py-1 text-xs outline-none font-mono ${inputBg}`}
                />
                <span className="text-[9px] font-mono opacity-60">mm</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className={`block text-[9px] font-bold uppercase tracking-wider ${textLabel}`}>
                Pulse Width
              </label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="500"
                  value={params.beamPulseWidthNs}
                  onChange={(e) => updateParam("beamPulseWidthNs", Math.max(0, Math.min(500, parseInt(e.target.value) || 0)))}
                  className={`w-full rounded-lg px-2 py-1 text-xs outline-none font-mono ${inputBg}`}
                />
                <span className="text-[9px] font-mono opacity-60">ns</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {activeSection === "radiator" && (
        <div className={`border p-6 md:p-8 rounded-xl shadow-sm space-y-8 ${cardBg}`}>
          <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-3">
            <Cpu className="w-5 h-5 text-orange-500" />
            <h3 className={`text-xs font-extrabold tracking-wider uppercase font-sans ${textTitle}`}>
              Sensor Matrix Architecture
            </h3>
          </div>

          {/* Chipset selection dropdown */}
          <div className="space-y-1.5">
            <label className={`block text-[10px] font-bold uppercase tracking-wider ${textLabel}`}>
              Silicon Tracker Chipset
            </label>
            <select
              value={detector.chipset}
              onChange={(e) => updateDetector("chipset", e.target.value as any)}
              className={`w-full rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-1 focus:ring-orange-500 transition-all ${inputBg}`}
              id="chipset-select"
            >
              <option value="Medipix3">Medipix3 (Spectroscopic Cluster)</option>
              <option value="Medipix4">Medipix4 (High-Rate Imaging)</option>
              <option value="Timepix3">Timepix3 (Time-of-Flight Tracking)</option>
              <option value="Timepix4">Timepix4 (Sub-nanosecond Time-of-Flight)</option>
              <option value="ATLAS-Pixel">ATLAS-Pixel (High Radiation Tolerance)</option>
              <option value="CMS-Strip">CMS-Strip (Large Area Silicon)</option>
              <option value="ALICE-ITS">ALICE-ITS (MAPS Ultra-Thin)</option>
              <option value="LHCb-VELO">LHCb-VELO (Microchannel Cooled)</option>
              <option value="SiPM">Silicon Photomultiplier Array</option>
              <option value="EMCCD">Gated EMCCD Detector</option>
              <option value="JUNGFRAU">JUNGFRAU (Photon Counting)</option>
              <option value="VERITAS">VERITAS (Triggered Spectrometry)</option>
              <option value="HPGe">HPGe (High-Purity Germanium)</option>
              <option value="CZT">CZT (Cadmium Zinc Telluride)</option>
              <option value="LaBr3">LaBr3 (Lanthanum Bromide)</option>
              <option value="APD">APD (Avalanche Photodiode)</option>
              <option value="PMT">PMT (Photomultiplier Tube)</option>
              <option value="CMOS">CMOS (Active Pixel Sensor)</option>
              <option value="Hybrid">Hybrid (Multi-Modal)</option>
            </select>
          </div>

          {/* Matrix Geometry standard scaling */}
          <div className="space-y-1.5">
            <label className={`block text-[10px] font-bold uppercase tracking-wider ${textLabel}`}>
              Sensor Array Grid Geometry
            </label>
            <select
              value={detector.geometry}
              onChange={(e) => updateDetector("geometry", e.target.value as any)}
              className={`w-full rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-1 focus:ring-orange-500 transition-all ${inputBg}`}
            >
              <option value="256x256">256 x 256 Array</option>
              <option value="512x512">512 x 512 Pixels</option>
              <option value="1024x1024">1024 x 1024 High-Res</option>
            </select>
          </div>

          {/* Precise Pixel Pitch */}
          <div className="space-y-1.5">
            <label className={`flex justify-between text-[10px] font-bold uppercase tracking-wider ${textLabel}`}>
              <span>Active Pixel Pitch</span>
              <span className="text-orange-500 font-mono font-bold">{detector.pixelPitchUm} µm</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="10.0"
              max="250.0"
              value={detector.pixelPitchUm}
              onChange={(e) => updateDetector("pixelPitchUm", Math.max(10.0, Math.min(250.0, parseFloat(e.target.value) || 55.0)))}
              className={`w-full rounded-lg px-3 py-2 text-xs font-mono outline-none focus:ring-1 focus:ring-orange-500 transition-all ${inputBg}`}
            />
          </div>

          {/* Chip threshold values (keV) */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className={`block text-[9px] font-bold uppercase tracking-wider ${textLabel}`}>
                Threshold (keV)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="25.0"
                value={detector.thresholdKeV}
                onChange={(e) => updateDetector("thresholdKeV", Math.max(0.1, parseFloat(e.target.value) || 1.2))}
                className={`w-full rounded-lg px-2.5 py-1.5 text-xs outline-none font-mono ${inputBg}`}
              />
            </div>
            <div className="space-y-1.5">
              <label className={`block text-[9px] font-bold uppercase tracking-wider ${textLabel}`}>
                Electronic Noise RMS
              </label>
              <input
                type="number"
                step="0.1"
                min="0.01"
                max="5.0"
                value={detector.noiseRmsKeV}
                onChange={(e) => updateDetector("noiseRmsKeV", Math.max(0.01, parseFloat(e.target.value) || 0.8))}
                className={`w-full rounded-lg px-2.5 py-1.5 text-xs outline-none font-mono ${inputBg}`}
              />
            </div>
          </div>

          {/* Charge Summing Activation toggle */}
          <div className={`flex items-center justify-between p-2.5 border rounded-lg ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-150"}`}>
            <span className="text-[11px] font-sans font-medium">
              Charge Summing Mode (CSM)
            </span>
            <input
              type="checkbox"
              checked={detector.chargeSharingActive}
              onChange={(e) => updateDetector("chargeSharingActive", e.target.checked)}
              className="accent-orange-500 h-4 w-4 rounded border-slate-300 cursor-pointer"
            />
          </div>

          {/* Extended Silicon Chipset Attributes Sub-grid */}
          <div className="border-t border-slate-150/10 pt-3.5 space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-500 block">
              Advanced Tracker & Silicon Chipset Suboptions
            </span>
            
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                  Active Cooling
                </label>
                <select
                  value={detector.activeCoolingType || "Thermoelectric Peltier"}
                  onChange={(e) => updateDetector("activeCoolingType", e.target.value as "None" | "Thermoelectric Peltier" | "Liquid Nitrogen Cryo" | "Helium Loop" | "Liquid Helium" | "Pulse Tube")}
                  className={`w-full rounded px-2 py-1 text-[10px] font-medium outline-none ${inputBg}`}
                >
                  <option value="None">None (Passive)</option>
                  <option value="Thermoelectric Peltier">Thermoelectric Peltier (PID)</option>
                  <option value="Peltier Cascade">Peltier Cascade (Multi-Stage)</option>
                  <option value="Liquid Nitrogen Cryo">Liquid Nitrogen Cryo</option>
                  <option value="Microchannel Liquid CO2">Microchannel Liquid CO2</option>
                  <option value="Helium Loop">Stirling Helium Loop</option>
                  <option value="Superfluid Helium">Superfluid Helium (2K)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                  Sensor Temp
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={detector.detectorTemperatureC !== undefined ? detector.detectorTemperatureC : 20}
                    onChange={(e) => updateDetector("detectorTemperatureC", parseInt(e.target.value) || 20)}
                    className={`w-full rounded px-1.5 py-1 text-[10px] font-mono outline-none ${inputBg}`}
                  />
                  <span className="text-[9px] font-mono opacity-60">°C</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                  Bias Voltage
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={detector.biasVoltageV !== undefined ? detector.biasVoltageV : 100}
                    onChange={(e) => updateDetector("biasVoltageV", parseInt(e.target.value) || 100)}
                    className={`w-full rounded px-1.5 py-1 text-[10px] font-mono outline-none ${inputBg}`}
                  />
                  <span className="text-[9px] font-mono opacity-60">V</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                  Leakage Current
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    step="0.1"
                    value={detector.leakageCurrentNa !== undefined ? detector.leakageCurrentNa : 1.5}
                    onChange={(e) => updateDetector("leakageCurrentNa", parseFloat(e.target.value) || 1.5)}
                    className={`w-full rounded px-1.5 py-1 text-[10px] font-mono outline-none ${inputBg}`}
                  />
                  <span className="text-[9px] font-mono opacity-60">nA</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                  Depletion Voltage
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={detector.depletionVoltageV !== undefined ? detector.depletionVoltageV : 150}
                    onChange={(e) => updateDetector("depletionVoltageV", parseInt(e.target.value) || 150)}
                    className={`w-full rounded px-1.5 py-1 text-[10px] font-mono outline-none ${inputBg}`}
                  />
                  <span className="text-[9px] font-mono opacity-60">V</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                  Substrate Thk.
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={detector.substrateThicknessUm !== undefined ? detector.substrateThicknessUm : 300}
                    onChange={(e) => updateDetector("substrateThicknessUm", parseInt(e.target.value) || 300)}
                    className={`w-full rounded px-1.5 py-1 text-[10px] font-mono outline-none ${inputBg}`}
                  />
                  <span className="text-[9px] font-mono opacity-60">µm</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                  Quantum Eff. (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={detector.quantumEfficiencyPct !== undefined ? detector.quantumEfficiencyPct : 92}
                  onChange={(e) => updateDetector("quantumEfficiencyPct", Math.max(1, Math.min(100, parseInt(e.target.value) || 92)))}
                  className={`w-full rounded px-2 py-1 text-[10px] font-mono outline-none ${inputBg}`}
                />
              </div>
              <div className="space-y-1">
                <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                  Dead Time Recovery
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={detector.pixelDeadTimeNs !== undefined ? detector.pixelDeadTimeNs : 25}
                    onChange={(e) => updateDetector("pixelDeadTimeNs", parseInt(e.target.value) || 25)}
                    className={`w-full rounded px-1.5 py-1 text-[10px] font-mono outline-none ${inputBg}`}
                  />
                  <span className="text-[9px] font-mono opacity-60">ns</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                  Substrate Doping
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    step="0.1"
                    value={detector.dopingDensityPtype !== undefined ? detector.dopingDensityPtype : 1.5}
                    onChange={(e) => updateDetector("dopingDensityPtype", parseFloat(e.target.value) || 1.5)}
                    className={`w-full rounded px-1.5 py-1 text-[10px] font-mono outline-none ${inputBg}`}
                  />
                  <span className="text-[8px] opacity-60 font-mono">10¹² cm⁻³</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                  Readout Mode
                </label>
                <select
                  value={detector.readoutMode || "ToT (Time over Threshold)"}
                  onChange={(e) => updateDetector("readoutMode", e.target.value as "ToA (Time of Arrival)" | "ToT (Time over Threshold)" | "Counting" | "Triggered Spectrometry" | "Waveform" | "Photon Counting" | "Energy Integrating")}
                  className={`w-full rounded px-2 py-1 text-[10px] font-medium outline-none ${inputBg}`}
                >
                  <option value="ToT (Time over Threshold)">ToT (Time over Threshold)</option>
                  <option value="ToA (Time of Arrival)">ToA (Time of Arrival)</option>
                  <option value="Counting">Active Counting</option>
                  <option value="Spectrometry">Triggered Spectrometry</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        )}

        {activeSection === "detector" && (
        <div className={`border p-6 md:p-8 rounded-xl shadow-sm space-y-8 ${cardBg}`}>
          <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-3">
            <Compass className="w-5 h-5 text-orange-500" />
            <h3 className={`text-xs font-extrabold tracking-wider uppercase font-sans ${textTitle}`}>
              Medium & Extended Physics
            </h3>
          </div>

          {/* Target physical medium selector */}
          <div className="space-y-1.5">
            <label className={`block text-[10px] font-bold uppercase tracking-wider ${textLabel}`}>
              Target Radiator Medium
            </label>
            <SearchableSelect
              value={params.materialId}
              onChange={(id) => updateParam("materialId", id)}
              options={MATERIAL_PRESETS.map(m => ({ id: m.id, name: m.name }))}
              placeholder="Search materials..."
              isDarkMode={isDarkMode}
              label=""
            />
          </div>

          {/* Radiator medium thickness */}
          <div className="space-y-1.5">
            <label className={`flex justify-between text-[10px] font-bold uppercase tracking-wider ${textLabel}`}>
              <span>Effective Depth (x)</span>
              <span className="text-orange-500 font-mono font-bold">{params.radiatorThicknessMm} mm</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0.0"
              max="150.0"
              value={params.radiatorThicknessMm}
              onChange={(e) => updateParam("radiatorThicknessMm", Math.max(0.0, Math.min(150.0, parseFloat(e.target.value) || 0.0)))}
              className={`w-full rounded-lg px-3 py-2 text-xs font-mono outline-none focus:ring-1 focus:ring-orange-500 transition-all ${inputBg}`}
            />
          </div>

          {/* Core Lab Environment parameters */}
          <div className="border-t border-slate-150/10 pt-3 space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-500 block">
              Spectrometry Lab & Vacuum Chambers Environment
            </span>
            
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                  Facility / Lab Type
                </label>
                <select
                  value={params.labFacility || "SPS-Synchrotron"}
                  onChange={(e) => updateParam("labFacility", e.target.value as any)}
                  className={`w-full rounded px-2 py-1 text-[10px] font-medium outline-none ${inputBg}`}
                >
                  <option value="SPS-Synchrotron">SPS Synchrotron</option>
                  <option value="DESY-II">DESY II Electron</option>
                  <option value="SuperKEKB">SuperKEKB Synchrotron</option>
                  <option value="Brookhaven-RHIC">Brookhaven RHIC</option>
                  <option value="BioExperimental-Proton-Suite">Proton Beam Suite</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                  Chamber Profile Shape
                </label>
                <select
                  value={params.chamberShape || "Cylindrical-Beam-Pipe"}
                  onChange={(e) => updateParam("chamberShape", e.target.value as any)}
                  className={`w-full rounded px-2 py-1 text-[10px] font-medium outline-none ${inputBg}`}
                >
                  <option value="Cylindrical-Beam-Pipe">Cylindrical Beam Pipe</option>
                  <option value="Toroidal-fusion-Ring">Toroidal Fusion Ring</option>
                  <option value="Spherical-Reaction-Vessel">Spherical Vessel</option>
                  <option value="Hexagonal-Cubic-Chamber">Hexagonal Chamber</option>
                  <option value="TPC-Cylindrical">TPC Cylindrical (LAr)</option>
                  <option value="Calorimeter-Block">Calorimeter Block (Pb/W)</option>
                  <option value="Muon-Spectrometer">Muon Spectrometer (Drift Tubes)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                  Chamber Temperature (K)
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    step="0.01"
                    min="1.00"
                    max="900.00"
                    value={params.chamberTemperatureK || 293.15}
                    onChange={(e) => updateParam("chamberTemperatureK", Math.max(1.0, Math.min(900.0, parseFloat(e.target.value) || 293.15)))}
                    className={`w-full rounded px-1.5 py-1 text-[10px] font-mono outline-none ${inputBg}`}
                  />
                  <span className="text-[9px] font-mono opacity-60">K</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                  Simulation Dimensions
                </label>
                <select
                  value={params.dimensionMode || "3D-Isometric-Chambers"}
                  onChange={(e) => updateParam("dimensionMode", e.target.value as any)}
                  className={`w-full rounded px-2 py-1 text-[10px] font-medium outline-none ${inputBg}`}
                >
                  <option value="2D-Orthogonal-Projectors">2D Orthogonal Slices</option>
                  <option value="3D-Isometric-Chambers">3D Isometric Chambers</option>
                  <option value="4D-Spacetime-Minkowski">4D Spacetime Minkowski</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                  Magnetic Field (B)
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0.0"
                    max="10.0"
                    value={params.magneticFieldTesla || 0.0}
                    onChange={(e) => updateParam("magneticFieldTesla", Math.max(0.0, Math.min(10.0, parseFloat(e.target.value) || 0.0)))}
                    className={`w-full rounded px-1.5 py-1 text-[10px] font-mono outline-none ${inputBg}`}
                  />
                  <span className="text-[9px] font-mono opacity-60">Tesla</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                  Electric Field (E)
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    step="1.0"
                    min="0.0"
                    max="1000.0"
                    value={params.electricFieldKvM || 0.0}
                    onChange={(e) => updateParam("electricFieldKvM", Math.max(0.0, Math.min(1000.0, parseFloat(e.target.value) || 0.0)))}
                    className={`w-full rounded px-1.5 py-1 text-[10px] font-mono outline-none ${inputBg}`}
                  />
                  <span className="text-[9px] font-mono opacity-60">kV/m</span>
                </div>
              </div>
            </div>

            {/* Thermal breaking warning thresholds */}
            <div className="space-y-1 py-1">
              {params.chamberTemperatureK !== undefined && (params.chamberTemperatureK > 328.15 || params.chamberTemperatureK < 80.0) ? (
                <div className="bg-red-500/20 border border-red-500/40 text-red-500 rounded p-2 text-[9px] font-semibold animate-pulse flex items-center space-x-1.5 leading-normal">
                  <span className="text-xs">⚠️</span>
                  <div>
                    {params.chamberTemperatureK > 328.15 ? (
                      <span><strong>CRITICAL THERMAL ANOMALY (+ BREAKDOWN):</strong> Target liquid boiling / gas phases. Radiative index drops dynamically!</span>
                    ) : (
                      <span><strong>CRITICAL THERMAL ANOMALY (- CRYOGENIC BREAK):</strong> Cryo phase crystallization. Lattice stress spikes index!</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded p-2 text-[9px] font-medium flex items-center space-x-1.5">
                  <span className="text-xs">✅</span>
                  <span>Chamber lattice thermal thresholds nominal (Index stable).</span>
                </div>
              )}
            </div>
          </div>

          {/* Monte Carlo & Generator Parameters */}
          <div className="border-t border-slate-150/10 pt-3 space-y-3">
             <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500 block">
              Event Generation & Advanced Physics
             </span>

             <div className="grid grid-cols-2 gap-2.5">
               <div className="space-y-1">
                 <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                   Monte Carlo Framework
                 </label>
                 <select
                   value={params.monteCarloGenerator || "NONE"}
                   onChange={(e) => updateParam("monteCarloGenerator", e.target.value as any)}
                   className={`w-full rounded px-2 py-1 text-[10px] font-medium outline-none border border-emerald-500/20 ${inputBg}`}
                 >
                   <option value="NONE">- Disabled / Standard -</option>
                   <option value="PYTHIA8">PYTHIA 8 (Hadron/Parton Shower)</option>
                   <option value="HERWIG">HERWIG 7 (Angular Ordering)</option>
                   <option value="GEANT4_FAST">GEANT4-Fast (Paramaterized)</option>
                 </select>
               </div>
               
               <div className="space-y-1">
                 <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                   MC Events Batch Size
                 </label>
                 <input
                   type="number"
                   step="1000"
                   min="1000"
                   max="1000000"
                   value={params.mcEventsPerRun || 10000}
                   onChange={(e) => updateParam("mcEventsPerRun", Math.max(1000, parseInt(e.target.value) || 10000))}
                   className={`w-full rounded px-2 py-1 text-[10px] font-mono outline-none ${inputBg}`}
                 />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-2.5">
                <label className={`flex items-center space-x-2 p-1.5 rounded border border-transparent hover:border-slate-500/30 cursor-pointer transition ${params.cosmicRaysActive ? "bg-emerald-500/10 border-emerald-500/30" : ""}`}>
                  <input
                    type="checkbox"
                    checked={params.cosmicRaysActive}
                    onChange={(e) => updateParam("cosmicRaysActive", e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-bold uppercase tracking-wide ${textTitle}`}>Cosmic Muon Flux</span>
                    <span className="text-[8px] opacity-70">Atmospheric shower overlay</span>
                  </div>
                </label>

                <label className={`flex items-center space-x-2 p-1.5 rounded border border-transparent hover:border-slate-500/30 cursor-pointer transition ${params.ambientCosmicRays ? "bg-fuchsia-500/10 border-fuchsia-500/30" : ""}`}>
                  <input
                    type="checkbox"
                    checked={params.ambientCosmicRays}
                    onChange={(e) => updateParam("ambientCosmicRays", e.target.checked)}
                    className="accent-fuchsia-500"
                  />
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-bold uppercase tracking-wide ${textTitle}`}>Weather Mode</span>
                    <span className="text-[8px] opacity-70">Ambient random hits</span>
                  </div>
                </label>

                <label className={`flex items-center space-x-2 p-1.5 rounded border border-transparent hover:border-slate-500/30 cursor-pointer transition ${params.gravitationalLensingActive ? "bg-amber-500/10 border-amber-500/30" : ""}`}>
                  <input
                    type="checkbox"
                    checked={params.gravitationalLensingActive}
                    onChange={(e) => updateParam("gravitationalLensingActive", e.target.checked)}
                    className="accent-amber-500"
                  />
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-bold uppercase tracking-wide ${textTitle}`}>Gravitational Lensing</span>
                    <span className="text-[8px] opacity-70">Schwarzschild metric deflection</span>
                  </div>
                </label>
             </div>
          </div>

          {/* Dose-rate reference mode panel */}
          <div className={`p-3 border rounded-lg space-y-2.5 ${isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-slate-150/40 border-slate-200"}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-orange-500 uppercase tracking-wider flex items-center space-x-1">
                <span>🔬 Dose-Rate Reference Mode</span>
              </span>
              <input
                type="checkbox"
                checked={params.experimentalModeActive}
                onChange={(e) => updateParam("experimentalModeActive", e.target.checked)}
                className="accent-orange-500 h-4 w-4 rounded border-slate-300 cursor-pointer"
                id="Experimental-mode-checkbox"
              />
            </div>

            {params.experimentalModeActive && (
              <div className="space-y-2 animate-fade border-t border-slate-200 dark:border-slate-800 pt-2.5">
                <div className="space-y-1">
                  <label className={`text-[9px] uppercase font-bold block ${textLabel}`}>Reference Application</label>
                  <select
                    value={params.experimentalApplication}
                    onChange={(e) => updateParam("experimentalApplication", e.target.value as any)}
                    className={`w-full rounded px-2.5 py-1.5 text-[11px] outline-none font-semibold ${inputBg}`}
                  >
                    <option value="imrt">IMRT Beam Reference (reference only)</option>
                    <option value="proton_therapy_verify">Proton Range Reference (reference only)</option>
                    <option value="nuclear_dosimetry">Isotope Source Reference (Y-90 Microspheres)</option>
                    <option value="ophthalmic_dosimetry">Alternative application (reference only)</option>
                    <option value="molecular_imaging">CLI Molecular Imaging Reference</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <label className={`text-[9px] uppercase font-bold block ${textLabel}`}>Dose-Rate Reference (Gy/min)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="50"
                      value={params.fluenceRateGyMin}
                      onChange={(e) => updateParam("fluenceRateGyMin", Math.max(0, Math.min(50, parseFloat(e.target.value) || 0)))}
                      className={`w-full rounded px-2 py-1 text-xs font-mono text-orange-500 focus:ring-1 focus:ring-orange-500 outline-none ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className={`text-[9px] uppercase font-bold block ${textLabel}`}>Cumulative Reference (Gy)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="120"
                      value={params.cumulativeFluenceGy}
                      onChange={(e) => updateParam("cumulativeFluenceGy", Math.max(0, Math.min(120, parseFloat(e.target.value) || 0)))}
                      className={`w-full rounded px-2 py-1 text-xs font-mono text-orange-500 focus:ring-1 focus:ring-orange-500 outline-none ${inputBg}`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Detector Geometry & Materials */}
          <div className="border-t border-slate-150/10 pt-3 space-y-3">
             <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-500 block">
              Detector Geometry & Readout
             </span>
             <div className="space-y-1">
               <label className={`block text-[8px] font-bold uppercase tracking-wider ${textLabel}`}>
                 Primary Target / Chamber Material
               </label>
               <select
                 value={params.chamberMaterial || "Vacuum"}
                 onChange={(e) => updateParam("chamberMaterial", e.target.value as any)}
                 className={`w-full rounded px-2 py-1 text-[10px] font-medium outline-none border border-slate-500/20 ${inputBg}`}
               >
                 <option value="Vacuum">Vacuum (10^-9 Torr)</option>
                 <option value="Water">H2O (Water) Target</option>
                 <option value="LiquidArgon">Liquid Argon (LAr TPC)</option>
                 <option value="LiquidXenon">Liquid Xenon (LXe)</option>
                 <option value="Aerogel">Silica Aerogel (n=1.05)</option>
                 <option value="Silicon">Bulk Silicon (Tracker)</option>
                 <option value="Lead">Lead (Pb) Absorber</option>
                 <option value="Tungsten">Tungsten (W) Calorimeter</option>
               </select>
             </div>
             
             <div className="grid grid-cols-2 gap-1.5">
               {Object.entries(params.detectorSubsystems || {}).map(([key, isActive]) => (
                  <label key={key} className={`flex items-center space-x-2 p-1.5 rounded border border-transparent hover:border-slate-500/30 cursor-pointer transition ${isActive ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "text-slate-500"}`}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => updateParam("detectorSubsystems", { ...params.detectorSubsystems, [key]: e.target.checked })}
                      className="accent-orange-500"
                    />
                    <span className="text-[9px] font-bold uppercase tracking-wide">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
               ))}
             </div>
          </div>
          
          {/* DAQ, ML & Reconstructions */}
          <div className="border-t border-slate-150/10 pt-3 space-y-3">
             <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-500 block">
              DAQ, Trigger & AI Reconstruction
             </span>
             
             <div className="grid grid-cols-2 gap-1.5">
               {Object.entries(params.reconstruction || {}).map(([key, isActive]) => (
                  <label key={key} className={`flex items-center space-x-2 p-1.5 rounded border border-transparent hover:border-slate-500/30 cursor-pointer transition ${isActive ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "text-slate-500"}`}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => updateParam("reconstruction", { ...params.reconstruction, [key]: e.target.checked })}
                      className="accent-blue-500"
                    />
                    <span className="text-[9px] font-bold uppercase tracking-wide">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
               ))}
             </div>
          </div>

          {/* Wavelength Shifters / Quantum dots dopants */}
          <div className={`p-3 border rounded-lg space-y-2 ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-sans font-bold">
                Wavelength Shifting Dopants
              </span>
              <input
                type="checkbox"
                checked={params.nanoparticlesActive}
                onChange={(e) => updateParam("nanoparticlesActive", e.target.checked)}
                className="accent-orange-500 h-4 w-4 rounded border-slate-300 cursor-pointer"
              />
            </div>

            {params.nanoparticlesActive && (
              <div className="space-y-2 animate-fade pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`text-[9px] uppercase block mb-1 ${textLabel}`}>
                      Fluor Peak (nm)
                    </label>
                    <input
                      type="number"
                      min="350"
                      max="900"
                      value={params.nanoparticlePeakNm}
                      onChange={(e) => updateParam("nanoparticlePeakNm", Math.max(350, Math.min(900, parseInt(e.target.value) || 520)))}
                      className={`w-full rounded px-2 py-1.5 text-xs font-mono text-orange-500 focus:ring-1 focus:ring-orange-500 outline-none ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className={`text-[9px] uppercase block mb-1 ${textLabel}`}>
                      Conc. (ppm)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={params.nanoparticleConcentrationPpm}
                      onChange={(e) => updateParam("nanoparticleConcentrationPpm", Math.max(1, Math.min(1000, parseInt(e.target.value) || 50)))}
                      className={`w-full rounded px-2 py-1.5 text-xs font-mono text-orange-500 focus:ring-1 focus:ring-orange-500 outline-none ${inputBg}`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {activeSection === "toggles" && (
        <div className={`border p-6 md:p-8 rounded-xl shadow-sm space-y-8 ${cardBg}`}>
        <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-3 mb-4">
          <Sliders className="w-5 h-5 text-orange-500" />
          <h3 className={`text-xs font-extrabold tracking-wider uppercase font-sans ${textTitle}`}>
            Physical Radiative Layer Estimations Toggles
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {Object.entries(params.componentsActive).map(([key, active]) => (
            <motion.button
              key={key}
              layout
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: active ? "0px 0px 8px rgba(249, 115, 22, 0.4)" : "none",
                borderColor: active ? "rgba(249, 115, 22, 0.3)" : "rgba(100, 116, 139, 0.2)",
              }}
              onClick={() =>
                setParams((prev) => ({
                  ...prev,
                  componentsActive: {
                    ...prev.componentsActive,
                    [key]: !active,
                  },
                }))
              }
              className={`relative overflow-hidden p-3 rounded-xl border text-xs font-bold font-sans text-center transition-colors duration-150 cursor-pointer flex flex-col items-center justify-center ${
                active
                  ? "bg-orange-500/10 text-orange-400 font-extrabold"
                  : isDarkMode
                    ? "bg-slate-950 text-slate-500 hover:bg-slate-900"
                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
              }`}
            >
              <AnimatePresence>
                {active && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 to-transparent pointer-events-none"
                  />
                )}
              </AnimatePresence>
              <motion.div layout="position" className="capitalize z-10">{key.replace(/([A-Z])/g, " $1")}</motion.div>
              <motion.div layout="position" className="text-[10px] mt-1 font-mono z-10">
                {active ? "ACTIVE" : "DISABLED"}
              </motion.div>
            </motion.button>
          ))}
        </div>
      </div>
        )}

        {activeSection === "calculator" && (
        <div className={`border p-6 md:p-8 rounded-xl shadow-md space-y-8 ${cardBg}`}>
        <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-4 mb-4">
          <Calculator className="w-5 h-5 text-orange-500 shrink-0" />
          <div>
            <h3 className={`text-xs font-extrabold tracking-wider uppercase font-sans ${textTitle}`}>
              Lorentz Kinematics & Cherenkov Threshold Solver
            </h3>
            <p className="text-[10px] text-slate-400 text-slate-500 font-mono mt-0.5">Interactive theoretical calibration sandbox</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Controls section */}
          <div className="lg:col-span-5 space-y-3.5">
            <div>
              <label className={`text-[10px] uppercase font-mono font-bold block mb-1.5 ${textLabel}`}>
                1. Select Particle Core mass
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: "electron", label: "Electron e⁻", mass: 0.51099895 },
                  { id: "muon", label: "Muon μ⁻", mass: 105.65837 },
                  { id: "kaon", label: "Kaon K⁻", mass: 493.677 },
                  { id: "proton", label: "Proton p⁺", mass: 938.2721 },
                  { id: "alpha", label: "Alpha α²⁺", mass: 3727.3794 },
                  { id: "custom", label: "Custom MeVs", mass: 1000.0 }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCalcMassPreset(item.id);
                      setCalcMass(item.mass);
                    }}
                    className={`py-1.5 px-1 rounded text-[9px] font-mono border text-center transition ${
                      calcMassPreset === item.id
                        ? "bg-orange-500/10 border-orange-500/50 text-orange-400 font-bold"
                        : isDarkMode
                          ? "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`text-[9px] uppercase font-mono font-bold block mb-1 ${textLabel}`}>
                  Rest Mass (MeV)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.001"
                  value={calcMass}
                  onChange={(e) => {
                    setCalcMass(Math.max(0.001, parseFloat(e.target.value) || 0.511));
                    setCalcMassPreset("custom");
                  }}
                  className={`w-full rounded px-2.5 py-1.5 text-xs font-mono text-orange-500 focus:ring-1 focus:ring-orange-500 outline-none ${inputBg}`}
                />
              </div>
              <div>
                <label className={`text-[9px] uppercase font-mono font-bold block mb-1 ${textLabel}`}>
                  Kinetic Energy (MeV)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={calcEnergy}
                  onChange={(e) => setCalcEnergy(Math.max(0, parseFloat(e.target.value) || 0))}
                  className={`w-full rounded px-2.5 py-1.5 text-xs font-mono text-orange-500 focus:ring-1 focus:ring-orange-500 outline-none ${inputBg}`}
                />
              </div>
            </div>

            <div>
              <label className={`text-[9px] uppercase font-mono font-bold block mb-1 ${textLabel}`}>
                Radiator Refractive Index n(λ)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.01"
                  value={calcRefIndex}
                  onChange={(e) => setCalcRefIndex(parseFloat(e.target.value))}
                  className="flex-1 accent-orange-500 cursor-pointer"
                />
                <input
                  type="number"
                  step="0.001"
                  min="1.000"
                  max="4.0"
                  value={calcRefIndex}
                  onChange={(e) => setCalcRefIndex(Math.max(1.0, parseFloat(e.target.value) || 1.33))}
                  className={`w-20 rounded px-2 py-1 text-xs font-mono text-center text-orange-500 focus:ring-1 focus:ring-orange-500 outline-none ${inputBg}`}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                <span>Vacuum (1.00)</span>
                <span>Water (1.33)</span>
                <span>Lead Glass (1.67)</span>
                <span>LYSO (1.82)</span>
              </div>
            </div>
          </div>

          {/* Results section */}
          <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800/85 rounded-xl p-4 flex flex-col justify-start space-y-4">
            
            {/* Top diagnostic line */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Einsteinian Kinematics Output</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                (calcEnergy / calcMass) > 1.0 ? "bg-orange-500/10 text-orange-400 border border-orange-500/30" : "bg-slate-800 text-slate-400"
              }`}>
                {(calcEnergy / calcMass) > 1.0 ? "Highly Relativistic" : "Relativistic"}
              </span>
            </div>

            {/* Calculations Grid */}
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-[11px] font-mono">
              <div>
                <span className="block text-[8px] text-slate-500 uppercase tracking-widest font-bold">Lorentz Gamma (γ)</span>
                <span className="text-sm font-bold text-slate-100">{(1 + (calcEnergy / calcMass)).toFixed(5)}</span>
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 uppercase tracking-widest font-bold">Relativistic Speed (β = v/c)</span>
                <span className="text-sm font-bold text-orange-500">{
                  (() => {
                    const gam = 1 + (calcEnergy / calcMass);
                    const b = Math.sqrt(Math.max(0, 1 - (1 / (gam * gam))));
                    return b.toFixed(6);
                  })()
                }</span>
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 uppercase tracking-widest font-bold">Relativistic Momentum (p)</span>
                <span className="text-sm font-bold text-teal-400">{
                  (() => {
                    const gam = 1 + (calcEnergy / calcMass);
                    const b = Math.sqrt(Math.max(0, 1 - (1 / (gam * gam))));
                    return (calcMass * gam * b).toLocaleString(undefined, { maximumFractionDigits: 3 });
                  })()
                } MeV/c</span>
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 uppercase tracking-widest font-bold">Total Energy (E = T + mc²)</span>
                <span className="text-sm font-bold text-slate-100">{(calcEnergy + calcMass).toLocaleString(undefined, { maximumFractionDigits: 3 })} MeV</span>
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 uppercase tracking-widest font-bold">Cherenkov Speed Threshold (1/n)</span>
                <span className="text-sm font-bold text-orange-400">{(calcRefIndex > 1.0 ? 1 / calcRefIndex : 1.0).toFixed(5)}</span>
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 uppercase tracking-widest font-bold">Threshold Kinetic Energy Required</span>
                <span className="text-sm font-bold text-emerald-400">{
                  (() => {
                    if (calcRefIndex <= 1.0) return "N/A";
                    const b_th = 1 / calcRefIndex;
                    const inside = 1 - (b_th * b_th);
                    if (inside <= 0) return "Infinity";
                    const gam_th = 1 / Math.sqrt(inside);
                    return (calcMass * (gam_th - 1)).toLocaleString(undefined, { maximumFractionDigits: 3 }) + " MeV";
                  })()
                }</span>
              </div>
            </div>

            {/* Emission Status Box */}
            <div className={`p-2.5 rounded-lg border text-center transition ${
              (() => {
                const gam = 1 + (calcEnergy / calcMass);
                const b = Math.sqrt(Math.max(0, 1 - (1 / (gam * gam))));
                const generates = b > (calcRefIndex > 1.0 ? 1 / calcRefIndex : 1.0);
                return generates 
                  ? "bg-blue-950/40 border-blue-800/40 text-blue-300"
                  : "bg-amber-950/40 border-amber-800/40 text-amber-300";
              })()
            }`}>
              {(() => {
                const gam = 1 + (calcEnergy / calcMass);
                const b = Math.sqrt(Math.max(0, 1 - (1 / (gam * gam))));
                const generates = b > (calcRefIndex > 1.0 ? 1 / calcRefIndex : 1.0);
                if (generates) {
                  const angle = Math.acos(1 / (b * calcRefIndex)) * (180 / Math.PI);
                  return (
                    <div className="text-[10px]">
                      <span className="font-extrabold text-[11px] block text-blue-400 uppercase tracking-wider mb-0.5">✔ EMISSION ACTIVE</span>
                      Physical beam exceeds threshold velocity. Simulated shockwave emission cone angle is <strong className="text-white text-xs">{angle.toFixed(2)}°</strong>.
                    </div>
                  );
                } else {
                  return (
                    <div className="text-[10px]">
                      <span className="font-extrabold text-[11px] block text-amber-400 uppercase tracking-wider mb-0.5">✖ EMISSION THRESHOLD NOT REACHED</span>
                      Relativistic speed β ({b.toFixed(5)}) is less than the medium index speed (1/n = {(calcRefIndex > 1.0 ? 1 / calcRefIndex : 1.0).toFixed(5)}). Particle moves too slow for Cherenkov shockwaves.
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      </div>
        )}

        {activeSection === "formulas" && (
        <div className={`border p-6 md:p-8 rounded-xl shadow-md space-y-8 ${cardBg}`}>
        <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-4 mb-4">
          <BookOpen className="w-5 h-5 text-orange-500 shrink-0" />
          <div>
            <h3 className={`text-xs font-extrabold tracking-wider uppercase font-sans ${textTitle}`}>
              Spectrometry & Relativistic Dynamics Journal Reference
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">High-Energy Physics peer-reviewed reference formulas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4.5">
          
          <div className="p-3 bg-slate-950/40 border border-slate-805/40 rounded-lg space-y-2">
            <h4 className="text-[10px] font-bold tracking-tight text-orange-400 font-sans uppercase">I. Frank-Tamm Integrated Yield</h4>
            <div className="bg-slate-950/80 p-2.5 rounded text-center my-2 font-mono text-[10px] border border-slate-900 text-teal-400">
              dN / dx dλ = (2πα / λ²) · (1 - 1 / (β² n²)) · Z²
            </div>
            <p className="text-[9.5px] leading-relaxed text-slate-400 text-justify">
              Formulated by Ilya Frank and Igor Tamm in 1937, this Nobel-prize-winning equation dictates the number of photons emitted per unit track length per unit spectral interval. Emitted photons scale inversely with wavelength squared, establishing the distinctive blue-violet luminescence.
            </p>
          </div>

          <div className="p-3 bg-slate-950/40 border border-slate-805/40 rounded-lg space-y-2">
            <h4 className="text-[10px] font-bold tracking-tight text-orange-400 font-sans uppercase">II. Sellmeier Dispersion Model</h4>
            <div className="bg-slate-950/80 p-2.5 rounded text-center my-2 font-mono text-[10px] border border-slate-900 text-teal-400">
              n²(λ) = 1 + [B₁λ² / (λ² - C₁)] + [B₂λ² / (λ² - C₂)]
            </div>
            <p className="text-[9.5px] leading-relaxed text-slate-400 text-justify">
              Describes the wavelength dependence of refractive index matching synthetic glass, crystals, and heavy water core Matrixs. High-frequency UV cutoff terms model the dispersion accurately, which prevents fictitious physics calculations near standard ultraviolet vacuum spectral bounds.
            </p>
          </div>

          <div className="p-3 bg-slate-950/40 border border-slate-805/40 rounded-lg space-y-2">
            <h4 className="text-[10px] font-bold tracking-tight text-orange-400 font-sans uppercase">III. Target Optical Attenuation</h4>
            <div className="bg-slate-950/80 p-2.5 rounded text-center my-2 font-mono text-[10px] border border-slate-900 text-teal-400">
              μ_eff = sqrt(3 μ_a · (μ_a + μ_s · (1 - g)))
            </div>
            <p className="text-[9.5px] leading-relaxed text-slate-400 text-justify">
              Under isotropic diffusion, scattering dominates light transport. The effective transport coefficient accounts for absorption coefficient (μ_a), raw scattering (μ_s), and anisotropy factor (g) in structural lead glass and organic scintillation tiles to calculate real optical throughput.
            </p>
          </div>

        </div>
        </div>
        )}
      </div>
    </div>
  );
}
