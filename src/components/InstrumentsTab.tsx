/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Calculator, Zap, Gauge, Hexagon, Microscope } from "lucide-react";

interface InstrumentsTabProps {
  isDarkMode: boolean;
}

export default function InstrumentsTab({ isDarkMode }: InstrumentsTabProps) {
  const cardBg = isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200";
  const panelBg = isDarkMode ? "bg-slate-950" : "bg-slate-50";
  const textTitle = isDarkMode ? "text-slate-100" : "text-slate-800";
  const textBody = isDarkMode ? "text-slate-400" : "text-slate-600";
  const inputBg = isDarkMode ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-800";

  // --- Relativistic Kinematics State ---
  const [kinParticleMass, setKinParticleMass] = useState<number>(0.511); // MeV (electron)
  const [kinKineticEnergy, setKinKineticEnergy] = useState<number>(1.0); // MeV

  const gamma = 1 + (kinKineticEnergy / kinParticleMass);
  const beta = Math.sqrt(Math.max(0, 1 - (1 / (gamma * gamma))));
  const momentum = kinParticleMass * gamma * beta;
  const totalEnergy = kinParticleMass + kinKineticEnergy;

  // --- Sellmeier Dispersion State ---
  const [sellWavelength, setSellWavelength] = useState<number>(400); // nm
  // Preset for Fused Silica
  const B1 = 0.6961663;
  const B2 = 0.4079426;
  const B3 = 0.8974794;
  const C1 = 0.0684043;
  const C2 = 0.1162414;
  const C3 = 9.896161;
  const lambdaUm = sellWavelength / 1000;
  const l2 = lambdaUm * lambdaUm;
  let nSquare = 1;
  if (l2 !== C1*C1 && l2 !== C2*C2 && l2 !== C3*C3) {
    nSquare = 1 + (B1 * l2) / (l2 - C1*C1) + (B2 * l2) / (l2 - C2*C2) + (B3 * l2) / (l2 - C3*C3);
  }
  const sellRefIndex = nSquare > 0 ? Math.sqrt(nSquare) : 1;

  // --- TOF Calculator State ---
  const [tofDistance, setTofDistance] = useState<number>(10); // meters
  const [tofMass1, setTofMass1] = useState<number>(139.57); // Pion
  const [tofMass2, setTofMass2] = useState<number>(493.67); // Kaon
  const [tofMomentum, setTofMomentum] = useState<number>(3000); // MeV/c

  const c_mps = 299792458; // m/s
  const beta1 = tofMomentum / Math.sqrt(tofMomentum * tofMomentum + tofMass1 * tofMass1);
  const beta2 = tofMomentum / Math.sqrt(tofMomentum * tofMomentum + tofMass2 * tofMass2);
  const t1 = tofDistance / (beta1 * c_mps);
  const t2 = tofDistance / (beta2 * c_mps);
  const deltaT_ps = Math.abs(t1 - t2) * 1e12; // in picoseconds

  return (
    <div className="space-y-6 animate-fade">
      <div className="flex flex-col mb-2">
        <h2 className={`text-xl font-black uppercase tracking-tight flex items-center space-x-2 ${textTitle}`}>
          <Microscope className="w-6 h-6 text-emerald-500" />
          <span>Scientific Instruments & Calculators</span>
        </h2>
        <p className={`text-xs mt-1 font-mono ${textBody}`}>
          High-precision standalone analytical modules for High-Energy Physics
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Relativistic Kinematics Calculator */}
        <div className={`border rounded-xl p-6 shadow-xl ${cardBg}`}>
          <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-4 mb-5">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className={`text-sm font-extrabold uppercase tracking-wide ${textTitle}`}>Relativistic Kinematics</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textBody}`}>Particle Mass (MeV/c²)</label>
              <input
                type="number"
                value={kinParticleMass}
                onChange={(e) => setKinParticleMass(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-lg text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${inputBg}`}
                min={0.1}
                step={0.1}
              />
              <div className="flex gap-1 mt-1.5">
                <button onClick={() => setKinParticleMass(0.511)} className="text-[9px] px-1.5 py-0.5 bg-slate-500/20 rounded hover:bg-amber-500/20 text-slate-400 hover:text-amber-400">e⁻</button>
                <button onClick={() => setKinParticleMass(105.658)} className="text-[9px] px-1.5 py-0.5 bg-slate-500/20 rounded hover:bg-amber-500/20 text-slate-400 hover:text-amber-400">μ⁻</button>
                <button onClick={() => setKinParticleMass(938.272)} className="text-[9px] px-1.5 py-0.5 bg-slate-500/20 rounded hover:bg-amber-500/20 text-slate-400 hover:text-amber-400">p⁺</button>
              </div>
            </div>
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textBody}`}>Kinetic Energy (MeV)</label>
              <input
                type="number"
                value={kinKineticEnergy}
                onChange={(e) => setKinKineticEnergy(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-lg text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${inputBg}`}
                min={0}
                step={1}
              />
            </div>
          </div>

          <div className={`p-4 rounded-xl space-y-3 ${panelBg}`}>
            <div className="flex justify-between items-center border-b border-slate-200/5 pb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${textBody}`}>Velocity (β = v/c)</span>
              <span className="text-sm font-mono font-bold text-amber-500">{beta.toFixed(6)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/5 pb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${textBody}`}>Lorentz Factor (γ)</span>
              <span className="text-sm font-mono font-bold text-teal-400">{gamma.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/5 pb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${textBody}`}>Momentum (p)</span>
              <span className="text-sm font-mono font-bold text-blue-400">{momentum.toFixed(2)} MeV/c</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-bold uppercase tracking-wider ${textBody}`}>Total Energy (E)</span>
              <span className="text-sm font-mono font-bold text-rose-400">{totalEnergy.toFixed(2)} MeV</span>
            </div>
          </div>
        </div>

        {/* TOF Resolution Calculator */}
        <div className={`border rounded-xl p-6 shadow-xl ${cardBg}`}>
          <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-4 mb-5">
            <Gauge className="w-5 h-5 text-blue-500" />
            <h3 className={`text-sm font-extrabold uppercase tracking-wide ${textTitle}`}>Time-Of-Flight (TOF) Resolution</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="col-span-1">
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textBody}`}>Dist (m)</label>
              <input
                type="number"
                value={tofDistance}
                onChange={(e) => setTofDistance(Number(e.target.value))}
                className={`w-full px-2 py-2 rounded-lg text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${inputBg}`}
              />
            </div>
            <div className="col-span-1">
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textBody}`}>Mass 1 (MeV)</label>
              <input
                type="number"
                value={tofMass1}
                onChange={(e) => setTofMass1(Number(e.target.value))}
                className={`w-full px-2 py-2 rounded-lg text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${inputBg}`}
              />
            </div>
            <div className="col-span-1">
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textBody}`}>Mass 2 (MeV)</label>
              <input
                type="number"
                value={tofMass2}
                onChange={(e) => setTofMass2(Number(e.target.value))}
                className={`w-full px-2 py-2 rounded-lg text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${inputBg}`}
              />
            </div>
            <div className="col-span-3">
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textBody}`}>Beam Momentum (MeV/c)</label>
              <input
                type="number"
                value={tofMomentum}
                onChange={(e) => setTofMomentum(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-lg text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${inputBg}`}
              />
            </div>
          </div>

          <div className={`p-4 rounded-xl flex flex-col items-center justify-center space-y-2 border border-blue-500/20 ${panelBg}`}>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${textBody}`}>Expected Time Difference (Δt)</span>
            <span className="text-3xl font-black text-blue-500 font-mono tracking-tighter">
              {deltaT_ps > 10000 ? (deltaT_ps / 1000).toFixed(2) + " ns" : deltaT_ps.toFixed(1) + " ps"}
            </span>
            <p className="text-[9px] text-slate-500 text-center mt-2 max-w-[80%]">
              For 3σ separation, your detector needs a timing resolution better than {(deltaT_ps / 3).toFixed(1)} ps.
            </p>
          </div>
        </div>

        {/* Sellmeier Dispersion Solver */}
        <div className={`border rounded-xl p-6 shadow-xl ${cardBg} xl:col-span-2`}>
          <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-4 mb-5">
            <Hexagon className="w-5 h-5 text-emerald-500" />
            <h3 className={`text-sm font-extrabold uppercase tracking-wide ${textTitle}`}>Sellmeier Dispersion Solver (Fused Silica)</h3>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-1/3">
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${textBody}`}>Target Wavelength (nm)</label>
              <input
                type="range"
                min={200}
                max={1000}
                step={1}
                value={sellWavelength}
                onChange={(e) => setSellWavelength(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-500">
                <span>200nm (UV)</span>
                <span className="text-emerald-500 font-bold text-sm">{sellWavelength} nm</span>
                <span>1000nm (IR)</span>
              </div>
            </div>

            <div className={`w-full md:w-2/3 p-5 rounded-xl border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between ${panelBg}`}>
              <div>
                <span className={`block text-[10px] font-bold uppercase tracking-widest mb-1 ${textBody}`}>Refractive Index n(λ)</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-emerald-500 font-mono">{sellRefIndex.toFixed(5)}</span>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 text-right">
                <span className={`block text-[10px] font-bold uppercase tracking-widest mb-1 ${textBody}`}>Phase Velocity</span>
                <span className="text-sm font-bold text-teal-400 font-mono">{(299792458 / sellRefIndex).toExponential(3)} m/s</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
