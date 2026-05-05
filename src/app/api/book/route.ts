import { NextRequest, NextResponse } from "next/server";
import { bookingSchema } from "@/lib/validators";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendConfirmationEmail } from "@/lib/resend";
import { sendTelegramNotification } from "@/lib/telegram";
import { endTimeFor, slotsForBooking, timeToMinutes, isWorkingDay } from "@/lib/booking";

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }
  const data = parsed.data;

  if (!isWorkingDay(data.date)) {
    return NextResponse.json({ error: "Selected date is not a working day" }, { status: 422 });
  }

  const supabase = createAdminClient();

  // 1) Look up the service for duration + name
  const { data: svc, error: svcErr } = await supabase
    .from("services")
    .select("id, name, duration_minutes")
    .eq("id", data.serviceId)
    .eq("active", true)
    .maybeSingle();
  if (svcErr || !svc) return NextResponse.json({ error: "Service not found" }, { status: 422 });

  // 2) Resolve technician — given, or pick any free active member
  const { data: bufferRow } = await supabase
    .from("site_content").select("value").eq("key", "booking_buffer_minutes").maybeSingle();
  const buffer = Number(bufferRow?.value ?? 0);

  const requiredSlots = slotsForBooking(data.startTime, svc.duration_minutes, buffer);

  let technicianId = data.technicianId || "";
  let technicianName = "Any Available";

  async function isTechFree(id: string): Promise<boolean> {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("preferred_date", data.date)
      .eq("technician_id", id)
      .neq("status", "Cancelled");
    const taken = new Set<string>();
    (bookings ?? []).forEach((b) => {
      if (!b.start_time || !b.end_time) return;
      const startMin = timeToMinutes(String(b.start_time).slice(0, 5));
      const endMin   = timeToMinutes(String(b.end_time).slice(0, 5)) + buffer;
      for (let m = startMin; m < endMin; m += 30) {
        const hh = String(Math.floor(m / 60)).padStart(2, "0");
        const mm = String(m % 60).padStart(2, "0");
        taken.add(`${hh}:${mm}`);
      }
    });
    return requiredSlots.every((s) => !taken.has(s));
  }

  if (technicianId) {
    const { data: tech } = await supabase
      .from("team").select("id, name, active").eq("id", technicianId).maybeSingle();
    if (!tech || !tech.active)        return NextResponse.json({ error: "Technician not available" }, { status: 422 });
    if (!(await isTechFree(tech.id))) return NextResponse.json({ error: "Selected slot is no longer available" }, { status: 409 });
    technicianName = tech.name;
  } else {
    const { data: team } = await supabase
      .from("team").select("id, name").eq("active", true);
    let assigned: { id: string; name: string } | null = null;
    for (const t of team ?? []) {
      if (await isTechFree(t.id)) { assigned = t; break; }
    }
    if (!assigned) return NextResponse.json({ error: "No technicians available for this slot" }, { status: 409 });
    technicianId   = assigned.id;
    technicianName = assigned.name;
  }

  // 3) Insert the booking
  const endTime = endTimeFor(data.startTime, svc.duration_minutes);
  const { data: booking, error: insErr } = await supabase
    .from("bookings")
    .insert({
      client_name:     data.name,
      client_phone:    data.phone,
      client_email:    data.email,
      service_id:      svc.id,
      service_name:    svc.name,
      technician_id:   technicianId,
      technician_name: technicianName,
      preferred_date:  data.date,
      start_time:      data.startTime,
      end_time:        endTime,
      notes:           data.notes,
      status:          "Pending",
    })
    .select()
    .single();
  if (insErr) {
    console.error("[Supabase] Booking insert failed:", insErr);
    return NextResponse.json({ error: "Failed to save your booking. Please try again." }, { status: 500 });
  }

  // 4) Email + Telegram are best-effort
  const notifyData = {
    name: data.name,
    phone: data.phone,
    email: data.email,
    service: svc.name,
    date: data.date,
    startTime: data.startTime,
    endTime,
    technician: technicianName,
    notes: data.notes,
  };
  const [emailRes, tgRes] = await Promise.allSettled([
    sendConfirmationEmail(notifyData),
    sendTelegramNotification(notifyData),
  ]);
  if (emailRes.status === "rejected") console.error("[Email] failed:", emailRes.reason);
  if (tgRes.status === "rejected")    console.error("[Telegram] failed:", tgRes.reason);

  return NextResponse.json({
    success:   true,
    bookingId: booking.id,
    message:   "Booking received! Check your email for confirmation.",
  });
}
