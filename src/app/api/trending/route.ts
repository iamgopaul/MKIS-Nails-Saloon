import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 300;

export async function GET() {
  try {
    const supabase = createAdminClient();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("bookings")
      .select("service_name")
      .gte("submitted_at", sevenDaysAgo);

    if (!data || data.length === 0) {
      return NextResponse.json([], {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
      });
    }

    const counts: Record<string, number> = {};
    data.forEach((row) => {
      counts[row.service_name] = (counts[row.service_name] ?? 0) + 1;
    });

    const total = data.length;
    const trending = Object.entries(counts)
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json(trending, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json([]);
  }
}
