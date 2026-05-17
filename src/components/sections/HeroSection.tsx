import Image from "next/image";
import Button from "@/components/ui/Button";

interface HeroSectionProps {
  id: string;
}

export default function HeroSection({ id }: HeroSectionProps) {
  return (
    <section
      id={id}
      className="relative min-h-screen flex items-center overflow-hidden bg-[#FBF7F4]"
    >
      {/* Soft decorative blooms */}
      <div className="absolute -top-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-[#FCE7EE] blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute -bottom-32 -left-24 w-[32rem] h-[32rem] rounded-full bg-[#F1E3D3] blur-3xl opacity-60 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Text column */}
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#EADBD2] text-[#C45E7A] text-xs font-medium tracking-[0.18em] uppercase mb-8 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E07898]" />
            Premium Nail Studio
          </span>

          <h1 className="display text-[3.25rem] leading-[1.05] md:text-6xl lg:text-[5.25rem] lg:leading-[0.98] text-[#1A1410] mb-7">
            Where beauty
            <br />
            meets <span className="display-md italic text-[#C45E7A]">artistry</span>
          </h1>

          <p className="text-[#6B5448] text-lg md:text-xl leading-relaxed mb-10 max-w-xl font-light">
            Every set is a small masterpiece. From understated classics to bold,
            sculptural nail art — we craft looks designed to be noticed.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a href="#booking">
              <Button size="lg">Book an Appointment</Button>
            </a>
            <a href="#gallery">
              <Button size="lg" variant="outline">View Our Work</Button>
            </a>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-3 max-w-md gap-8 pt-8 border-t border-[#EADBD2]">
            {[
              { value: "500+", label: "Happy clients" },
              { value: "50+",  label: "Signature designs" },
              { value: "5.0",  label: "Average rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="display-md text-3xl text-[#1A1410]">{stat.value}</p>
                <p className="text-xs text-[#A89484] mt-1 tracking-wide uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Editorial logo card */}
        <div className="hidden lg:flex lg:col-span-5 justify-center items-center">
          <div className="relative">
            {/* Soft offset shadow plate */}
            <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2rem] bg-[#FCE7EE]" />

            <div className="relative w-[22rem] h-[28rem] rounded-[2rem] bg-white border border-[#EADBD2] shadow-[0_30px_60px_-30px_rgba(196,94,122,0.25)] flex flex-col items-center justify-center gap-7 p-10">
              <div className="relative">
                <div className="logo-glow absolute inset-0 rounded-full bg-[#E07898] blur-xl" />
                <div className="relative rounded-full p-[2px] bg-gradient-to-br from-[#E07898] to-[#C9956B]">
                  <div className="rounded-full bg-white p-1.5">
                    <Image
                      src="/logo.png"
                      alt="MKIS Nail Saloon"
                      width={144}
                      height={144}
                      className="rounded-full object-contain"
                    />
                  </div>
                </div>
              </div>

              <div className="w-16 h-px bg-[#EADBD2]" />

              <p className="display-md text-xl text-[#1A1410] text-center leading-snug">
                MKIS Nails
              </p>

              <div className="flex gap-1.5 flex-wrap justify-center">
                {["Gel", "Acrylic", "Nail Art", "Pedicure"].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full bg-[#FBF7F4] text-[#6B5448] text-[11px] font-medium tracking-wide"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Floating notes */}
            <div className="absolute -top-4 -right-6 bg-white border border-[#EADBD2] rounded-2xl px-4 py-2.5 shadow-[0_12px_24px_-12px_rgba(26,20,16,0.15)] text-xs font-medium text-[#1A1410] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Book online
            </div>
            <div className="absolute -bottom-5 -left-6 bg-[#C45E7A] text-white rounded-2xl px-4 py-2.5 shadow-[0_12px_24px_-12px_rgba(196,94,122,0.5)] text-xs font-medium">
              New designs weekly
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <a
        href="#gallery"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-[#A89484] text-[11px] tracking-[0.25em] uppercase animate-bounce"
      >
        <span>Scroll</span>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </a>
    </section>
  );
}
