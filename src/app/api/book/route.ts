import { NextRequest, NextResponse } from "next/server";
import { bookingSchema } from "@/lib/validators";
import { saveBooking } from "@/lib/airtable";
import { sendConfirmationEmail } from "@/lib/resend";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Airtable is the source of truth — hard failure
  let bookingId: string;
  try {
    bookingId = await saveBooking(data);
  } catch (err) {
    console.error("[Airtable] Failed to save booking:", err);
    return NextResponse.json(
      { error: "Failed to save your booking. Please try again." },
      { status: 500 }
    );
  }

  // Email + Telegram are best-effort — don't fail the request if they error
  const [emailResult, telegramResult] = await Promise.allSettled([
    sendConfirmationEmail(data),
    sendTelegramNotification(data),
  ]);

  if (emailResult.status === "rejected") {
    console.error("[Resend] Email failed:", emailResult.reason);
  }
  if (telegramResult.status === "rejected") {
    console.error("[Telegram] Notification failed:", telegramResult.reason);
  }

  return NextResponse.json({
    success: true,
    bookingId,
    message: "Booking received! Check your email for confirmation.",
  });
}
