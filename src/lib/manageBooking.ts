import { createAdminClient } from "@/lib/supabase/admin";

export interface ManagedBooking {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  service_id: string;
  service_name: string;
  technician_id: string | null;
  technician_name: string | null;
  preferred_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  manage_token_expires_at: string | null;
  cancelled_at: string | null;
}

/**
 * Look up a booking by its manage token. Returns null if the token is
 * unknown OR expired. Uses a service-role client so RLS doesn't matter.
 *
 * The token itself is the only proof of ownership — we don't leak whether
 * "expired" vs "not found" so casual probing yields the same answer.
 */
export async function findBookingByToken(token: string): Promise<ManagedBooking | null> {
  if (!token || typeof token !== "string" || token.length < 20) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, client_name, client_phone, client_email, service_id, service_name, technician_id, technician_name, preferred_date, start_time, end_time, status, notes, manage_token_expires_at, cancelled_at")
    .eq("manage_token", token)
    .maybeSingle();

  if (error || !data) return null;

  if (data.manage_token_expires_at && new Date(data.manage_token_expires_at) < new Date()) {
    return null;
  }
  return data as ManagedBooking;
}
