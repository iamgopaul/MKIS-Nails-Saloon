import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 60;

/** Public: returns approved reviews, newest first */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("reviews")
      .select("id, client_name, review, rating, approved_at")
      .eq("status", "approved")
      .order("approved_at", { ascending: false })
      .limit(50);
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([]);
  }
}

/** Public: submit a new review (lands in 'pending' for admin to approve) */
export async function POST(req: NextRequest) {
  let body: { client_name?: string; review?: string; rating?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const name   = (body.client_name ?? "").trim();
  const text   = (body.review ?? "").trim();
  const rating = Number(body.rating ?? 0);

  if (name.length < 2)            return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (text.length < 10)           return NextResponse.json({ error: "Review must be at least 10 characters." }, { status: 400 });
  if (text.length > 1000)         return NextResponse.json({ error: "Review is too long (max 1000 chars)." }, { status: 400 });
  if (rating < 1 || rating > 5)   return NextResponse.json({ error: "Please give a rating between 1 and 5." }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("reviews").insert({
    client_name: name,
    review:      text,
    rating,
    status:      "pending",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
