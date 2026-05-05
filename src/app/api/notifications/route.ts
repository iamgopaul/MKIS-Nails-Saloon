import { NextResponse } from "next/server";
import { getLiveNotifications } from "@/lib/airtableAdmin";

export const revalidate = 60; // cache for 60 seconds

export async function GET() {
  const notifications = await getLiveNotifications();
  return NextResponse.json(notifications, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
  });
}
