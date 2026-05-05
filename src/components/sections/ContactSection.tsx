import SectionHeading from "@/components/ui/SectionHeading";

interface ContactSectionProps {
  id: string;
}

const hours = [
  { day: "Monday – Friday", time: "9:00 AM – 7:00 PM" },
  { day: "Saturday", time: "9:00 AM – 6:00 PM" },
  { day: "Sunday", time: "Closed" },
];

export default function ContactSection({ id }: ContactSectionProps) {
  return (
    <section id={id} className="py-24 bg-[#111111]/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Find Us"
          subtitle="Come visit us or reach out. We would love to hear from you."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div className="space-y-8">
            {[
              {
                icon: "📍",
                label: "Address",
                content: <p className="text-[#9A7060]">123 Beauty Lane<br />Your City, ST 00000</p>,
              },
              {
                icon: "📞",
                label: "Phone",
                content: (
                  <a href="tel:+17542365112" className="text-[#E07898] hover:text-[#E07898] font-medium transition-colors">
                    +1 (754) 236-5112
                  </a>
                ),
              },
              {
                icon: "✉️",
                label: "Email",
                content: (
                  <a href="mailto:mkisservicesllc@gmail.com" className="text-[#E07898] hover:text-[#E07898] font-medium transition-colors">
                    mkisservicesllc@gmail.com
                  </a>
                ),
              },
            ].map(({ icon, label, content }) => (
              <div key={label} className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E07898]/10 border border-[#E07898]/20 flex items-center justify-center text-xl flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <h4 className="font-semibold text-[#F5EDE6] mb-1">{label}</h4>
                  {content}
                </div>
              </div>
            ))}

            {/* Hours */}
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E07898]/10 border border-[#E07898]/20 flex items-center justify-center text-xl flex-shrink-0">
                🕐
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-[#F5EDE6] mb-3">Business Hours</h4>
                <div className="space-y-2">
                  {hours.map(({ day, time }) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="text-[#9A7060]">{day}</span>
                      <span className={`font-medium ${time === "Closed" ? "text-red-400" : "text-[#E07898]"}`}>
                        {time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="rounded-3xl overflow-hidden border border-[#E07898]/20 min-h-80 bg-[#1C1614] flex items-center justify-center shadow-lg shadow-[#E07898]/5">
            <div className="text-center p-8">
              <div className="text-6xl mb-4 opacity-60">🗺️</div>
              <p className="text-[#F5EDE6] font-medium">Map coming soon</p>
              <p className="text-[#9A7060] text-sm mt-2">
                Add your Google Maps embed URL in ContactSection.tsx
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
