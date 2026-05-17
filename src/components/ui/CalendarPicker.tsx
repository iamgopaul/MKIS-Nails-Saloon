"use client";

import { useState, useRef, useEffect } from "react";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface CalendarPickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  min?: string;
  required?: boolean;
}

export default function CalendarPicker({
  label,
  value,
  onChange,
  min,
  required,
}: CalendarPickerProps) {
  const todayRaw = new Date();
  todayRaw.setHours(0, 0, 0, 0);
  const minDate = min ? new Date(min + "T00:00:00") : todayRaw;

  const selectedDate = value ? new Date(value + "T00:00:00") : null;

  const startYear  = selectedDate ? selectedDate.getFullYear() : todayRaw.getFullYear();
  const startMonth = selectedDate ? selectedDate.getMonth()    : todayRaw.getMonth();

  const [open, setOpen]         = useState(false);
  const [viewYear, setViewYear]   = useState(startYear);
  const [viewMonth, setViewMonth] = useState(startMonth);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayLabel = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Select a date...";

  useEffect(() => {
    function onMouse(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function pickDay(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    if (d < minDate) return;
    onChange(
      `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    );
    setOpen(false);
  }

  const firstDow     = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const canGoPrev =
    viewYear > minDate.getFullYear() ||
    (viewYear === minDate.getFullYear() && viewMonth > minDate.getMonth());

  function isSelected(day: number) {
    return (
      !!selectedDate &&
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth()    === viewMonth &&
      selectedDate.getDate()     === day
    );
  }
  function isToday(day: number) {
    return (
      todayRaw.getFullYear() === viewYear &&
      todayRaw.getMonth()    === viewMonth &&
      todayRaw.getDate()     === day
    );
  }
  function isDisabled(day: number) {
    return new Date(viewYear, viewMonth, day) < minDate;
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5 relative">
      <span className="text-[13px] font-medium text-[#1A1410]">
        {label}
        {required && <span className="text-[#C45E7A] ml-0.5">*</span>}
      </span>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`w-full px-4 py-3 rounded-xl border text-left flex items-center justify-between gap-2
          bg-white transition focus:outline-none focus:ring-2 focus:ring-[#E07898]/30
          ${open
            ? "border-[#E07898] ring-2 ring-[#E07898]/30"
            : "border-[#EADBD2] hover:border-[#E07898]/60"
          }`}
      >
        <span className={value ? "text-[#1A1410]" : "text-[#A89484]"}>
          {displayLabel}
        </span>
        <svg className="w-4 h-4 flex-shrink-0 text-[#6B5448]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Date picker"
          className="absolute z-50 top-full mt-2 left-0 right-0 rounded-2xl
            border border-[#EADBD2] bg-white
            shadow-[0_20px_40px_-15px_rgba(26,20,16,0.15)] p-4 select-none"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoPrev}
              aria-label="Previous month"
              className="w-8 h-8 rounded-full flex items-center justify-center
                text-[#6B5448] hover:bg-[#FCE7EE] hover:text-[#C45E7A]
                disabled:opacity-25 disabled:cursor-not-allowed transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span className="display-md text-[#1A1410] text-base">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              className="w-8 h-8 rounded-full flex items-center justify-center
                text-[#6B5448] hover:bg-[#FCE7EE] hover:text-[#C45E7A] transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[10px] font-medium uppercase tracking-wider text-[#A89484] py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) =>
              day === null ? (
                <div key={`e-${i}`} />
              ) : (
                <button
                  key={day}
                  type="button"
                  onClick={() => pickDay(day)}
                  disabled={isDisabled(day)}
                  className={`
                    mx-auto w-8 h-8 flex items-center justify-center rounded-full text-sm
                    font-medium transition-all duration-150
                    ${isSelected(day)
                      ? "bg-[#E07898] text-white shadow-[0_6px_16px_-6px_rgba(224,120,152,0.55)] scale-110"
                      : isDisabled(day)
                        ? "text-[#A89484]/40 cursor-not-allowed"
                        : isToday(day)
                          ? "text-[#C45E7A] ring-1 ring-[#E07898]/50 hover:bg-[#FCE7EE]"
                          : "text-[#1A1410] hover:bg-[#FCE7EE] hover:text-[#C45E7A] cursor-pointer"
                    }
                  `}
                >
                  {day}
                </button>
              )
            )}
          </div>

          <p className="text-center text-[10px] text-[#A89484] mt-3 tracking-wide">
            Past dates are unavailable
          </p>
        </div>
      )}
    </div>
  );
}
