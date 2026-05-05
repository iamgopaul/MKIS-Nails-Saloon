import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminEvent } from "@/lib/adminLog";

/**
 * Permission helper — admins can mutate any row; team users can mutate only
 * gallery items they created themselves. Returns the row's `active` flag too
 * so callers can decide whether a non-admin is allowed to flip it.
 */
async function canModify(id: string, session: { userId: string; role: "admin" | "team" }) {
  const admin = createAdminClient();
  const { data } = await admin.from("gallery").select("created_by").eq("id", id).maybeSingle();
  if (!data) return { allowed: false as const, found: false as const };
  if (session.role === "admin") return { allowed: true as const, found: true as const };
  return { allowed: data.created_by === session.userId, found: true as const };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;

    const perm = await canModify(id, session);
    if (!perm.found)   return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!perm.allowed) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

    const body = await req.json();
    const supabase = await createClient();

    const fields: Record<string, unknown> = {};
    for (const k of ["name", "category", "image_url", "display_order"]) {
      if (k in body) fields[k] = body[k];
    }
    // Only admins can flip the active/visibility flag.
    if ("active" in body && session.role === "admin") fields.active = body.active;

    const { error } = await supabase.from("gallery").update(fields).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logAdminEvent({ session, req, action: "gallery.update", targetTable: "gallery", targetId: id, metadata: { fields, by_role: session.role } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;

    const perm = await canModify(id, session);
    if (!perm.found)   return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!perm.allowed) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

    const supabase = await createClient();
    const { error } = await supabase.from("gallery").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logAdminEvent({ session, req, action: "gallery.delete", targetTable: "gallery", targetId: id, metadata: { by_role: session.role } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
