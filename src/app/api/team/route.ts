import { NextResponse } from "next/server";
import { getTeam } from "@/lib/airtableAdmin";

const FALLBACK = [
  { id: "p1", name: "Kristin Harricharan", role: "Owner — Head Nail Technician" },
  { id: "p2", name: "Ashley Monroe",       role: "Senior Nail Technician" },
  { id: "p3", name: "Tiana Joseph",        role: "Nail Technician" },
  { id: "p4", name: "Renée Baptiste",      role: "Nail Artist" },
  { id: "p5", name: "Camille Torres",      role: "Nail Technician" },
  { id: "p6", name: "Jade Williams",       role: "Junior Nail Technician" },
];

export const revalidate = 300; // 5 min cache

export async function GET() {
  try {
    const team = await getTeam();
    const members = (team.length > 0 ? team : FALLBACK).map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
    }));
    return NextResponse.json(members);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
