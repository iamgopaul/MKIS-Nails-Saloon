import React from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export default function Select({
  label,
  options,
  error,
  placeholder,
  id,
  className = "",
  ...props
}: SelectProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-[#F5EDE6]">
        {label}
        {props.required && <span className="text-[#E07898] ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          id={inputId}
          className={`w-full px-4 py-3 rounded-xl border border-[#E07898]/20 bg-[#1C1614] text-[#F5EDE6] focus:outline-none focus:ring-2 focus:ring-[#E07898]/50 focus:border-[#E07898]/50 transition appearance-none cursor-pointer ${error ? "border-red-500/50" : ""} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-[#1C1614]">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#1C1614]">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg className="w-4 h-4 text-[#9A7060]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
