/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { SimulationParams, DetectorSettings, SimulationSummary, BatchRow } from "./types";
import {
  runCherenkovSimulation,
  calculateRelativisticBeta,
  ELECTRON_MASS_MEV,
  MUON_MASS_MEV,
} from "./core/physics";
import { sendAIMessage, loadApiKeys, saveApiKeys, getActiveProvider, AI_PROVIDERS } from "./core/ai";
import { MATERIAL_PRESETS, ISOTOPE_PRESETS } from "./data/presets";
import { BEAMLINE_PRESETS } from "./data/beamlinePresets";

// Import modules (eager: always visible or small)
import ConfigurationTab from "./components/ConfigurationTab";
import DynamicPlots from "./components/DynamicPlots";
import Sidebar from "./components/Sidebar";
import PhysicsDetailsPanel from "./components/PhysicsDetailsPanel";

// Heavy tabs are loaded on demand to keep the initial bundle small
const LabTab = lazy(() => import("./components/LabTab"));
const RawBatchTab = lazy(() => import("./components/RawBatchTab"));
const ExportsTab = lazy(() => import("./components/ExportsTab"));
const ValidationTab = lazy(() => import("./components/ValidationTab"));
const MonteCarloTab = lazy(() => import("./components/MonteCarloTab"));
const InstrumentsTab = lazy(() => import("./components/InstrumentsTab"));
const TheoryTab = lazy(() => import("./components/TheoryTab").then((m) => ({ default: m.TheoryTab })));
import { motion, AnimatePresence } from "motion/react";
import { generatePdfFromElement } from "./utils/pdfExport";

// Import icons from lucide-react
import {
  Bookmark,
  Share2,
  FileText,
  Send,
  HelpCircle,
  Lightbulb,
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
    customIsotopeName: "Custom Physical Beam",
    beamEnergyMeV: 0.546,
    energyUnit: "MeV",
    isRelativisticCalculated: true,
    intensityFlux: 370000,
    incidenceAngleDeg: 0,
    magneticFieldT: 0.0,
    beamProfile: "Gaussian",
    beamFwhmUm: 200.0,
    
    materialId: "heavy_water",
    nanoparticlePeakNm: 520,
    nanoparticlesActive: false,
    nanoparticleConcentrationPpm: 50,
    radiatorThicknessMm: 15.0, // Used internally as general target material thickness (x)

    spectralRangeStartNm: 300,
    spectralRangeEndNm: 800,
    binResolutionNm: 10,

    componentsActive: {
      primaryCherenkov: true,
      secondaryCherenkov: true,
      bremsstrahlung: false,
      fluorescence: false,
      detectorBackground: true,
      opticalRayleighScattering: false,
      comptonScattering: false,
      photoelectricIonization: false,
      transitionRadiation: false,
      synchrotronRadiation: false,
      pairProduction: false,
      hadronicShower: false,
      neutrinoOscillation: false,
      muonDecay: false,
      kaonDecay: false,
      bMesonDecay: false,
      crystalChanneling: false,
      lowEnergyNeutrons: false,
      darkMatterScattering: false,
      axionConversion: false,
      gravitationalWaveLensing: false,
      planckScaleEffects: false,
      magneticMonopoleSignatures: false,
      hawkingRadiation: false,
    },

    chamberMaterial: "Vacuum",
    
    detectorSubsystems: {
      pixelTracker: true,
      stripTracker: false,
      tpc: false,
      driftChamber: false,
      ecal: true,
      hcal: false,
      muonSpectrometer: false,
      rich: false,
    },
    
    reconstruction: {
      kalmanFilter: true,
      helixFitting: false,
      vertexReconstruction: false,
      mlJetClassification: false,
      mlAnomalyDetection: false,
    },
  
    simulationMode: "stochastic",
    
    daq: {
      l1Trigger: true,
      highLevelTrigger: false,
      deadtimeFraction: 0.05,
      radiationDamagePercent: 0.0, 
      sensorDefects: "low",
    },
  
    exoticPhysics: {
      supersymmetry: false,
      darkMatter: false,
      magneticMonopoles: false,
      axions: false,
      sterileNeutrinos: false,
      extraDimensions: false,
    },

    // Advanced beam properties
    beamDivergenceMrad: 0.3,
    beamCharge: 1,
    beamPulseWidthNs: 12,
    trackLengthMm: 10.0,
    
    // Macro Fields
    magneticFieldTesla: 1.5,
    electricFieldKvM: 0.0,

    // Monte Carlo & Generator Parameters
    monteCarloGenerator: "NONE",
    eventGenerator: "Standalone",
    mcEventsPerRun: 10000,
    cosmicRaysActive: false,
    ambientCosmicRays: false,
    gravitationalLensingActive: false,
    triggerLevel1Active: true,
    mlJetReconstruction: false,
    daqDeadTimeFraction: 0.05,

    // Extra detailed particle info
    particleSpin: "1/2",
    baryonNumber: 0,
    leptonNumber: 1,
    customRestMassMeV: 105.658,
    customChargeE: -1,

    // Particle Trigger options
    numberFiredParticles: 150,

    // Lab setup properties
    labFacility: "SPS-Synchrotron",
    chamberShape: "Cylindrical-Beam-Pipe",
    dimensionMode: "3D-Isometric-Chambers",
    chamberTemperatureK: 293.15, // room temp 20°C

    // Experimental dosimetry Experimental mode state
    experimentalModeActive: false,
    experimentalApplication: "none",
    fluenceRateGyMin: 0.05,
    cumulativeFluenceGy: 0.1,
  };

