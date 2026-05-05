import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/signup — Body: { token, name, password }
 *
 * Validates a pending invite token, creates the auth user + team listing,
 * and marks the invite as used. The client signs in afterwards using the
 * email + password they just set.
 */
export async function POST(req: NextRequest) {
  const { token, name, password } = await req.json();

  if (!token || typeof token !== "string")        return NextResponse.json({ error: "Invalid invite link" }, { status: 400 });
  if (!name?.trim())                              return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
  if (!password || password.length < 8)           return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const supabase = createAdminClient();

  // 1) Look up the invite
  const { data: invite, error: lookupErr } = await supabase
    .from("pending_invites")
    .select("*")
    .eq("token", token)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (lookupErr || !invite) {
    return NextResponse.json({ error: "This invite link is invalid or has expired." }, { status: 400 });
  }

  // 2) Create the auth user (email_confirm: true skips Supabase's own confirmation flow)
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email:          invite.email,
    password,
    email_confirm:  true,
    user_metadata:  { full_name: name.trim() },
  });
  if (createErr || !created?.user) {
    return NextResponse.json({ error: createErr?.message ?? "Failed to create account" }, { status: 500 });
  }

  // 3) Profile row is auto-created by the trigger; sync the name just in case
  await supabase
    .from("profiles")
    .upsert({ id: created.user.id, role: "team", full_name: name.trim() }, { onConflict: "id" });

  // 4) Create the team listing (hidden until they complete their profile)
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

  // 5) Mark the invite as used
  await supabase
    .from("pending_invites")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invite.id);

  return NextResponse.json({ success: true, email: invite.email });
}
