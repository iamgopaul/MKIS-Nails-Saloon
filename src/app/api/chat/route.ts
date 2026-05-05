import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime  = "nodejs";
export const maxDuration = 30;

interface ChatMessage { role: "user" | "assistant"; content: string; }

// Cache the context for 5 min — services/team don't change often
let contextCache: { text: string; expires: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

async function buildContext(): Promise<string> {
  if (contextCache && contextCache.expires > Date.now()) return contextCache.text;

  const supabase = createAdminClient();

  const [{ data: services }, { data: team }, { data: content }] = await Promise.all([
    supabase.from("services").select("name,description,duration_minutes,price").eq("active", true).order("display_order"),
    supabase.from("team").select("name,role,bio").eq("active", true).order("display_order"),
    supabase.from("site_content").select("key,value"),
  ]);

  const contentMap: Record<string, string> = {};
  (content ?? []).forEach((row) => { contentMap[row.key] = row.value ?? ""; });

  const lines: string[] = [];
  lines.push("=== ABOUT MKIS NAIL SALOON ===");
  lines.push("Premium nail care and custom nail art in Florida, USA.");
  if (contentMap.about_subtitle) lines.push(contentMap.about_subtitle);
  lines.push("");

  lines.push("=== CONTACT ===");
  lines.push(`Phone: ${contentMap.contact_phone || "+1 (754) 230-2480"}`);
  lines.push(`Email: ${contentMap.contact_email || "mkisservicesllc@gmail.com"} (the only official email)`);
  if (contentMap.contact_address) lines.push(`Address: ${contentMap.contact_address}`);
  lines.push("");

  lines.push("=== HOURS ===");
  lines.push(contentMap.hours_weekday  || "Mon–Fri: 9 AM – 7 PM");
  lines.push(contentMap.hours_saturday || "Saturday: 9 AM – 6 PM");
  lines.push(contentMap.hours_sunday   || "Sunday: Closed");
  lines.push("");

  lines.push("=== SERVICES ===");
  (services ?? []).forEach((s) => {
    lines.push(`- ${s.name} (${s.duration_minutes} min, ${s.price}): ${s.description}`);
  });
  lines.push("");

  lines.push("=== TEAM ===");
  (team ?? []).forEach((t) => {
    lines.push(`- ${t.name} — ${t.role}${t.bio ? `: ${t.bio}` : ""}`);
  });
  lines.push("");

  lines.push("=== BOOKING ===");
  lines.push("Bookings are made online via the website's booking form. Clients pick a service, technician (or 'no preference'), date, and a 30-minute time slot. The system shows real-time availability based on existing bookings.");

  const text = lines.join("\n");
  contextCache = { text, expires: Date.now() + CACHE_MS };
  return text;
}

const SYSTEM_PROMPT_TEMPLATE = (context: string) => `
You are Bella, the friendly chat assistant for MKIS Nail Saloon. You help potential and existing clients with questions about the salon. If asked your name, say "I'm Bella, the MKIS Nail Saloon assistant."

STRICT RULES:
1. Answer ONLY using the information in the CONTEXT below. Do NOT invent services, prices, team members, hours, or policies.
2. If a question can't be answered from the context, reply: "I don't have that information — please call us at +1 (754) 230-2480 or email mkisservicesllc@gmail.com and we'll be happy to help."
3. Keep replies short and conversational (1–3 sentences usually). No long lists unless explicitly asked.
4. Be warm, professional, and on-brand. Use friendly nail / beauty language sparingly (no excessive emojis).
5. Never share or ask for passwords, payment details, or sensitive info.
6. For booking requests, direct the client to the booking form on the website ("scroll to the Book Appointment section" or "use the Book Now button").
7. You don't know the current time or which day it is — refer to the listed hours instead of guessing whether they're open right now.

=== CONTEXT ===
${context}
=== END CONTEXT ===
`.trim();

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Chatbot not configured" }, { status: 503 });
  }

  let body: { messages: ChatMessage[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const messages = (body.messages ?? []).slice(-10);  // keep last 10 turns
  if (messages.length === 0)         return NextResponse.json({ error: "No messages" }, { status: 400 });
  if (messages.some((m) => typeof m.content !== "string" || m.content.length > 2000)) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const context = await buildContext();
  const client  = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT_TEMPLATE(context) },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });
    const reply = completion.choices[0]?.message?.content ?? "Sorry, I couldn't generate a reply.";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[chat] Groq error:", err);
    return NextResponse.json({ error: "Sorry, the assistant is unavailable right now." }, { status: 500 });
  }
}
