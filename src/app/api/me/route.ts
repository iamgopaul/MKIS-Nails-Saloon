import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Returns the signed-in user's profile + linked team record (if any) */
export async function GET() {
  try {
    const session = await requireUser();
    const supabase = await createClient();
    const { data: team } = await supabase
      .from("team")
      .select("*")
      .eq("user_id", session.userId)
      .maybeSingle();
    return NextResponse.json({ session, team: team ?? null });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

/** Updates the signed-in user's profile name and (if linked) their team row */
export async function PUT(req: NextRequest) {
  try {
    const session = await requireUser();
    const supabase = await createClient();
    const body = await req.json();

    // Update profile name
    if (typeof body.name === "string" && body.name.trim()) {
      await supabase.from("profiles").update({ full_name: body.name }).eq("id", session.userId);
      // Also update auth metadata so it's reflected in the session
      await supabase.auth.updateUser({ data: { full_name: body.name } });
    }

    // Update team row fields the user owns (name, bio, photo_url, role)
    const teamUpdates: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) teamUpdates.name = body.name;
    if (typeof body.bio === "string")       teamUpdates.bio       = body.bio;
    if (typeof body.photo_url === "string") teamUpdates.photo_url = body.photo_url;
    if (typeof body.role === "string" && body.role.trim()) teamUpdates.role = body.role;

    if (Object.keys(teamUpdates).length > 0) {
      await supabase.from("team").update(teamUpdates).eq("user_id", session.userId);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
