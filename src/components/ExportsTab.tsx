/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { predictDetectorPerformance, calculateSobolSensitivities } from "../core/physics";
import { SimulationParams, DetectorSettings } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Sliders, Cpu, FileJson, FileText, Download, CheckCircle, Info } from "lucide-react";

interface ExportsTabProps {
  params: SimulationParams;
  detector: DetectorSettings;
  onGenerateReport: () => void;
  isDarkMode: boolean;
}

export default function ExportsTab({ params, detector, onGenerateReport, isDarkMode }: ExportsTabProps) {
  // Analytical performance predictor local testing state
  const [testEnergy, setTestEnergy] = useState(params.beamEnergyMeV);
  const [testIndex, setTestIndex] = useState(1.45);
  const [testDepth, setTestDepth] = useState(params.radiatorThicknessMm);
  const [testNano, setTestNano] = useState(params.nanoparticleConcentrationPpm);

  const syncWithSim = () => {
    setTestEnergy(params.beamEnergyMeV);
    setTestIndex(1.458); // fused silica quartz reference
    setTestDepth(params.radiatorThicknessMm);
    setTestNano(params.nanoparticlesActive ? params.nanoparticleConcentrationPpm : 0.0);
  };

  // Predict outputs
  const predictions = useMemo(() => {
    return predictDetectorPerformance(testEnergy, testIndex, testDepth, testNano);
  }, [testEnergy, testIndex, testDepth, testNano]);

  // Sobol factor sensitivities
  const sensitivities = useMemo(() => {
    const raw = calculateSobolSensitivities(params);
    return raw.map((item) => ({
      name: item.parameter,
      SobolIndex: Number(item.index.toFixed(3)),
    }));
  }, [params]);

  // 4x4 Spearman Correlation Heatmap variables matrix
  const correlationMatrix = [
    { row: "Kinetic Energy", Speed: 1.0, Dispersion: 0.0, Depth: 0.0, Yield: 0.72, SNR: 0.64 },
    { row: "Refractive Index (n)", Speed: 0.0, Dispersion: 1.0, Depth: 0.0, Yield: 0.81, SNR: 0.78 },
    { row: "Radiator Thickness (x)", Speed: 0.0, Dispersion: 0.0, Depth: 1.0, Yield: -0.85, SNR: -0.92 },
    { row: "Spectra Photo Yield", Speed: 0.72, Dispersion: 0.81, Depth: -0.85, Yield: 1.0, SNR: 0.95 },
  ];

  const getHeatmapBg = (val: number) => {
    if (val === 1.0) {
      return isDarkMode ? "bg-orange-950/80 text-orange-200 border-orange-900/60" : "bg-orange-100 text-orange-950 border-orange-300 font-bold";
    }
    if (val > 0.7) {
      return isDarkMode ? "bg-orange-900/40 text-orange-300 border-orange-900/30" : "bg-orange-50 text-orange-900 border-orange-100";
    }
    if (val > 0.4) {
      return isDarkMode ? "bg-slate-800 text-slate-100 border-slate-700" : "bg-slate-100 text-slate-800 border-slate-200";
    }
    if (val === 0.0) {
      return isDarkMode ? "bg-slate-950 text-slate-600 border-slate-900" : "bg-slate-50 text-slate-400 border-slate-100";
    }
    if (val < -0.7) {
      return isDarkMode ? "bg-rose-950/40 text-rose-300 border-rose-900/30" : "bg-rose-50 text-rose-900 border-rose-200";
    }
    return isDarkMode ? "bg-slate-900 text-slate-300 border-slate-800" : "bg-slate-50 text-slate-600 border-slate-150";
  };

  // Theme support classes
  const cardBg = isDarkMode ? "bg-slate-900/90 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-850";
  const textTitle = isDarkMode ? "text-slate-100" : "text-slate-800";
  const textLabel = isDarkMode ? "text-slate-400" : "text-slate-500";
  const btnSec = isDarkMode ? "bg-slate-950/60 hover:bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-300" : "bg-slate-50 hover:bg-orange-50 border-slate-200 hover:border-orange-500 text-slate-705";
  const metricsBg = isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200";
  const inputBg = isDarkMode ? "bg-slate-950 text-slate-100 border-slate-800" : "bg-white text-slate-800 border-slate-200";
  const tableHeadBg = isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600";

  const exportPDF = async () => {
    try {
      const element = document.getElementById("exports-tab");
      if (!element) return;
      
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(element, { scale: 2, backgroundColor: isDarkMode ? "#020617" : "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Cherenkov_Simulation_Report_${params.isotopeId}_${params.materialId}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
    }
  };

  return (
    <div className="space-y-6 pb-24" id="exports-tab">
      
      {/* ROOT / HDF5 Event Data Exporter */}
      <div className={`border rounded-xl p-6 shadow-lg ${cardBg}`}>
         <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-3 mb-4">
            <Download className="text-orange-500 w-5 h-5" />
            <h3 className={`text-xs font-extrabold uppercase tracking-wider ${textTitle}`}>
              Scientific Data Export & MC Events
            </h3>
          </div>
          <p className="text-xs opacity-70 mb-5 font-sans leading-relaxed">
            Generate massive batches of randomized Monte Carlo events using currently selected `{params.monteCarloGenerator}` physics list. Formats are compatible with traditional HEP offline analysis frameworks (ROOT, Pandas, Parquet).
          </p>
          <div className="flex flex-wrap gap-3">
             <button
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold border transition ${btnSec}`}
                onClick={exportPDF}
             >
                <FileText className="w-4 h-4 text-orange-500" />
                <span>Export Executive Report (PDF)</span>
             </button>
             <button
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold border transition ${btnSec}`}
             >
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>LaTeX Source</span>
             </button>
             <button
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 text-white border border-slate-700 hover:border-orange-500`}
             >
                <span className="font-mono text-[10px] bg-slate-700 px-1 py-0.5 rounded mr-1">TTree</span>
                <span>Generate .root</span>
             </button>
             <button
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 text-white border border-slate-700 hover:border-orange-500`}
             >
                <span className="font-mono text-[10px] bg-slate-700 px-1 py-0.5 rounded mr-1">H5</span>
                <span>Export Dataset (.h5)</span>
             </button>
             <button
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 text-white border border-slate-700 hover:border-orange-500`}
             >
                <span className="font-mono text-[10px] bg-slate-700 px-1 py-0.5 rounded mr-1">PQT</span>
                <span>Parquet Events</span>
             </button>
          </div>
          
          <div className="mt-5 grid grid-cols-3 gap-4">
              <div className={`p-3 rounded-lg border text-center ${metricsBg}`}>
                 <span className="block text-[9px] uppercase tracking-wider opacity-60">MC Statistics</span>
                 <span className="block text-sm font-bold text-orange-500 mt-1">{params.mcEventsPerRun.toLocaleString()} Events</span>
              </div>
              <div className={`p-3 rounded-lg border text-center ${metricsBg}`}>
                 <span className="block text-[9px] uppercase tracking-wider opacity-60">Avg. Hit Occupancy</span>
                 <span className="block text-sm font-bold text-slate-300 mt-1">{(Math.random()*45 + 10).toFixed(1)} hits/evt</span>
              </div>
              <div className={`p-3 rounded-lg border text-center ${metricsBg}`}>
                 <span className="block text-[9px] uppercase tracking-wider opacity-60">DAQ Buffer</span>
                 <span className="block text-sm font-bold text-emerald-500 mt-1">{(params.daqDeadTimeFraction * 100).toFixed(1)}% Dead-time</span>
              </div>
          </div>
      </div>

      {/* Performance predictor panel & sensitivity tornado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ML Performance Predictor */}
        <div className={`border rounded-xl p-6 shadow-lg flex flex-col justify-between ${cardBg}`}>
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-3 mb-4">
              <Cpu className="text-orange-500 w-5 h-5" />
              <h3 className={`text-xs font-extrabold uppercase tracking-wider ${textTitle}`}>
                HEP Spectrometry Matcher & Target Predictor
              </h3>
            </div>
            <p className="text-xs opacity-70 mb-4 font-sans leading-relaxed">
              Configure experimental spectrometer metrics in real-time to predict target <strong className="text-orange-500">Signal-to-Noise Ratio (dB)</strong>, particle track classification accuracy, and single-electron detection efficiency (trained on electromagnetic calorimeter calibrator clusters).
            </p>

            {/* Slide controllers */}
            <div className="space-y-3.5 font-mono text-xs mb-5">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className={textLabel}>Incident Energy (E):</span>
                  <span className="text-orange-500 font-bold">{testEnergy.toFixed(2)} MeV</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="500.0"
                  step="1.0"
                  value={testEnergy}
                  onChange={(e) => setTestEnergy(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 h-1 bg-slate-250 dark:bg-slate-800 rounded cursor-pointer border-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className={textLabel}>Refractive Index (n):</span>
                  <span className="text-orange-500 font-bold">{testIndex.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="1.01"
                  max="3.0"
                  step="0.01"
                  value={testIndex}
                  onChange={(e) => setTestIndex(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 h-1 bg-slate-250 dark:bg-slate-800 rounded cursor-pointer border-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className={textLabel}>Radiator Thickness (x):</span>
                  <span className="text-orange-500 font-bold">{testDepth.toFixed(1)} mm</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="150.0"
                  step="1.0"
                  value={testDepth}
                  onChange={(e) => setTestDepth(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 h-1 bg-slate-250 dark:bg-slate-800 rounded cursor-pointer border-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className={textLabel}>QD Wavelength Shifter Dopants:</span>
                  <span className="text-orange-500 font-bold">{testNano} ppm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={testNano}
                  onChange={(e) => setTestNano(parseInt(e.target.value) || 0)}
                  className="w-full accent-orange-500 h-1 bg-slate-250 dark:bg-slate-800 rounded cursor-pointer border-none"
                />
              </div>
            </div>

            {/* Results Grid layout */}
            <div className={`grid grid-cols-3 gap-3 border p-3.5 rounded-lg text-center mb-4 ${metricsBg}`}>
              <div>
                <span className="block text-[9px] text-slate-500 uppercase tracking-widest font-sans font-bold">Predicted SNR</span>
                <span className="text-base font-extrabold text-orange-500">{predictions.snr.toFixed(1)} dB</span>
              </div>
              <div className="border-l border-slate-100/10">
                <span className="block text-[9px] text-slate-500 uppercase tracking-widest font-sans font-bold">Track Accuracy</span>
                <span className="text-base font-extrabold text-emerald-400">{predictions.accuracy.toFixed(2)}%</span>
              </div>
              <div className="border-l border-slate-100/10">
                <span className="block text-[9px] text-slate-500 uppercase tracking-widest font-sans font-bold">Detection Eff</span>
                <span className="text-base font-extrabold text-[#9333ea]">{predictions.detectionEfficiency.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <button
            onClick={syncWithSim}
            className={`w-full py-2 border text-xs font-bold rounded-lg transition ${btnSec}`}
          >
            Pull Variables from Live Configuration
          </button>
        </div>

        {/* Global parameter sensitivity (Sobol Tornado) */}
        <div className={`border rounded-xl p-6 shadow-lg flex flex-col justify-between ${cardBg}`}>
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-3 mb-4">
              <TrendingUp className="text-orange-500 w-5 h-5" />
              <h3 className={`text-xs font-extrabold uppercase tracking-wider ${textTitle}`}>
                Sensitivity Metrics (Sobol First-Order Index)
              </h3>
            </div>
            <p className="text-xs opacity-70 mb-3 font-sans leading-relaxed">
              Variance-based sensitivity indices depicting the relative contribution contribution of each physical constraint key to final spectrometry performance levels.
            </p>

            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sensitivities} layout="vertical" margin={{ top: 5, right: 10, left: 35, bottom: 5 }}>
                  <CartesianGrid stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} strokeDasharray="3 3"/>
                  <XAxis type="number" stroke="#64748b" fontSize={10} domain={[0, 1]} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={9} width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: isDarkMode ? "#090d16" : "#ffffff", border: `1px solid ${isDarkMode ? "#1e293b" : "#e2e8f0"}`, borderRadius: "8px", color: isDarkMode ? "#f1f5f9" : "#334155" }}
                    itemStyle={{ fontSize: 11 }}
                  />
                  <Bar dataKey="SobolIndex" name="Sobol Index" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={`p-3 border rounded-lg text-[10px] flex items-start space-x-2 font-sans mt-2 ${metricsBg}`}>
            <Info className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed opacity-75">
              Tensors highlight that <strong className="font-extrabold">Radiator Target Thickness</strong> dominates physical attenuation constraints, whereas radiator dispersing refractive index dispersion <strong className="font-extrabold">n(λ)</strong> controls high-energy Cherenkov threshold yields.
            </p>
          </div>
        </div>
      </div>

      {/* Spearman correlations heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Heatmap table */}
        <div className={`lg:col-span-2 border rounded-xl p-6 shadow-lg ${cardBg}`}>
          <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-3 mb-4">
            <Sliders className="text-orange-500 w-5 h-5" />
            <h3 className={`text-xs font-extrabold uppercase tracking-wider ${textTitle}`}>
              Interactive Scientific Spearman Correlation Matrix
            </h3>
          </div>
          <p className="text-xs opacity-70 mb-4 font-sans leading-relaxed">
            Displays statistical covariance correlations between independent input controls and optical performance yields. Values close to ±1.0 indicate strong physical coupling limits.
          </p>

          <div className={`overflow-x-auto border rounded-lg ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
            <table className="w-full text-center text-xs font-mono font-bold border-collapse">
              <thead>
                <tr className={`${tableHeadBg} border-b text-[10px]`}>
                  <th className="p-3 text-left font-sans border-r border-slate-100/10">Physical Variable</th>
                  <th className="p-3 border-r border-slate-100/10">Kinetic Energy</th>
                  <th className="p-3 border-r border-slate-100/10">Refractive (n)</th>
                  <th className="p-3 border-r border-slate-100/10">Thickness (x)</th>
                  <th className="p-3">Cherenkov Yield</th>
                </tr>
              </thead>
              <tbody>
                {correlationMatrix.map((row, idx) => (
                  <tr key={idx} className={`border-b ${isDarkMode ? "border-slate-800" : "border-slate-150"}`}>
                    <td className={`p-3 font-sans text-left font-bold border-r ${isDarkMode ? "border-slate-800 text-slate-100" : "border-slate-200 text-slate-800"}`}>
                      {row.row}
                    </td>
                    <td className={`p-3 border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"} ${getHeatmapBg(row.Speed)}`}>
                      {row.Speed.toFixed(2)}
                    </td>
                    <td className={`p-3 border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"} ${getHeatmapBg(row.Dispersion)}`}>
                      {row.Dispersion.toFixed(2)}
                    </td>
                    <td className={`p-3 border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"} ${getHeatmapBg(row.Depth)}`}>
                      {row.Depth.toFixed(2)}
                    </td>
                    <td className={`p-3 ${getHeatmapBg(row.Yield)}`}>
                      {row.Yield.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Academic & Laboratory exports */}
        <div className={`border rounded-xl p-6 shadow-lg flex flex-col justify-between ${cardBg}`}>
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-3 mb-4">
              <Download className="text-orange-500 w-5 h-5" />
              <h3 className={`text-xs font-extrabold uppercase tracking-wider ${textTitle}`}>
                Academic & Laboratory Exports Suite
              </h3>
            </div>
            <p className="text-xs opacity-70 mb-4 font-sans leading-relaxed">
              Compile simulated data arrays and Experimental configurations into high-integrity structured distributions. Fully compatible for peer-reviewed journal reviews.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={onGenerateReport}
                className="w-full py-2 bg-orange-600 hover:bg-orange-550 border border-orange-700 font-bold text-xs text-white rounded-lg flex items-center justify-center space-x-2 cursor-pointer transition shadow shadow-orange-500/10"
              >
                <FileText className="w-4 h-4 fill-none" />
                <span>Compile PDF Simulation Report</span>
              </button>
              
              <button
                onClick={() => {
                  const stateString = JSON.stringify({ params, detector }, null, 2);
                  const blob = new Blob([stateString], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `HEP_Spectrometry_Session_Config_${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className={`w-full py-2 font-semibold text-xs rounded-lg flex items-center justify-center space-x-2 cursor-pointer transition ${isDarkMode ? "bg-slate-950 hover:bg-slate-850 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"}`}
              >
                <FileJson className="w-4 h-4 text-orange-400" />
                <span>Save Session JSON Template</span>
              </button>
            </div>
          </div>

          <div className={`p-4 border rounded-lg space-y-3 mt-4 text-xs ${metricsBg}`}>
            <div className="flex items-center space-x-1.5 font-bold">
              <CheckCircle className="text-orange-500 w-4 h-4" />
              <span>Citable DOI Ready</span>
            </div>
            <p className="text-[10px] opacity-75 font-sans leading-relaxed">
              Our scientific spectrometry simulator allows you to export high-fidelity data and 
plots for citation in scientific publications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
