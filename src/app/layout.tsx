import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://mkisnails.com"),
  title: {
    default:  "MKIS Nails",
    template: "%s · MKIS Nails",
  },
  description:
    "Book your nail appointment at MKIS Nail Salon. We offer gel manicures, acrylics, nail art, and pedicures with a personal touch.",
  openGraph: {
    title: "MKIS Nails",
    description: "Premium nail art and care. Book your appointment online.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "MKIS Nail Salon" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${cormorant.variable}`}
    >
      <body className="min-h-full flex flex-col antialiased font-[family-name:var(--font-montserrat)]">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
