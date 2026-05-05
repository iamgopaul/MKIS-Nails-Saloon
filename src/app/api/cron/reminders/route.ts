import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReminderEmail } from "@/lib/resend";
import { manageUrl } from "@/lib/manageToken";

export const runtime     = "nodejs";
export const maxDuration = 60;
export const dynamic     = "force-dynamic";

/**
 * GET /api/cron/reminders
 *
 * Sends a "see you tomorrow" email to every non-cancelled booking on
 * tomorrow's date that hasn't been reminded yet. Idempotent: each row
 * gets `reminder_sent_at` stamped after a successful send.
 *
 * Auth: pass `Authorization: Bearer <CRON_SECRET>` (Vercel Cron does this
 * automatically when CRON_SECRET is configured) OR `?secret=<CRON_SECRET>`
 * for triggers like Supabase pg_cron / pg_net.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }

  const authz = req.headers.get("authorization") ?? "";
  const url   = new URL(req.url);
  const ok =
    authz === `Bearer ${secret}` ||
    url.searchParams.get("secret") === secret;
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // "Tomorrow" in salon time, returned as YYYY-MM-DD.
  const tomorrowStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(Date.now() + 24 * 60 * 60_000));

  const supabase = createAdminClient();
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, client_name, client_phone, client_email, service_name, technician_name, preferred_date, start_time, end_time, notes, manage_token")
    .eq("preferred_date", tomorrowStr)
    .neq("status", "Cancelled")
    .is("reminder_sent_at", null);

  if (error) {
    console.error("[cron/reminders] query failed:", error);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const b of bookings ?? []) {
    if (!b.client_email) continue;
    try {
      await sendReminderEmail({
        name:       b.client_name,
        phone:      b.client_phone ?? "",
        email:      b.client_email,
        service:    b.service_name,
        date:       b.preferred_date,
        startTime:  String(b.start_time).slice(0, 5),
        endTime:    String(b.end_time).slice(0, 5),
        technician: b.technician_name ?? "",
        notes:      b.notes ?? "",
        manageUrl:  b.manage_token ? manageUrl(b.manage_token) : undefined,
      });
      await supabase
        .from("bookings")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", b.id);
      sent++;
    } catch (err) {
      console.error("[cron/reminders] send failed for", b.id, err);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, date: tomorrowStr, sent, failed, total: bookings?.length ?? 0 });
}
