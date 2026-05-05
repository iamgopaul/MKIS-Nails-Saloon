import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashIp } from "@/lib/chatLog";
import { getClientIp } from "@/lib/rateLimit";
import type { AuthSession } from "@/lib/auth";

/**
 * Audit-log a write performed by an admin. Caller passes the action
 * verb (e.g. "service.update"), the affected row, and any helpful metadata
 * — diff, before/after, etc. Failures are logged but don't break the request.
 */
export async function logAdminEvent(opts: {
  session: AuthSession;
  req?: NextRequest;
  action: string;
  targetTable?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("admin_events").insert({
      actor_id:     opts.session.userId,
      actor_email:  opts.session.email,
      action:       opts.action,
      target_table: opts.targetTable ?? null,
      target_id:    opts.targetId ?? null,
      metadata:     opts.metadata ?? null,
      ip_hash:      opts.req ? hashIp(getClientIp(opts.req)) : null,
    });
  } catch (err) {
    console.error("[adminLog]", opts.action, err);
  }
}
