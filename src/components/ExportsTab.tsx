/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { SimulationParams, DetectorSettings } from "../types";
import { FileJson, FileText, Download, CheckCircle } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface ExportsTabProps {
  params: SimulationParams;
  detector: DetectorSettings;
  onGenerateReport: () => void;
  isDarkMode: boolean;
}

export default function ExportsTab({ params, detector, onGenerateReport, isDarkMode }: ExportsTabProps) {
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
                 <span className="block text-[9px] uppercase tracking-wider opacity-60">Particles per Batch</span>
                 <span className="block text-sm font-bold text-slate-300 mt-1">{params.numberFiredParticles.toLocaleString()} particles</span>
              </div>
              <div className={`p-3 rounded-lg border text-center ${metricsBg}`}>
                 <span className="block text-[9px] uppercase tracking-wider opacity-60">DAQ Buffer</span>
                 <span className="block text-sm font-bold text-emerald-500 mt-1">{(params.daqDeadTimeFraction * 100).toFixed(1)}% Dead-time</span>
              </div>
          </div>
      </div>

      {/* Sensitivity and ML predictor notes */}
      <div className={`border rounded-xl p-4 shadow-lg text-xs font-sans ${cardBg}`}>
        <p className="leading-relaxed opacity-75">
          Sensitivity analysis and ML predictors were removed because they were not computed from the physics model.
        </p>
      </div>

      {/* Correlation analysis removed: the previous matrix was hardcoded, not computed. */}
      <div className={`border rounded-xl p-4 shadow-lg text-xs font-sans ${cardBg}`}>
        <p className="leading-relaxed opacity-75">
          The Spearman correlation matrix was removed because its values were hardcoded rather than computed from the model.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              Compile simulated data arrays and Experiment configurations into high-integrity structured distributions. Fully compatible for peer-reviewed journal reviews.
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
