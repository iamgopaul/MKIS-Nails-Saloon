"use client";

import { useEffect } from "react";

const BASE = "MKIS Nails";

// id (matches the section[id] on the home page) → tab title fragment
const TITLES: Record<string, string> = {
  home:     "",                  // default base title
  gallery:  "Gallery",
  services: "Services",
  about:    "Team",
  reviews:  "Reviews",
  booking:  "Reservations",
  contact:  "Contact",
};

export default function SectionTitleSync() {
  useEffect(() => {
    const original = document.title;
    const ids = Object.keys(TITLES);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    // Track most-visible section by intersection ratio.
    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        let topId = "home";
        let topRatio = 0;
        for (const [id, r] of ratios) {
          if (r > topRatio) { topRatio = r; topId = id; }
        }
        const fragment = TITLES[topId] ?? "";
        document.title = fragment ? `${fragment} · ${BASE}` : BASE;
      },
      // Sample multiple thresholds so the active section flips smoothly on scroll.
      { threshold: [0.1, 0.25, 0.5, 0.75], rootMargin: "-96px 0px 0px 0px" },
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      document.title = original;
    };
  }, []);

  return null;
}
