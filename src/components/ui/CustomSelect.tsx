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

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    <div ref={containerRef} className="flex flex-col gap-1.5 relative">
      <span className="text-[13px] font-medium text-[#F0E4D8]">
        {label}
        {required && <span className="text-[#D89AAE] ml-0.5">*</span>}
      </span>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open ? "true" : "false"}
        aria-label={label}
        className={`w-full px-4 py-3 rounded-xl border text-left flex items-center justify-between gap-2
          bg-[#2A1F18] transition focus:outline-none focus:ring-2 focus:ring-[#D89AAE]/30
          ${open
            ? "border-[#E07898] ring-2 ring-[#E07898]/30"
            : error
              ? "border-red-400"
              : "border-[#3A2E26] hover:border-[#D89AAE]/60"
          }`}
      >
        <span className={isPlaceholder ? "text-[#7A6657]" : "text-[#F0E4D8]"}>
          {displayLabel}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-[#B8A89A] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute z-50 top-full mt-1 w-full rounded-xl border border-[#3A2E26]
            bg-[#2A1F18] shadow-[0_20px_40px_-15px_rgba(26,20,16,0.15)] overflow-hidden
            max-h-64 overflow-y-auto"
        >
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isActive ? "true" : "false"}
                onClick={() => select(opt.value)}
                className={`px-4 py-3 cursor-pointer text-sm transition-colors
                  ${isActive
                    ? "bg-[#2E1F24] text-[#D89AAE] font-medium"
                    : "text-[#F0E4D8] hover:bg-[#1A1410]"
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
