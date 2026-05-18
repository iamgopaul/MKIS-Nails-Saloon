import SectionHeading from "@/components/ui/SectionHeading";

interface ContactSectionProps {
  id: string;
}

const hours = [
  { day: "Monday – Friday", time: "9:00 AM – 7:00 PM" },
  { day: "Saturday",        time: "9:00 AM – 6:00 PM" },
  { day: "Sunday",          time: "Closed" },
];

function PinIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 11H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7" />
    </svg>
  );
}

export default function ContactSection({ id }: ContactSectionProps) {
  const items = [
    {
      Icon: PinIcon,
      label: "Address",
      content: <p className="text-[#B8A89A] font-light leading-relaxed">123 Beauty Lane<br />Your City, ST 00000</p>,
    },
    {
      Icon: PhoneIcon,
      label: "Phone",
      content: (
        <a href="tel:+17542365112" className="text-[#D89AAE] hover:text-[#D89AAE] font-medium transition-colors">
          +1 (754) 236-5112
        </a>
      ),
    },
    {
      Icon: MailIcon,
      label: "Email",
      content: (
        <a href="mailto:mkisservicesllc@gmail.com" className="text-[#D89AAE] hover:text-[#D89AAE] font-medium transition-colors break-all">
          mkisservicesllc@gmail.com
        </a>
      ),
    },
  ];

  return (
    <section id={id} className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <SectionHeading
          eyebrow="Contact"
          title="Get in"
          accent="Touch"
          subtitle="Come by the studio or reach out — we'd love to hear from you."
        />

        <div className="reveal-stagger grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact info */}
          <div className="space-y-5">
            {items.map(({ Icon, label, content }) => (
              <div key={label} className="flex gap-4 items-start p-6 bg-[#2A1F18] border border-[#3A2E26]/60 rounded-lg hover:border-[#D89AAE]/40 transition-colors">
                <div className="w-11 h-11 rounded-lg bg-[#2E1F24] text-[#D89AAE] flex items-center justify-center flex-shrink-0">
                  <Icon />
                </div>
                <div>
                  <h4 className="text-[11px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.22em] uppercase text-[#F0E4D8] mb-1.5">{label}</h4>
                  {content}
                </div>
              </div>
            ))}

            {/* Hours */}
            <div className="flex gap-4 items-start p-6 bg-[#2A1F18] border border-[#3A2E26]/60 rounded-lg">
              <div className="w-11 h-11 rounded-lg bg-[#2E1F24] text-[#D89AAE] flex items-center justify-center flex-shrink-0">
                <ClockIcon />
              </div>
              <div className="flex-1">
                <h4 className="text-[11px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.22em] uppercase text-[#F0E4D8] mb-3">Business Hours</h4>
                <div className="space-y-2">
                  {hours.map(({ day, time }) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="text-[#B8A89A] font-light">{day}</span>
                      <span className={`font-medium ${time === "Closed" ? "text-red-400" : "text-[#F0E4D8]"}`}>
                        {time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="rounded-lg overflow-hidden border border-[#3A2E26]/60 min-h-80 bg-[#2A1F18] flex items-center justify-center">
            <div className="text-center p-8 text-[#7A6657]">
              <div className="inline-flex w-14 h-14 mb-4 rounded-lg bg-[#2E1F24] text-[#D89AAE] items-center justify-center">
                <MapIcon />
              </div>
              <p className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F0E4D8]">Map coming soon</p>
              <p className="text-[#7A6657] text-sm mt-2 font-light">
                Add your Google Maps embed URL in ContactSection.tsx
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
