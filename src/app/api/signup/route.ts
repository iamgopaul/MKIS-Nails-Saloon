import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { validatePassword } from "@/lib/password";

/**
 * POST /api/signup — Body: { token, name, password }
 *
 * Atomically claims a pending invite token, creates the auth user + team listing.
 */
export async function POST(req: NextRequest) {
  // Defensive rate limit — 10 signup attempts per IP per 10 min
  const rl = rateLimit(`signup:${getClientIp(req)}`, { max: 10, windowMs: 10 * 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const { token, name, password } = await req.json();

  if (!token || typeof token !== "string")     return NextResponse.json({ error: "Invalid invite link" }, { status: 400 });
  if (!name?.trim())                           return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
  const pwdErr = validatePassword(password ?? "");
  if (pwdErr)                                  return NextResponse.json({ error: pwdErr }, { status: 400 });

  const supabase = createAdminClient();

  // ATOMIC claim: only one concurrent caller can transition the row from
  // (used_at IS NULL, expires_at > now) to (used_at = now). The RETURNING row
  // is the proof we won the race.
  const { data: claimed, error: claimErr } = await supabase
    .from("pending_invites")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select()
    .single();

  if (claimErr || !claimed) {
    return NextResponse.json({ error: "This invite link is invalid or has expired." }, { status: 400 });
  }

  // 2) Create the auth user with the chosen credentials
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email:          claimed.email,
    password,
    email_confirm:  true,
    user_metadata:  { full_name: name.trim() },
  });
  if (createErr || !created?.user) {
    // Roll back the claim so the user can retry with a different password
    await supabase.from("pending_invites").update({ used_at: null }).eq("id", claimed.id);
    return NextResponse.json({ error: createErr?.message ?? "Failed to create account" }, { status: 500 });
  }

  // 3) Sync profile name (trigger may have already created the row)
  await supabase
    .from("profiles")
    .upsert({ id: created.user.id, role: "team", full_name: name.trim() }, { onConflict: "id" });

  // 4) Create the team listing — unique constraint on user_id prevents dupes
  await supabase
    .from("team")
    .insert({
      user_id:        created.user.id,
      name:           name.trim(),
      role:           "Nail Technician",
      bio:            "",
      photo_url:      "",
      display_order:  99,
      active:         false,
    });

  return NextResponse.json({ success: true, email: claimed.email });
}
