import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const supabase = await createClient();

    const fields: Record<string, unknown> = {};
    for (const k of ["name", "role", "bio", "photo_url", "display_order", "active", "user_id"]) {
      if (k in body) fields[k] = body[k];
    }
    const { error } = await supabase.from("team").update(fields).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminSession = await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();
    const adminDb  = createAdminClient();

    // 1) Look up the linked auth user before deleting
    const { data: row } = await supabase
      .from("team")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();

    // 2) Delete the team row
    const { error: teamErr } = await supabase.from("team").delete().eq("id", id);
    if (teamErr) return NextResponse.json({ error: teamErr.message }, { status: 500 });

    // 3) If linked to an auth user, delete the user (and their profile via cascade)
    //    — but never delete the currently signed-in admin
    if (row?.user_id && row.user_id !== adminSession.userId) {
      const { error: userErr } = await adminDb.auth.admin.deleteUser(row.user_id);
      if (userErr) {
        console.error("[delete-team] auth.deleteUser failed:", userErr);
        // Team row already deleted — still return success so UI updates
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
