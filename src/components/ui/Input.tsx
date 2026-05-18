import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[13px] font-medium text-[#F0E4D8]">
        {label}
        {props.required && <span className="text-[#D89AAE] ml-0.5">*</span>}
      </label>
      <input
        id={inputId}
        className={`w-full px-4 py-3 rounded-xl border bg-[#2A1F18] text-[#F0E4D8] placeholder:text-[#7A6657]
                    focus:outline-none focus:ring-2 focus:ring-[#D89AAE]/30 focus:border-[#D89AAE]
                    transition ${error ? "border-red-400" : "border-[#3A2E26]"} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
