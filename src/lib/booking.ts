/**
 * Time-slot helpers for the booking system.
 * 30-minute granularity. Open Saturday + Sunday only, 10 AM to 6 PM.
 */

export const SLOT_MINUTES = 30;
export const SALON_TZ = "America/New_York";

/** Today's date as YYYY-MM-DD in the salon's timezone. */
export function todayInSalonTZ(): string {
  // en-CA gives YYYY-MM-DD format directly.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SALON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Per-day open/close times in minutes from midnight
const HOURS: Record<number, { open: number; close: number } | null> = {
  0: { open: 10 * 60, close: 18 * 60 },    // Sun  10 AM – 6 PM
  1: null,                                 // Mon  closed
  2: null,                                 // Tue  closed
  3: null,                                 // Wed  closed
  4: null,                                 // Thu  closed
  5: null,                                 // Fri  closed
  6: { open: 10 * 60, close: 18 * 60 },    // Sat  10 AM – 6 PM
};

export function isWorkingDay(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  return HOURS[d.getDay()] !== null;
}

/** All 30-minute slot start times for a given date as "HH:MM" */
export function dailySlots(dateStr: string): string[] {
  const d = new Date(dateStr + "T00:00:00");
  const h = HOURS[d.getDay()];
  if (!h) return [];
  const out: string[] = [];
  for (let m = h.open; m + SLOT_MINUTES <= h.close; m += SLOT_MINUTES) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/**
 * Given a start time and a service duration (+ buffer), returns the list of
 * 30-min slot starts the booking will occupy.
 */
export function slotsForBooking(
  start: string,
  durationMinutes: number,
  bufferMinutes = 0
): string[] {
  const startMin = timeToMinutes(start);
  const endMin   = startMin + durationMinutes + bufferMinutes;
  const out: string[] = [];
  for (let m = startMin; m < endMin; m += SLOT_MINUTES) out.push(minutesToTime(m));
  return out;
}

export function endTimeFor(start: string, durationMinutes: number): string {
  return minutesToTime(timeToMinutes(start) + durationMinutes);
}
