import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAdminEvent } from "@/lib/adminLog";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const supabase = await createClient();

    const fields: Record<string, unknown> = {};
    for (const k of ["name", "category", "image_url", "display_order", "active"]) {
      if (k in body) fields[k] = body[k];
    }
    const { error } = await supabase.from("gallery").update(fields).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logAdminEvent({ session, req, action: "gallery.update", targetTable: "gallery", targetId: id, metadata: { fields } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();
    const { error } = await supabase.from("gallery").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logAdminEvent({ session, req, action: "gallery.delete", targetTable: "gallery", targetId: id });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
