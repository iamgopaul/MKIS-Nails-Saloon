import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://mkisnailssaloon.com"),
  title: "MKIS Nails Saloon — Premium Nail Art & Care",
  description:
    "Book your nail appointment at MKIS Nails Saloon. We offer gel manicures, acrylics, nail art, and pedicures with a personal touch.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "MKIS Nails Saloon",
    description: "Premium nail art and care. Book your appointment online.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "MKIS Nails Saloon" }],
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
      className={`${inter.variable} ${playfair.variable}`}
    >
      <body className="min-h-full flex flex-col antialiased font-[family-name:var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}
