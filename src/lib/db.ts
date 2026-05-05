/**
 * Server-side database access via Supabase.
 * Public reads use the server client (respects RLS).
 * Mutations from API routes verify the caller's role first.
 */

import { createClient } from "@/lib/supabase/server";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  user_id: string | null;
  name: string;
  role: string;
  bio: string;
  photo_url: string;
  display_order: number;
  active: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: string;
  icon: string;
  display_order: number;
  active: boolean;
}

export interface GalleryItem {
  id: string;
  name: string;
  category: string;
  image_url: string;
  display_order: number;
  active: boolean;
  added_at: string;
}

export interface BookingRow {
  id: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  service_id: string | null;
  service_name: string;
  technician_id: string | null;
  technician_name: string | null;
  preferred_date: string;
  start_time: string | null;
  end_time: string | null;
  time_slot: string | null;
  notes: string;
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
  submitted_at: string;
}

export type ContentMap = Record<string, string>;

// ─── Public reads ────────────────────────────────────────────────────────────

export async function getTeam(): Promise<TeamMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("team")
    .select("*")
    .eq("active", true)
    .order("display_order", { ascending: true });
  return data ?? [];
}

export async function getServices(): Promise<ServiceItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("active", true)
    .order("display_order", { ascending: true });
  return data ?? [];
}

export async function getGallery(): Promise<GalleryItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery")
    .select("*")
    .eq("active", true)
    .order("display_order", { ascending: true });
  return data ?? [];
}

export async function getContent(): Promise<ContentMap> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_content").select("key,value");
  const map: ContentMap = {};
  (data ?? []).forEach((row) => { map[row.key] = row.value ?? ""; });
  return map;
}

// ─── Trending services (last 7 days) ─────────────────────────────────────────

export interface TrendingService {
  name: string;
  count: number;
  percentage: number;
}

export async function getTrending(): Promise<TrendingService[]> {
  const supabase = await createClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("bookings")
    .select("service_name")
    .gte("submitted_at", sevenDaysAgo);

  if (!data || data.length === 0) return [];

  const counts: Record<string, number> = {};
  data.forEach((row) => {
    counts[row.service_name] = (counts[row.service_name] ?? 0) + 1;
  });

  const total = data.length;
  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
