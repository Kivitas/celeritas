/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
  placeholder?: string;
  isDarkMode: boolean;
  label?: string;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Search...",
  isDarkMode,
  label,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearchQuery("");
  };

  const inputBg = isDarkMode ? "bg-slate-950 text-slate-100 border-slate-800" : "bg-white text-slate-800 border-slate-200";

  return (
    <div className="space-y-1.5" ref={dropdownRef}>
      {label && (
        <label className={`block text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-1 focus:ring-orange-500 transition-all text-left flex items-center justify-between ${inputBg} border`}
        >
          <span className="truncate">{selectedOption?.name || "Select..."}</span>
          <span className="ml-2">{isOpen ? "▲" : "▼"}</span>
        </button>

        {isOpen && (
          <div
            className={`absolute z-50 w-full mt-1 border rounded-lg shadow-lg ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className={`w-full px-3 py-2 text-xs outline-none border-b ${inputBg} border`}
              autoFocus
            />
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-500">No results found</div>
              ) : (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full px-3 py-2 text-xs text-left transition-colors ${
                      opt.id === value
                        ? "bg-orange-500/20 text-orange-400 font-semibold"
                        : isDarkMode
                        ? "hover:bg-slate-800 text-slate-200"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    {opt.name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}