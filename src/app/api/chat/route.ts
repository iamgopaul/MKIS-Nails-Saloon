import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  dailySlots,
  isWorkingDay,
  slotsForBooking,
  timeToMinutes,
  endTimeFor,
} from "@/lib/booking";
import { sendConfirmationEmail } from "@/lib/resend";
import { sendTelegramNotification } from "@/lib/telegram";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RX = /^\+?[\d\s\-()\\.]{7,20}$/;
const UUID_RX  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const runtime  = "nodejs";
export const maxDuration = 30;

interface ChatMessage { role: "user" | "assistant"; content: string; }

// ─── Live context (cached 5 min) ─────────────────────────────────────────────
let contextCache: { text: string; expires: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

async function buildContext(): Promise<string> {
  if (contextCache && contextCache.expires > Date.now()) return contextCache.text;
  const supabase = createAdminClient();

  const [{ data: services }, { data: team }, { data: content }] = await Promise.all([
    supabase.from("services").select("id,name,description,duration_minutes,price").eq("active", true).order("display_order"),
    supabase.from("team").select("id,name,role").eq("active", true).order("display_order"),
    supabase.from("site_content").select("key,value"),
  ]);
  const c: Record<string, string> = {};
  (content ?? []).forEach((r) => { c[r.key] = r.value ?? ""; });

  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const lines = [
    `Today is ${todayStr}.`,
    "",
    "=== ABOUT ===",
    "MKIS Nail Saloon — premium nail care and custom nail art in Florida, USA.",
    c.about_subtitle || "",
    "",
    "=== CONTACT ===",
    `Phone: ${c.contact_phone || "+1 (754) 230-2480"}`,
    `Email: ${c.contact_email || "mkisservicesllc@gmail.com"} (the only official email)`,
    "",
    "=== HOURS ===",
    c.hours_weekday  || "Mon–Fri: 9 AM – 7 PM",
    c.hours_saturday || "Saturday: 9 AM – 6 PM",
    c.hours_sunday   || "Sunday: Closed",
    "",
    "=== SERVICES (use these exact IDs when booking) ===",
    ...(services ?? []).map((s) => `- id="${s.id}" "${s.name}" — ${s.duration_minutes} min — ${s.price} — ${s.description}`),
    "",
    "=== TEAM (use these exact IDs when booking) ===",
    ...(team ?? []).map((t) => `- id="${t.id}" "${t.name}" — ${t.role}`),
  ];
  const text = lines.join("\n");
  contextCache = { text, expires: Date.now() + CACHE_MS };
  return text;
}

// ─── Tool definitions ────────────────────────────────────────────────────────
const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "check_availability",
      description: "Check available 30-minute time slots for a given date, service, and (optional) technician. Returns a list of slot start times in HH:MM 24-hour format.",
      parameters: {
        type: "object",
        properties: {
          date:          { type: "string", description: "ISO date YYYY-MM-DD" },
          service_id:    { type: "string", description: "UUID of the service from the services list" },
          technician_id: { type: "string", description: "UUID of the technician (optional, omit for any)" },
        },
        required: ["date", "service_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_booking",
      description: "Create a new booking. Always confirm all details with the client first by repeating them back, and only call this once they say yes.",
      parameters: {
        type: "object",
        properties: {
          name:          { type: "string" },
          phone:         { type: "string" },
          email:         { type: "string" },
          service_id:    { type: "string", description: "UUID of the chosen service" },
          date:          { type: "string", description: "YYYY-MM-DD" },
          start_time:    { type: "string", description: "HH:MM (24-hour)" },
          technician_id: { type: "string", description: "UUID — omit for any technician" },
          notes:         { type: "string" },
        },
        required: ["name", "phone", "email", "service_id", "date", "start_time"],
      },
    },
  },
];

// ─── Tool implementations ────────────────────────────────────────────────────

async function tool_check_availability(args: { date: string; service_id: string; technician_id?: string }) {
  if (!isWorkingDay(args.date)) return { slots: [], reason: "Salon is closed on this day." };
  const supabase = createAdminClient();

  const { data: bufferRow } = await supabase.from("site_content").select("value").eq("key", "booking_buffer_minutes").maybeSingle();
  const buffer = Number(bufferRow?.value ?? 0);

  const { data: svc } = await supabase.from("services").select("duration_minutes,active").eq("id", args.service_id).maybeSingle();
  if (!svc || !svc.active) return { slots: [], error: "Service not found." };

  let q = supabase
    .from("bookings")
    .select("start_time,end_time")
    .eq("preferred_date", args.date)
    .neq("status", "Cancelled");
  if (args.technician_id) q = q.eq("technician_id", args.technician_id);
  const { data: bookings } = await q;

  const taken = new Set<string>();
  (bookings ?? []).forEach((b) => {
    if (!b.start_time || !b.end_time) return;
    const startMin = timeToMinutes(String(b.start_time).slice(0, 5));
    const endMin   = timeToMinutes(String(b.end_time).slice(0, 5)) + buffer;
    for (let m = startMin; m < endMin; m += 30) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      taken.add(`${hh}:${mm}`);
    }
  });

  const all = dailySlots(args.date);
  const open = all.filter((slot) => {
    const required = slotsForBooking(slot, svc.duration_minutes, buffer);
    if (!all.includes(required[required.length - 1])) return false;
    return required.every((s) => !taken.has(s));
  });

  return { date: args.date, slots: open, count: open.length };
}

