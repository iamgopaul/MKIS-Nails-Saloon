import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findBookingByToken } from "@/lib/manageBooking";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import {
  dailySlots,
  endTimeFor,
  isWorkingDay,
  todayInSalonTZ,
} from "@/lib/booking";
import { sendConfirmationEmail } from "@/lib/resend";
import { sendTelegramAlert } from "@/lib/telegram";
import { manageUrl } from "@/lib/manageToken";

export async function POST(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rl = await rateLimit(`manage:${getClientIp(req)}`, { max: 20, windowMs: 10 * 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: { token?: string; date?: string; startTime?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const { token = "", date = "", startTime = "" } = body;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))   return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  if (!/^\d{2}:\d{2}$/.test(startTime))    return NextResponse.json({ error: "Invalid time" }, { status: 400 });
  if (!isWorkingDay(date))                 return NextResponse.json({ error: "Salon is closed on this day" }, { status: 422 });
  if (date < todayInSalonTZ())             return NextResponse.json({ error: "Date is in the past" }, { status: 422 });
  if (!dailySlots(date).includes(startTime)) {
    return NextResponse.json({ error: "Selected time is outside business hours" }, { status: 422 });
  }

  const booking = await findBookingByToken(token);
  if (!booking) return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 404 });
  if (booking.status === "Cancelled") {
    return NextResponse.json({ error: "This booking was cancelled." }, { status: 409 });
  }

  const supabase = createAdminClient();

  // Re-fetch service to validate active + duration
  const { data: svc } = await supabase
    .from("services")
    .select("id, name, duration_minutes, active")
    .eq("id", booking.service_id)
    .maybeSingle();
  if (!svc || !svc.active) return NextResponse.json({ error: "Service no longer available" }, { status: 422 });

  const newEnd = endTimeFor(startTime, svc.duration_minutes);

  // Update — the EXCLUDE constraint will catch any conflict atomically.
  const { error: updErr } = await supabase
    .from("bookings")
    .update({
      preferred_date: date,
      start_time:     startTime,
      end_time:       newEnd,
      status:         "Pending",
    })
    .eq("id", booking.id);

  if (updErr?.code === "23P01") {
    return NextResponse.json(
      { error: "That slot was just taken — please pick another time." },
      { status: 409 },
    );
  }
  if (updErr) {
    console.error("[manage/reschedule] update failed:", updErr);
    return NextResponse.json({ error: "Could not reschedule right now." }, { status: 500 });
  }

  // Best-effort notifications — reuse the standard confirmation email
  Promise.allSettled([
    sendConfirmationEmail({
      name:       booking.client_name,
      phone:      booking.client_phone,
      email:      booking.client_email,
      service:    svc.name,
      date,
      startTime,
      endTime:    newEnd,
      technician: booking.technician_name ?? "Any Available",
      notes:      booking.notes ?? "",
      manageUrl:  manageUrl(token),
    }),
    sendTelegramAlert(
      [
        "🔄 *Booking Rescheduled by Client*",
        "",
        `👤 ${booking.client_name}`,
        `💅 ${svc.name}`,
        `📅 ${date} at ${startTime}`,
        `💁 ${booking.technician_name ?? "—"}`,
      ].join("\n")
    ),
  ]).catch(() => {});

  return NextResponse.json({ ok: true, date, startTime, endTime: newEnd });
}
