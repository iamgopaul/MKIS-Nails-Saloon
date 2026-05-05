"use client";

import { useEffect, useState } from "react";
import SectionHeading from "@/components/ui/SectionHeading";

interface TrendingService {
  name: string;
  count: number;
  percentage: number;
}

const BADGE_COLORS = [
  "from-[#E07898] to-[#C9956B]",
  "from-[#C9956B] to-[#D4A882]",
  "from-[#D4849A] to-[#E07898]",
  "from-[#C9956B] to-[#E07898]",
  "from-[#E07898] to-[#D4849A]",
];

const RANK_LABELS = ["01", "02", "03", "04", "05"];

export default function TrendingSection({ id }: { id: string }) {
  const [trending, setTrending] = useState<TrendingService[]>([]);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetchTrending() {
    try {
      const res = await fetch("/api/trending");
      if (!res.ok) return;
      const data = await res.json();
      setTrending(data);
      setLastUpdated(new Date());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrending();
    const id = setInterval(fetchTrending, 5 * 60_000); // refresh every 5 min
    return () => clearInterval(id);
  }, []);

  // Always render — show empty state when no booking data yet

  return (
    <section id={id} className="py-24 bg-[#080808]/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Trending This Week"
          subtitle="Based on real bookings, updated automatically."
        />

        {lastUpdated && (
          <div className="flex justify-center mb-8 -mt-6">
            <div className="flex items-center gap-2 text-xs text-[#9A7060] bg-[#1C1614] border border-[#E07898]/15 rounded-full px-4 py-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E07898] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E07898]" />
              </span>
              Live data · Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#1C1614] rounded-3xl p-6 border border-[#E07898]/10 animate-pulse h-40" />
            ))}
          </div>
        ) : trending.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {["Gel Manicure", "Acrylic Full Set", "Nail Art"].map((name, i) => (
              <div key={name} className={`bg-[#1C1614] rounded-3xl p-6 border border-[#E07898]/15 opacity-50`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#E07898]/40 tracking-tight">{RANK_LABELS[i]}</span>
                  {i === 0 && <span className="px-3 py-1 rounded-full bg-[#E07898]/20 text-[#E07898] text-xs font-bold">Trending</span>}
                </div>
                <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#F5EDE6] mb-2">{name}</h3>
                <p className="text-[#9A7060] text-sm mb-4">Trending data appears once bookings come in</p>
                <div className="h-1.5 bg-[#E07898]/10 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${BADGE_COLORS[i]} rounded-full ${["w-[70%]","w-[50%]","w-[30%]"][i]}`} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trending.map((svc, i) => (
              <div
                key={svc.name}
                className={`group relative bg-[#1C1614] rounded-3xl p-6 border transition-all duration-300
                  ${i === 0
                    ? "border-[#E07898]/50 shadow-xl shadow-[#E07898]/10 lg:col-span-1"
                    : "border-[#E07898]/15 hover:border-[#E07898]/40"
                  }`}
              >
                {/* Rank badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#E07898]/40 tracking-tight">{RANK_LABELS[i]}</span>
                  {i === 0 && (
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white text-xs font-bold">
                      Most Popular
                    </span>
                  )}
                </div>

                <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#F5EDE6] mb-2">
                  {svc.name}
                </h3>

                <p className="text-[#9A7060] text-sm mb-4">
                  {svc.count} booking{svc.count !== 1 ? "s" : ""} this week
                </p>

                {/* Progress bar */}
                <div className="h-1.5 bg-[#E07898]/10 rounded-full overflow-hidden">
                  {/* percentage is dynamic — cannot be expressed as a static Tailwind class */}
                  {/* eslint-disable-next-line react/forbid-component-props */}
                  <div
                    className={`h-full bg-gradient-to-r ${BADGE_COLORS[i]} rounded-full transition-all duration-700`}
                    style={{ width: `${svc.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-[#9A7060] mt-1.5 text-right">{svc.percentage}% of bookings</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <a
            href="#booking"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#E07898] to-[#C9956B]
                       text-white text-lg font-semibold hover:from-[#C45E7A] hover:to-[#B07A52] transition-all
                       shadow-lg shadow-[#E07898]/25"
          >
            Book a Trending Service →
          </a>
        </div>
      </div>
    </section>
  );
}
