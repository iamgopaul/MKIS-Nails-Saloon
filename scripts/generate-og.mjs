/**
 * Generates public/og.png — the social preview image.
 * Run once: node scripts/generate-og.mjs
 * Or add to package.json "prebuild": "node scripts/generate-og.mjs"
 */

import sharp from "sharp";
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const W = 1200, H = 630;
const LOGO_SIZE = 200;
const RING      = 6;   // gradient ring thickness
const CX        = W / 2;
const LOGO_Y    = 90;
const LOGO_CY   = LOGO_Y + LOGO_SIZE / 2;
const LOGO_CX   = CX;

const logo64 = (await readFile(join(root, "public/logo.png"))).toString("base64");

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#0A0A0A"/>
      <stop offset="50%"  stop-color="#0E0B09"/>
      <stop offset="100%" stop-color="#120D0A"/>
    </linearGradient>
    <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#E07898"/>
      <stop offset="50%"  stop-color="#C9956B"/>
      <stop offset="100%" stop-color="#D4A882"/>
    </linearGradient>
    <clipPath id="logoClip">
      <circle cx="${LOGO_CX}" cy="${LOGO_CY}" r="${LOGO_SIZE / 2 - RING - 4}"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Gradient ring -->
  <circle cx="${LOGO_CX}" cy="${LOGO_CY}" r="${LOGO_SIZE / 2}"
          fill="none" stroke="url(#ring)" stroke-width="${RING}"/>

  <!-- Dark background inside ring -->
  <circle cx="${LOGO_CX}" cy="${LOGO_CY}" r="${LOGO_SIZE / 2 - RING}"
          fill="#0A0A0A"/>

  <!-- Logo photo -->
  <image href="data:image/png;base64,${logo64}"
         x="${LOGO_CX - LOGO_SIZE / 2}" y="${LOGO_Y}"
         width="${LOGO_SIZE}" height="${LOGO_SIZE}"
         clip-path="url(#logoClip)"/>

  <!-- Wordmark -->
  <text font-family="Georgia, serif" font-weight="bold" font-size="68"
        text-anchor="middle" x="${CX}" y="${LOGO_Y + LOGO_SIZE + 72}">
    <tspan fill="#F5EDE6">MKIS</tspan><tspan fill="#E07898" dx="24"> Nails</tspan>
  </text>

  <!-- Sub-label -->
  <text font-family="Georgia, serif" font-size="24" letter-spacing="8"
        fill="#9A7060" text-anchor="middle" x="${CX}" y="${LOGO_Y + LOGO_SIZE + 112}">
    SALOON
  </text>

  <!-- Tagline -->
  <text font-family="Georgia, serif" font-size="20"
        fill="#9A7060" text-anchor="middle" x="${CX}" y="${LOGO_Y + LOGO_SIZE + 162}">
    Premium Nail Art &amp; Care  ·  Book Online
  </text>

  <!-- Decorative divider -->
  <line x1="${CX - 120}" y1="${LOGO_Y + LOGO_SIZE + 135}"
        x2="${CX + 120}" y2="${LOGO_Y + LOGO_SIZE + 135}"
        stroke="#E07898" stroke-width="0.8" opacity="0.35"/>
</svg>`;

await sharp(Buffer.from(svg))
  .png()
  .toFile(join(root, "public/og.png"));

console.log("✓ public/og.png generated");

// ── Favicon (32x32 + 192x192 + apple-touch 180x180) ──────────────────────────
const logoPath = join(root, "public/logo.png");

await sharp(logoPath).resize(32, 32).png().toFile(join(root, "src/app/icon.png"));
await sharp(logoPath).resize(180, 180).png().toFile(join(root, "src/app/apple-icon.png"));

console.log("✓ favicon + apple-touch icon generated");
