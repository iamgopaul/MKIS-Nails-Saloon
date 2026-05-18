import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-[family-name:var(--font-montserrat)] font-medium tracking-[0.18em] uppercase " +
    "transition-colors duration-300 cursor-pointer select-none " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D89AAE]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1410] " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-[#D89AAE] text-[#1A1410] hover:bg-[#E5B0C2]",
    outline:
      "bg-transparent text-[#F0E4D8] border border-[#D89AAE]/40 hover:border-[#D89AAE] hover:bg-[#D89AAE]/10",
    ghost:
      "bg-transparent text-[#D89AAE] hover:text-[#E5B0C2]",
  };

  const sizes = {
    sm: "px-5 py-2 text-[11px]",
    md: "px-7 py-3 text-[12px]",
    lg: "px-10 py-4 text-[12px]",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
