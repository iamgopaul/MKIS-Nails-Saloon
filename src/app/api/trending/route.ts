import { NextResponse } from "next/server";
import { getTrendingServices } from "@/lib/airtableAdmin";

export const revalidate = 300; // cache for 5 minutes

export async function GET() {
  const trending = await getTrendingServices();
  return NextResponse.json(trending, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
