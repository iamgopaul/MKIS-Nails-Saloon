import Image from "next/image";

const socialLinks = [
  { name: "Instagram", href: "https://instagram.com" },
  { name: "Facebook",  href: "https://facebook.com" },
  { name: "TikTok",    href: "https://tiktok.com" },
];

const quickLinks = [
  { label: "Gallery",  href: "#gallery" },
  { label: "Services", href: "#services" },
  { label: "Team",     href: "#about" },
  { label: "Reviews",  href: "#reviews" },
  { label: "Booking",  href: "#booking" },
  { label: "Contact",  href: "#contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#3A2E26]/50 bg-[#1A1410] text-[#F0E4D8]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Image
              src="/logo-transparent.png"
              alt="MKIS Nails Salon"
              width={160}
              height={80}
              className="h-16 w-auto mb-5"
            />
            <p className="text-sm text-[#B8A89A] font-light leading-relaxed max-w-sm mb-6">
              Where every nail tells a story. Premium nail art and care crafted just for you.
            </p>
            <div className="flex gap-5">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-[family-name:var(--font-montserrat)] tracking-[0.2em] uppercase text-[#7A6657] hover:text-[#D89AAE] transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-[11px] font-[family-name:var(--font-montserrat)] tracking-[0.22em] uppercase text-[#D89AAE] mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map(({ href, label }) => (
                <li key={href}>
                  <a href={href} className="text-sm text-[#B8A89A] font-light hover:text-[#F0E4D8] transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Visit */}
          <div>
            <h4 className="text-[11px] font-[family-name:var(--font-montserrat)] tracking-[0.22em] uppercase text-[#D89AAE] mb-5">
              Visit Us
            </h4>
            <div className="space-y-3 text-sm text-[#B8A89A] font-light leading-relaxed">
              <p>
                123 Beauty Lane<br />
                Your City, ST 00000
              </p>
              <p>
                <a href="tel:+17542365112" className="hover:text-[#D89AAE] transition-colors">
                  +1 (754) 236-5112
                </a>
              </p>
              <p>
                <a href="mailto:mkisservicesllc@gmail.com" className="hover:text-[#D89AAE] transition-colors break-all">
                  mkisservicesllc@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#3A2E26]/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <p className="text-[11px] text-[#7A6657] font-light text-center tracking-wide">
            © {year} MKIS Nails Salon. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
