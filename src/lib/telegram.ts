import type { NotificationData } from "@/lib/email";

export async function sendTelegramNotification(data: NotificationData): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.warn("[Telegram] not configured — skipping notification");
    return;
  }
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  const message = [
    "🌸 *New Booking — MKIS Nails* 🌸",
    "",
    `👤 *Name:* ${data.name}`,
    `📞 *Phone:* ${data.phone}`,
    `📧 *Email:* ${data.email}`,
    "",
    `💅 *Service:* ${data.service}`,
    `📅 *Date:* ${data.date}`,
    `⏰ *Time:* ${data.startTime} – ${data.endTime}`,
    `💁 *Technician:* ${data.technician}`,
    "",
    `📝 *Notes:* ${data.notes || "None"}`,
    "",
    `_Received at ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}_`,
  ].join("\n");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id:    process.env.TELEGRAM_CHAT_ID,
      text:       message,
      parse_mode: "Markdown",
    }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Telegram API error: ${JSON.stringify(err)}`);
  }
}

export async function sendTelegramAlert(text: string): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id:    process.env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: "Markdown",
    }),
  });
}
