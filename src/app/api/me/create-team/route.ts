import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Creates a public team listing linked to the signed-in user */
export async function POST(req: NextRequest) {
  try {
    const session = await requireUser();
    const supabase = await createClient();
    const { name, role } = await req.json();
    if (!name || !role) return NextResponse.json({ error: "Name and role required" }, { status: 400 });

    // Don't create a duplicate
    const { data: existing } = await supabase
      .from("team")
      .select("id")
      .eq("user_id", session.userId)
      .maybeSingle();
    if (existing) return NextResponse.json({ error: "Team listing already exists" }, { status: 409 });

    const { data, error } = await supabase
      .from("team")
      .insert({
        user_id:        session.userId,
        name,
        role,
        bio:            "",
        photo_url:      "",
        display_order:  1,
        active:         true,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
