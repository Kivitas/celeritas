/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Activity, Monitor, Cpu, GitBranch, Compass, X, Zap, ChevronRight } from "lucide-react";

interface SidebarProps {
  activeTab: "configure" | "montecarlo" | "lab" | "batch" | "exports" | "validation" | "instruments" | "theory";
  onTabChange: (tab: "configure" | "montecarlo" | "lab" | "batch" | "exports" | "validation" | "instruments" | "theory") => void;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const navItems = [
  { id: "configure" as const, label: "Simulation Controls", icon: Activity, desc: "Particle beam & detector config" },
  { id: "montecarlo" as const, label: "Monte Carlo Engine", icon: Cpu, desc: "Event generation & physics" },
  { id: "lab" as const, label: "3D Chamber Lab", icon: Monitor, desc: "Interactive visualization" },
  { id: "batch" as const, label: "Batch Accelerator", icon: Cpu, desc: "Multi-sample processing" },
  { id: "exports" as const, label: "Analytical Predictors", icon: GitBranch, desc: "Performance forecasting" },
  { id: "validation" as const, label: "Benchmark Journal", icon: Compass, desc: "Calibration & validation" },
  { id: "instruments" as const, label: "Scientific Instruments", icon: Activity, desc: "Physics calculators" },
  { id: "theory" as const, label: "Theory & Formulas", icon: Compass, desc: "Physics mathematics" },
];

export default React.memo(function Sidebar({ activeTab, onTabChange, isOpen, onClose, isMobile }: SidebarProps) {

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden" id="mobile-sidebar-drawer">
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer animate-fade"
              onClick={onClose}
            />
            <div className="relative flex flex-col w-72 max-w-[85%] bg-slate-900/95 backdrop-blur-xl text-slate-300 h-full p-6 border-r border-white/5 shadow-2xl animate-slide-right">
              <div className="flex items-center justify-between pb-6 border-b border-white/5 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-white font-extrabold text-sm tracking-tight block">Celeritas</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Spectrometry Suite</span>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="flex-1 space-y-1">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-4 px-3">Navigation</div>
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onTabChange(item.id); onClose(); }}
                      className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl justify-start transition-all group ${
                        isActive
                          ? "bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-400 border border-orange-500/20"
                          : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isActive ? "bg-orange-500/20" : "bg-white/5 group-hover:bg-white/10"
                      }`}>
                        <item.icon className={`w-4 h-4 ${isActive ? "text-orange-400" : "text-slate-400"}`} />
                      </div>
                      <div className="text-left flex-1">
                        <span className={`text-xs font-semibold block ${isActive ? "text-orange-400" : ""}`}>
                          {item.label}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">{item.desc}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-orange-500" />}
                    </button>
                  );
                })}
              </nav>


              <div className="mt-auto pt-6 border-t border-white/5">
                <div className="bg-gradient-to-r from-orange-500/10 to-transparent rounded-xl p-4 border border-orange-500/10">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse-glow" />
                    <span className="text-[10px] text-slate-400 font-mono">Calibration</span>
                  </div>
                  <p className="text-xs font-bold text-orange-400 font-mono">Standard Standardized</p>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  v1.0 &middot; Open Access
                </span>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <aside className="w-64 bg-slate-900/90 backdrop-blur-xl flex flex-col border-r border-white/5 text-slate-300 shrink-0 h-screen sticky top-0 hidden lg:flex" id="sidebar">
      <div className="p-5 flex items-center gap-3 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-white font-extrabold text-sm tracking-tight block">Celeritas</span>
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Spectrometry Suite</span>
        </div>
      </div>
      
      <nav className="flex-1 px-3 py-5 space-y-1">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3 px-3">Core Modules</div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl justify-start transition-all group ${
                isActive
                  ? "bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-400 border border-orange-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                isActive ? "bg-orange-500/20" : "bg-white/5 group-hover:bg-white/10"
              }`}>
                <item.icon className={`w-4 h-4 ${isActive ? "text-orange-400" : "text-slate-400"}`} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <span className={`text-xs font-semibold block truncate ${isActive ? "text-orange-400" : ""}`}>
                  {item.label}
                </span>
                <span className="text-[9px] text-slate-500 font-mono truncate block">{item.desc}</span>
              </div>
              {isActive && <ChevronRight className="w-3 h-3 text-orange-500 shrink-0" />}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 space-y-3 border-t border-white/5">
        <div className="bg-gradient-to-r from-orange-500/10 to-transparent rounded-xl p-3.5 border border-orange-500/10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse-glow" />
            <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Calibration</span>
          </div>
          <p className="text-xs font-bold text-orange-400 font-mono">Standard Standardized</p>
        </div>
        <div className="text-[9px] text-slate-600 text-center font-mono">
          v1.0 &middot; Kivitas
        </div>
      </div>
    </aside>
  );
});