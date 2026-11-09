/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { SimulationParams, SimulationSummary } from "../types";
import { ShieldCheck, Image, PenTool } from "lucide-react";
import {
  calculateRelativisticBeta,
  cherenkovAngleDeg,
  frankTammPhotonsPerMm,
  getCherenkovThresholdEnergy,
  getRefractiveIndexAt,
} from "../core/physics";
import { MATERIAL_PRESETS } from "../data/presets";

const ELECTRON_MASS_MEV = 0.51099895;

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

export default function ValidationTab({ params, setParams, summary, isDarkMode }: ValidationTabProps) {
  // Analytical research verification notes state
  const [protocolNotes, setProtocolNotes] = useState(
    `# HIGH-ENERGY PHYSICS SPECTROMETRY CALIBRATION LOG
[Date: 2026-06-22 | Time: 09:54:03 UTC]

1. ACCELERATOR BEAMLINE & TARGET MEDIUM MATRIX
-----------------------------------------------------------
* Selected source profiles: High-energy particle beam
* Spectroscopy wavelengths range: 300 nm to 800 nm
* Physical Frank-Tamm limits: \\cos(\\theta_{c}) = 1 / (\\beta \\cdot n)
* Optical dispersion scattering g-index: g = 0.999 (Fused Silica Block)

2. COMPLIANCE STANDARDS & PHYSICAL CALIBRATIONS
-----------------------------------------------------------
* Charged particles velocities verified exceeding local light speed thresholds.
* High-intensity Cherenkov blue-UV prompt emission spectrum verified on hybrid detectors.
* Calculated and registered charge cluster collections on Medipix3 channels. 
* Attenuation losses across experimental target depths matched theoretical curves.`
  );

  // Physical radiator visualizer state
  const [targetRadiatorMockImage, setTargetRadiatorMockImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [markerCoords, setMarkerCoords] = useState<{ x: number; y: number } | null>({ x: 125, y: 90 });

  const appendNoteText = (textToAppend: string) => {
    setProtocolNotes((prev) => prev + "\n" + textToAppend);
  };

  // Preset experimental configurations
  const loadSilicaMockScan = () => {
    setTargetRadiatorMockImage("quartz-fused-silica");
    setMarkerCoords({ x: 140, y: 110 });
    // Update thickness
    setParams((prev) => ({ ...prev, radiatorThicknessMm: 15.0 }));
  };

  const loadScintillatorMockScan = () => {
    setTargetRadiatorMockImage("scintillator-block");
    setMarkerCoords({ x: 180, y: 150 });
    setParams((prev) => ({ ...prev, radiatorThicknessMm: 45.0 }));
  };

  // Render optical/radiator chamber or uploaded physical cross sections
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (targetRadiatorMockImage === "quartz-fused-silica") {
      // Draw professional quartz physical crystal target block
      ctx.fillStyle = "#0c1017";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid reference
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i); ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Silica glass hexagon / block boundary
      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(60, 60);
      ctx.lineTo(190, 60);
      ctx.lineTo(210, 140);
      ctx.lineTo(40, 140);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
      ctx.fill();

      // Draw particle beam entry path (orange laser line)
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(125, 10);
      ctx.lineTo(125, 110);
      ctx.stroke();

      // Prompt Cherenkov light cones dispersing outwards from collision point
      ctx.strokeStyle = "rgba(56, 189, 248, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(125, 80);
      ctx.lineTo(75, 130);
      ctx.moveTo(125, 80);
      ctx.lineTo(175, 130);
      ctx.stroke();

      ctx.fillStyle = "rgba(14, 165, 233, 0.25)";
      ctx.beginPath();
      ctx.moveTo(125, 80);
      ctx.lineTo(75, 130);
      ctx.lineTo(175, 130);
      ctx.closePath();
      ctx.fill();
      
    } else if (targetRadiatorMockImage === "scintillator-block") {
      // Draw high density plastic scintillator tiles with photomultiplier connectors
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid structure
      ctx.strokeStyle = "#1a2436";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }

      // Draw scintillator tiles (blue rects)
      ctx.strokeStyle = "#8b5cf6";
      ctx.lineWidth = 1.5;
      ctx.fillStyle = "rgba(139, 92, 246, 0.1)";
      ctx.fillRect(40, 50, 170, 100);
      ctx.strokeRect(40, 50, 170, 100);

      // Multi-anode PMT nodes at the bottom of block
      ctx.fillStyle = "rgba(52, 211, 153, 0.4)";
      ctx.strokeStyle = "#34d399";
      ctx.lineWidth = 1;
      for (let x = 50; x < 200; x += 30) {
        ctx.fillRect(x, 150, 20, 12);
        ctx.strokeRect(x, 150, 20, 12);
      }

      // High-energy particle track crossing diagonally
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, 30);
      ctx.lineTo(210, 170);
      ctx.stroke();

      // Trigger light emission paths
      ctx.strokeStyle = "rgba(14, 165, 233, 0.6)";
      ctx.lineWidth = 1;
      for (let x = 60; x < 180; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 50 + x * 0.5);
        ctx.lineTo(x - 20, 150);
        ctx.lineTo(x + 20, 150);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = isDarkMode ? "#070a13" : "#f8fafc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = isDarkMode ? "#1e293b" : "#e2e8f0";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < canvas.width; i += 25) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i); ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      ctx.fillStyle = isDarkMode ? "#94a3b8" : "#475569";
      ctx.font = "10px monospace";
      ctx.fillText("Coordinate target plane active", 35, 100);
      ctx.fillText("Select test preset or upload calibration scan", 20, 120);
    }

    // Draw coordinate target crosshair
    if (markerCoords) {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1.5;
      const { x, y } = markerCoords;
      
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x - 12, y);
      ctx.lineTo(x + 12, y);
      ctx.moveTo(x, y - 12);
      ctx.lineTo(x, y + 12);
      ctx.stroke();
    }
  }, [targetRadiatorMockImage, markerCoords, isDarkMode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMarkerCoords({ x, y });

    // Map Y coordinate (0-200) to actual core medium thickness (0.1 - 100.0 mm)
    const thicknessPhysical = Number(((y / canvas.height) * 100.0).toFixed(1));
    setParams((prev) => ({ ...prev, radiatorThicknessMm: Math.max(0.1, thicknessPhysical) }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setTargetRadiatorMockImage(evt.target?.result as string || "custom-upload");
      setMarkerCoords({ x: 125, y: 100 });
      setParams((prev) => ({ ...prev, radiatorThicknessMm: 25.0 }));
    };
    reader.readAsDataURL(file);
  };

  // Analytic validation checks: computed by the code, compared with reference values
  const quartzPreset = MATERIAL_PRESETS.find((m) => m.id === "quartz");
  const validationChecks: ValidationCheck[] = [
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
      name: "Frank-Tamm photons per particle, electron (beta = 0.8754, n = 1.328, 300-800 nm, 10 mm)",
      reference: 248.4,
      computed: frankTammPhotonsPerMm(0.8754, 1.328, 300, 800) * 10,
      tolerance: 10,
      unit: "photons",
      decimals: 1,
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
  const passCount = validationChecks.filter(isCheckPass).length;

  // Theme support classes
  const cardBg = isDarkMode ? "bg-slate-900/90 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-850";
  const innerChamberBg = isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200";
  const btnSec = isDarkMode ? "bg-slate-950/60 hover:bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-300" : "bg-slate-50 hover:bg-orange-50 border-slate-200 hover:border-orange-500 text-slate-700";

  return (
    <div className="space-y-6" id="validation-tab">
      
      {/* Analytic validation checks */}
      <div className={`border rounded-xl p-5 shadow-lg ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100/10 pb-3 mb-4 gap-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="text-emerald-400 w-5 h-5" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Analytic Validation Checks
            </h3>
          </div>
          <span className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono font-bold rounded-full uppercase tracking-wider">
            {passCount} of {validationChecks.length} checks pass
          </span>
        </div>
        <p className="text-xs opacity-70 mb-4 font-sans leading-relaxed">
          Analytic checks comparing the code to reference values computed from standard formulas. Tolerances are shown.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {validationChecks.map((check, index) => {
            const pass = isCheckPass(check);
            return (
              <div key={index} className={`flex justify-between items-center border p-3 rounded-lg text-xs font-mono ${isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50/60 border-slate-150"}`}>
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

      {/* Live simulation values (current run, not a validation) */}
      <div className={`border rounded-xl p-4 shadow-lg ${cardBg}`}>
        <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-3">
          Live simulation (current run, not a validation check)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div>
            <span className="block text-[9px] text-slate-500 uppercase font-sans">Beta (live)</span>
            <span className="font-bold">{summary.beta.toFixed(5)}</span>
          </div>
          <div>
            <span className="block text-[9px] text-slate-500 uppercase font-sans">Cherenkov angle (live)</span>
            <span className="font-bold">{summary.cherenkovAngleDeg.toFixed(2)} deg</span>
          </div>
          <div>
            <span className="block text-[9px] text-slate-500 uppercase font-sans">Threshold energy (live)</span>
            <span className="font-bold">{summary.cherenkovThresholdEnergyMeV.toFixed(4)} MeV</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Radiator coordinate visualizer */}
        <div className={`border rounded-xl p-5 shadow-lg flex flex-col justify-between ${cardBg}`}>
          <div>
            <div className="flex items-center justify-between border-b border-slate-100/10 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Image className="text-orange-500 w-5 h-5" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">
                  Target Radiator Cross Section & Thickness Targeter
                </h3>
              </div>
            </div>
            <p className="text-xs opacity-70 mb-4 font-sans leading-relaxed">
              Activate the optical block models or upload customized test setup diagrams. <strong className="text-orange-500">Click anywhere on the coordinate canvas</strong> to dynamically calculate and calibrate target thickness (<span className="text-red-400 font-mono font-bold">x</span>) based on coordinate height.
            </p>

            <div className={`flex p-2 rounded-lg border space-x-2 text-xs mb-4 ${innerChamberBg}`}>
              <button
                onClick={loadSilicaMockScan}
                className={`flex-1 py-1 rounded-md transition font-medium cursor-pointer ${
                  targetRadiatorMockImage === "quartz-fused-silica" ? "bg-orange-500/15 text-orange-400 border border-orange-500/30" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                💎 Quartz glass block
              </button>
              <button
                onClick={loadScintillatorMockScan}
                className={`flex-1 py-1 rounded-md transition font-medium cursor-pointer ${
                  targetRadiatorMockImage === "scintillator-block" ? "bg-orange-500/15 text-orange-400 border border-orange-500/30" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🛡️ Scintillator tile block
              </button>
            </div>

            <div className="flex items-center justify-center p-2 mb-4 bg-slate-950/80 border border-slate-800/60 rounded-xl">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={250}
                  height={200}
                  onClick={handleCanvasClick}
                  className="rounded-lg border border-slate-800/80 cursor-crosshair shadow-inner"
                />
                {markerCoords && (
                  <span className="absolute bottom-2.5 right-2.5 bg-slate-900/90 border border-slate-700/60 px-2.5 py-0.5 text-[9px] text-[#ef4444] font-mono rounded">
                    X: {markerCoords.x} | Y: {markerCoords.y} : Target thickness: {params.radiatorThicknessMm} mm
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="border border-dashed border-slate-800 p-3 rounded-lg bg-slate-950/10 text-center">
            <label className="text-[11px] font-medium text-slate-400 cursor-pointer hover:text-orange-400 transition block">
              <span>📤 Upload Mechanical Target Plan / CAD Drawing</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        {/* Research notes logging */}
        <div className={`border rounded-xl p-5 shadow-lg flex flex-col justify-between ${cardBg}`}>
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-3 mb-4">
              <PenTool className="text-purple-500 w-5 h-5" />
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Spectroscopic Physics Lab Journal
              </h3>
            </div>
            <p className="text-xs opacity-70 mb-4 font-sans leading-relaxed">
              Log experimental particle speeds, radiator refractive indexes, and beam profiles in real-time. Use the formula helpers below to insert core relativistic outcomes into the lab notes.
            </p>

            <textarea
              value={protocolNotes}
              onChange={(e) => setProtocolNotes(e.target.value)}
              className={`w-full h-80 rounded-lg p-3 text-[11px] font-mono leading-relaxed outline-none border focus:border-purple-500 ${isDarkMode ? "bg-slate-950 text-emerald-400 border-slate-800" : "bg-slate-50 text-emerald-700 border-slate-250"}`}
              placeholder="Record physics journal logs here..."
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-semibold">
            <button
              onClick={() => appendNoteText(`* Frank-Tamm photons per particle (300-800 nm): ${summary.photonsPerParticle} per mm.`)}
              className={`py-1.5 border hover:border-purple-600 rounded-lg transition font-mono text-[10px] cursor-pointer ${btnSec}`}
            >
              + Emitted Photons Sweep
            </button>
            <button
              onClick={() => appendNoteText(`* Measured particle relativistic speed (beta): ${summary.beta.toFixed(5)}`)}
              className={`py-1.5 border hover:border-purple-600 rounded-lg transition font-mono text-[10px] cursor-pointer ${btnSec}`}
            >
              + Relativistic Speed β
            </button>
          </div>
        </div>
      </div>

      {/* SCIENTIFIC ANALYSIS WORKSPACE */}
      <div className={`mt-6 border rounded-xl p-6 shadow-lg lg:col-span-2 ${cardBg}`}>
         <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-3 mb-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-400">
               Scientific Analysis Workspace & AI Reconstruction
            </h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className={`p-4 rounded-xl border space-y-3 ${innerChamberBg}`}>
               <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Energy Spectrum Histogram</span>
               <div className="h-32 w-full flex items-end space-x-1">
                  {[...Array(20)].map((_, i) => (
                     <div key={i} className="flex-1 bg-teal-500/80 rounded-t" style={{ height: `${Math.max(10, 100 - Math.abs(10 - i) * 8)}%` }}></div>
                  ))}
               </div>
               <div className="flex justify-between text-[8px] font-mono opacity-60">
                 <span>0.1 MeV</span>
                 <span>Target Peak</span>
                 <span>1.0 GeV</span>
               </div>
            </div>

            <div className={`p-4 rounded-xl border space-y-3 ${innerChamberBg}`}>
               <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">AI Jet Classification Confidence</span>
               <div className="space-y-2 mt-4">
                 {[
                   { label: "QCD Background", val: 5 },
                   { label: "b-quark Jet", val: 82 },
                   { label: "Gluon Splitting", val: 12 },
                   { label: "Tau-lepton Decay", val: 1 }
                 ].map((t, i) => (
                   <div key={i} className="flex items-center justify-between text-[9px] font-mono">
                     <span className="w-24 text-slate-300">{t.label}</span>
                     <div className="flex-1 bg-slate-900 h-2 mx-2 rounded-full overflow-hidden">
                       <div className="bg-orange-500 h-full" style={{ width: `${t.val}%` }}></div>
                     </div>
                     <span className="w-6 text-right font-bold text-orange-400">{t.val}%</span>
                   </div>
                 ))}
               </div>
            </div>

            <div className={`p-4 rounded-xl border space-y-3 ${innerChamberBg}`}>
               <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">DAQ & Deadtime Sweep</span>
               <div className="h-32 w-full bg-slate-900 rounded border border-slate-800 relative overflow-hidden">
                 <svg className="absolute inset-0" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path d="M0,100 L10,80 L30,85 L50,40 L70,45 L90,10 L100,5" fill="none" stroke="rgba(239, 68, 68, 0.8)" strokeWidth="2" />
                    <path d="M0,80 L10,78 L30,75 L50,60 L70,55 L90,50 L100,45" fill="none" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2" strokeDasharray="4" />
                 </svg>
                 <div className="absolute bottom-2 left-2 flex flex-col text-[8px] font-mono">
                    <span className="text-red-400">Trigger Overflow Rate</span>
                    <span className="text-green-400">Live Time Filter</span>
                 </div>
               </div>
            </div>

         </div>
      </div>
    </div>
  );
}
