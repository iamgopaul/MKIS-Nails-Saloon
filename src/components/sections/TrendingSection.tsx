"use client";

import { useEffect, useRef, useState } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";

interface TrendingService {
  name: string;
  count: number;
  percentage: number;
}

const RANK_LABELS = ["01", "02", "03", "04", "05"];

function ProgressBar({ percentage }: { percentage: number }) {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (barRef.current) barRef.current.style.width = `${percentage}%`;
  }, [percentage]);
  return (
    <div className="h-1 bg-[#F5EDE6] rounded-full overflow-hidden">
      <div ref={barRef} className="h-full bg-[#E07898] rounded-full transition-all duration-700" />
    </div>
  );
}

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
    const id = setInterval(fetchTrending, 5 * 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id={id} className="py-24 bg-[#FBF7F4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow="This week"
          title="What clients are loving"
          subtitle="Based on real bookings — updated automatically."
        />

        {lastUpdated && (
          <div className="flex justify-center mb-10 -mt-6">
            <div className="flex items-center gap-2 text-[11px] text-[#6B5448] bg-white border border-[#EADBD2] rounded-full px-3 py-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E07898] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#E07898]" />
              </span>
              Live
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-[#EADBD2] animate-pulse h-40" />
            ))}
          </div>
        ) : trending.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {["Gel Manicure", "Acrylic Full Set", "Nail Art"].map((name, i) => (
              <div key={name} className="bg-white rounded-3xl p-7 border border-[#EADBD2] opacity-60">
                <div className="flex items-center justify-between mb-4">
                  <span className="display-md text-2xl text-[#A89484] tracking-tight">{RANK_LABELS[i]}</span>
                  {i === 0 && <span className="px-3 py-1 rounded-full bg-[#FCE7EE] text-[#C45E7A] text-[11px] font-medium">Trending</span>}
                </div>
                <h3 className="display-md text-xl text-[#1A1410] mb-2">{name}</h3>
                <p className="text-[#A89484] text-sm mb-4">Trending data appears once bookings come in</p>
                <ProgressBar percentage={[70, 50, 30][i]} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trending.map((svc, i) => (
              <div
                key={svc.name}
                className={`group bg-white rounded-3xl p-7 border transition-all duration-300
                  ${i === 0
                    ? "border-[#E07898]/40 shadow-[0_20px_40px_-20px_rgba(224,120,152,0.25)]"
                    : "border-[#EADBD2] hover:border-[#E07898]/40 hover:shadow-[0_12px_30px_-15px_rgba(26,20,16,0.12)]"
                  }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="display-md text-2xl text-[#A89484] tracking-tight">{RANK_LABELS[i]}</span>
                  {i === 0 && (
                    <span className="px-3 py-1 rounded-full bg-[#E07898] text-white text-[11px] font-medium">
                      Most popular
                    </span>
                  )}
                </div>

                <h3 className="display-md text-xl text-[#1A1410] mb-2">{svc.name}</h3>

                <p className="text-[#6B5448] text-sm mb-5 font-light">
                  {svc.count} booking{svc.count !== 1 ? "s" : ""} this week
                </p>

                <ProgressBar percentage={svc.percentage} />
                <p className="text-[11px] text-[#A89484] mt-2 text-right tracking-wide">{svc.percentage}% of bookings</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-14 text-center">
          <a href="#booking">
            <Button size="lg">Book a Trending Service</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
