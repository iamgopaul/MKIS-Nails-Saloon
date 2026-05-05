import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findBookingByToken } from "@/lib/manageBooking";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { sendCancellationEmail } from "@/lib/resend";
import { sendTelegramAlert } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rl = await rateLimit(`manage:${getClientIp(req)}`, { max: 20, windowMs: 10 * 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: { token?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const token = body.token ?? "";

  const booking = await findBookingByToken(token);
  if (!booking) return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 404 });

  if (booking.status === "Cancelled") {
    return NextResponse.json({ ok: true, alreadyCancelled: true });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bookings")
    .update({ status: "Cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", booking.id);
  if (error) {
    console.error("[manage/cancel] update failed:", error);
    return NextResponse.json({ error: "Could not cancel right now." }, { status: 500 });
  }

  // Best-effort notifications
  Promise.allSettled([
    sendCancellationEmail({
      name:       booking.client_name,
      phone:      booking.client_phone,
      email:      booking.client_email,
      service:    booking.service_name,
      date:       booking.preferred_date,
      startTime:  String(booking.start_time).slice(0, 5),
      endTime:    String(booking.end_time).slice(0, 5),
      technician: booking.technician_name ?? "",
      notes:      booking.notes ?? "",
    }),
    sendTelegramAlert(
      [
        "❌ *Booking Cancelled by Client*",
        "",
        `👤 ${booking.client_name}`,
        `💅 ${booking.service_name}`,
        `📅 ${booking.preferred_date} at ${String(booking.start_time).slice(0, 5)}`,
        `💁 ${booking.technician_name ?? "—"}`,
      ].join("\n")
    ),
  ]).catch(() => {});

  return NextResponse.json({ ok: true });
}
