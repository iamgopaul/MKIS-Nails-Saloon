"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const links = [
  { label: "Home",     href: "#home" },
  { label: "Trending", href: "#trending" },
  { label: "Gallery",  href: "#gallery" },
  { label: "Services", href: "#services" },
  { label: "Team",     href: "#about" },
  { label: "Reviews",  href: "#reviews" },
  { label: "Contact",  href: "#contact" },
];

function BusinessStatusBadge() {
  const [status, setStatus]   = useState<"open" | "closed" | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetch_() {
      try {
        const res  = await fetch("/api/status");
        const data = await res.json();
        setStatus(data.status === "closed" ? "closed" : "open");
        setMessage(data.message ?? "");
      } catch { /* silently fail */ }
    }
    fetch_();
    const id = setInterval(fetch_, 60_000);
    return () => clearInterval(id);
  }, []);

  if (status === null) return null;

  const isOpen = status === "open";

  return (
    <div
      title={message || (isOpen ? "We are open" : "We are currently closed")}
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold transition-all
        ${isOpen
          ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400"
          : "bg-red-950/60 border-red-500/40 text-red-400"
        }`}
    >
      <span className="relative flex h-2 w-2">
        {isOpen && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${isOpen ? "bg-emerald-400" : "bg-red-400"}`} />
      </span>
      {isOpen ? "Open Now" : "Closed"}
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-[#E07898]/20">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2.5">
          <div className="relative">
            <div className="logo-glow absolute inset-0 rounded-full bg-[#E07898] blur-md" />
            <div className="relative rounded-full p-[2px] bg-gradient-to-br from-[#E07898] via-[#C9956B] to-[#D4A882]">
              <div className="rounded-full bg-[#0A0A0A] p-0.5">
                <Image src="/logo.png" alt="MKIS Nail Saloon" width={34} height={34} className="rounded-full object-cover" />
              </div>
            </div>
          </div>
          <span className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#F5EDE6] tracking-wide">
            MKIS <span className="bg-gradient-to-r from-[#E07898] to-[#C9956B] bg-clip-text text-transparent">Nails</span>
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#9A7060] hover:text-[#E07898] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <BusinessStatusBadge />
          <a
            href="#booking"
            className="px-5 py-2 rounded-full bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white text-sm font-semibold hover:from-[#C45E7A] hover:to-[#B07A52] transition-all shadow-lg shadow-[#E07898]/25"
          >
            Book Now
          </a>
        </div>

        {/* Mobile: status badge + hamburger */}
        <div className="md:hidden flex items-center gap-3">
          <BusinessStatusBadge />
          <button
            type="button"
            className="p-2 rounded-lg text-[#F5EDE6] hover:bg-[#1C1614] transition"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <span className="block w-5 h-0.5 bg-current mb-1" />
            <span className="block w-5 h-0.5 bg-current mb-1" />
            <span className="block w-5 h-0.5 bg-current" />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#0A0A0A] border-t border-[#E07898]/20 px-4 py-4 flex flex-col gap-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-base font-medium text-[#9A7060] hover:text-[#E07898] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#booking"
            onClick={() => setOpen(false)}
            className="text-center px-5 py-2 rounded-full bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white font-semibold hover:from-[#C45E7A] hover:to-[#B07A52] transition-all"
          >
            Book Now
          </a>
        </div>
      )}
    </header>
  );
}
