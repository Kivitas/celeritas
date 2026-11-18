/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { SimulationParams, DetectorSettings, SimulationSummary, BatchRow } from "./types";
import {
  runCherenkovSimulation,
  calculateRelativisticBeta,
  ELECTRON_MASS_MEV,
  MUON_MASS_MEV,
} from "./core/physics";
import { validateRunConfig, configToEngine, type RunConfig } from "./core/runConfig";
import { MATERIAL_PRESETS, ISOTOPE_PRESETS } from "./data/presets";
import { BEAMLINE_PRESETS } from "./data/beamlinePresets";

// Import modules (eager: always visible or small)
import ConfigurationTab from "./components/ConfigurationTab";
import Sidebar from "./components/Sidebar";
import ErrorBoundary from "./components/ErrorBoundary";
import PhysicsDetailsPanel from "./components/PhysicsDetailsPanel";
import MonteCarloPanel from "./components/MonteCarloPanel";

// Heavy tabs are loaded on demand to keep the initial bundle small
const LabTab = lazy(() => import("./components/LabTab"));
const RawBatchTab = lazy(() => import("./components/RawBatchTab"));
const ExportsTab = lazy(() => import("./components/ExportsTab"));
const ValidationTab = lazy(() => import("./components/ValidationTab"));
const InstrumentsTab = lazy(() => import("./components/InstrumentsTab"));
const DynamicPlots = lazy(() => import("./components/DynamicPlots"));
const TheoryTab = lazy(() => import("./components/TheoryTab").then((m) => ({ default: m.TheoryTab })));
import { motion, AnimatePresence } from "motion/react";

// Import icons from lucide-react
import {
  Bookmark,
  Share2,
  FileText,
  Send,
  HelpCircle,
  X,
  Printer,
  RefreshCw,
  Flame,
  Sun,
  Moon,
  ShieldCheck,
  Menu,
  Sparkles
} from "lucide-react";

const DEFAULT_PARAMS: SimulationParams = {
  isotopeId: "sr90",
  customIsotopeName: "",
  beamEnergyMeV: 0.546,
  energyUnit: "MeV",
  beamCharge: -1,
  customRestMassMeV: 0.51099895,
  customChargeE: -1,
  magneticFieldT: 1.5,
  beamFwhmUm: 200,
  trackLengthMm: 10,
  numberFiredParticles: 100,
  chamberTemperatureK: 293.15,
  materialId: "quartz",
  radiatorThicknessMm: 15,
  spectralRangeStartNm: 300,
  spectralRangeEndNm: 800,
  binResolutionNm: 10,
  componentsActive: { primaryCherenkov: true },
  daq: { deadtimeFraction: 0 },
};

type TabId = "configure" | "lab" | "batch" | "exports" | "validation" | "instruments" | "theory" | "montecarlo";

// Mobile tab bar: every tab, with a short label for the narrow header strip
const MOBILE_TABS: { id: TabId; short: string }[] = [
  { id: "configure", short: "Sim" },
  { id: "lab", short: "3D" },
  { id: "montecarlo", short: "MC" },
  { id: "batch", short: "Batch" },
  { id: "exports", short: "Export" },
  { id: "validation", short: "Journal" },
  { id: "instruments", short: "Instr." },
  { id: "theory", short: "Theory" },
];

const DEFAULT_PARAMS_DETECTOR: DetectorSettings = {
  quantumEfficiencyPct: 30,
  darkCountRateHz: 20,
  frameRateHz: 1000,
};

// Builds one batch row, deriving beta from the kinetic energy and particle rest mass
const makeRow = (
  id: string,
  sampleName: string,
  energyMeV: number,
  particleMassMeV: number,
  refractiveIndex: number,
  radiatorThicknessMm: number,
): BatchRow => ({
  id,
  sampleName,
  beta: calculateRelativisticBeta(energyMeV, particleMassMeV),
  refractiveIndex,
  energyMeV,
  radiatorThicknessMm,
});

