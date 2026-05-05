import { createClient } from "@/lib/supabase/server";

export interface AuthSession {
  userId: string;
  email: string | null;
  role: "admin" | "team";
  fullName: string;
}

export class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Returns the current session + role, or null if not signed in. */
export async function getSession(): Promise<AuthSession | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  return {
    userId:   user.id,
    email:    user.email ?? null,
    role:     (profile?.role as "admin" | "team") ?? "team",
    fullName: profile?.full_name ?? "",
  };
}

export async function requireAdmin(): Promise<AuthSession> {
  const session = await getSession();
  if (!session)                   throw new AuthError("Not authenticated", 401);
  if (session.role !== "admin")   throw new AuthError("Admin access required", 403);
  return session;
}

export async function requireUser(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) throw new AuthError("Not authenticated", 401);
  return session;
}
