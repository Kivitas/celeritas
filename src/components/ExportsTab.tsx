/**
 * @license
 * SPDX-License-Identifier: MIT
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

          <div className={`p-4 border rounded-lg space-y-2 mt-4 text-xs ${metricsBg}`}>
            <p className="text-[10px] opacity-75 font-sans leading-relaxed">
              No DOI has been assigned to this software yet. Cite the repository (see CITATION.cff) until a release is archived.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
