"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const links = [
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
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide transition-all
        ${isOpen
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-red-50 text-red-700 border border-red-200"
        }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {isOpen && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isOpen ? "bg-emerald-500" : "bg-red-500"}`} />
      </span>
      {isOpen ? "Open now" : "Closed"}
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#FBF7F4]/85 backdrop-blur-md border-b border-[#EADBD2]/70">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2.5 group">
          <Image
            src="/mkislogo.png"
            alt="MKIS Nail Saloon"
            width={42}
            height={42}
            priority
            className="rounded-full object-cover ring-1 ring-[#EADBD2] transition-transform group-hover:scale-105"
          />
          <span className="font-[family-name:var(--font-playfair)] text-xl font-normal text-[#1A1410] tracking-tight">
            MKIS <span className="italic text-[#C45E7A]">Nails</span>
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium text-[#6B5448] hover:text-[#1A1410] transition-colors relative
                         after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-1.5 after:h-px
                         after:bg-[#E07898] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left"
            >
              {link.label}
            </a>
          ))}
          <BusinessStatusBadge />
          <a
            href="#booking"
            className="px-5 py-2 rounded-full bg-[#E07898] text-white text-[13px] font-medium tracking-wide
                       hover:bg-[#C45E7A] hover:-translate-y-[1px] transition-all
                       shadow-[0_6px_16px_-6px_rgba(224,120,152,0.55)]"
          >
            Book Now
          </a>
        </div>

        {/* Mobile: status badge + hamburger */}
        <div className="md:hidden flex items-center gap-3">
          <BusinessStatusBadge />
          <button
            type="button"
            className="p-2 rounded-lg text-[#1A1410] hover:bg-white/70 transition"
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
        <div className="md:hidden bg-[#FBF7F4] border-t border-[#EADBD2] px-4 py-5 flex flex-col gap-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-base font-medium text-[#6B5448] hover:text-[#C45E7A] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#booking"
            onClick={() => setOpen(false)}
            className="text-center px-5 py-2.5 rounded-full bg-[#E07898] text-white font-medium tracking-wide
                       hover:bg-[#C45E7A] transition-all shadow-[0_6px_16px_-6px_rgba(224,120,152,0.55)]"
          >
            Book Now
          </a>
        </div>
      )}
    </header>
  );
}
