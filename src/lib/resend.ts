import nodemailer from "nodemailer";
import { buildEmail } from "@/lib/emailLayout";

export interface NotificationData {
  name:       string;
  phone:      string;
  email:      string;
  service:    string;
  date:       string;
  startTime:  string;
  endTime:    string;
  technician: string;
  notes:      string;
}

function createTransport() {
  return nodemailer.createTransport({
    host:   "smtp.gmail.com",
    port:   587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });
}

export async function sendConfirmationEmail(data: NotificationData): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[Email] SMTP not configured — skipping confirmation email");
    return;
  }

  const bodyHtml = `
    <p style="font-size:16px;margin:0 0 16px;line-height:1.6;color:#F5EDE6;">
      Hi <strong style="color:#F5EDE6;">${data.name}</strong>,
    </p>
    <p style="font-size:14px;color:#9A7060;margin:0 0 24px;line-height:1.7;">
      Thank you for booking with MKIS Nail Saloon. We have received your request and will confirm your appointment shortly.
    </p>

    <div style="background:#111111;border:1px solid rgba(224,120,152,0.15);border-radius:14px;padding:20px 24px;margin-bottom:24px;">
      <h2 style="margin:0 0 14px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#E07898;font-weight:700;">
        Booking Summary
      </h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#F5EDE6;">
        <tr>
          <td style="padding:8px 0;color:#9A7060;width:40%;">Service</td>
          <td style="padding:8px 0;font-weight:600;color:#F5EDE6;">${data.service}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-top:1px solid rgba(224,120,152,0.1);color:#9A7060;">Date</td>
          <td style="padding:8px 0;border-top:1px solid rgba(224,120,152,0.1);font-weight:600;color:#F5EDE6;">${data.date}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-top:1px solid rgba(224,120,152,0.1);color:#9A7060;">Time</td>
          <td style="padding:8px 0;border-top:1px solid rgba(224,120,152,0.1);font-weight:600;color:#F5EDE6;">${data.startTime} – ${data.endTime}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-top:1px solid rgba(224,120,152,0.1);color:#9A7060;">Technician</td>
          <td style="padding:8px 0;border-top:1px solid rgba(224,120,152,0.1);font-weight:600;color:#F5EDE6;">${data.technician}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-top:1px solid rgba(224,120,152,0.1);color:#9A7060;">Phone</td>
          <td style="padding:8px 0;border-top:1px solid rgba(224,120,152,0.1);font-weight:600;color:#F5EDE6;">${data.phone}</td>
        </tr>
        ${data.notes ? `
        <tr>
          <td style="padding:8px 0;border-top:1px solid rgba(224,120,152,0.1);color:#9A7060;vertical-align:top;">Notes</td>
          <td style="padding:8px 0;border-top:1px solid rgba(224,120,152,0.1);color:#F5EDE6;">${data.notes}</td>
        </tr>` : ""}
      </table>
    </div>

    <p style="font-size:13px;color:#9A7060;margin:0 0 6px;">Need to reschedule or have questions?</p>
    <p style="font-size:13px;margin:0;line-height:1.7;color:#F5EDE6;">
      Call us at <a href="tel:+17542302480" style="color:#E07898;text-decoration:none;font-weight:600;">+1 (754) 230-2480</a><br>
      Email <a href="mailto:mkisservicesllc@gmail.com" style="color:#E07898;text-decoration:none;font-weight:600;">mkisservicesllc@gmail.com</a>
    </p>
  `;

  const { html, attachments } = await buildEmail({
    headline:  "Booking Received",
    preheader: `Your appointment for ${data.service} on ${data.date} is confirmed pending review.`,
    bodyHtml,
  });

  const transporter = createTransport();
  await transporter.sendMail({
    from:    `MKIS Nail Saloon <${process.env.SMTP_USER}>`,
    to:      data.email,
    subject: "Your Booking Request — MKIS Nail Saloon",
    html,
    attachments,
  });
}
