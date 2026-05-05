"use client";

import { useState, useRef, useEffect } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export default function CustomSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  required,
  error,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected ? selected.label : placeholder ?? "Select...";
  const isPlaceholder = !selected;

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function select(val: string) {
    onChange(val);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-1 relative">
      <span className="text-sm font-medium text-[#F5EDE6]">
        {label}
        {required && <span className="text-[#E07898] ml-0.5">*</span>}
      </span>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full px-4 py-3 rounded-xl border text-left flex items-center justify-between gap-2
          bg-[#1C1614] transition focus:outline-none focus:ring-2 focus:ring-[#E07898]/50
          ${open
            ? "border-[#E07898]/50 ring-2 ring-[#E07898]/50"
            : error
              ? "border-red-500/50"
              : "border-[#E07898]/20 hover:border-[#E07898]/40"
          }`}
      >
        <span className={isPlaceholder ? "text-[#9A7060]/60" : "text-[#F5EDE6]"}>
          {displayLabel}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-[#9A7060] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 top-full mt-1 w-full rounded-xl border border-[#E07898]/20
            bg-[#1C1614] shadow-2xl shadow-[#E07898]/10 overflow-hidden
            max-h-64 overflow-y-auto"
        >
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isActive}
                onClick={() => select(opt.value)}
                className={`px-4 py-3 cursor-pointer text-sm transition-colors
                  ${isActive
                    ? "bg-gradient-to-r from-[#E07898]/20 to-[#C9956B]/20 text-[#E07898] font-semibold"
                    : "text-[#F5EDE6] hover:bg-[#E07898]/10 hover:text-[#E07898]"
                  }`}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
