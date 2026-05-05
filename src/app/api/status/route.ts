import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 60;

const HOURS: Record<number, { open: number; close: number } | null> = {
  0: null,
  1: { open: 9, close: 19 },
  2: { open: 9, close: 19 },
  3: { open: 9, close: 19 },
  4: { open: 9, close: 19 },
  5: { open: 9, close: 19 },
  6: { open: 9, close: 18 },
};

function isWithinBusinessHours(): boolean {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const todayHours = HOURS[now.getDay()];
  if (!todayHours) return false;
  const nowDec = now.getHours() + now.getMinutes() / 60;
  return nowDec >= todayHours.open && nowDec < todayHours.close;
}

export async function GET() {
  let manualStatus = "open";
  let message = "";
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_content")
      .select("key, value")
      .in("key", ["business_status", "business_status_message"]);
    (data ?? []).forEach((row) => {
      if (row.key === "business_status")         manualStatus = row.value ?? "open";
      if (row.key === "business_status_message") message      = row.value ?? "";
    });
  } catch { /* fall through with defaults */ }

  const isOpen = manualStatus !== "closed" && isWithinBusinessHours();

  return NextResponse.json(
    { status: isOpen ? "open" : "closed", message },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" } }
  );
}
