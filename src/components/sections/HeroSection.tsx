import Image from "next/image";
import Button from "@/components/ui/Button";

interface HeroSectionProps {
  id: string;
}

export default function HeroSection({ id }: HeroSectionProps) {
  return (
    <section
      id={id}
      className="relative min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-6rem)] flex items-start justify-center overflow-hidden pt-4 md:pt-8"
    >

      <div className="relative max-w-5xl mx-auto px-6 lg:px-8 pb-16 flex flex-col items-center text-center">
        {/* Floating transparent logo */}
        <div className="relative mb-5">
          <div className="logo-glow absolute inset-0 -m-6 rounded-full bg-[#D89AAE]/25 blur-3xl" />
          <Image
            src="/logo-transparent.png"
            alt="MKIS Nails Salon"
            width={360}
            height={360}
            priority
            className="relative w-52 md:w-64 lg:w-80 h-auto drop-shadow-[0_18px_36px_rgba(0,0,0,0.55)]"
          />
        </div>

        {/* Eyebrow */}
        <span className="inline-flex items-center gap-2.5 px-3.5 py-1 border border-[#3A2E26] text-[#D89AAE] text-[10px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.28em] uppercase mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D89AAE]" />
          Premium Nail Studio
        </span>

        {/* Headline — preserved per user request */}
        <h1 className="font-[family-name:var(--font-cormorant)] font-light text-[2.5rem] md:text-6xl lg:text-[4.75rem] leading-[0.98] text-[#F0E4D8] mb-5 text-balance">
          Where Beauty
          <br />
          Meets <span className="italic text-[#D89AAE]">Artistry</span>
        </h1>

        <p className="text-[#B8A89A] text-sm md:text-base lg:text-lg font-light leading-relaxed max-w-xl mb-8">
          Every set is a small masterpiece. From understated classics to bold,
          sculptural nail art. We craft looks designed to be noticed.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <a href="#booking">
            <Button size="lg">Book an Appointment</Button>
          </a>
          <a href="#gallery">
            <Button size="lg" variant="outline">View Our Work</Button>
          </a>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-px bg-[#D89AAE]/50" />
          <span className="text-[10px] tracking-[0.32em] uppercase text-[#7A6657] font-[family-name:var(--font-montserrat)] font-medium">
            Now Open
          </span>
          <div className="w-14 h-px bg-[#D89AAE]/50" />
        </div>
      </div>

    </section>
  );
}
