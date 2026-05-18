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
  // The tulip glyph lives in a 24x24 viewBox, but its actual visual bounds
  // are roughly x:6→18, y:4→18 — visual center at (12, 11). We scale so the
  // glyph height fills ~56% of the icon, then translate so its visual center
  // lands exactly on the icon center.
  const halo = size * 0.45;
  const GLYPH_H = 14;     // visual height in viewBox units
  const GLYPH_CX = 12;    // visual center x in viewBox units
  const GLYPH_CY = 11;    // visual center y in viewBox units
  const targetH = size * 0.56;
  const S = targetH / GLYPH_H;
  const tx = size / 2 - GLYPH_CX * S;
  const ty = size / 2 - GLYPH_CY * S;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <radialGradient id="bg" cx="50%" cy="50%" r="70%">
        <stop offset="0%"   stop-color="#2E2018"/>
        <stop offset="65%"  stop-color="#1A1410"/>
        <stop offset="100%" stop-color="#0A0706"/>
      </radialGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="url(#bg)"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${halo}" fill="#D89AAE" opacity="0.22"/>
    <g transform="translate(${tx}, ${ty}) scale(${S})" fill="#D89AAE">
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

console.log("✓ brand icons generated:", ICON_SIZES.map((i) => `${i.size}px`).join(", "));

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
