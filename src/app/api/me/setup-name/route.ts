import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Updates the signed-in user's profile.full_name + team.name (if linked) */
export async function POST(req: NextRequest) {
  try {
    const session = await requireUser();
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const supabase = await createClient();
    await supabase.from("profiles").update({ full_name: name }).eq("id", session.userId);
    await supabase.from("team").update({ name }).eq("user_id", session.userId);

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
