import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 60;

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("services")
      .select("id, name, duration_minutes, price")
      .eq("active", true)
      .order("display_order", { ascending: true });
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