async function tool_create_booking(args: {
  name: string; phone: string; email: string;
  service_id: string; date: string; start_time: string;
  technician_id?: string; notes?: string;
}) {
  // Strict validation — never trust the LLM
  if (!args.name?.trim() || args.name.trim().length < 2)             return { error: "Name is required." };
  if (args.name.length > 100)                                         return { error: "Name is too long." };
  if (!EMAIL_RX.test(args.email ?? ""))                               return { error: "Invalid email." };
  if (!PHONE_RX.test(args.phone ?? ""))                               return { error: "Invalid phone number." };
  if (!UUID_RX.test(args.service_id ?? ""))                           return { error: "Invalid service." };
  if (args.technician_id && !UUID_RX.test(args.technician_id))        return { error: "Invalid technician." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date ?? ""))                   return { error: "Invalid date format." };
  if (!/^\d{2}:\d{2}$/.test(args.start_time ?? ""))                   return { error: "Invalid time format." };
  if (!isWorkingDay(args.date))                                       return { error: "Salon is closed on this day." };
  if ((args.notes ?? "").length > 500)                                return { error: "Notes too long." };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (new Date(args.date + "T00:00:00") < today)                      return { error: "Date is in the past." };

  // Slot must be a real working slot (not 02:13 etc.) AND fit inside business hours
  if (!dailySlots(args.date).includes(args.start_time))               return { error: "Selected time is outside business hours." };

  const supabase = createAdminClient();

  const { data: svc } = await supabase
    .from("services").select("id,name,duration_minutes,active").eq("id", args.service_id).maybeSingle();
  if (!svc || !svc.active) return { error: "Service not found." };

  const { data: bufferRow } = await supabase.from("site_content").select("value").eq("key", "booking_buffer_minutes").maybeSingle();
  const buffer = Number(bufferRow?.value ?? 0);
  const requiredSlots = slotsForBooking(args.start_time, svc.duration_minutes, buffer);

  // Resolve / verify technician
  let techId   = args.technician_id || "";
  let techName = "Any Available";
  async function isFree(id: string): Promise<boolean> {
    const { data } = await supabase
      .from("bookings").select("start_time,end_time")
      .eq("preferred_date", args.date).eq("technician_id", id).neq("status", "Cancelled");
    const taken = new Set<string>();
    (data ?? []).forEach((b) => {
      if (!b.start_time || !b.end_time) return;
      const startMin = timeToMinutes(String(b.start_time).slice(0, 5));
      const endMin   = timeToMinutes(String(b.end_time).slice(0, 5)) + buffer;
      for (let m = startMin; m < endMin; m += 30) {
        taken.add(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
      }
    });
    return requiredSlots.every((s) => !taken.has(s));
  }

  if (techId) {
    const { data: t } = await supabase.from("team").select("id,name,active").eq("id", techId).maybeSingle();
    if (!t || !t.active)        return { error: "Technician unavailable." };
    if (!(await isFree(t.id)))  return { error: "That slot is no longer available for the chosen technician." };
    techName = t.name;
  } else {
    const { data: team } = await supabase.from("team").select("id,name").eq("active", true);
    let assigned: { id: string; name: string } | null = null;
    for (const t of team ?? []) { if (await isFree(t.id)) { assigned = t; break; } }
    if (!assigned) return { error: "No technicians available for this slot." };
    techId   = assigned.id;
    techName = assigned.name;
  }

  const endTime = endTimeFor(args.start_time, svc.duration_minutes);
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      client_name:     args.name.trim(),
      client_phone:    args.phone,
      client_email:    args.email,
      service_id:      svc.id,
      service_name:    svc.name,
      technician_id:   techId,
      technician_name: techName,
      preferred_date:  args.date,
      start_time:      args.start_time,
      end_time:        endTime,
      notes:           args.notes ?? "",
      status:          "Pending",
    })
    .select()
    .single();
  if (error || !booking) return { error: "Failed to save booking." };

  // Best-effort notifications
  const notify = {
    name: args.name, phone: args.phone, email: args.email,
    service: svc.name, date: args.date,
    startTime: args.start_time, endTime,
    technician: techName, notes: args.notes ?? "",
  };
  Promise.allSettled([sendConfirmationEmail(notify), sendTelegramNotification(notify)]).catch(() => {});

  return {
    success: true,
    booking_id:  booking.id,
    confirmation: `Booked ${svc.name} with ${techName} on ${args.date} from ${args.start_time} to ${endTime}.`,
  };
}

