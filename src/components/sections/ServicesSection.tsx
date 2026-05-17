import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { getServices } from "@/lib/db";

interface ServicesSectionProps { id: string; }

function durationLabel(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export default async function ServicesSection({ id }: ServicesSectionProps) {
  const services = await getServices().catch(() => []);

  return (
    <section id={id} className="py-24 bg-[#FBF7F4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow="Menu"
          title="Our services"
          subtitle="From everyday elegance to show-stopping nail art, there is something crafted for every occasion."
        />

        {services.length === 0 ? (
          <p className="text-center text-[#A89484] font-light">Services coming soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="group bg-white rounded-3xl p-8 border border-[#EADBD2]
                           hover:border-[#E07898]/40 hover:shadow-[0_18px_40px_-20px_rgba(26,20,16,0.15)]
                           hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#FCE7EE]
                                flex items-center justify-center text-2xl mb-6
                                group-hover:bg-[#E07898] group-hover:text-white transition-colors">
                  {service.icon || "✦"}
                </div>
                <h3 className="display-md text-xl text-[#1A1410] mb-2">
                  {service.name}
                </h3>
                <p className="text-[#6B5448] text-sm leading-relaxed mb-6 font-light">
                  {service.description}
                </p>
                <div className="flex items-end justify-between pt-5 border-t border-[#F5EDE6]">
                  <span className="display-md text-2xl text-[#1A1410]">{service.price}</span>
                  <span className="text-[#A89484] text-xs tracking-wide">
                    {durationLabel(service.duration_minutes)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-[#6B5448] mb-5 text-base font-light">Ready to treat yourself?</p>
          <a href="#booking">
            <Button size="lg">Book Any Service</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
