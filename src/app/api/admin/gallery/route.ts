import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAdminEvent } from "@/lib/adminLog";

/** GET — admins see everything; team users see only their own items. */
export async function GET() {
  try {
    const session = await requireUser();
    const supabase = await createClient();
    let q = supabase.from("gallery").select("*").order("display_order", { ascending: true });
    if (session.role !== "admin") q = q.eq("created_by", session.userId);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

/** POST — anyone signed in can add a design. Team uploads start inactive
 *  and are tagged with created_by so only the owner (or an admin) can edit. */
export async function POST(req: NextRequest) {
  try {
    const session = await requireUser();
    const supabase = await createClient();
    const body = await req.json();
    const isAdmin = session.role === "admin";
    const { data, error } = await supabase
      .from("gallery")
      .insert({
        name:          body.name ?? "",
        category:      body.category ?? "",
        image_url:     body.image_url ?? "",
        display_order: body.display_order ?? 0,
        active:        isAdmin ? (body.active ?? true) : false, // team uploads await admin approval
        created_by:    session.userId,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logAdminEvent({ session, req, action: "gallery.create", targetTable: "gallery", targetId: data?.id, metadata: { name: data?.name, by_role: session.role } });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
