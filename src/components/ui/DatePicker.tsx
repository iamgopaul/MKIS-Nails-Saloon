"use client";

import { useMemo } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const sel =
  "w-full px-3 py-3 rounded-xl border border-[#E07898]/20 bg-[#1C1614] text-[#F5EDE6] " +
  "focus:outline-none focus:ring-2 focus:ring-[#E07898]/50 focus:border-[#E07898]/50 " +
  "transition appearance-none cursor-pointer";

interface DatePickerProps {
  label: string;
  value: string;       // YYYY-MM-DD or ""
  onChange: (val: string) => void;
  min?: string;        // YYYY-MM-DD earliest selectable date
  required?: boolean;
}

export default function DatePicker({ label, value, onChange, min, required }: DatePickerProps) {
  const [year, month, day] = value
    ? value.split("-").map(Number)
    : [0, 0, 0];

  const minYear = min
    ? Number(min.split("-")[0])
    : new Date().getFullYear();
  const years = [minYear, minYear + 1];

  const daysInMonth = useMemo(() => {
    if (!year || !month) return 31;
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  function set(part: "Y" | "M" | "D", val: number) {
    const y = part === "Y" ? val : (year || minYear);
    const m = part === "M" ? val : (month || 1);
    const d = part === "D" ? val : (day || 1);
    const maxD = new Date(y, m, 0).getDate();
    const safeD = Math.min(d, maxD);
    onChange(
      `${y}-${String(m).padStart(2, "0")}-${String(safeD).padStart(2, "0")}`
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-[#F5EDE6]">
        {label}
        {required && <span className="text-[#E07898] ml-0.5">*</span>}
      </span>
      <div className="grid grid-cols-3 gap-2">
        <Slot>
          <select
            aria-label="Month"
            value={month || ""}
            onChange={(e) => set("M", Number(e.target.value))}
            className={sel}
          >
            <option value="" disabled>Month</option>
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1} className="bg-[#1C1614]">{name}</option>
            ))}
          </select>
        </Slot>

        <Slot>
          <select
            aria-label="Day"
            value={day || ""}
            onChange={(e) => set("D", Number(e.target.value))}
            className={sel}
          >
            <option value="" disabled>Day</option>
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d} className="bg-[#1C1614]">{d}</option>
            ))}
          </select>
        </Slot>

        <Slot>
          <select
            aria-label="Year"
            value={year || ""}
            onChange={(e) => set("Y", Number(e.target.value))}
            className={sel}
          >
            <option value="" disabled>Year</option>
            {years.map((y) => (
              <option key={y} value={y} className="bg-[#1C1614]">{y}</option>
            ))}
          </select>
        </Slot>
      </div>
    </div>
  );
}

function Slot({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg className="w-4 h-4 text-[#9A7060]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
