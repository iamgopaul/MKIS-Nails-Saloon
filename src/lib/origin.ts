import { NextRequest } from "next/server";

/**
 * Reject cross-origin POSTs from arbitrary websites. The browser sends
 * `Origin` on POST requests; if it's missing or doesn't match our own
 * deployment, refuse. Same-origin browser requests always carry our origin.
 *
 * This is a CSRF defense for cookie-authenticated routes and a basic
 * "don't let random sites hammer our APIs from someone's browser" guard
 * for unauthenticated public POSTs.
 */
export function isAllowedOrigin(req: NextRequest): boolean {
  const origin  = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // No Origin header at all — could be a non-browser client (curl, server-side
  // fetch). Fall back to Referer; if neither is present, allow (we can't tell).
  if (!origin && !referer) return true;

  const allowed = new Set<string>();
  const envSite = process.env.NEXT_PUBLIC_SITE_URL;
  if (envSite) {
    try { allowed.add(new URL(envSite).origin); } catch {}
  }
  const host = req.headers.get("host");
  if (host) {
    allowed.add(`https://${host}`);
    if (process.env.NODE_ENV !== "production") allowed.add(`http://${host}`);
  }
  // Vercel preview deployments
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) allowed.add(`https://${vercelUrl}`);

  const candidate = origin ?? (() => {
    try { return new URL(referer!).origin; } catch { return null; }
  })();
  if (!candidate) return false;

  return allowed.has(candidate);
}
