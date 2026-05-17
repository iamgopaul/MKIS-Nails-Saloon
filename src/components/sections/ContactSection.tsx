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
      content: <p className="text-[#6B5448] font-light leading-relaxed">123 Beauty Lane<br />Your City, ST 00000</p>,
    },
    {
      Icon: PhoneIcon,
      label: "Phone",
      content: (
        <a href="tel:+17542365112" className="text-[#C45E7A] hover:text-[#E07898] font-medium transition-colors">
          +1 (754) 236-5112
        </a>
      ),
    },
    {
      Icon: MailIcon,
      label: "Email",
      content: (
        <a href="mailto:mkisservicesllc@gmail.com" className="text-[#C45E7A] hover:text-[#E07898] font-medium transition-colors break-all">
          mkisservicesllc@gmail.com
        </a>
      ),
    },
  ];

  return (
    <section id={id} className="py-24 bg-[#FBF7F4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow="Visit us"
          title="Find us"
          subtitle="Come by the studio or reach out — we'd love to hear from you."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact info */}
          <div className="space-y-7">
            {items.map(({ Icon, label, content }) => (
              <div key={label} className="flex gap-4 items-start">
                <div className="w-11 h-11 rounded-2xl bg-white border border-[#EADBD2] text-[#C45E7A] flex items-center justify-center flex-shrink-0">
                  <Icon />
                </div>
                <div>
                  <h4 className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#1A1410] mb-1.5">{label}</h4>
                  {content}
                </div>
              </div>
            ))}

            {/* Hours */}
            <div className="flex gap-4 items-start">
              <div className="w-11 h-11 rounded-2xl bg-white border border-[#EADBD2] text-[#C45E7A] flex items-center justify-center flex-shrink-0">
                <ClockIcon />
              </div>
              <div className="flex-1">
                <h4 className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#1A1410] mb-3">Business Hours</h4>
                <div className="space-y-2">
                  {hours.map(({ day, time }) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="text-[#6B5448] font-light">{day}</span>
                      <span className={`font-medium ${time === "Closed" ? "text-red-500" : "text-[#1A1410]"}`}>
                        {time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="rounded-3xl overflow-hidden border border-[#EADBD2] min-h-80 bg-white flex items-center justify-center">
            <div className="text-center p-8 text-[#A89484]">
              <div className="inline-flex w-14 h-14 mb-4 rounded-full bg-[#FCE7EE] text-[#C45E7A] items-center justify-center">
                <MapIcon />
              </div>
              <p className="text-[#1A1410] font-medium">Map coming soon</p>
              <p className="text-[#A89484] text-sm mt-2 font-light">
                Add your Google Maps embed URL in ContactSection.tsx
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
