import React, { useEffect, useRef, useState } from "react";
import { SimulationParams } from "../types";
import { Activity, Database, Zap, Binary, Box, BarChart2, Hash, Workflow } from "lucide-react";

interface MonteCarloTabProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  isDarkMode: boolean;
}

export default function MonteCarloTab({ params, setParams, isDarkMode }: MonteCarloTabProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);

  // Mini 3D viewer animation loop
  useEffect(() => {
    let animFrame: number;
    const step = () => {
      setRotation(prev => (prev + 0.5) % 360);
      animFrame = requestAnimationFrame(step);
    };
    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Mini 3D viewer rendering logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const scale = 3.5;

    const radY = (rotation * Math.PI) / 180;
    const radX = (15 * Math.PI) / 180; // Fixed isometric tilt

    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);
    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);

    const project = (x: number, y: number, z: number) => {
      const rotY_X = x * cosY - z * sinY;
      const rotY_Z = x * sinY + z * cosY;
      const rotX_Y = y * cosX - rotY_Z * sinX;
      return {
        screenX: cx + rotY_X * scale,
        screenY: cy - rotX_Y * scale
      };
    };

    const drawSubsystemLayers = () => {
      const layers = [
        { active: params.detectorSubsystems?.pixelTracker, r: 2, l: 20, outline: "rgba(168, 85, 247, 0.8)" },    // Purple
        { active: params.detectorSubsystems?.stripTracker, r: 4, l: 24, outline: "rgba(168, 85, 247, 0.6)" },
        { active: params.detectorSubsystems?.tpc,          r: 6, l: 26, outline: "rgba(59, 130, 246, 0.7)" },     // Blue
        { active: params.detectorSubsystems?.driftChamber, r: 7, l: 27, outline: "rgba(6, 182, 212, 0.7)" },      // Cyan
        { active: params.detectorSubsystems?.ecal,         r: 8, l: 28, outline: "rgba(34, 197, 94, 0.7)" },      // Green
        { active: params.detectorSubsystems?.hcal,         r: 11, l: 30, outline: "rgba(234, 179, 8, 0.6)" },     // Yellow
        { active: params.detectorSubsystems?.rich,         r: 13, l: 32, outline: "rgba(236, 72, 153, 0.7)" },    // Pink
        { active: params.detectorSubsystems?.muonSpectrometer, r: 15, l: 34, outline: "rgba(249, 115, 22, 0.6)" },// Orange
      ];

      layers.forEach(layer => {
        if (!layer.active) return;
        ctx.lineWidth = 1;
        ctx.strokeStyle = layer.outline;
        
        // Front and back rings
        [-layer.l/2, layer.l/2].forEach(zPos => {
           ctx.beginPath();
           for (let theta = 0; theta <= Math.PI * 2; theta += 0.2) {
             const p = project(layer.r * Math.cos(theta), layer.r * Math.sin(theta), zPos);
             if (theta === 0) ctx.moveTo(p.screenX, p.screenY);
             else ctx.lineTo(p.screenX, p.screenY);
           }
           ctx.closePath();
           ctx.stroke();
        });
        
        // Staves connecting them
        for (let i = 0; i < 6; i++) {
           const theta = (i / 6) * Math.PI * 2;
           const pStart = project(layer.r * Math.cos(theta), layer.r * Math.sin(theta), -layer.l/2);
           const pEnd = project(layer.r * Math.cos(theta), layer.r * Math.sin(theta), layer.l/2);
           ctx.beginPath();
           ctx.moveTo(pStart.screenX, pStart.screenY);
           ctx.lineTo(pEnd.screenX, pEnd.screenY);
           ctx.stroke();
        }
      });
    };

    drawSubsystemLayers();
  }, [rotation, params.detectorSubsystems]);

  const updateParam = (key: keyof SimulationParams, value: any) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const updateNested = (category: keyof SimulationParams, key: string, value: any) => {
    setParams((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] as object),
        [key]: value
      }
    }));
  };

  const cardBg = isDarkMode ? "bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-white/5" : "bg-white border-slate-200";
  const textTitle = isDarkMode ? "text-slate-100" : "text-slate-800";
  const textLabel = isDarkMode ? "text-slate-400" : "text-slate-500";
  const inputBg = isDarkMode ? "bg-slate-950/80 text-slate-100 border-white/10" : "bg-white text-slate-800 border-slate-200";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Monte Carlo Engine Header */}
      <div className={`border p-6 rounded-xl shadow-lg relative overflow-hidden ${cardBg}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <h2 className={`text-xl font-black tracking-widest uppercase font-sans mb-1 flex items-center gap-2 ${textTitle}`}>
              <Workflow className="w-6 h-6 text-orange-500" />
              Monte Carlo Event Generation Framework
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Integrate PYTHIA8, HERWIG, and GEANT4-style stochastic event propagation and advanced hadronic interaction generation.
            </p>
          </div>
          <div className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-500 font-bold font-mono text-[10px] tracking-wider uppercase">
            {params.simulationMode} MODE
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Generator Selection */}
        <div className={`border p-5 rounded-xl shadow-sm space-y-4 ${cardBg}`}>
          <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-3">
            <Database className="w-5 h-5 text-emerald-500" />
            <h3 className={`text-xs font-extrabold tracking-wider uppercase font-sans ${textTitle}`}>
              Event Generator Engine
            </h3>
          </div>

          <div className="space-y-3">
            <label className={`block text-[10px] font-bold uppercase tracking-wider ${textLabel}`}>
              Primary Generator
            </label>
            <select
              value={params.monteCarloGenerator}
              onChange={(e) => updateParam("monteCarloGenerator", e.target.value)}
              className={`w-full text-xs p-2 rounded-lg border outline-none focus:border-orange-500 transition ${inputBg}`}
            >
              <option value="NONE">Standard Deterministic</option>
              <option value="PYTHIA8">PYTHIA 8 (Hadronization/Showers)</option>
              <option value="HERWIG">HERWIG (Cluster Hadronization)</option>
              <option value="GEANT4_FAST">GEANT4 (Fast Sim Mode)</option>
            </select>

            <label className={`block text-[10px] font-bold uppercase tracking-wider mt-4 ${textLabel}`}>
              Statistical Event Volume
            </label>
            <select
              value={params.mcEventsPerRun}
              onChange={(e) => updateParam("mcEventsPerRun", Number(e.target.value))}
              className={`w-full text-xs p-2 rounded-lg border outline-none focus:border-orange-500 transition ${inputBg}`}
            >
              <option value={10}>10 Events (Debug)</option>
              <option value={100}>100 Events</option>
              <option value={1000}>1,000 Events</option>
              <option value={100000}>100,000 Events</option>
              <option value={1000000}>1,000,000+ Events (High Compute)</option>
            </select>
          </div>
        </div>

        {/* Physics Interaction Toggles */}
        <div className={`border p-5 rounded-xl shadow-sm space-y-4 ${cardBg}`}>
          <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-3">
            <Zap className="w-5 h-5 text-blue-500" />
            <h3 className={`text-xs font-extrabold tracking-wider uppercase font-sans ${textTitle}`}>
              Particle Interactions
            </h3>
          </div>

          <div className="space-y-2">
            {[
              { id: 'hadronicShower', label: 'Hadronic Showers (QCD)' },
              { id: 'muonDecay', label: 'Muon Decay Cascades' },
              { id: 'bMesonDecay', label: 'B-Meson Resonances' },
              { id: 'kaonDecay', label: 'Kaon Decay Chains' },
              { id: 'pairProduction', label: 'Pair Production' },
              { id: 'comptonScattering', label: 'Compton Scattering' }
            ].map((interaction) => (
              <label key={interaction.id} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={(params.componentsActive as any)[interaction.id]}
                  onChange={(e) => updateNested("componentsActive", interaction.id, e.target.checked)}
                  className="w-4 h-4 text-orange-500 rounded border-slate-700 bg-slate-900 focus:ring-orange-500 focus:ring-offset-slate-900"
                />
                <span className={`text-[11px] font-bold tracking-wide transition ${textLabel} group-hover:text-orange-400`}>
                  {interaction.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Optical & Detector Modules */}
        <div className={`border p-5 rounded-xl shadow-sm space-y-4 ${cardBg}`}>
          <div className="flex items-center justify-between border-b border-slate-100/10 pb-3">
            <div className="flex items-center space-x-2">
              <Box className="w-5 h-5 text-purple-500" />
              <h3 className={`text-xs font-extrabold tracking-wider uppercase font-sans ${textTitle}`}>
                Detector Subsystems
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Toggles */}
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'pixelTracker', label: 'Pixel Tracker' },
                { id: 'stripTracker', label: 'Strip Tracker' },
                { id: 'tpc', label: 'Time Proj. Chamber' },
                { id: 'driftChamber', label: 'Drift Chamber' },
                { id: 'ecal', label: 'EM Calorimeter (ECAL)' },
                { id: 'hcal', label: 'Hadronic Cal. (HCAL)' },
                { id: 'muonSpectrometer', label: 'Muon Spectrometer' },
                { id: 'rich', label: 'RICH Detector' }
              ].map((sub) => (
                <label key={sub.id} className="flex items-center space-x-2 cursor-pointer group p-1.5 rounded hover:bg-white/5 transition">
                  <input
                    type="checkbox"
                    checked={(params.detectorSubsystems as any)[sub.id]}
                    onChange={(e) => updateNested("detectorSubsystems", sub.id, e.target.checked)}
                    className="w-3.5 h-3.5 text-purple-500 rounded border-slate-700 bg-slate-900 focus:ring-purple-500 focus:ring-offset-slate-900"
                  />
                  <span className={`text-[10px] font-bold tracking-wide transition ${textLabel} group-hover:text-purple-400`}>
                    {sub.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Mini 3D Viewer */}
            <div className="flex flex-col items-center justify-center bg-slate-950/50 rounded-lg border border-slate-800/50 relative overflow-hidden">
              <div className="absolute top-2 left-2 flex items-center space-x-1 opacity-50">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest">3D Sync Live</span>
              </div>
              <canvas
                ref={canvasRef}
                width={200}
                height={200}
                className="w-full max-w-[160px] aspect-square opacity-80 mix-blend-screen pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* ML Reconstruction Module */}
        <div className={`border p-5 rounded-xl shadow-sm space-y-4 ${cardBg}`}>
          <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-3">
            <Binary className="w-5 h-5 text-rose-500" />
            <h3 className={`text-xs font-extrabold tracking-wider uppercase font-sans ${textTitle}`}>
              ML Reconstruction
            </h3>
          </div>

          <div className="space-y-2">
            {[
              { id: 'kalmanFilter', label: 'Kalman Filter Track Fit' },
              { id: 'helixFitting', label: 'Magnetic Helix Fitting' },
              { id: 'vertexReconstruction', label: 'Primary Vertex Reco' },
              { id: 'mlJetClassification', label: 'ML Jet Classification' },
              { id: 'mlAnomalyDetection', label: 'BSM Anomaly Detection' }
            ].map((reco) => (
              <label key={reco.id} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={(params.reconstruction as any)[reco.id]}
                  onChange={(e) => updateNested("reconstruction", reco.id, e.target.checked)}
                  className="w-4 h-4 text-rose-500 rounded border-slate-700 bg-slate-900 focus:ring-rose-500 focus:ring-offset-slate-900"
                />
                <span className={`text-[11px] font-bold tracking-wide transition ${textLabel} group-hover:text-rose-400`}>
                  {reco.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Exotic Physics Box */}
        <div className={`border p-5 rounded-xl shadow-sm space-y-4 ${cardBg} border-amber-500/20`}>
          <div className="flex items-center space-x-2 border-b border-amber-500/20 pb-3">
            <Activity className="w-5 h-5 text-amber-500" />
            <h3 className={`text-xs font-extrabold tracking-wider uppercase font-sans text-amber-500`}>
              Exotic Physics Sandbox
            </h3>
          </div>

          <div className="space-y-2">
            {[
              { id: 'supersymmetry', label: 'Supersymmetry (SUSY)' },
              { id: 'darkMatter', label: 'Dark Matter Candidates' },
              { id: 'magneticMonopoles', label: 'Magnetic Monopoles' },
              { id: 'sterileNeutrinos', label: 'Sterile Neutrinos' },
              { id: 'extraDimensions', label: 'Extra Dimensions' }
            ].map((exo) => (
              <label key={exo.id} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={(params.exoticPhysics as any)[exo.id]}
                  onChange={(e) => updateNested("exoticPhysics", exo.id, e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-slate-700 bg-slate-900 focus:ring-amber-500 focus:ring-offset-slate-900"
                />
                <span className={`text-[11px] font-bold tracking-wide transition ${textLabel} group-hover:text-amber-400`}>
                  {exo.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Scientific Calculators Box */}
        <div className={`border p-5 rounded-xl shadow-sm space-y-4 ${cardBg} border-blue-500/20`}>
          <div className="flex items-center space-x-2 border-b border-blue-500/20 pb-3">
            <Hash className="w-5 h-5 text-blue-500" />
            <h3 className={`text-xs font-extrabold tracking-wider uppercase font-sans text-blue-500`}>
              Scientific Calculators
            </h3>
          </div>

          <div className="space-y-4 mt-4 text-[10px] font-mono text-slate-300">
             <div className="flex justify-between items-center bg-black/20 p-2 rounded">
               <span className="opacity-70 text-[9px] uppercase tracking-wider">Center of Mass Energy (√s)</span>
               <span className="font-bold text-blue-400">{(Math.sqrt(2 * 0.938 * params.beamEnergyMeV)).toFixed(2)} MeV</span>
             </div>
             <div className="flex justify-between items-center bg-black/20 p-2 rounded">
               <span className="opacity-70 text-[9px] uppercase tracking-wider">Time of Flight (1m)</span>
               <span className="font-bold text-emerald-400">{ (1 / (3e8 * Math.sqrt(1 - Math.pow(0.938/(params.beamEnergyMeV+0.938), 2)))) * 1e9 | 0 } ns</span>
             </div>
             <div className="flex justify-between items-center bg-black/20 p-2 rounded">
               <span className="opacity-70 text-[9px] uppercase tracking-wider">B-rho (Magnetic Rigidity)</span>
               <span className="font-bold text-orange-400">{ (Math.sqrt(Math.pow(params.beamEnergyMeV, 2) + 2*params.beamEnergyMeV*0.938) / 300).toFixed(4) } T·m</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
