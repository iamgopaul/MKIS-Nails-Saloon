import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/invite
 *
 * Body: { email, name, role, bio? }
 *
 * Sends a Supabase magic-link invite email to the new user.
 * On click, they land on /admin/setup with a session and finish signup.
 * Also creates a `team` row linked to the new user.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { email, name, role, bio } = await req.json();

    if (!email || !name || !role) {
      return NextResponse.json({ error: "Email, name, and role are required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    // 1) Send invite (creates auth user, no password yet, email goes out)
    const { data: invite, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { full_name: name },
      redirectTo: `${siteUrl}/admin/setup`,
    });
    if (inviteErr || !invite.user) {
      return NextResponse.json({ error: inviteErr?.message ?? "Invite failed" }, { status: 500 });
    }

    // 2) Update profile name (trigger auto-creates the row with full_name from metadata, but be safe)
    await supabase
      .from("profiles")
      .upsert({ id: invite.user.id, role: "team", full_name: name }, { onConflict: "id" });

    // 3) Create team row linked to this user (or upsert if one exists for the email)
    const { count } = await supabase
      .from("team")
      .select("id", { count: "exact", head: true })
      .eq("user_id", invite.user.id);

    if (!count || count === 0) {
      await supabase.from("team").insert({
        user_id:       invite.user.id,
        name,
        role,
        bio:           bio ?? "",
        photo_url:     "",
        display_order: 99,
        active:        true,
      });
    }

    return NextResponse.json({ success: true, userId: invite.user.id });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[invite] error:", err);
    throw err;
  }
}
