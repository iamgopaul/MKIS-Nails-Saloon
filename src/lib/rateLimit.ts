/**
 * Rate limiter backed by a Supabase table so quotas are shared across
 * serverless instances and survive cold starts. Falls open on infrastructure
 * failure — we'd rather serve real users than 500 the whole site if the DB
 * is briefly unreachable.
 */

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "anon";
}

export async function rateLimit(
  key: string,
  opts: { max: number; windowMs: number }
): Promise<{ allowed: boolean; resetAt: number }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("rate_limit_consume", {
      p_key: key,
      p_max: opts.max,
      p_window_ms: opts.windowMs,
    });
    if (error || !data || !Array.isArray(data) || data.length === 0) {
      console.error("[rateLimit] rpc error, failing open:", error);
      return { allowed: true, resetAt: Date.now() + opts.windowMs };
    }
    const row = data[0] as { allowed: boolean; reset_at: string };
    return { allowed: !!row.allowed, resetAt: new Date(row.reset_at).getTime() };
  } catch (err) {
    console.error("[rateLimit] threw, failing open:", err);
    return { allowed: true, resetAt: Date.now() + opts.windowMs };
  }
}
