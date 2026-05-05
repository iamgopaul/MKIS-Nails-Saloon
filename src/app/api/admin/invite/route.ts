import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInviteEmail } from "@/lib/inviteEmail";

/**
 * POST /api/admin/invite — Body: { email }
 *
 * Generates a Supabase magic link, then sends a branded invite email
 * via our Gmail SMTP. Team member clicks the link → /admin/setup → finishes signup.
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

    // 1) Generate invite link (creates the auth user, returns the magic URL — does NOT email)
    const { data, error } = await supabase.auth.admin.generateLink({
      type:  "invite",
      email,
      options: {
        redirectTo: `${siteUrl}/admin/setup`,
      },
    });
    if (error || !data?.user || !data?.properties?.action_link) {
      return NextResponse.json({ error: error?.message ?? "Invite failed" }, { status: 500 });
    }

    // 2) Send the branded email through Gmail SMTP
    try {
      await sendInviteEmail({ to: email, inviteUrl: data.properties.action_link });
    } catch (mailErr) {
      console.error("[invite] email send failed:", mailErr);
      return NextResponse.json({
        error: "User created, but invite email failed to send. Check your SMTP settings."
      }, { status: 500 });
    }

    // 3) Auto-create a hidden team listing — name/role/bio filled in by the user later
    const { count } = await supabase
      .from("team")
      .select("id", { count: "exact", head: true })
      .eq("user_id", data.user.id);
    if (!count || count === 0) {
      await supabase.from("team").insert({
        user_id:       data.user.id,
        name:          email.split("@")[0],
        role:          "Nail Technician",
        bio:           "",
        photo_url:     "",
        display_order: 99,
        active:        false,
      });
    }

    return NextResponse.json({ success: true, userId: data.user.id });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[invite] error:", err);
    throw err;
  }
}
