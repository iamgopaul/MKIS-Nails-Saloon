import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  dailySlots,
  isWorkingDay,
  slotsForBooking,
  timeToMinutes,
} from "@/lib/booking";

/**
 * GET /api/availability?technicianId=...&date=YYYY-MM-DD&serviceId=...
 *
 *  - If technicianId is missing, returns the union of all technicians' open slots
 *  - If serviceId is provided, only returns slots where the full service duration fits
 *
 * Response: { slots: string[] }   // array of "HH:MM" 30-min slot starts
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const technicianId = url.searchParams.get("technicianId");
  const date         = url.searchParams.get("date");
  const serviceId    = url.searchParams.get("serviceId");
  if (!date)         return NextResponse.json({ error: "Missing date" }, { status: 400 });

  if (!isWorkingDay(date)) return NextResponse.json({ slots: [] });

  const all = dailySlots(date);
  const supabase = createAdminClient();

  // Get buffer + service duration
  const { data: bufferRow } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", "booking_buffer_minutes")
    .maybeSingle();
  const buffer = Number(bufferRow?.value ?? 0);

  let duration = 60;
  if (serviceId) {
    const { data: svc } = await supabase
      .from("services")
      .select("duration_minutes")
      .eq("id", serviceId)
      .maybeSingle();
    if (svc?.duration_minutes) duration = svc.duration_minutes;
  }

  // Fetch existing bookings for this date — by technician (or all)
  let q = supabase
    .from("bookings")
    .select("technician_id, start_time, end_time")
    .eq("preferred_date", date)
    .neq("status", "Cancelled");

  if (technicianId) q = q.eq("technician_id", technicianId);

  const { data: bookings } = await q;

  // Build the set of taken slot start strings
  const taken = new Set<string>();
  (bookings ?? []).forEach((b) => {
    if (!b.start_time || !b.end_time) return;
    // The booking's own service duration determines its blocked range
    const startMin = timeToMinutes(String(b.start_time).slice(0, 5));
    const endMin   = timeToMinutes(String(b.end_time).slice(0, 5)) + buffer;
    for (let m = startMin; m < endMin; m += 30) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      taken.add(`${hh}:${mm}`);
    }
  });

  // A slot is open only if every required slot (for the service duration) is free
  const open = all.filter((slot) => {
    const required = slotsForBooking(slot, duration, buffer);
    // Also ensure last required slot doesn't run past closing time
    const lastRequired = required[required.length - 1];
    if (!all.includes(lastRequired)) return false;
    return required.every((s) => !taken.has(s));
  });

  return NextResponse.json({ slots: open });
}
