/**
 * Tiny in-memory IP rate limiter.
 *
 * Cheap & cheerful — resets on cold-start in serverless, doesn't share state
 * across Vercel instances. Good enough as a first line of defense against
 * casual scripted abuse on public endpoints. For production-grade limits use
 * a shared store (Redis, Supabase, Upstash).
 */

import { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "anon";
}

/**
 * Returns true if the request is within the limit and consumes one token.
 * Returns false if the limit has been exceeded.
 */
export function rateLimit(
  key: string,
  opts: { max: number; windowMs: number }
): { allowed: boolean; resetAt: number } {
  const now    = Date.now();
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + opts.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, resetAt };
  }
  if (bucket.count >= opts.max) {
    return { allowed: false, resetAt: bucket.resetAt };
  }
  bucket.count += 1;
  return { allowed: true, resetAt: bucket.resetAt };
}