function makeToolHandlers(ip: string): Record<string, (args: Record<string, unknown>) => Promise<unknown>> {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    check_availability: (args: any) => tool_check_availability(args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create_booking:     (args: any) => {
      // Cap real bookings via chat at 3 per IP per hour to prevent abuse
      const rl = rateLimit(`chat-book:${ip}`, { max: 3, windowMs: 60 * 60_000 });
      if (!rl.allowed) {
        return Promise.resolve({ error: "Too many bookings from this device. Please use the booking form on the page." });
      }
      return tool_create_booking(args);
    },
  };
}

// ─── System prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = (context: string) => `
You are Bella, the friendly chat assistant for MKIS Nail Saloon. You help clients with questions and can also book appointments for them.

STRICT RULES:
1. Answer ONLY using the information in the CONTEXT below. Do NOT invent services, prices, team members, hours, or policies.
2. If a question can't be answered from the context, reply: "I don't have that information — please call us at +1 (754) 230-2480 or email mkisservicesllc@gmail.com and we'll be happy to help."
3. Keep replies short and conversational (1–4 sentences usually). No long lists unless asked.
4. Be warm, professional, and on-brand. Use friendly nail / beauty language sparingly.
5. Never share or ask for passwords, payment details, or sensitive info.
6. You don't know the current time of day — refer to the listed hours instead of guessing whether they're open right now. (Today's date IS provided above.)

BOOKING FLOW:
- When a client wants to book, collect: full name, phone, email, service, optional preferred technician, preferred date, and time.
- Use exact service and technician UUIDs from the CONTEXT above when calling tools.
- Use the check_availability tool to verify open slots BEFORE asking the client to commit to a time.
- Always summarize the full booking and ask "Shall I book this for you?" before calling create_booking.
- After create_booking succeeds, your reply MUST be EXACTLY this format (replacing FIRST_NAME with the client's first name only):
  "Thank you for choosing us, FIRST_NAME! Hope you like our services and feel free to leave us a review :) — A confirmation email is on its way."
- Do not add extra sentences or change the wording above.
- Reject bookings outside business hours and on past dates.

=== CONTEXT ===
${context}
=== END CONTEXT ===
`.trim();

// ─── Main handler with tool execution loop ───────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GroqMsg = any;

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Chatbot not configured" }, { status: 503 });
  }

  // Rate limit chat traffic — 30 messages per IP per 5 minutes
  const ip = getClientIp(req);
  const rl = rateLimit(`chat:${ip}`, { max: 30, windowMs: 5 * 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many messages, please slow down." }, { status: 429 });
  }

  let body: { messages: ChatMessage[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const userMsgs = (body.messages ?? []).slice(-12);
  if (userMsgs.length === 0) return NextResponse.json({ error: "No messages" }, { status: 400 });
  if (userMsgs.some((m) => typeof m.content !== "string" || m.content.length > 2000)) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const context = await buildContext();
  const client  = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const toolHandlers = makeToolHandlers(ip);

  const conversation: GroqMsg[] = [
    { role: "system", content: SYSTEM_PROMPT(context) },
    ...userMsgs.map((m) => ({ role: m.role, content: m.content })),
  ];

  // Loop up to 4 tool-call rounds before giving up
  for (let i = 0; i < 4; i++) {
    let completion;
    try {
      completion = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.4,
        max_tokens: 700,
        messages: conversation,
        tools: TOOLS,
        tool_choice: "auto",
      });
    } catch (err) {
      console.error("[chat] Groq error:", err);
      return NextResponse.json({ error: "Sorry, the assistant is unavailable right now." }, { status: 500 });
    }

    const reply = completion.choices[0]?.message;
    if (!reply) return NextResponse.json({ reply: "Sorry, I couldn't generate a reply." });

    conversation.push(reply);

    const toolCalls = reply.tool_calls ?? [];
    if (toolCalls.length === 0) {
      return NextResponse.json({ reply: reply.content ?? "Sorry, I couldn't generate a reply." });
    }

    // Execute each tool call and append the result
    for (const call of toolCalls) {
      const fnName = call.function?.name ?? "";
      const handler = toolHandlers[fnName];
      let result: unknown;
      try {
        const parsed = JSON.parse(call.function?.arguments ?? "{}");
        result = handler ? await handler(parsed) : { error: `Unknown tool: ${fnName}` };
      } catch (err) {
        result = { error: err instanceof Error ? err.message : "Tool execution failed" };
      }
      conversation.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return NextResponse.json({ reply: "Sorry, I couldn't complete that request — please try again or call us directly." });
}
