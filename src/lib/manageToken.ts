import { randomBytes } from "crypto";

/** URL-safe 32-byte token (43 chars) used for self-service manage links. */
export function generateManageToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Token validity: until 24h after the appointment date. After the appointment
 * has clearly passed there's nothing useful to do with the link.
 */
export function manageTokenExpiry(dateStr: string): Date {
  const d = new Date(`${dateStr}T23:59:59`);
  d.setDate(d.getDate() + 1);
  return d;
}

export function manageUrl(token: string): string {
  let base = process.env.NEXT_PUBLIC_SITE_URL || "";
  if (!base && process.env.VERCEL_URL) base = `https://${process.env.VERCEL_URL}`;
  return `${base.replace(/\/$/, "")}/manage/${token}`;
}
