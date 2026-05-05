import type { BookingInput } from "@/lib/validators";

export async function sendTelegramNotification(data: BookingInput): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chatId = process.env.TELEGRAM_CHAT_ID!;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const message = [
    "🌸 *New Booking — MKIS Nails Saloon* 🌸",
    "",
    `👤 *Name:* ${data.name}`,
    `📞 *Phone:* ${data.phone}`,
    `📧 *Email:* ${data.email}`,
    "",
    `💅 *Service:* ${data.service}`,
    `📅 *Date:* ${data.date}`,
    `⏰ *Time Slot:* ${data.timeSlot}`,
    `💁 *Technician:* ${data.technician || "Any Available"}`,
    "",
    `📝 *Notes:* ${data.notes || "None"}`,
    "",
    `_Received at ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}_`,
  ].join("\n");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Telegram API error: ${JSON.stringify(error)}`);
  }
}
