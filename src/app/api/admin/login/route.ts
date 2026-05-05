import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { isAllowedOrigin } from "@/lib/origin";

export async function POST(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getClientIp(req);

  // Per-IP cap so a single attacker can't grind through credentials.
  const ipRl = await rateLimit(`admin-login:ip:${ip}`, { max: 10, windowMs: 15 * 60_000 });
  if (!ipRl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }

  const { email, password } = await req.json();
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Per-account cap so attacker rotating IPs can't lock-pick a single account.
  const acctRl = await rateLimit(`admin-login:acct:${email.toLowerCase()}`, { max: 5, windowMs: 15 * 60_000 });
  if (!acctRl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  return NextResponse.json({ success: true });
}
