import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-[#F5EDE6]">
        {label}
        {props.required && <span className="text-[#E07898] ml-0.5">*</span>}
      </label>
      <input
        id={inputId}
        className={`w-full px-4 py-3 rounded-xl border border-[#E07898]/20 bg-[#1C1614] text-[#F5EDE6] placeholder:text-[#9A7060]/60 focus:outline-none focus:ring-2 focus:ring-[#E07898]/50 focus:border-[#E07898]/50 transition ${error ? "border-red-500/50" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
