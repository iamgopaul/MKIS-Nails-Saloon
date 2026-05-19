import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import BookServiceButton from "@/components/ui/BookServiceButton";
import { getServices } from "@/lib/db";
import {
  Sparkles, Hand, Footprints, Paintbrush, Gem,
  Brush, FlaskConical, Scissors, Flower2,
} from "lucide-react";

interface ServicesSectionProps { id: string; }

function durationLabel(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

function pickIcon(name: string) {
  const n = name.toLowerCase();
  const cls = "w-5 h-5";
  if (n.includes("pedicure"))   return <Footprints   className={cls} strokeWidth={1.5} />;
  if (n.includes("manicure"))   return <Hand         className={cls} strokeWidth={1.5} />;
  if (n.includes("gel"))        return <Sparkles     className={cls} strokeWidth={1.5} />;
  if (n.includes("acrylic"))    return <Gem          className={cls} strokeWidth={1.5} />;
  if (n.includes("dip"))        return <FlaskConical className={cls} strokeWidth={1.5} />;
  if (n.includes("extension"))  return <Scissors     className={cls} strokeWidth={1.5} />;
  if (n.includes("art"))        return <Paintbrush   className={cls} strokeWidth={1.5} />;
  if (n.includes("design"))     return <Brush        className={cls} strokeWidth={1.5} />;
  return <Flower2 className={cls} strokeWidth={1.5} />;
}

export default async function ServicesSection({ id }: ServicesSectionProps) {
  const services = await getServices().catch(() => []);

  return (
    <section id={id} className="relative py-24 lg:py-32">
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Services"
          title="Services & Prices"
          subtitle="From everyday elegance to show-stopping nail art, crafted for every occasion."
        />

        {services.length === 0 ? (
          <p className="text-center text-[#B8A89A] font-light">Services coming soon.</p>
        ) : (
          <div className="reveal-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {services.map((service) => (
              <div
                key={service.id}
                className="group bg-[#2A1F18] border border-[#3A2E26]/60 rounded-lg p-8
                           hover:border-[#D89AAE]/40 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-[#2E1F24] border border-[#3A2E26]
                                flex items-center justify-center text-[#D89AAE] mb-6
                                group-hover:bg-[#D89AAE] group-hover:text-[#1A1410] transition-colors">
                  {pickIcon(service.name)}
                </div>
                <h3 className="font-[family-name:var(--font-cormorant)] font-light text-2xl text-[#F0E4D8] mb-2">
                  {service.name}
                </h3>
                <p className="text-[#B8A89A] text-sm leading-relaxed mb-6 font-light">
                  {service.description}
                </p>
                <div className="flex items-end justify-between pt-5 border-t border-[#3A2E26]/60 mb-5">
                  <span className="font-[family-name:var(--font-cormorant)] text-2xl text-[#D89AAE]">{service.price}</span>
                  <span className="text-[#7A6657] text-[11px] tracking-[0.18em] uppercase">
                    {durationLabel(service.duration_minutes)}
                  </span>
                </div>
                <BookServiceButton serviceId={service.id} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-[#B8A89A] mb-5 text-base font-light italic">Ready to treat yourself?</p>
          <a href="#booking">
            <Button size="lg">Book Any Service</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
