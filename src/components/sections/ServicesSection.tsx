import SectionHeading from "@/components/ui/SectionHeading";
import { services } from "@/data/services";

interface ServicesSectionProps {
  id: string;
}

export default function ServicesSection({ id }: ServicesSectionProps) {
  return (
    <section id={id} className="py-24 bg-[#0A0A0A]/85 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Our Services"
          subtitle="From everyday elegance to show-stopping nail art, there is something crafted for every occasion."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.name}
              className="group bg-[#1C1614] rounded-3xl p-7 border border-[#E07898]/15 hover:border-[#E07898]/50 hover:shadow-xl hover:shadow-[#E07898]/10 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#E07898]/10 border border-[#E07898]/20 flex items-center justify-center text-3xl mb-5 group-hover:bg-[#E07898]/20 transition-colors">
                {service.icon}
              </div>
              <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#F5EDE6] mb-2">
                {service.name}
              </h3>
              <p className="text-[#9A7060] text-sm leading-relaxed mb-5">
                {service.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-[#E07898]">{service.price}</span>
                <span className="px-3 py-1 rounded-full border border-[#E07898]/25 text-[#9A7060] text-xs font-medium">
                  ⏱ {service.duration}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <p className="text-[#9A7060] mb-4 text-lg">Ready to treat yourself?</p>
          <a
            href="#booking"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white text-lg font-semibold hover:from-[#C45E7A] hover:to-[#B07A52] transition-all shadow-lg shadow-[#E07898]/25"
          >
            Book Any Service →
          </a>
        </div>
      </div>
    </section>
  );
}