const INITIAL_BATCH_ROWS: BatchRow[] = [
  makeRow("1", "Heavy Water Core (D2O) [Sr-90 beta]", 0.546, ELECTRON_MASS_MEV, 1.328, 15.0),
  makeRow("2", "Lead Glass Block (SF5) [Co-60 Compton-edge e-]", 0.963, ELECTRON_MASS_MEV, 1.673, 25.0),
  makeRow("3", "Liquid Argon Cryo [Cosmic Muon]", 4000.0, MUON_MASS_MEV, 1.233, 120.0),
];

const TAB_FALLBACK = <div className="p-6 text-slate-400 text-sm">Loading…</div>;

export default function App() {
  // Global Active Tab state
  const [activeTab, setActiveTab] = useState<TabId>("configure");

  // Mobile sidebar open state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Global Dark Mode state (defaults to true since high-energy physics dashboards are traditionally low-fatigue slate dark console aesthetics!)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Global physics simulation state (completely material and isotope generic, no Target/anatomical Radiator)
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);

  // Global Silicon Core Settings state
  const [detector, setDetector] = useState<DetectorSettings>(DEFAULT_PARAMS_DETECTOR);

  // Bulk parameters calibration spreadsheets list (generic high-purity physical tracks reference logs)
  const [batchRows, setBatchRows] = useState<BatchRow[]>(INITIAL_BATCH_ROWS);

  const [optimizerMessage, setOptimizerMessage] = useState<string | null>(null);

  // PDF export loading state
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleGenerateReport = async () => {
    setIsExportingPdf(true);
    try {
      // Loaded on demand: jsPDF and html2canvas are large and only needed for export.
      const { generatePdfFromElement } = await import("./utils/pdfExport");
      await generatePdfFromElement("report-export-area", `Cherenkov_Lab_Report_${Date.now()}.pdf`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Solve live physics simulation matching the current controls
  const activeIsotopePreset = useMemo(() => {
    return ISOTOPE_PRESETS.find((v) => v.id === params.isotopeId);
  }, [params.isotopeId]);

  const activeMaterialPreset = useMemo(() => {
    return MATERIAL_PRESETS.find((m) => m.id === params.materialId) || MATERIAL_PRESETS[0];
  }, [params.materialId]);

  const simResult = useMemo(() => {
    return runCherenkovSimulation(params, activeMaterialPreset, activeIsotopePreset, detector);
  }, [params, activeMaterialPreset, activeIsotopePreset, detector]);

  // Scan radiator thickness (1-200 mm, 1 mm steps) and keep the one with the highest SNR.
  // Ties keep the smaller thickness.
  const optimizeThickness = () => {
    let bestThickness = 1;
    let bestSnr = -Infinity;
    for (let t = 1; t <= 200; t += 1) {
      const { summary } = runCherenkovSimulation(
        { ...params, radiatorThicknessMm: t },
        activeMaterialPreset,
        activeIsotopePreset,
        detector,
      );
      if (summary.signalToNoiseRatio > bestSnr) {
        bestSnr = summary.signalToNoiseRatio;
        bestThickness = t;
      }
    }
    const previousSnr = simResult.summary.signalToNoiseRatio;
    setParams((prev) => ({ ...prev, radiatorThicknessMm: bestThickness }));
    setOptimizerMessage(
      `Thickness set to ${bestThickness} mm: S/√(S+B) ${bestSnr.toFixed(2)} (was ${previousSnr.toFixed(2)}). The scan changes radiator thickness only.`
    );
  };

  // Trigger quick setups from fast physical triggers (data lives in data/beamlinePresets.ts)
  // Validates a run configuration file, then applies it. Returns an error message, or null on success.
  const importRunConfig = (jsonText: string): string | null => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      return "Not valid JSON: " + (err as Error).message;
    }
    const problems = validateRunConfig(parsed);
    if (problems.length > 0) {
      return "Rejected: " + problems.map((p) => `${p.field}: ${p.message}`).join("; ");
    }
    const engine = configToEngine(parsed as RunConfig);
    setParams((prev) => ({ ...prev, ...engine.params }));
    setDetector(engine.detector);
    return null;
  };

  const loadPresetSetup = (presetId: string) => {
    const preset = BEAMLINE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setParams((prev) => ({
      ...prev,
      ...preset.params,
    }));

    if (preset.detector) {
      const detectorOverrides = preset.detector;
      setDetector((prev) => ({ ...prev, ...detectorOverrides }));
    }
  };

  // Theme support styles
  const wrapperClass = isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-950";
  const headerClass = isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-950";
  const contentBgClass = isDarkMode ? "bg-slate-950" : "bg-slate-50";

  // Sidebar remains a classy deep slate charcoal regardless of theme, reflecting high-end laboratory aesthetics
  return (
    <div className={`min-h-screen flex flex-col lg:flex-row font-sans transition-all selection:bg-orange-500 selection:text-white ${wrapperClass}`}>
      
      {/* PROFESSIONAL CHERENKOV ACCELERATOR LAB SIDEBAR - DESKTOP */}
      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isMobile={false}
      />

      {/* PORTAL MOBILE OVERLAY DRAWER - TABLETS & PHONES */}
      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isMobile={true}
      />

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-x-hidden">
        
        {/* UPGRADED HEADER BAR */}
        <header className="no-print sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between px-3 sm:px-5 py-2.5">
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-slate-300 hover:bg-white/5 rounded-xl transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span className="text-white font-bold text-sm tracking-tight">Redshift</span>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                  {activeTab === "configure" && "Simulation Controls"}
                  {activeTab === "lab" && "3D Chamber Lab"}
                  {activeTab === "montecarlo" && "Monte Carlo"}
                  {activeTab === "batch" && "Batch Accelerator"}
                  {activeTab === "exports" && "Analytical Predictors"}
                  {activeTab === "validation" && "Benchmark Journal"}
                  {activeTab === "instruments" && "Instrument Library"}
                  {activeTab === "theory" && "Theory & Formulas"}
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-1 p-0.5 bg-white/5 rounded-xl border border-white/5">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={isExportingPdf}
                className="px-3 py-1.5 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-orange-500/15 disabled:opacity-50"
              >
                {isExportingPdf ? <RefreshCw className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                <span>{isExportingPdf ? "Generating..." : "Report"}</span>
              </button>
              {simResult.summary.isCherenkovGenerated && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
                </div>
              )}
            </div>

            <div className="flex lg:hidden items-center gap-0.5 bg-slate-950/80 rounded-lg p-0.5 border border-white/5 overflow-x-auto whitespace-nowrap min-w-0 max-w-[65%]">
              {MOBILE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2 py-1 text-[8px] font-bold rounded-md transition-all shrink-0 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.short}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Main Dashboard Workspace Grid - Full Width Layout */}
        <main id="report-export-area" className={`flex-1 w-full p-3 sm:p-4 md:p-6 xl:p-8 flex flex-col ${contentBgClass}`}>
          
          {/* Full Width Main Workspace Area */}
          <section className="w-full space-y-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full space-y-6"
              >
                <ErrorBoundary name={activeTab}>
                <Suspense fallback={TAB_FALLBACK}>
                {activeTab === "configure" && (
                  <ConfigurationTab
                    params={params}
                    setParams={setParams}
                    detector={detector}
                    setDetector={setDetector}
                    onLoadPreset={loadPresetSetup}
                    isDarkMode={isDarkMode}
                  />
                )}

                {activeTab === "batch" && (
                  <RawBatchTab
                    batchRows={batchRows}
                    setBatchRows={setBatchRows}
                    isDarkMode={isDarkMode}
                  />
                )}

                {activeTab === "exports" && (
                  <ExportsTab
                    params={params}
                    detector={detector}
                    onGenerateReport={handleGenerateReport}
                    onImportConfig={importRunConfig}
                    isDarkMode={isDarkMode}
                  />
                )}

                {activeTab === "validation" && (
                  <ValidationTab
                    params={params}
                    setParams={setParams}
                    summary={simResult.summary}
                    isDarkMode={isDarkMode}
                  />
                )}

                {activeTab === "lab" && (
                  <LabTab
                    params={params}
                    detector={detector}
                    summary={simResult.summary}
                    isDarkMode={isDarkMode}
                  />
                )}

                {activeTab === "montecarlo" && (
                    <MonteCarloPanel
                      params={params}
                      material={activeMaterialPreset}
                      isotope={activeIsotopePreset}
                      detector={detector}
                      isDarkMode={isDarkMode}
                    />
                )}

                {activeTab === "instruments" && (
                  <InstrumentsTab isDarkMode={isDarkMode} />
                )}

                {activeTab === "theory" && (
                  <TheoryTab />
                )}

                {(activeTab === "configure" || activeTab === "lab") && (
                  <>
                    {/* Synchronized diagnostic plots occupant */}
                    <Suspense fallback={<div className="text-xs opacity-60 p-4">Loading spectra…</div>}>
                      <DynamicPlots
                        spectra={simResult.spectra}
                        summary={simResult.summary}
                        detector={detector}
                        beamEnergyMeV={params.beamEnergyMeV}
                        isDarkMode={isDarkMode}
                      />
                    </Suspense>

                    {/* Physics Details Panel - Shows when all components enabled */}
                    <PhysicsDetailsPanel
                      params={params}
                      summary={simResult.summary}
                      isDarkMode={isDarkMode}
                      activeMaterialPreset={activeMaterialPreset}
                    />
                  </>
                )}
                </Suspense>
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </section>

          <section className="w-full space-y-6 mt-8 border-t border-white/10 pt-8">
            <div className="flex items-center space-x-3 mb-4">
              <h2 className="text-xl font-bold text-white tracking-widest font-sans">AUXILIARY SYSTEMS</h2>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>
            <div className="rounded-xl bg-slate-900/80 border border-white/5 p-5 space-y-3">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300">Radiator thickness scan</h3>
              <p className="text-[10px] text-slate-400">Scans 1–200 mm and sets the thickness that maximises S/√(S+B). Other settings are unchanged.</p>
              <button
                onClick={optimizeThickness}
                className="w-full bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white font-bold text-[10px] uppercase tracking-wider py-1.5 rounded-lg transition shadow-lg flex justify-center items-center gap-2"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Optimize thickness</span>
              </button>
              {optimizerMessage && <p className="text-[10px] font-mono text-slate-200" aria-live="polite">{optimizerMessage}</p>}
            </div>

            {/* Detector Snapshot */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 shadow-lg">
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300">
                    Active Detector Snapshot
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Quantum Eff.", value: `${detector.quantumEfficiencyPct}%`, color: "text-orange-400" },
                    { label: "Dark counts", value: `${detector.darkCountRateHz} Hz`, color: "text-white" },
                    { label: "Frame rate", value: `${detector.frameRateHz} Hz`, color: "text-white" },
                  ].map((item) => (
                    <div key={item.label} className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[8px] uppercase tracking-widest text-slate-500 font-mono mb-1">{item.label}</div>
                      <div className={`text-xs font-bold font-mono ${item.color}`}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Reference Beamlines */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 shadow-lg">
              <div className="absolute top-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Quick Reference Beamlines
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {BEAMLINE_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => loadPresetSetup(p.id)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[10px] font-semibold border border-white/5 bg-white/5 hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-400 transition-all text-slate-300"
                    >
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      {/* FOOTER */}
      <footer className="mt-auto bg-slate-950/50 border-t border-white/5 py-3 px-6 text-center">
        <div className="flex items-center justify-center gap-3 text-[9px] text-slate-500 font-mono tracking-wider">
          <span>© 2026 Kivitas </span>
          <span className="w-px h-3 bg-white/10" />
          <span>MIT Academic License</span>
          <span className="w-px h-3 bg-white/10" />
          <span>v1.0 · Kivitas</span>
        </div>
      </footer>
      
      </div>
    </div>
  );
}
