import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface LiveNotification {
  id:      string;
  type:    "booking" | "trending" | "milestone" | "design";
  message: string;
  ts:      number;
}

export const revalidate = 60;

export async function GET() {
  const out: LiveNotification[] = [];
  try {
    const supabase = createAdminClient();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Today's bookings count
    const { count: todayCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("submitted_at", startOfDay.toISOString());

    if (todayCount && todayCount > 0) {
      out.push({
        id: "today",
        type: "booking",
        message: `${todayCount} booking${todayCount === 1 ? "" : "s"} today so far`,
        ts: Date.now(),
      });
    }

    // Latest gallery design (added in last 14 days)
    const fourteenAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("gallery")
      .select("name, added_at")
      .eq("active", true)
      .gte("added_at", fourteenAgo)
      .order("added_at", { ascending: false })
      .limit(1);
    if (recent && recent.length > 0) {
      out.push({
        id: "design",
        type: "design",
        message: `New design: "${recent[0].name}"`,
        ts: new Date(recent[0].added_at).getTime(),
      });
    }
  } catch { /* return empty */ }

  return NextResponse.json(out, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
  });
}
