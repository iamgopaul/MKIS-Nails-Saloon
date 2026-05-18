"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const links = [
  { label: "Home",     href: "#home" },
  { label: "Gallery",  href: "#gallery" },
  { label: "Services", href: "#services" },
  { label: "Team",     href: "#about" },
  { label: "Reviews",  href: "#reviews" },
  { label: "Reservations", href: "#booking" },
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
      className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-[family-name:var(--font-montserrat)] tracking-[0.18em] uppercase
        ${isOpen
          ? "text-emerald-300/90 border border-emerald-500/30"
          : "text-red-300/90 border border-red-500/30"
        }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {isOpen && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isOpen ? "bg-emerald-400" : "bg-red-400"}`} />
      </span>
      {isOpen ? "Open" : "Closed"}
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "bg-[#1A1410]/80 backdrop-blur-md border-b border-[#3A2E26]/50"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-24 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center group">
          <Image
            src="/logo-transparent.png"
            alt="MKIS Nails Salon"
            width={240}
            height={96}
            priority
            className="h-20 w-auto transition-transform group-hover:scale-[1.02]"
          />
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-[11px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.2em] uppercase text-[#F0E4D8]/80 hover:text-[#D89AAE] transition-colors
                         after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-1.5 after:h-px
                         after:bg-[#D89AAE] after:origin-left after:scale-x-0 hover:after:scale-x-100
                         after:transition-transform after:duration-300"
            >
              {link.label}
            </a>
          ))}
          <BusinessStatusBadge />
          <a
            href="#booking"
            className="ml-2 px-6 py-2.5 bg-[#D89AAE] text-[#1A1410] text-[11px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.2em] uppercase hover:bg-[#E5B0C2] transition-colors"
          >
            Book Now
          </a>
        </div>

        {/* Mobile: status + hamburger */}
        <div className="md:hidden flex items-center gap-3">
          <BusinessStatusBadge />
          <button
            type="button"
            className="p-2 text-[#F0E4D8] hover:text-[#D89AAE] transition"
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
        <div className="md:hidden bg-[#1A1410] border-t border-[#3A2E26]/50 px-6 py-6 flex flex-col gap-5">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-[12px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.2em] uppercase text-[#F0E4D8]/80 hover:text-[#D89AAE] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#booking"
            onClick={() => setOpen(false)}
            className="mt-2 text-center px-6 py-3 bg-[#D89AAE] text-[#1A1410] text-[11px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.2em] uppercase hover:bg-[#E5B0C2] transition-colors"
          >
            Book Now
          </a>
        </div>
      )}
    </header>
  );
}
