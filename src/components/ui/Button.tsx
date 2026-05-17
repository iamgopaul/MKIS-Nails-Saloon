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
    "inline-flex items-center justify-center rounded-full font-medium tracking-wide " +
    "transition-all duration-200 cursor-pointer select-none " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E07898]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7F4] " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-[#E07898] text-white shadow-[0_8px_24px_-8px_rgba(224,120,152,0.55)] " +
      "hover:bg-[#C45E7A] hover:shadow-[0_12px_28px_-8px_rgba(196,94,122,0.65)] hover:-translate-y-[1px] " +
      "active:translate-y-0",
    outline:
      "bg-transparent text-[#1A1410] border border-[#1A1410]/15 " +
      "hover:border-[#E07898] hover:text-[#C45E7A] hover:bg-[#FCE7EE]/40",
    ghost:
      "bg-transparent text-[#C45E7A] hover:text-[#E07898] underline-offset-4 hover:underline",
  };

  const sizes = {
    sm: "px-5 py-2 text-sm",
    md: "px-7 py-3 text-[15px]",
    lg: "px-10 py-4 text-base",
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
