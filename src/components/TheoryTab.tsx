import React, { useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { BookOpen, Calculator, Beaker, Atom, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PHYSICS_FORMULAS } from "../data/formulas";

export const TheoryTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const cardBg = "bg-white/5 backdrop-blur-md border border-white/10";
  const glowBorder = "border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]";

  const categories = ["All", ...Array.from(new Set(PHYSICS_FORMULAS.map(f => f.category)))];

  const filteredFormulas = PHYSICS_FORMULAS.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "All" || f.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 flex flex-col min-h-[70vh]" id="theory-tab">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Physics Theory & Formulas</h2>
            <p className="text-slate-400 text-sm">Mathematical models governing the Monte Carlo particle simulation</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-700 p-2 rounded-xl">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input 
            type="text" 
            placeholder="Search formulas..." 
            className="bg-transparent border-none outline-none text-slate-200 text-sm w-48 px-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors border ${
              activeCategory === cat 
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50" 
                : "bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800 hover:text-slate-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
        <AnimatePresence mode="popLayout">
          {filteredFormulas.map((formula, idx) => (
            <motion.div 
              key={`${formula.id}-${idx}`}
              layout
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`rounded-xl p-6 ${cardBg} ${idx < 2 ? glowBorder : ''}`}
            >
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <div className="flex items-center space-x-2 text-cyan-400">
                  {formula.category === 'Cherenkov' && <Beaker className="w-5 h-5 text-emerald-400" />}
                  {formula.category === 'Energy Loss' && <Calculator className="w-5 h-5 text-rose-400" />}
                  {formula.category === 'Scattering' && <Atom className="w-5 h-5 text-fuchsia-400" />}
                  {formula.category === 'Kinematics' && <Atom className="w-5 h-5 text-amber-400" />}
                  {formula.category === 'Detectors' && <BookOpen className="w-5 h-5 text-cyan-400" />}
                  {formula.category === 'Quantum' && <Beaker className="w-5 h-5 text-yellow-400" />}
                  <h3 className="font-semibold text-lg text-slate-200">{formula.title}</h3>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {formula.category}
                </span>
              </div>
              <p className="text-slate-400 mb-4 text-sm min-h-[40px]">
                {formula.description}
              </p>
              <div className="bg-slate-900/50 p-4 rounded-lg overflow-x-auto text-slate-300 mb-4 flex flex-col items-center justify-center min-h-[80px]">
                {formula.equations.map((eq, i) => (
                  <BlockMath key={i} math={eq} />
                ))}
              </div>
              <ul className="text-xs text-slate-400 space-y-1.5 list-none">
                {formula.variables.map((v, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 text-cyan-500 font-bold">•</span>
                    <span className="w-16 flex-shrink-0"><InlineMath math={v.symbol} /></span>
                    <span className="text-slate-500 mx-2">=</span>
                    <span>{v.meaning}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredFormulas.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500">
            No formulas found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};
