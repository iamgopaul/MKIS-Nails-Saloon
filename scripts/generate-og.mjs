/**
 * Generates public/og.png — the social preview image.
 * Run once: node scripts/generate-og.mjs
 * Or add to package.json "prebuild": "node scripts/generate-og.mjs"
 *
 * Uses the page's bg.png as the backdrop with a heavy dark overlay so the
 * logo and copy stay legible regardless of where the OG card is rendered.
 */

import sharp from "sharp";
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const W = 1200, H = 630;

// 1. Background — peak-petal snapshot from sakura-intro.mp4 (pre-extracted to
//    public/og-source.png), darkened by a 75% #1A1410 overlay so the petals
//    remain visible while text + logo still read at thumbnail size.
const bgBuffer = await sharp(join(root, "public/og-source.png"))
  .resize(W, H, { fit: "cover", position: "center" })
  .composite([{
    input: { create: { width: W, height: H, channels: 4, background: { r: 26, g: 20, b: 16, alpha: 0.75 } } },
  }])
  .toBuffer();

// 2. Logo (transparent PNG) — pre-resized to the size we'll place it at, so
//    sharp composites it crisply onto the darkened bg.
const LOGO_W = 380;
const LOGO_H = 380;
const LOGO_X = Math.round((W - LOGO_W) / 2);
const LOGO_Y = 60;

const logoBuffer = await sharp(join(root, "public/logo-transparent.png"))
  .resize(LOGO_W, LOGO_H, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

// 3. SVG overlay with copy — the wordmark sits low so it doesn't clash with
//    the logo's own text (since logo-transparent.png includes "MKIS Nails Salon").
const COPY_Y = LOGO_Y + LOGO_H + 30;

const svgOverlay = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <text font-family="Georgia, 'Cormorant Garamond', serif" font-style="italic"
        font-size="36" fill="#D89AAE" text-anchor="middle" x="${W / 2}" y="${COPY_Y}">
    Where Beauty Meets Artistry
  </text>

  <line x1="${W / 2 - 110}" y1="${COPY_Y + 28}" x2="${W / 2 + 110}" y2="${COPY_Y + 28}"
        stroke="#D89AAE" stroke-width="1" opacity="0.45"/>

  <text font-family="Georgia, sans-serif" font-size="22" letter-spacing="8"
        fill="#F0E4D8" text-anchor="middle" x="${W / 2}" y="${COPY_Y + 70}">
    PREMIUM NAIL STUDIO  ·  BOOK ONLINE
  </text>
</svg>`);

await sharp(bgBuffer)
  .composite([
    { input: logoBuffer, top: LOGO_Y, left: LOGO_X },
    { input: svgOverlay, top: 0, left: 0 },
  ])
  .png()
  .toFile(join(root, "public/og.png"));

console.log("✓ public/og.png generated");

// ── Brand icons ──────────────────────────────────────────────────────────────
// Builds a square brand icon — warm-dark backdrop, centered tulip rose-mark
// (the same glyph used in the section dividers + logo), with a soft rose
// halo. Generated at multiple sizes for favicon, apple-touch, and PWA.

const ICON_SIZES = [
  // Favicon — bumped to 256 so the browser anti-aliases it down to 16/32
  // with crisp results instead of starting from a tiny 32px source.
  { size: 256, file: "src/app/icon.png" },
  { size: 180, file: "src/app/apple-icon.png" },             // iOS home-screen
  { size: 192, file: "public/icon-192.png" },                // PWA / Android
  { size: 512, file: "public/icon-512.png" },                // PWA splash + maskable
];

function brandIconSvg(size) {
  // Rose-plated icon with a cream tulip — high contrast in both light and
  // dark browser tab bars. The tulip glyph lives in a 24x24 viewBox with
  // visual center at (12, 11); we scale to ~56% of the icon then translate
  // so its visual center lands on the icon's center.
  const GLYPH_H = 14;
  const GLYPH_CX = 12;
  const GLYPH_CY = 11;
  const targetH = size * 0.56;
  const S = targetH / GLYPH_H;
  const tx = size / 2 - GLYPH_CX * S;
  const ty = size / 2 - GLYPH_CY * S;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="#E5B0C2"/>
        <stop offset="60%"  stop-color="#D89AAE"/>
        <stop offset="100%" stop-color="#C45E7A"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.20}" fill="url(#bg)"/>
    <g transform="translate(${tx}, ${ty}) scale(${S})" fill="#FFF8F0">
      <path d="M12 4c1.4 1.6 1.4 4.6 1.4 7.4 0 1.6-.6 2.6-1.4 2.6s-1.4-1-1.4-2.6c0-2.8 0-5.8 1.4-7.4z"/>
      <path d="M6.8 8.2c1.7.6 3.2 2.7 4 5 .4 1.2.1 2.1-.5 2.3-.6.2-1.5-.3-2.1-1.4-1.2-2.1-2.1-4.4-1.4-5.9z"/>
      <path d="M17.2 8.2c-1.7.6-3.2 2.7-4 5-.4 1.2-.1 2.1.5 2.3.6.2 1.5-.3 2.1-1.4 1.2-2.1 2.1-4.4 1.4-5.9z"/>
      <circle cx="12" cy="15" r="0.7"/>
    </g>
  </svg>`;
}

for (const { size, file } of ICON_SIZES) {
  await sharp(Buffer.from(brandIconSvg(size)))
    .png()
    .toFile(join(root, file));
}

// Legacy favicon.ico at the repo root /public for older browsers that don't
// pick up the App Router icon convention. A single 32×32 PNG renamed .ico is
// what most browsers accept; we use the same generated icon source.
await sharp(Buffer.from(brandIconSvg(32)))
  .resize(32, 32)
  .png()
  .toFile(join(root, "public/favicon.ico"));

console.log("✓ brand icons generated:", ICON_SIZES.map((i) => `${i.size}px`).join(", "), "+ favicon.ico");

// ── Google Business profile logo (720×720) ───────────────────────────────────
// Square, no transparency, full brand wordmark over the warm dark plate.
// Upload at: business.google.com → Edit profile → Photos → Logo
const GB_SIZE = 720;

const gbBgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${GB_SIZE}" height="${GB_SIZE}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="70%">
      <stop offset="0%"   stop-color="#2A1F18"/>
      <stop offset="60%"  stop-color="#1A1410"/>
      <stop offset="100%" stop-color="#0E0A07"/>
    </radialGradient>
  </defs>
  <rect width="${GB_SIZE}" height="${GB_SIZE}" fill="url(#bg)"/>
  <!-- Rose halo behind the wordmark -->
  <circle cx="${GB_SIZE / 2}" cy="${GB_SIZE / 2 - 20}" r="${GB_SIZE * 0.38}" fill="#D89AAE" opacity="0.18"/>
</svg>`;

const gbLogoBuffer = await sharp(join(root, "public/logo-transparent.png"))
  .resize(Math.round(GB_SIZE * 0.78), Math.round(GB_SIZE * 0.78), {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

await sharp(Buffer.from(gbBgSvg))
  .composite([{ input: gbLogoBuffer, gravity: "center" }])
  .png()
  .toFile(join(root, "public/google-business-logo.png"));

console.log("✓ Google Business logo (720×720) generated → public/google-business-logo.png");
