import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const session = await requireUser();
    const supabase = await createClient();

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Client converts HEIC → JPEG before upload, but accept HEIC/HEIF too as
    // a backup for any client path that uploads the raw iPhone file.
    const allowed = [
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "image/heic", "image/heif",
    ];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, GIF, and HEIC are allowed" },
        { status: 400 }
      );
    }

    // Each user uploads under their own folder for storage policy isolation
    const path = `${session.userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const { error } = await supabase.storage
      .from("mkis-images")
      .upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from("mkis-images").getPublicUrl(path);
    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
