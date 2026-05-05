import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramAlert } from "@/lib/telegram";

export type ChatEventKind =
  | "injection_blocked"
  | "rate_limited"
  | "tool_error"
  | "booking_created"
  | "booking_cancelled_chat"
  | "refusal";

/**
 * Hash IPs before storing — keeps the join key (so we can rate-limit and
 * spot patterns from one source) without persisting raw PII. Salt with
 * SUPABASE_SERVICE_ROLE_KEY so the hash can't be reversed by anyone who
 * only ends up with a DB dump.
 */
export function hashIp(ip: string): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** Strip emails / phones / very long digit runs before persisting. */
function redact(text: string): string {
  return text
    .replace(/[^\s@<>()]+@[^\s@<>()]+\.[A-Za-z]{2,}/g, "[email]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]")
    .replace(/\b\d{9,}\b/g, "[digits]")
    .slice(0, 240);
}

export async function logChatEvent(
  kind: ChatEventKind,
  opts: { ip?: string; excerpt?: string; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("chat_events").insert({
      kind,
      ip_hash: opts.ip ? hashIp(opts.ip) : null,
      excerpt: opts.excerpt ? redact(opts.excerpt) : null,
      metadata: opts.metadata ?? null,
    });
  } catch (err) {
    console.error("[chatLog]", kind, err);
  }

  // Surface clear-abuse signals to staff immediately.
  if (kind === "injection_blocked") {
    sendTelegramAlert(
      [
        "⚠️ *Chat: prompt-injection blocked*",
        "",
        opts.excerpt ? "`" + redact(opts.excerpt).replace(/`/g, "'") + "`" : "(no excerpt)",
      ].join("\n"),
    ).catch(() => {});
  }
}
