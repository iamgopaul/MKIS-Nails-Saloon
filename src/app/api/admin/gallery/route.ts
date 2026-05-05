import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getAllGallery, createGalleryItem } from "@/lib/airtableAdmin";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await getAllGallery();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const item = await createGalleryItem({ ...data, addedAt: new Date().toISOString() });
  return NextResponse.json(item, { status: 201 });
}
