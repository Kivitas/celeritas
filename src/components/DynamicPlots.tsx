/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";
import { SimulationResultPoint, SimulationSummary, DetectorSettings } from "../types";
import { Orbit, Activity, ShieldAlert, Cpu, Layers } from "lucide-react";

interface DynamicPlotsProps {
  spectra: SimulationResultPoint[];
  summary: SimulationSummary;
  detector: DetectorSettings;
  beamEnergyMeV: number;
  isDarkMode: boolean;
}

export default React.memo(function DynamicPlots({ spectra, summary, detector, beamEnergyMeV, isDarkMode }: DynamicPlotsProps) {
  
  // Custom tooltip styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
          <p className={`text-xs font-bold mb-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            {label} nm
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(3)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [noiseSeed, setNoiseSeed] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = isDarkMode ? "#020617" : "#f8fafc"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gridSize = 16;
    const cellW = canvas.width / gridSize;
    const cellH = canvas.height / gridSize;

    ctx.strokeStyle = isDarkMode ? "#0f172a" : "#e2e8f0";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        ctx.strokeRect(i * cellW, j * cellH, cellW, cellH);
      }
    }

    const beamCenterX = canvas.width / 2;
    const beamCenterY = canvas.height / 2;
    
    ctx.beginPath();
    ctx.arc(beamCenterX, beamCenterY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = isDarkMode ? "rgba(249, 115, 22, 0.2)" : "rgba(249, 115, 22, 0.15)";
    ctx.fill();

    if (summary.isCherenkovGenerated) {
      const radius = Math.max(10, Math.min(100, summary.cherenkovAngleDeg * 1.55));
      ctx.beginPath();
      ctx.arc(beamCenterX, beamCenterY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = isDarkMode ? "rgba(249, 115, 22, 0.75)" : "rgba(249, 115, 22, 0.55)";
      ctx.lineWidth = detector.chargeSharingActive ? 5 : 2; 
      ctx.stroke();

      ctx.fillStyle = isDarkMode ? "rgba(249, 115, 22, 0.95)" : "rgba(249, 115, 22, 0.85)";
      const activePixelsCount = Math.floor(summary.totalPhotonsDetected / 3) + 6;
      for (let p = 0; p < activePixelsCount; p++) {
        const angle = (p / activePixelsCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const offsetR = radius + (Math.random() - 0.5) * (detector.chargeSharingActive ? 12 : 5);
        const px = beamCenterX + Math.cos(angle) * offsetR;
        const py = beamCenterY + Math.sin(angle) * offsetR;

        const cellX = Math.floor(px / cellW);
        const cellY = Math.floor(py / cellH);

        if (cellX >= 0 && cellX < gridSize && cellY >= 0 && cellY < gridSize) {
          ctx.fillRect(cellX * cellW + 1, cellY * cellH + 1, cellW - 2, cellH - 2);

          if (detector.chargeSharingActive && Math.random() > 0.45) {
            ctx.fillStyle = isDarkMode ? "rgba(234, 179, 8, 0.6)" : "rgba(234, 179, 8, 0.55)";
            const directions = [[0,1],[1,0],[-1,0],[0,-1]];
            const [dx, dy] = directions[Math.floor(Math.random() * 4)];
            const cx = cellX + dx;
            const cy = cellY + dy;
            if (cx >= 0 && cx < gridSize && cy >= 0 && cy < gridSize) {
              ctx.fillRect(cx * cellW + 1, cy * cellH + 1, cellW - 2, cellH - 2);
            }
            ctx.fillStyle = isDarkMode ? "rgba(249, 115, 22, 0.95)" : "rgba(249, 115, 22, 0.85)";
          }
        }
      }
    }

    ctx.fillStyle = isDarkMode ? "rgba(239, 68, 68, 0.8)" : "rgba(239, 68, 68, 0.75)";
    const noiseHitsCount = Math.floor(detector.noiseRmsKeV * 2.8);
    for (let n = 0; n < noiseHitsCount; n++) {
      const rx = Math.floor(Math.random() * gridSize);
      const ry = Math.floor(Math.random() * gridSize);
      ctx.fillRect(rx * cellW + 1, ry * cellH + 1, cellW - 2, cellH - 2);
    }
  }, [summary, detector, noiseSeed, isDarkMode]);

  const spectraChartData = useMemo(() => {
    return spectra.map((p) => ({
      wavelength: p.wavelengthNm,
      primary: Number(p.primaryCherenkov.toFixed(2)),
      secondary: Number(p.secondaryCherenkov.toFixed(2)),
      bremsstrahlung: Number(p.bremsstrahlung.toFixed(2)),
      fluorescence: Number(p.fluorescence.toFixed(2)),
      bg: Number(p.background.toFixed(2)),
      total: Number(p.totalYield.toFixed(2)),
    }));
  }, [spectra]);

  const angularConeData = useMemo(() => {
    const dataPoints = [];
    const peakAngle = summary.cherenkovAngleDeg;
    for (let degree = 0; degree <= 90; degree += 2) {
      const angularDiff = Math.abs(degree - peakAngle);
      const emissionIntensity =
        angularDiff < 1.5
          ? 100.0 * Math.exp(-Math.pow(angularDiff / 1.0, 2))
          : 15.0 * Math.exp(-angularDiff / 12.0) + 1.2;
      dataPoints.push({
        angleDeg: degree,
        emissionIntensity: Number(emissionIntensity.toFixed(2)),
      });
    }
    return dataPoints;
  }, [summary.cherenkovAngleDeg]);

  const attenuationData = useMemo(() => {
    const dataPoints = [];
    for (let depth = 0; depth <= 100; depth += 10) {
      const intensity = 100.0 * Math.exp(-0.025 * depth);
      const percent = 100.0 * Math.exp(-0.025 * depth);
      dataPoints.push({
        depthMm: depth,
        intensity: Number(intensity.toFixed(2)),
        percentTransmission: Number(percent.toFixed(1)),
      });
    }
    return dataPoints;
  }, []);

  const timeResolvedChartData = useMemo(() => {
    if (!summary.isCherenkovGenerated) {
      return Array.from({ length: 15 }, (_, i) => ({ timeNs: (i * 0.5).toFixed(1), counts: 1 }));
    }
    return Array.from({ length: 15 }, (_, i) => {
      const time = i * 0.5;
      const promptPeak = 120.0 * Math.exp(-Math.pow((time - 1.5) / 0.25, 2));
      const scintillationDecay = 45.0 * Math.exp(-time / 3.2);
      const noise = 4.0;
      return {
        timeNs: time.toFixed(1),
        counts: Math.floor(promptPeak + scintillationDecay + noise),
      };
    });
  }, [summary.isCherenkovGenerated]);

  const energyHistogramData = useMemo(() => {
    const bins = 30;
    const minEnergy = 0;
    const maxEnergy = beamEnergyMeV * 2;
    const binWidth = (maxEnergy - minEnergy) / bins;
    
    return Array.from({ length: bins }, (_, i) => {
      const binCenter = minEnergy + (i + 0.5) * binWidth;
      const gaussianPeak = 1000 * Math.exp(-Math.pow((binCenter - beamEnergyMeV) / (beamEnergyMeV * 0.1), 2));
      const background = 50 + Math.random() * 20;
      const comptonEdge = binCenter > beamEnergyMeV * 0.5 ? 300 * Math.exp(-Math.pow((binCenter - beamEnergyMeV * 0.7) / (beamEnergyMeV * 0.15), 2)) : 0;
      return {
        energyMeV: binCenter.toFixed(2),
        counts: Math.floor(gaussianPeak + background + comptonEdge),
      };
    });
  }, [beamEnergyMeV]);

  const phaseSpaceData = useMemo(() => {
    const points = 100;
    return Array.from({ length: points }, (_, i) => {
      const t = (i / points) * Math.PI * 2;
      const momentum = summary.beta * 1000 * (1 + 0.3 * Math.sin(t * 3));
      const position = 10 * Math.cos(t) + 5 * Math.sin(t * 2);
      return {
        momentumGeV: momentum.toFixed(2),
        positionCm: position.toFixed(2),
      };
    });
  }, [summary.beta]);

  const efficiencyCurveData = useMemo(() => {
    const energies = Array.from({ length: 20 }, (_, i) => 0.1 + i * 0.5);
    return energies.map(energy => {
      const efficiency = 0.95 * (1 - Math.exp(-energy / 2)) * (1 + 0.05 * Math.sin(energy));
      return {
        energyMeV: energy.toFixed(2),
        efficiency: (efficiency * 100).toFixed(1),
      };
    });
  }, []);

  const correlationData = useMemo(() => {
    const params = ['Energy', 'Flux', 'Angle', 'B-Field', 'Thickness'];
    return params.map((param1, i) => {
      return params.map((param2, j) => {
        const correlation = i === j ? 1.0 : parseFloat((Math.sin(i * j + 1) * 0.8).toFixed(2));
        return {
          param1,
          param2,
          correlation,
        };
      });
    }).flat();
  }, []);

  const snrAnalysisData = useMemo(() => {
    const thresholds = Array.from({ length: 15 }, (_, i) => 0.5 + i * 0.3);
    return thresholds.map(threshold => {
      const signal = summary.totalPhotonsEmitted * (1 - threshold * 0.1);
      const noise = detector.noiseRmsKeV * 100 * (1 + threshold * 0.2);
      const snr = 10 * Math.log10(Math.max(signal / noise, 0.01));
      return {
        thresholdKeV: threshold.toFixed(2),
        signal: Math.floor(signal),
        noise: Math.floor(noise),
        snrDb: snr.toFixed(1),
      };
    });
  }, [summary.totalPhotonsEmitted, detector.noiseRmsKeV]);

  const angularDistributionData = useMemo(() => {
    const angles = Array.from({ length: 36 }, (_, i) => i * 10);
    return angles.map(angle => {
      const angleRad = (angle * Math.PI) / 180;
      const cherenkovCone = summary.isCherenkovGenerated 
        ? Math.exp(-Math.pow((angle - summary.cherenkovAngleDeg) / 15, 2)) 
        : 0;
      const isotropic = 0.3 + 0.1 * Math.random();
      const forwardPeaked = Math.cos(angleRad) * 0.5;
      return {
        angle: angle,
        intensity: (cherenkovCone + isotropic + forwardPeaked) * 100,
      };
    });
  }, [summary.isCherenkovGenerated, summary.cherenkovAngleDeg]);

  const spatialHeatmapData = useMemo(() => {
    const gridSize = 20;
    const data = [];
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const centerX = gridSize / 2;
        const centerY = gridSize / 2;
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        const beamProfile = Math.exp(-Math.pow(distance / 5, 2));
        const noise = Math.random() * 0.1;
        data.push({
          x: x,
          y: y,
          intensity: (beamProfile + noise) * 1000,
        });
      }
    }
    return data;
  }, []);

  const particleTrackingData = useMemo(() => {
    const tracks = 50;
    return Array.from({ length: tracks }, (_, i) => {
      const startX = (Math.random() - 0.5) * 10;
      const startY = (Math.random() - 0.5) * 10;
      const energy = beamEnergyMeV * (0.8 + Math.random() * 0.4);
      const angle = (Math.random() - 0.5) * Math.PI / 4;
      const trackLength = 10 + Math.random() * 20;
      
      return {
        id: i,
        startX: startX.toFixed(2),
        startY: startY.toFixed(2),
        endX: (startX + Math.cos(angle) * trackLength).toFixed(2),
        endY: (startY + Math.sin(angle) * trackLength).toFixed(2),
        energy: energy.toFixed(2),
        angle: (angle * 180 / Math.PI).toFixed(1),
      };
    });
  }, [beamEnergyMeV]);

  const wavelengthEfficiencyData = useMemo(() => {
    const wavelengths = Array.from({ length: 50 }, (_, i) => 300 + i * 10);
    return wavelengths.map(wavelength => {
      const peakWavelength = 450;
      const efficiency = Math.exp(-Math.pow((wavelength - peakWavelength) / 100, 2)) * detector.quantumEfficiencyPct;
      return {
        wavelengthNm: wavelength,
        efficiency: efficiency.toFixed(1),
      };
    });
  }, [detector.quantumEfficiencyPct]);

  const doseRateData = useMemo(() => {
    const timePoints = Array.from({ length: 24 }, (_, i) => i);
    return timePoints.map(hour => {
      const baseDose = beamEnergyMeV * 0.1;
      const diurnal = 1 + 0.3 * Math.sin((hour / 24) * Math.PI * 2);
      const random = 0.9 + Math.random() * 0.2;
      return {
        hour: hour,
        doseRate: (baseDose * diurnal * random).toFixed(3),
      };
    });
  }, [beamEnergyMeV]);

  const panelBg = isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800";
  const footerBg = isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200";
  const footerBorder = isDarkMode ? "border-slate-800" : "border-slate-200";

  return (
    <div className={`border rounded-xl p-5 shadow-lg flex flex-col transition overflow-visible ${panelBg}`} id="plots-panel">
      
      <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-3 mb-4">
        <Activity className="text-orange-500 w-5 h-5" />
        <h2 className="text-xs font-extrabold font-sans tracking-tight uppercase">
          HEP Spectrometry Diagnostics & Cones Diagnostics
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Spectra Distribution */}
        <div className="w-full min-h-[320px] flex flex-col justify-center animate-fade bg-slate-900/30 rounded-lg p-2 border border-slate-800/50">
          <h3 className="text-[11px] font-bold mb-2 uppercase text-slate-400 text-center tracking-widest">Spectra Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={spectraChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorBrems" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorFluor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} strokeDasharray="3 3"/>
              <XAxis dataKey="wavelength" stroke="#64748b" fontSize={11} unit="nm" />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="primary" name="Cherenkov Primary" stroke="#f97316" fillOpacity={1} fill="url(#colorPrimary)" stackId="1" />
              <Area type="monotone" dataKey="bremsstrahlung" name="Bremsstrahlung" stroke="#eab308" fillOpacity={1} fill="url(#colorBrems)" stackId="1" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cherenkov Cones Angle */}
        <div className="w-full min-h-[320px] flex flex-col justify-center animate-fade bg-slate-900/30 rounded-lg p-2 border border-slate-800/50">
          <h3 className="text-[11px] font-bold mb-2 uppercase text-slate-400 text-center tracking-widest">Cherenkov Cones Angle</h3>
          {summary.isCherenkovGenerated ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={angularConeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} strokeDasharray="3 3"/>
                <XAxis dataKey="angleDeg" stroke="#64748b" fontSize={11} unit="°" />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: isDarkMode ? "#090d16" : "#ffffff", border: `1px solid ${isDarkMode ? "#1e293b" : "#e2e8f0"}`, borderRadius: "8px", color: isDarkMode ? "#f1f5f9" : "#0f172a" }} />
                <Area type="monotone" dataKey="emissionIntensity" name="Radiance" stroke="#ea580c" fill="rgba(249, 115, 22, 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className={`flex flex-col items-center justify-center h-[280px] border rounded-lg ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <ShieldAlert className="text-amber-500 w-12 h-12 mb-3 animate-bounce" />
              <h4 className="text-sm font-bold">Below Threshold</h4>
            </div>
          )}
        </div>

        {/* Medium Attenuation */}
        <div className="w-full min-h-[320px] flex flex-col justify-center animate-fade bg-slate-900/30 rounded-lg p-2 border border-slate-800/50">
          <h3 className="text-[11px] font-bold mb-2 uppercase text-slate-400 text-center tracking-widest">Medium Attenuation</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={attenuationData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} strokeDasharray="3 3"/>
              <XAxis dataKey="depthMm" stroke="#64748b" fontSize={11} unit="mm" />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: isDarkMode ? "#090d16" : "#ffffff", border: `1px solid ${isDarkMode ? "#1e293b" : "#e2e8f0"}`, borderRadius: "8px", color: isDarkMode ? "#f1f5f9" : "#0f172a" }} />
              <Line type="monotone" dataKey="intensity" name="Flux" stroke="#ea580c" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sensor Matrix */}
        <div className="w-full min-h-[320px] flex flex-col justify-center animate-fade bg-slate-900/30 rounded-lg p-2 border border-slate-800/50">
          <h3 className="text-[11px] font-bold mb-2 uppercase text-slate-400 flex items-center justify-between tracking-widest">
            <span className="opacity-0">PULSE</span>
            <span>Sensor Matrix</span>
            <button onClick={() => setNoiseSeed((s) => s + 1)} className="text-[9px] px-2 py-0.5 rounded bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition">PULSE</button>
          </h3>
          <div className="flex-1 flex justify-center items-center">
            <canvas ref={canvasRef} width={240} height={240} className={`rounded-lg shadow-inner border ${isDarkMode ? "border-slate-800" : "border-slate-200"}`} />
          </div>
        </div>

        {/* TOF Coincidence */}
        <div className="w-full min-h-[320px] flex flex-col justify-center animate-fade bg-slate-900/30 rounded-lg p-2 border border-slate-800/50">
          <h3 className="text-[11px] font-bold mb-2 uppercase text-slate-400 text-center tracking-widest">TOF Coincidence</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={timeResolvedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} strokeDasharray="3 3"/>
              <XAxis dataKey="timeNs" stroke="#64748b" fontSize={11} unit="ns" />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: isDarkMode ? "#090d16" : "#ffffff", border: `1px solid ${isDarkMode ? "#1e293b" : "#e2e8f0"}`, borderRadius: "8px", color: isDarkMode ? "#f1f5f9" : "#0f172a" }} />
              <Bar dataKey="counts" fill="#eab308" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Energy Histogram */}
        <div className="w-full min-h-[320px] flex flex-col justify-center animate-fade bg-slate-900/30 rounded-lg p-2 border border-slate-800/50">
          <h3 className="text-[11px] font-bold mb-2 uppercase text-slate-400 text-center tracking-widest">Energy Histogram</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={energyHistogramData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} strokeDasharray="3 3"/>
              <XAxis dataKey="energyMeV" stroke="#64748b" fontSize={11} unit="MeV" />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: isDarkMode ? "#090d16" : "#ffffff", border: `1px solid ${isDarkMode ? "#1e293b" : "#e2e8f0"}`, borderRadius: "8px", color: isDarkMode ? "#f1f5f9" : "#0f172a" }} />
              <Bar dataKey="counts" fill="#f97316" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Phase Space */}
        <div className="w-full min-h-[320px] flex flex-col justify-center animate-fade bg-slate-900/30 rounded-lg p-2 border border-slate-800/50">
          <h3 className="text-[11px] font-bold mb-2 uppercase text-slate-400 text-center tracking-widest">Phase Space</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={phaseSpaceData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} strokeDasharray="3 3"/>
              <XAxis dataKey="positionCm" stroke="#64748b" fontSize={11} unit="cm" />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: isDarkMode ? "#090d16" : "#ffffff", border: `1px solid ${isDarkMode ? "#1e293b" : "#e2e8f0"}`, borderRadius: "8px", color: isDarkMode ? "#f1f5f9" : "#0f172a" }} />
              <Line type="monotone" dataKey="momentumGeV" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Detection Efficiency */}
        <div className="w-full min-h-[320px] flex flex-col justify-center animate-fade bg-slate-900/30 rounded-lg p-2 border border-slate-800/50">
          <h3 className="text-[11px] font-bold mb-2 uppercase text-slate-400 text-center tracking-widest">Detection Efficiency</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={efficiencyCurveData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} strokeDasharray="3 3"/>
              <XAxis dataKey="energyMeV" stroke="#64748b" fontSize={11} unit="MeV" />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: isDarkMode ? "#090d16" : "#ffffff", border: `1px solid ${isDarkMode ? "#1e293b" : "#e2e8f0"}`, borderRadius: "8px", color: isDarkMode ? "#f1f5f9" : "#0f172a" }} />
              <Line type="monotone" dataKey="efficiency" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Correlation Matrix */}
        <div className="w-full min-h-[320px] flex flex-col justify-center animate-fade bg-slate-900/30 rounded-lg p-2 border border-slate-800/50">
          <h3 className="text-[11px] font-bold mb-2 uppercase text-slate-400 text-center tracking-widest">Correlation Matrix</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="grid grid-cols-5 gap-1 p-2 w-full max-w-[280px]">
              {correlationData.map((item, idx) => (
                <div key={idx} className={`aspect-square flex items-center justify-center rounded-sm text-[9px] font-mono shadow-sm`}
                  style={{
                    backgroundColor: `rgba(249, 115, 22, ${Math.abs(item.correlation) * 0.9 + 0.1})`,
                    color: Math.abs(item.correlation) > 0.5 ? "#fff" : (isDarkMode ? "#f1f5f9" : "#0f172a"),
                  }}>
                  {item.correlation.toFixed(1)}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-2 text-[8px] font-mono uppercase text-slate-500 px-2 w-full max-w-[280px]">
              <span className="truncate">Egy</span>
              <span className="truncate">Flx</span>
              <span className="truncate">Ang</span>
              <span className="truncate">BFi</span>
              <span className="truncate">Thk</span>
            </div>
          </div>
        </div>

        {/* SNR Analysis */}
        <div className="w-full min-h-[320px] flex flex-col justify-center animate-fade bg-slate-900/30 rounded-lg p-2 border border-slate-800/50">
          <h3 className="text-[11px] font-bold mb-2 uppercase text-slate-400 text-center tracking-widest">SNR Analysis</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={snrAnalysisData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} strokeDasharray="3 3"/>
              <XAxis dataKey="thresholdKeV" stroke="#64748b" fontSize={11} unit="keV" />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: isDarkMode ? "#090d16" : "#ffffff", border: `1px solid ${isDarkMode ? "#1e293b" : "#e2e8f0"}`, borderRadius: "8px", color: isDarkMode ? "#f1f5f9" : "#0f172a" }} />
              <Line type="monotone" dataKey="snrDb" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Dynamic diagnostic footers */}
      <div className="space-y-3 mt-8 animate-fade">
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl text-center border ${footerBg} ${footerBorder} shadow-sm`}>
          <div className="font-mono text-center flex flex-col items-center justify-center">
            <span className="block text-[9px] opacity-60 uppercase tracking-widest font-bold mb-1">Relativistic Speed (v/c)</span>
            <span className="text-sm font-bold text-orange-500">β = {summary.beta.toFixed(5)}</span>
          </div>
          <div className={`font-mono text-center flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l ${footerBorder}`}>
            <span className="block text-[9px] opacity-60 uppercase tracking-widest font-bold mb-1">Wavelength Peak</span>
            <span className="text-sm font-bold text-orange-500">{summary.peakWavelengthNm} nm</span>
          </div>
          <div className={`font-mono text-center flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l ${footerBorder}`}>
            <span className="block text-[9px] opacity-60 uppercase tracking-widest font-bold mb-1">Total Emitted Rate</span>
            <span className="text-sm font-bold text-orange-500">{summary.totalPhotonsEmitted.toLocaleString()} / cm</span>
          </div>
          <div className={`font-mono text-center flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l ${footerBorder}`}>
            <span className="block text-[9px] opacity-60 uppercase tracking-widest font-bold mb-1">Simulated SNR</span>
            <span className="text-sm font-bold text-emerald-400">{summary.signalToNoiseRatioDb} dB</span>
          </div>
        </div>

        {/* Sophisticated Academic Tracking Row */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl text-center border ${footerBg} ${footerBorder} text-xs font-mono shadow-sm`}>
          <div className="flex flex-col justify-center items-center">
            <span className="text-[9px] opacity-60 uppercase tracking-widest font-bold mb-1">Matrix Fluence Intensity</span>
            <span className="text-sm font-bold text-cyan-400">
              {summary.fluencePhotonsPerMm2 ? summary.fluencePhotonsPerMm2.toLocaleString() : "0"} photons/mm²
            </span>
          </div>
          <div className={`flex flex-col justify-center items-center border-t sm:border-t-0 sm:border-l ${footerBorder}`}>
            <span className="text-[9px] opacity-60 uppercase tracking-widest font-bold mb-1">Radiotherapy Safe-status</span>
            <span className="text-sm font-bold text-amber-500 dark:text-amber-400">
              {summary.radSafetyClassification || "Unshielded Zone"}
            </span>
          </div>
          <div className={`flex flex-col justify-center items-center border-t sm:border-t-0 sm:border-l ${footerBorder}`}>
            <span className="text-[9px] opacity-60 uppercase tracking-widest font-bold mb-1">Fluence Calibration Dev</span>
            <span className="text-sm font-bold text-emerald-500">
              ± {summary.experimentalFluencePercentError ? summary.experimentalFluencePercentError.toFixed(2) : "0.00"} %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
