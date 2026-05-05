import Image from "next/image";
import Button from "@/components/ui/Button";

interface HeroSectionProps {
  id: string;
}

export default function HeroSection({ id }: HeroSectionProps) {
  return (
    <section id={id} className="relative min-h-screen flex items-center overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-20 right-10 w-80 h-80 rounded-full bg-[#E07898]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-[#D4849A]/8 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#C9956B]/4 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#E07898]/40 bg-[#E07898]/10 text-[#E07898] text-sm font-semibold mb-6 tracking-wide">
            Premium Nail Art & Care
          </span>
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl md:text-6xl lg:text-7xl font-bold text-[#F5EDE6] leading-tight mb-6">
            Where Beauty <br />
            <span className="bg-gradient-to-r from-[#E07898] to-[#C9956B] bg-clip-text text-transparent">Meets Art</span>
          </h1>
          <p className="text-[#9A7060] text-lg md:text-xl leading-relaxed mb-10 max-w-lg">
            At MKIS Nail Saloon, every set is a masterpiece. From classic elegance to bold nail art, we craft looks that are truly unforgettable.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#booking">
              <Button size="lg">Book Appointment</Button>
            </a>
            <a href="#gallery">
              <Button size="lg" variant="outline">View Our Work</Button>
            </a>
          </div>

          {/* Stats */}
          <div className="mt-14 flex gap-10">
            {[
              { value: "500+", label: "Happy Clients" },
              { value: "50+", label: "Nail Designs" },
              { value: "5★", label: "Rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#E07898]">
                  {stat.value}
                </p>
                <p className="text-sm text-[#9A7060] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Logo card */}
        <div className="hidden lg:flex justify-center items-center">
          <div className="relative">
            <div className="w-80 h-96 rounded-3xl bg-[#1C1614] border border-[#E07898]/20 shadow-2xl shadow-[#E07898]/10 flex flex-col items-center justify-center gap-6 p-8">
              <div className="relative">
                <div className="logo-glow absolute inset-0 rounded-full bg-[#E07898] blur-xl" />
                <div className="relative rounded-full p-[3px] bg-gradient-to-br from-[#E07898] via-[#C9956B] to-[#D4A882]">
                  <div className="rounded-full bg-[#1C1614] p-1">
                    <Image src="/logo.png" alt="MKIS Nail Saloon" width={144} height={144} className="rounded-full object-contain" />
                  </div>
                </div>
              </div>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-[#C9956B]/40 to-transparent" />
              <div className="flex gap-2 flex-wrap justify-center">
                {["Gel", "Acrylic", "Nail Art", "Pedicure"].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full border border-[#E07898]/30 text-[#E07898] text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white rounded-2xl px-4 py-2 shadow-lg shadow-[#E07898]/30 text-sm font-semibold">
              Book Online ✓
            </div>
            <div className="absolute -bottom-4 -left-4 bg-[#1C1614] border border-[#E07898]/20 rounded-2xl px-4 py-2 shadow-lg text-sm font-semibold text-[#F5EDE6]">
              New Designs Weekly
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <a
        href="#gallery"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#9A7060] text-xs font-medium animate-bounce"
      >
        <span>Scroll</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </a>
    </section>
  );
}
