import Image from "next/image";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#F5EDE6] border-t border-[#EADBD2] text-[#1A1410]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-[#1A1410] p-2 ring-1 ring-[#EADBD2]">
                <Image src="/logo.png" alt="MKIS Nail Saloon" width={36} height={36} className="object-contain" />
              </div>
              <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-normal text-[#1A1410]">
                MKIS <span className="italic text-[#C45E7A]">Nails</span>
              </h3>
            </div>
            <p className="text-[#6B5448] text-sm leading-relaxed font-light max-w-xs">
              Where every nail tells a story. Premium nail art and care crafted just for you.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#1A1410] mb-5">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-[#6B5448]">
              {[
                { href: "#home",     label: "Home" },
                { href: "#trending", label: "Trending" },
                { href: "#gallery",  label: "Gallery" },
                { href: "#services", label: "Services" },
                { href: "#about",    label: "Team" },
                { href: "#reviews",  label: "Reviews" },
                { href: "#booking",  label: "Booking" },
                { href: "#contact",  label: "Contact" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <a href={href} className="hover:text-[#C45E7A] transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#1A1410] mb-5">Follow Us</h4>
            <div className="flex gap-3">
              {[
                {
                  label: "Instagram",
                  href: "https://instagram.com",
                  icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />,
                },
                {
                  label: "Facebook",
                  href: "https://facebook.com",
                  icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />,
                },
                {
                  label: "TikTok",
                  href: "https://tiktok.com",
                  icon: <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.74a4.85 4.85 0 01-1.01-.05z" />,
                },
              ].map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-white border border-[#EADBD2] flex items-center justify-center text-[#6B5448]
                             hover:bg-[#E07898] hover:text-white hover:border-[#E07898] transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">{icon}</svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#EADBD2] pt-6 text-center text-[#A89484] text-xs tracking-wide">
          © {year} MKIS Nail Saloon. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
