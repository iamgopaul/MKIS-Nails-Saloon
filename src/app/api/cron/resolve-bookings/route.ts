import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInSalonTZ } from "@/lib/booking";

export const runtime     = "nodejs";
export const maxDuration = 60;
export const dynamic     = "force-dynamic";

/**
 * GET /api/cron/resolve-bookings
 *
 * Auto-progresses past appointments so the admin list isn't littered with
 * stale "Pending" rows. Idempotent — only touches rows whose status is
 * still in a non-terminal state.
 *
 *   Pending in the past   → No Show
 *   Confirmed in the past → Completed
 *
 * Auth: same pattern as /api/cron/reminders (Bearer or ?secret).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });

  const authz = req.headers.get("authorization") ?? "";
  const url   = new URL(req.url);
  const ok =
    authz === `Bearer ${secret}` ||
    url.searchParams.get("secret") === secret;
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const today    = todayInSalonTZ();
  const now      = new Date().toISOString();
  const supabase = createAdminClient();

  const { data: pending, error: pErr } = await supabase
    .from("bookings")
    .update({ status: "No Show", auto_resolved_at: now })
    .lt("preferred_date", today)
    .eq("status", "Pending")
    .select("id");

  const { data: confirmed, error: cErr } = await supabase
    .from("bookings")
    .update({ status: "Completed", auto_resolved_at: now })
    .lt("preferred_date", today)
    .eq("status", "Confirmed")
    .select("id");

  if (pErr || cErr) {
    console.error("[cron/resolve-bookings] failed:", pErr ?? cErr);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok:        true,
    cutoff:    today,
    no_show:   pending?.length ?? 0,
    completed: confirmed?.length ?? 0,
  });
}
