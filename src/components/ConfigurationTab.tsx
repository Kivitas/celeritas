/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useMemo, useState } from "react";
import { SimulationParams, DetectorSettings } from "../types";
import { ISOTOPE_PRESETS, MATERIAL_PRESETS } from "../data/presets";
import { BEAMLINE_PRESETS } from "../data/beamlinePresets";
import SearchableSelect from "./SearchableSelect";
import { Sparkles, Calculator } from "lucide-react";
import {
  calculateRelativisticBeta,
  cherenkovAngleDeg,
  getCherenkovThresholdEnergy,
} from "../core/physics";

interface ConfigurationTabProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  detector: DetectorSettings;
  setDetector: React.Dispatch<React.SetStateAction<DetectorSettings>>;
  onLoadPreset: (presetId: string) => void;
  isDarkMode: boolean;
}

// Every control here changes an input the engine reads (see src/core/physics.ts).
export default function ConfigurationTab({ params, setParams, detector, setDetector, onLoadPreset, isDarkMode }: ConfigurationTabProps) {
  const [calcMass, setCalcMass] = useState<number>(0.51099895);
  const [calcEnergy, setCalcEnergy] = useState<number>(1.2);
  const [calcRefIndex, setCalcRefIndex] = useState<number>(1.333);
  const [showUnverifiedMaterials, setShowUnverifiedMaterials] = useState<boolean>(false);

  const updateParam = <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };
  const updateDetector = <K extends keyof DetectorSettings>(key: K, value: DetectorSettings[K]) => {
    setDetector((prev) => ({ ...prev, [key]: value }));
  };

  const handleIsotopeChange = (id: string) => {
    const preset = ISOTOPE_PRESETS.find((p) => p.id === id);
    if (preset) {
      setParams((prev) => ({ ...prev, isotopeId: id, beamEnergyMeV: preset.baseEnergyMeV, energyUnit: "MeV" }));
    } else {
      updateParam("isotopeId", id);
    }
  };

  const card = isDarkMode ? "bg-slate-900/90 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800";
  const label = isDarkMode ? "text-slate-400" : "text-slate-500";
  const input = isDarkMode ? "bg-slate-950/80 text-slate-100 border-white/10" : "bg-white text-slate-800 border-slate-200";
  const numberInput = `w-full rounded-lg border px-2 py-1.5 text-xs font-mono outline-none focus:border-orange-500 ${input}`;

  const kin = useMemo(() => {
    const beta = calculateRelativisticBeta(calcEnergy, calcMass);
    const gamma = 1 + calcEnergy / calcMass;
    const betaN = beta * calcRefIndex;
    return {
      beta,
      gamma,
      emits: betaN > 1,
      angle: betaN > 1 ? cherenkovAngleDeg(beta, calcRefIndex) : 0,
      threshold: getCherenkovThresholdEnergy(calcMass, calcRefIndex),
    };
  }, [calcEnergy, calcMass, calcRefIndex]);

  const numField = (labelText: string, value: number, onChange: (v: number) => void, step = "any") => (
    <div>
      <label className={`text-[9px] uppercase font-bold block mb-1 ${label}`}>{labelText}</label>
      <input type="number" step={step} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(parseFloat(e.target.value))} className={numberInput} />
    </div>
  );

  return (
    <div className="space-y-6" id="configuration-tab">
      <p className={`text-[10px] ${label}`}>Research and teaching simulator. Results are not for clinical, dosimetric, or radiation-safety decisions.</p>

      <div className={`border rounded-xl p-4 ${card}`}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400 mb-3">
          <Sparkles className="w-4 h-4" /> Quick load (example settings)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BEAMLINE_PRESETS.map((preset) => (
            <button key={preset.id} onClick={() => onLoadPreset(preset.id)} title={preset.description} className={`text-left border rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer ${isDarkMode ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"}`}>
              {preset.label}
              <div className="text-[10px] font-normal opacity-70 mt-0.5">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className={`border rounded-xl p-4 space-y-4 ${card}`}>
        <h3 className="text-xs font-bold uppercase tracking-wider">Beam</h3>
        <div>
          <label className={`text-[9px] uppercase font-bold block mb-1 ${label}`}>Particle</label>
          <SearchableSelect value={params.isotopeId} onChange={handleIsotopeChange} options={ISOTOPE_PRESETS.map((p) => ({ id: p.id, name: p.name }))} placeholder="Search particles..." isDarkMode={isDarkMode} label="" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {numField("Kinetic energy", params.beamEnergyMeV, (v) => updateParam("beamEnergyMeV", v))}
          <div>
            <label className={`text-[9px] uppercase font-bold block mb-1 ${label}`}>Energy unit</label>
            <select value={params.energyUnit} onChange={(e) => updateParam("energyUnit", e.target.value as SimulationParams["energyUnit"])} className={numberInput}>
              <option value="MeV">MeV</option>
              <option value="GeV">GeV</option>
              <option value="TeV">TeV</option>
            </select>
          </div>
          {numField("Charge Z (units of e)", params.beamCharge, (v) => updateParam("beamCharge", v))}
          {numField("Beam spot FWHM (µm)", params.beamFwhmUm, (v) => updateParam("beamFwhmUm", v))}
          {numField("Magnetic field (T), for Larmor radius", params.magneticFieldT, (v) => updateParam("magneticFieldT", v))}
          {numField("Particles per run", params.numberFiredParticles, (v) => updateParam("numberFiredParticles", Math.max(1, Math.round(v))), "1")}
        </div>
        {params.isotopeId === "custom" && (
          <div className="grid grid-cols-2 gap-3">
            {numField("Rest mass (MeV/c²)", params.customRestMassMeV, (v) => updateParam("customRestMassMeV", v))}
            {numField("Charge (e)", params.customChargeE, (v) => updateParam("customChargeE", v))}
          </div>
        )}
      </div>

      <div className={`border rounded-xl p-4 space-y-4 ${card}`}>
        <h3 className="text-xs font-bold uppercase tracking-wider">Radiator</h3>
        <div>
          <label className={`text-[9px] uppercase font-bold block mb-1 ${label}`}>Material</label>
          <label className={`flex items-center gap-2 text-[10px] mb-2 ${label}`}>
            <input type="checkbox" checked={showUnverifiedMaterials} onChange={(e) => setShowUnverifiedMaterials(e.target.checked)} />
            Show unverified materials (refractive index and absorption not checked against a source)
          </label>
          <SearchableSelect
            value={params.materialId}
            onChange={(id) => updateParam("materialId", id)}
            options={MATERIAL_PRESETS.filter((m) => showUnverifiedMaterials || m.verified || m.id === params.materialId).map((m) => ({ id: m.id, name: m.verified ? m.name : `${m.name} [unverified]` }))}
            placeholder="Search materials..."
            isDarkMode={isDarkMode}
            label=""
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {numField("Thickness (mm)", params.radiatorThicknessMm, (v) => updateParam("radiatorThicknessMm", v))}
          {numField("Track length in radiator (mm)", params.trackLengthMm, (v) => updateParam("trackLengthMm", v))}
          {numField("Temperature (K)", params.chamberTemperatureK, (v) => updateParam("chamberTemperatureK", v))}
        </div>
      </div>

      <div className={`border rounded-xl p-4 space-y-4 ${card}`}>
        <h3 className="text-xs font-bold uppercase tracking-wider">Spectrum and detector</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {numField("Range start (nm)", params.spectralRangeStartNm, (v) => updateParam("spectralRangeStartNm", v))}
          {numField("Range end (nm)", params.spectralRangeEndNm, (v) => updateParam("spectralRangeEndNm", v))}
          {numField("Bin width (nm)", params.binResolutionNm, (v) => updateParam("binResolutionNm", v))}
          {numField("Dead-time fraction (0–1)", params.daq.deadtimeFraction, (v) => updateParam("daq", { deadtimeFraction: Math.min(1, Math.max(0, v || 0)) }))}
          {numField("Quantum efficiency (%)", detector.quantumEfficiencyPct, (v) => updateDetector("quantumEfficiencyPct", v))}
          {numField("Dark counts (Hz)", detector.darkCountRateHz, (v) => updateDetector("darkCountRateHz", v))}
          {numField("Frame rate (Hz)", detector.frameRateHz, (v) => updateDetector("frameRateHz", v))}
        </div>
      </div>

      <div className={`border rounded-xl p-4 space-y-3 ${card}`}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <Calculator className="w-4 h-4" /> Kinematics calculator (standalone)
        </div>
        <div className="grid grid-cols-3 gap-3">
          {numField("Rest mass (MeV/c²)", calcMass, setCalcMass)}
          {numField("Kinetic energy (MeV)", calcEnergy, setCalcEnergy)}
          {numField("Refractive index n", calcRefIndex, setCalcRefIndex)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
          <div><span className={`block text-[9px] uppercase ${label}`}>β</span>{kin.beta.toFixed(6)}</div>
          <div><span className={`block text-[9px] uppercase ${label}`}>γ</span>{kin.gamma.toFixed(4)}</div>
          <div><span className={`block text-[9px] uppercase ${label}`}>Cherenkov angle</span>{kin.emits ? `${kin.angle.toFixed(2)}°` : "below threshold"}</div>
          <div><span className={`block text-[9px] uppercase ${label}`}>Threshold kinetic energy</span>{Number.isFinite(kin.threshold) ? `${kin.threshold.toFixed(4)} MeV` : "no threshold (n ≤ 1)"}</div>
        </div>
      </div>
    </div>
  );
}
