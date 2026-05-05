import { NextResponse } from "next/server";
import { getContent } from "@/lib/airtableAdmin";

export const revalidate = 60;

// Business hours in America/New_York (South Florida)
// day: 0 = Sunday … 6 = Saturday
const HOURS: Record<number, { open: number; close: number } | null> = {
  0: null,              // Sunday — closed
  1: { open: 9, close: 19 }, // Mon
  2: { open: 9, close: 19 }, // Tue
  3: { open: 9, close: 19 }, // Wed
  4: { open: 9, close: 19 }, // Thu
  5: { open: 9, close: 19 }, // Fri
  6: { open: 9, close: 18 }, // Sat
};

function isWithinBusinessHours(): boolean {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const day    = now.getDay();
  const hour   = now.getHours();
  const minute = now.getMinutes();
  const todayHours = HOURS[day];
  if (!todayHours) return false;
  const nowDecimal = hour + minute / 60;
  return nowDecimal >= todayHours.open && nowDecimal < todayHours.close;
}

export async function GET() {
  const content = await getContent();
  const manualStatus = content["business_status"] ?? "open";

  // Manual "closed" overrides everything (holidays, early close, etc.)
  // Manual "open" still defers to actual business hours
  const isOpen = manualStatus !== "closed" && isWithinBusinessHours();

  return NextResponse.json({
    status:  isOpen ? "open" : "closed",
    message: content["business_status_message"] ?? "",
  }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
  });
}
