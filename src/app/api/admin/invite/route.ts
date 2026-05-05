import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireAdmin, AuthError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInviteEmail } from "@/lib/inviteEmail";

/**
 * POST /api/admin/invite — Body: { email }
 *
 * Creates a pending invite (token only — no auth user yet) and emails the
 * recipient a signup link. The actual user + team row are created only when
 * they complete /signup with their name + password.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { email } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase();

    const supabase = createAdminClient();

    // Reject if email already belongs to a registered user
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    if (existingUser?.users.some((u) => (u.email ?? "").toLowerCase() === cleanEmail)) {
      return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });
    }

    // Invalidate any prior unused invites for this email
    await supabase
      .from("pending_invites")
      .update({ used_at: new Date().toISOString() })
      .eq("email", cleanEmail)
      .is("used_at", null);

    // Create new invite token
    const token = randomBytes(32).toString("hex");
    const { error: insertErr } = await supabase
      .from("pending_invites")
      .insert({ email: cleanEmail, token, invited_by: session.userId });
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    // Send the email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const inviteUrl = `${siteUrl}/signup?token=${token}`;
    try {
      await sendInviteEmail({ to: cleanEmail, inviteUrl });
    } catch (mailErr) {
      console.error("[invite] email send failed:", mailErr);
      return NextResponse.json({ error: "Failed to send invite email — check SMTP settings" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[invite] error:", err);
    throw err;
  }
}
