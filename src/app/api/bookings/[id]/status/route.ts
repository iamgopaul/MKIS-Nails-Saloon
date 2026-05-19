import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAllowedOrigin } from "@/lib/origin";
import { sendCancellationEmail } from "@/lib/email";
import { sendTelegramAlert } from "@/lib/telegram";
import { logAdminEvent } from "@/lib/adminLog";

const ALLOWED = ["Confirmed", "Completed", "Cancelled", "No Show", "Pending"] as const;
type AllowedStatus = (typeof ALLOWED)[number];

/**
 * PUT /api/bookings/[id]/status — body: { status }
 *
 * Permissions:
 *   - Admins can change the status of any booking.
 *   - Team users can change the status only of bookings where they're the
 *     assigned technician.
 *
 * Cancelled transitions also send a cancellation email and stamp
 * cancelled_at.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAllowedOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let session;
  try {
    session = await requireUser();
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  const { id } = await params;
  let body: { status?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const status = body.status as AllowedStatus | undefined;
  if (!status || !ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, technician_id, status, client_name, client_phone, client_email, service_name, technician_name, preferred_date, start_time, end_time, notes")
    .eq("id", id)
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Permission check — admin can update anything; otherwise must be the
  // assigned technician.
  if (session.role !== "admin") {
    const { data: myTeam } = await supabase
      .from("team")
      .select("id")
      .eq("user_id", session.userId)
      .maybeSingle();
    if (!myTeam || booking.technician_id !== myTeam.id) {
      return NextResponse.json({ error: "Not allowed to change this booking" }, { status: 403 });
    }
  }

  const updates: Record<string, unknown> = { status };
  if (status === "Cancelled") updates.cancelled_at = new Date().toISOString();

  const { error: updErr } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", id);
  if (updErr) {
    console.error("[bookings/status] update failed:", updErr);
    return NextResponse.json({ error: "Could not update status" }, { status: 500 });
  }

  // Notifications + audit
  if (status === "Cancelled" && booking.status !== "Cancelled") {
    Promise.allSettled([
      sendCancellationEmail({
        name:       booking.client_name,
        phone:      booking.client_phone ?? "",
        email:      booking.client_email ?? "",
        service:    booking.service_name,
        date:       booking.preferred_date,
        startTime:  String(booking.start_time).slice(0, 5),
        endTime:    String(booking.end_time).slice(0, 5),
        technician: booking.technician_name ?? "",
        notes:      booking.notes ?? "",
      }),
      sendTelegramAlert(
        [
          "❌ *Booking Cancelled by Staff*",
          "",
          `👤 ${booking.client_name}`,
          `💅 ${booking.service_name}`,
          `📅 ${booking.preferred_date} at ${String(booking.start_time).slice(0, 5)}`,
          `By: ${session.email ?? session.fullName}`,
        ].join("\n")
      ),
    ]).catch(() => {});
  }

  logAdminEvent({
    session,
    req,
    action:      `booking.status.${status.toLowerCase().replace(/\s+/g, "_")}`,
    targetTable: "bookings",
    targetId:    id,
    metadata:    { from: booking.status, to: status },
  });

  return NextResponse.json({ ok: true, status });
}
