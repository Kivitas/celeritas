/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BatchRow } from "../types";
import { Upload, Download, Plus, Trash2, Play, Table, AlertCircle, FileSpreadsheet } from "lucide-react";

interface RawBatchTabProps {
  batchRows: BatchRow[];
  setBatchRows: React.Dispatch<React.SetStateAction<BatchRow[]>>;
  isDarkMode: boolean;
}

export default function RawBatchTab({ batchRows, setBatchRows, isDarkMode }: RawBatchTabProps) {
  const [csvInput, setCsvInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Relativistic calculations across rows
  const triggerBatchProcess = () => {
    setBatchRows((prev) =>
      prev.map((row) => {
        const beta = row.beta;
        const n = row.refractiveIndex;
        const betaN = beta * n;
        
        let calculatedAngle = 0.0;
        let calculatedYield = 0.0;

        // cos(theta) = 1 / (beta * n)
        if (betaN > 1.0) {
          calculatedAngle = Math.acos(1.0 / betaN) * (180.0 / Math.PI);
          calculatedYield = 2 * Math.PI * (1 / 137.03599) * (1 - 1 / (beta * beta * n * n)) * 8200; // Relative photon index yield
        }

        return {
          ...row,
          angleDeg: Number(calculatedAngle.toFixed(4)),
          photonYield: Number(calculatedYield.toFixed(2)),
        };
      })
    );
  };

  // Quick physical presets loader
  const loadPhysicalTemplate = () => {
    const template: BatchRow[] = [
      { id: "1", sampleName: "Heavy Water Core (D2O) [Sr-90 beta]", beta: 0.8860, refractiveIndex: 1.328, energyMeV: 0.546, radiatorThicknessMm: 15.0 },
      { id: "2", sampleName: "Lead Glass Block (SF5) [Co-60 beta]", beta: 0.9450, refractiveIndex: 1.673, energyMeV: 0.963, radiatorThicknessMm: 25.0 },
      { id: "3", sampleName: "Liquid Argon Cryo [Cosmic Muon]", beta: 0.9998, refractiveIndex: 1.233, energyMeV: 4000.0, radiatorThicknessMm: 120.0 },
      { id: "4", sampleName: "Fused Silica Window [Synchrotron e-]", beta: 0.9999, refractiveIndex: 1.458, energyMeV: 6.0, radiatorThicknessMm: 2.0 },
      { id: "5", sampleName: "Silica Aerogel Block [SPS Proton]", beta: 0.7420, refractiveIndex: 1.050, energyMeV: 450.0, radiatorThicknessMm: 10.0 },
      { id: "6", sampleName: "BGO Scintillator Crystal [PET Gamma]", beta: 0.9120, refractiveIndex: 2.150, energyMeV: 0.511, radiatorThicknessMm: 30.0 },
      { id: "7", sampleName: "Liquid Xenon (LXe) [Dark Matter WIMP]", beta: 0.6500, refractiveIndex: 1.690, energyMeV: 0.050, radiatorThicknessMm: 200.0 },
      { id: "8", sampleName: "Sapphire Window (Al2O3) [Medical Linac]", beta: 0.9850, refractiveIndex: 1.770, energyMeV: 15.0, radiatorThicknessMm: 5.0 },
      { id: "9", sampleName: "Polystyrene Plastic (EJ-212) [Fast Neutron]", beta: 0.8500, refractiveIndex: 1.580, energyMeV: 2.0, radiatorThicknessMm: 50.0 },
      { id: "10", sampleName: "Water (H2O) [Super-Kamiokande Neutrino]", beta: 0.9990, refractiveIndex: 1.333, energyMeV: 1000.0, radiatorThicknessMm: 1000.0 },
    ];
    setBatchRows(template);
    setErrorMessage("");
  };

  // Handle CSV spreadsheet uploads
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      parseCSVContent(text);
    };
    reader.readAsText(file);
  };

  const parseCSVContent = (text: string) => {
    try {
      const lines = text.split("\n").filter((l) => l.trim() !== "");
      if (lines.length < 2) {
        setErrorMessage("CSV must contain at least a header row and one data row.");
        return;
      }

      const dataRows: BatchRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",").map((p) => p.trim());
        if (parts.length < 5) continue;

        dataRows.push({
          id: String(Date.now() + i),
          sampleName: parts[0] || `Medium_Sample_${i}`,
          beta: parseFloat(parts[1]) || 0.0,
          refractiveIndex: parseFloat(parts[2]) || 1.0,
          energyMeV: parseFloat(parts[3]) || 0.1,
          radiatorThicknessMm: parseFloat(parts[4]) || 0.0,
        });
      }

      setBatchRows((prev) => [...prev, ...dataRows]);
      setErrorMessage("");
    } catch (err) {
      setErrorMessage("Error parsing CSV. Format: name, beta, index, energy, thickness");
    }
  };

  const addEmptyRow = () => {
    setBatchRows((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sampleName: "New Radiator Target",
        beta: 0.975,
        refractiveIndex: 1.458,
        energyMeV: 2.5,
        radiatorThicknessMm: 10.0,
      },
    ]);
  };

  const removeRow = (id: string) => {
    setBatchRows((prev) => prev.filter((r) => r.id !== id));
  };

  const clearAllRows = () => {
    setBatchRows([]);
    setErrorMessage("");
  };

  const handleCellEdit = (id: string, col: keyof BatchRow, val: any) => {
    setBatchRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, [col]: val };
        }
        return r;
      })
    );
  };

  const downloadCalculatedCSV = () => {
    const header = "SampleName,Particle_Beta,Refractive_Index,KineticEnergy_MeV,TargetThickness_mm,Calculated_Angle_deg,Spectral_Photon_Yield\n";
    const body = batchRows
      .map(
        (r) =>
          `"${r.sampleName}",${r.beta},${r.refractiveIndex},${r.energyMeV},${r.radiatorThicknessMm},${r.angleDeg || 0.0},${r.photonYield || 0.0}`
      )
      .join("\n");

    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HEP_Spectrometry_Batch_Output_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Theme support
  const cardBg = isDarkMode ? "bg-slate-900/90 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-850";
  const inputBg = isDarkMode ? "bg-slate-950 text-slate-100 border-slate-800 focus:border-orange-500" : "bg-white text-slate-800 border-slate-200 focus:border-orange-500";
  const btnSec = isDarkMode ? "bg-slate-950/60 hover:bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-300" : "bg-slate-50 hover:bg-orange-50 border-slate-200 hover:border-orange-500 text-slate-700";
  const tableHeadBg = isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600";
  const rowBorder = isDarkMode ? "border-slate-800/80" : "border-slate-150";

  return (
    <div className="space-y-6 pb-24" id="raw-batch-tab">
      
      {/* Upload area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Drag & Drop area */}
        <div className={`border rounded-xl p-5 shadow-lg flex flex-col justify-between ${cardBg}`}>
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-3 mb-4">
              <FileSpreadsheet className="text-orange-500 w-5 h-5" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider">
                Relatvistic Spectra Batch Upload Area
              </h3>
            </div>
            <p className="text-xs opacity-70 mb-4 leading-relaxed font-sans">
              Drag or drop comma-separated spreadsheets (.csv) containing experimental refractive index logs. Populates particle speeds, counts, and emission properties automatically inside the database grid below.
            </p>

            <div className={`border border-dashed rounded-lg p-6 text-center transition ${isDarkMode ? "border-slate-800 bg-slate-950/40 hover:border-orange-500/50" : "border-slate-200 bg-slate-50 hover:border-orange-500/85"}`}>
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-2.5" />
              <label className="block text-xs font-bold cursor-pointer">
                <span className="text-orange-500 hover:underline">Select CSV File from System</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCSVUpload}
                />
              </label>
              <span className="text-[10px] opacity-50 mt-1 block">
                Format: SampleName, Beta, RefractiveIndex, EnergyMeV, ThicknessMm
              </span>
            </div>

            {errorMessage && (
              <div className="mt-3.5 bg-red-500/10 border border-red-500/30 p-2.5 rounded-lg flex items-center space-x-2 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex space-x-2">
            <button
              onClick={loadPhysicalTemplate}
              className={`flex-1 py-1.5 border text-xs font-semibold rounded-lg transition cursor-pointer ${btnSec}`}
            >
              Load Physical Presets Template
            </button>
          </div>
        </div>

        {/* Live Manual Input Clipboard */}
        <div className={`border rounded-xl p-5 shadow-lg flex flex-col justify-between ${cardBg}`}>
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-100/10 pb-3 mb-4">
              <Table className="text-orange-500 w-5 h-5" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider">
                Spectroscopic Clipboard Datastream
              </h3>
            </div>
            <p className="text-xs opacity-70 mb-3.5 leading-relaxed font-sans">
              Paste standard tabular spreadsheet series here directly. Perfect output from RefractiveIndex.INFO indices.
            </p>
            <textarea
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder="Sample1, 0.952, 1.336, 1.5, 4.0&#10;Sample2, 0.981, 1.458, 4.0, 10.0"
              className={`w-full h-32 rounded-lg p-2.5 text-xs font-mono outline-none focus:ring-1 focus:ring-orange-500 border ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-850"}`}
            />
          </div>
          <button
            onClick={() => {
              if (csvInput.trim()) {
                const head = "Name,Beta,Index,Energy,Depth\n" + csvInput;
                parseCSVContent(head);
                setCsvInput("");
              }
            }}
            className="w-full py-1.5 bg-orange-600 hover:bg-orange-550 border border-orange-700 text-xs text-white font-semibold rounded-lg mt-3 transition cursor-pointer"
          >
            Inject Clipboard Logs to Workspace
          </button>
        </div>
      </div>

      {/* Main interactive grid editor */}
      <div className={`border rounded-xl p-5 shadow-lg ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100/10 pb-3 mb-4 gap-3">
          <div className="flex items-center space-x-2">
            <Table className="text-orange-500 w-5 h-5" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider">
              Interactive Experimental Calibration Calculator
            </h3>
          </div>
          <div className="flex items-center space-x-2.5">
            <button
              onClick={clearAllRows}
              className="px-3 py-1.5 border border-red-500/30 hover:border-red-500/60 text-xs font-semibold rounded-lg flex items-center space-x-1 transition text-red-400 bg-red-500/5 hover:bg-red-500/10 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 opacity-60" />
              <span>Clear Board</span>
            </button>
            <button
              onClick={addEmptyRow}
              className={`px-3 py-1.5 border text-xs font-semibold rounded-lg flex items-center space-x-1 transition ${btnSec}`}
            >
              <Plus className="w-3.5 h-3.5 opacity-60" />
              <span>Insert Single Run</span>
            </button>
            <button
              onClick={triggerBatchProcess}
              className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-xs font-bold rounded-lg text-white flex items-center space-x-1.5 transition shadow cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run Relativistic Matrix Sweep</span>
            </button>
          </div>
        </div>

        {/* Spreadsheet table */}
        <div className={`overflow-x-auto border rounded-lg ${isDarkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
          <table className="w-full text-left text-xs font-mono border-collapse animate-fade">
            <thead className={`${tableHeadBg} border-b`}>
              <tr>
                <th className="p-3 font-sans border-r border-slate-100/10 font-bold uppercase tracking-wider text-[9px]">Sample / Radiator Target</th>
                <th className="p-3 border-r border-slate-100/10 font-bold uppercase tracking-wider text-[9px]">Beta Velocity β</th>
                <th className="p-3 border-r border-slate-100/10 font-bold uppercase tracking-wider text-[9px]">Index of Refraction n</th>
                <th className="p-3 border-r border-slate-100/10 font-bold uppercase tracking-wider text-[9px]">Kinetic Energy (MeV)</th>
                <th className="p-3 border-r border-slate-100/10 font-bold uppercase tracking-wider text-[9px]">Target Thickness x (mm)</th>
                <th className="p-3 border-r border-slate-100/10 text-blue-400 font-bold uppercase tracking-wider text-[9px]">Cerenkov Angle θc (deg)</th>
                <th className="p-3 border-r border-slate-100/10 text-orange-400 font-bold uppercase tracking-wider text-[9px]">Emitted Yield (photons/cm)</th>
                <th className="p-3 text-center font-bold uppercase tracking-wider text-[9px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {batchRows.length > 0 ? (
                batchRows.map((row) => (
                  <tr key={row.id} className={`border-b transition ${isDarkMode ? "border-slate-800/60 hover:bg-slate-900/40" : "border-slate-150 hover:bg-slate-50/50"}`}>
                    <td className="p-2 border-r border-slate-100/10">
                      <input
                        type="text"
                        value={row.sampleName}
                        onChange={(e) => handleCellEdit(row.id, "sampleName", e.target.value)}
                        className={`bg-transparent border-none outline-none focus:bg-slate-150 rounded px-1.5 py-1 w-full ${isDarkMode ? "text-slate-100 focus:bg-slate-800" : "text-slate-800 focus:bg-slate-100"}`}
                      />
                    </td>
                    <td className="p-2 border-r border-slate-100/10">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        max="0.99999"
                        value={row.beta}
                        onChange={(e) => handleCellEdit(row.id, "beta", parseFloat(e.target.value) || 0)}
                        className={`bg-transparent border-none outline-none focus:bg-slate-150 rounded px-1.5 py-1 font-mono w-full ${isDarkMode ? "text-slate-100 focus:bg-slate-800" : "text-slate-800 focus:bg-slate-100"}`}
                      />
                    </td>
                    <td className="p-2 border-r border-slate-100/10">
                      <input
                        type="number"
                        step="0.001"
                        min="1"
                        max="5.0"
                        value={row.refractiveIndex}
                        onChange={(e) => handleCellEdit(row.id, "refractiveIndex", parseFloat(e.target.value) || 0)}
                        className={`bg-transparent border-none outline-none focus:bg-slate-150 rounded px-1.5 py-1 font-mono w-full ${isDarkMode ? "text-slate-100 focus:bg-slate-800" : "text-slate-800 focus:bg-slate-100"}`}
                      />
                    </td>
                    <td className="p-2 border-r border-slate-100/10">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={row.energyMeV}
                        onChange={(e) => handleCellEdit(row.id, "energyMeV", parseFloat(e.target.value) || 0)}
                        className={`bg-transparent border-none outline-none focus:bg-slate-150 rounded px-1.5 py-1 font-mono w-full ${isDarkMode ? "text-slate-100 focus:bg-slate-800" : "text-slate-800 focus:bg-slate-100"}`}
                      />
                    </td>
                    <td className="p-2 border-r border-slate-100/10">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={row.radiatorThicknessMm}
                        onChange={(e) => handleCellEdit(row.id, "radiatorThicknessMm", parseFloat(e.target.value) || 0)}
                        className={`bg-transparent border-none outline-none focus:bg-slate-150 rounded px-1.5 py-1 font-mono w-full ${isDarkMode ? "text-slate-100 focus:bg-slate-800" : "text-slate-800 focus:bg-slate-100"}`}
                      />
                    </td>
                    <td className="p-2 border-r border-slate-100/10 font-bold text-blue-500">
                      {row.angleDeg !== undefined ? `${row.angleDeg}°` : "--"}
                    </td>
                    <td className="p-2 border-r border-slate-100/10 font-bold text-orange-500">
                      {row.photonYield !== undefined ? `${row.photonYield.toLocaleString()} /cm` : "--"}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => removeRow(row.id)}
                        className="p-1 hover:bg-red-500/10 hover:text-red-400 rounded transition cursor-pointer"
                        title="Delete Track Row"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-sans italic">
                    Grid completely empty. Paste clipboard logs, upload CSV spreadsheets, or click "Load Physical Presets Template" above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Export triggers */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 mt-4 font-mono gap-3">
          <span>* Solving relativistic kinematics and Cherenkov cones with high performance parallel iterations.</span>
          <button
            onClick={downloadCalculatedCSV}
            disabled={batchRows.length === 0}
            className={`px-4 py-2 bg-slate-950 border border-slate-805 hover:bg-slate-900 rounded-lg font-bold text-slate-200 flex items-center space-x-1.5 transition ${
              batchRows.length === 0 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <Download className="w-4 h-4 text-orange-500" />
            <span>Generate Completed Spreadsheet (CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