type TabId = "configure" | "montecarlo" | "lab" | "batch" | "exports" | "validation" | "instruments" | "theory";

// Mobile tab bar: every tab, with a short label for the narrow header strip
const MOBILE_TABS: { id: TabId; short: string }[] = [
  { id: "configure", short: "Sim" },
  { id: "montecarlo", short: "MC" },
  { id: "lab", short: "3D" },
  { id: "batch", short: "Batch" },
  { id: "exports", short: "Export" },
  { id: "validation", short: "Journal" },
  { id: "instruments", short: "Instr." },
  { id: "theory", short: "Theory" },
];

const DEFAULT_PARAMS_DETECTOR: DetectorSettings = {
  chipset: "Timepix3",
  geometry: "256x256",
  pixelPitchUm: 55.0,
  thresholdKeV: 1.2,
  noiseRmsKeV: 0.8,
  coincidenceNs: 20,
  chargeSharingActive: false,
  clusteringAlgo: "Center-of-Gravity",

  detectorTemperatureC: 20,
  leakageCurrentNa: 1.5,
  depletionVoltageV: 150,
  substrateThicknessUm: 300,
  quantumEfficiencyPct: 90,
  pixelDeadTimeNs: 100,
  activeCoolingType: "Thermoelectric Peltier",
  biasVoltageV: 50,
  dopingDensityPtype: 1.0,
  readoutMode: "ToA (Time of Arrival)",
  gainMode: "Medium",
  frameRateHz: 1000,
  dynamicRangeBits: 10,
  energyResolutionPercent: 1.5,
  timingResolutionPs: 100,
  spatialResolutionUm: 5.0,
  darkCountRateHz: 100,
  afterpulsingProbability: 0.01,
  crosstalkPercent: 2.0,
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

  // AI Assistant Chat interactive panel states
  const [assistantLogs, setAssistantLogs] = useState<string>(
    "Welcome to the HEP AI Spectrometry Advisor. Ask questions about relativistic critical angles, Frank-Tamm parameters, Sellmeier dispersion parameters, or recommend silicon sensor configurations for your particle radiation tracks!"
  );
  const [assistantQuery, setAssistantQuery] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => loadApiKeys());
  const [showAiConfig, setShowAiConfig] = useState(false);

  const updateApiKey = (id: string, key: string) => {
    const newKeys = { ...apiKeys, [id]: key };
    setApiKeys(newKeys);
    saveApiKeys(newKeys);
  };

  // PDF export loading state
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleGenerateReport = async () => {
    setIsExportingPdf(true);
    try {
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
  // Ties keep the smaller thickness. Purely local: no AI call.
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
      if (summary.signalToNoiseRatioDb > bestSnr) {
        bestSnr = summary.signalToNoiseRatioDb;
        bestThickness = t;
      }
    }
    const previousSnr = simResult.summary.signalToNoiseRatioDb;
    setParams((prev) => ({ ...prev, radiatorThicknessMm: bestThickness }));
    setAssistantLogs(
      `Thickness optimised to ${bestThickness} mm: SNR ${bestSnr.toFixed(2)} dB (was ${previousSnr.toFixed(2)} dB). Optimisation scans radiator thickness only; it does not change other settings.`
    );
  };

  // Trigger quick setups from fast physical triggers (data lives in data/beamlinePresets.ts)
  const loadPresetSetup = (presetId: string) => {
    const preset = BEAMLINE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setParams((prev) => ({
      ...prev,
      ...preset.params,
      componentsActive: { ...prev.componentsActive, ...preset.componentsActive },
    }));

    if (preset.detector) {
      const detectorOverrides = preset.detector;
      setDetector((prev) => ({ ...prev, ...detectorOverrides }));
    }
  };

  // Submit prompts to the full-stack AI advisor
  const queryWebAssistant = async (customPrompt?: string) => {
    const activePrompt = customPrompt || assistantQuery;
    if (!activePrompt.trim()) return;

    const provider = getActiveProvider(apiKeys);
    if (!provider) {
      setAssistantLogs("Error: No API key configured. Please enter an API key in the AI Configuration.");
      setShowAiConfig(true);
      return;
    }

    setIsAiLoading(true);
    setAssistantLogs("HEP AI Consulting Node: Formulating spectroscopic physics assessment...");

    try {
      const text = await sendAIMessage(provider.id, apiKeys[provider.id], activePrompt, {
        parameters: params,
        siliconMatrix: detector,
        calculatedSummary: simResult.summary,
      });
      setAssistantLogs(text);
    } catch (err: any) {
      setAssistantLogs(`AI Solver Offline: ${err.message || "Network Timeout"}`);
    } finally {
      setIsAiLoading(false);
      if (!customPrompt) setAssistantQuery("");
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
              <span className="text-white font-bold text-sm tracking-tight">Celeritas</span>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                  {activeTab === "configure" && "Simulation Controls"}
                  {activeTab === "montecarlo" && "Monte Carlo Generator"}
                  {activeTab === "lab" && "3D Chamber Lab"}
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
                <button
                  onClick={() => setShowAiConfig(!showAiConfig)}
                  className={`p-1.5 rounded-lg transition-all ${
                    showAiConfig ? 'bg-orange-500/15 text-orange-400' : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
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

                {activeTab === "montecarlo" && (
                  <MonteCarloTab
                    params={params}
                    setParams={setParams}
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

                {activeTab === "instruments" && (
                  <InstrumentsTab isDarkMode={isDarkMode} />
                )}

                {activeTab === "theory" && (
                  <TheoryTab />
                )}

                {(activeTab === "configure" || activeTab === "lab") && (
                  <>
                    {/* Synchronized diagnostic plots occupant */}
                    <DynamicPlots
                      spectra={simResult.spectra}
                      summary={simResult.summary}
                      detector={detector}
                      beamEnergyMeV={params.beamEnergyMeV}
                      isDarkMode={isDarkMode}
                    />

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
              </motion.div>
            </AnimatePresence>
          </section>

          {/* Right Column / Floating Drawer: AI Assistant consultation panel */}
          {/* For now, we will render it below the main section on small screens, or hidden behind a toggle if we wanted a drawer. Let's just stack it at the bottom for now to give the main workspace 100% width above. */}
          <section className="w-full space-y-6 mt-8 border-t border-white/10 pt-8">

            <div className="flex items-center space-x-3 mb-4">
               <h2 className="text-xl font-bold text-white tracking-widest font-sans">AUXILIARY SYSTEMS</h2>
               <div className="h-px bg-white/10 flex-1"></div>
            </div>

            {/* Live calibration metrics strip */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent pointer-events-none" />
              <div className="relative grid grid-cols-3 gap-px bg-white/5">
                <div className="p-4 text-center bg-slate-900">
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500/60" />
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 font-mono">Speed β</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-orange-400">{simResult.summary.beta.toFixed(4)}</div>
                </div>
                <div className="p-4 text-center bg-slate-900/50">
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 font-mono">Cone θc</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-blue-400">{simResult.summary.cherenkovAngleDeg.toFixed(2)}°</div>
                </div>
                <div className="p-4 text-center bg-slate-900/50">
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 font-mono">SNR</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-400">{simResult.summary.signalToNoiseRatioDb.toFixed(1)} dB</div>
                </div>
              </div>
            </div>

            {/* AI Assistant Chat frame */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 shadow-lg flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative p-5">
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/5">
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse-glow shrink-0"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-extrabold tracking-wider uppercase font-sans text-white">
                      HEP AI Spectrometry Advisor
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono truncate">Theoretical & Calibration Assistant</p>
                  </div>
                  <button
                    onClick={() => setShowAiConfig(!showAiConfig)}
                    className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition shrink-0 border ${
                      showAiConfig 
                        ? "bg-orange-500/15 text-orange-400 border-orange-500/30" 
                        : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {showAiConfig ? "Close" : "API Keys"}
                  </button>
                </div>

              {showAiConfig && (
                <div className="mb-4 p-3 bg-slate-800/50 rounded-lg space-y-2 border border-slate-700">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-300">AI Provider Keys</h4>
                  {AI_PROVIDERS.map((p) => (
                    <div key={p.id} className="flex flex-col">
                      <label className="text-[9px] text-slate-400 mb-1">{p.label}</label>
                      <input
                        type="password"
                        placeholder={`Enter ${p.label} API Key`}
                        value={apiKeys[p.id] || ""}
                        onChange={(e) => updateApiKey(p.id, e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-orange-500"
                      />
                    </div>
                  ))}
                  <p className="text-[9px] text-slate-500 mt-2">Keys are stored locally in your browser.</p>
                </div>
              )}

              {/* Chat outcome console */}
              <div className={`whitespace-pre-wrap border p-4 rounded-lg text-xs font-mono leading-relaxed max-h-[420px] min-h-[260px] overflow-y-auto ${isDarkMode ? "bg-slate-950 border-slate-800 text-emerald-400" : "bg-slate-50 border-slate-200 text-emerald-800"}`}>
                {assistantLogs}
              </div>

              <div className="mt-4 space-y-3">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Suggested Physics Queries</label>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <button
                    onClick={() => queryWebAssistant(`Draft an academic summary for synchrotron relativistic electron tracking in Fused Silica`)}
                    className={`py-2 px-3 border text-start text-[10px] rounded-lg transition ${isDarkMode ? "bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300" : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"}`}
                  >
                    ✉️ Synchrotron electron tracking in quartz
                  </button>
                  <button
                    onClick={() => queryWebAssistant(`Explain the Frank-Tamm integrated yield limits in Liquid Argon`)}
                    className={`py-2 px-3 border text-start text-[10px] rounded-lg transition ${isDarkMode ? "bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300" : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"}`}
                  >
                    📐 Explain Frank-Tamm integral formula
                  </button>
                  <button
                    onClick={() => queryWebAssistant(`Recommend silicon sensor noise thresholds for cosmic Muon tracking`)}
                    className={`py-2 px-3 border text-start text-[10px] rounded-lg transition col-span-2 ${isDarkMode ? "bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300" : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"}`}
                  >
                    🚀 Recommend silicon sensor configurations
                  </button>
                </div>

                <div className="flex space-x-2 border-t border-slate-100/10 pt-3 mb-2">
                  <button
                    onClick={() => {
                      if (!isAiLoading) optimizeThickness();
                    }}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white font-bold text-[10px] uppercase tracking-wider py-1.5 rounded-lg transition shadow-lg flex justify-center items-center space-x-2 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Optimize Thickness</span>
                  </button>
                  <button
                    onClick={() => queryWebAssistant("Generate a comprehensive summary of the current physics state.")}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-[10px] uppercase tracking-wider py-1.5 rounded-lg transition shadow flex justify-center items-center cursor-pointer"
                  >
                    Generate Summary
                  </button>
                </div>
                
                {/* Question paste form */}
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="text"
                    placeholder="Query specialized recommendations..."
                    value={assistantQuery}
                    onChange={(e) => setAssistantQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && queryWebAssistant()}
                    disabled={isAiLoading}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-orange-500 transition-all font-sans ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`}
                  />
                  <button
                    onClick={() => queryWebAssistant()}
                    disabled={isAiLoading || !assistantQuery.trim()}
                    className="p-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-100 disabled:opacity-40 rounded-lg text-white transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 fill-none" />
                  </button>
                </div>
              </div>
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
                    { label: "Chipset", value: detector.chipset, color: "text-orange-400" },
                    { label: "Geometry", value: detector.geometry, color: "text-orange-400" },
                    { label: "Threshold", value: `${detector.thresholdKeV} keV`, color: "text-white" },
                    { label: "Cooling", value: detector.activeCoolingType, color: "text-white" },
                    { label: "Quantum Eff.", value: `${detector.quantumEfficiencyPct}%`, color: "text-white" },
                    { label: "Bias Voltage", value: `${detector.biasVoltageV} V`, color: "text-white" },
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
                      <span className="text-base">{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
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
