import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/invite — Body: { email }
 *
 * Sends a Supabase magic-link invite email. The team member fills in their
 * name + password on /admin/setup, then can edit their job title, bio, and
 * photo from their profile tab.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const { data: invite, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/admin/setup`,
    });
    if (inviteErr || !invite.user) {
      return NextResponse.json({ error: inviteErr?.message ?? "Invite failed" }, { status: 500 });
    }

    // Auto-create an empty team listing linked to the new user.
    // Name + role get filled in once the user completes setup and edits their profile.
    const { count } = await supabase
      .from("team")
      .select("id", { count: "exact", head: true })
      .eq("user_id", invite.user.id);
    if (!count || count === 0) {
      await supabase.from("team").insert({
        user_id:       invite.user.id,
        name:          email.split("@")[0],
        role:          "Nail Technician",
        bio:           "",
        photo_url:     "",
        display_order: 99,
        active:        false,    // hidden until they complete their profile
      });
    }

    return NextResponse.json({ success: true, userId: invite.user.id });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[invite] error:", err);
    throw err;
  }
}
