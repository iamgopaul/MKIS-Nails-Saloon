import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[13px] font-medium text-[#1A1410]">
        {label}
        {props.required && <span className="text-[#C45E7A] ml-0.5">*</span>}
      </label>
      <input
        id={inputId}
        className={`w-full px-4 py-3 rounded-xl border bg-white text-[#1A1410] placeholder:text-[#A89484]
                    focus:outline-none focus:ring-2 focus:ring-[#E07898]/30 focus:border-[#E07898]
                    transition ${error ? "border-red-400" : "border-[#EADBD2]"} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
