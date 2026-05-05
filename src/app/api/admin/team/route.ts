import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAdminEvent } from "@/lib/adminLog";

export async function GET() {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("team")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const supabase = await createClient();
    const body = await req.json();
    const { data, error } = await supabase
      .from("team")
      .insert({
        name:          body.name ?? "",
        role:          body.role ?? "",
        bio:           body.bio ?? "",
        photo_url:     body.photo_url ?? "",
        display_order: body.display_order ?? 0,
        active:        body.active ?? true,
        user_id:       body.user_id ?? null,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logAdminEvent({ session, req, action: "team.create", targetTable: "team", targetId: data?.id, metadata: { name: data?.name } });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
