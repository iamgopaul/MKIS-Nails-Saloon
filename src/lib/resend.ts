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
  manageUrl?: string;
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

    ${data.manageUrl ? `
    <div style="text-align:center;margin:0 0 24px;">
      <a href="${data.manageUrl}" style="display:inline-block;background:#E07898;color:#0A0A0A;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:14px 28px;border-radius:999px;">
        Manage Booking
      </a>
      <p style="margin:10px 0 0;font-size:11px;color:#9A7060;">Cancel or reschedule from this private link.</p>
    </div>` : ""}

    <p style="font-size:13px;color:#9A7060;margin:0 0 6px;">Questions?</p>
    <p style="font-size:13px;margin:0;line-height:1.7;color:#F5EDE6;">
      Call us at <a href="tel:+17542365112" style="color:#E07898;text-decoration:none;font-weight:600;">+1 (754) 236-5112</a><br>
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

export async function sendCancellationEmail(data: NotificationData): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  const bodyHtml = `
    <p style="font-size:16px;margin:0 0 16px;line-height:1.6;color:#F5EDE6;">
      Hi <strong>${data.name}</strong>,
    </p>
    <p style="font-size:14px;color:#9A7060;margin:0 0 24px;line-height:1.7;">
      Your appointment for <strong style="color:#F5EDE6;">${data.service}</strong> on
      <strong style="color:#F5EDE6;">${data.date} at ${data.startTime}</strong> has been cancelled.
      We hope to see you again soon.
    </p>
    <p style="font-size:13px;color:#9A7060;margin:0;line-height:1.7;">
      To rebook, visit our site or call <a href="tel:+17542365112" style="color:#E07898;font-weight:600;text-decoration:none;">+1 (754) 236-5112</a>.
    </p>
  `;

  const { html, attachments } = await buildEmail({
    headline:  "Booking Cancelled",
    preheader: `Your appointment on ${data.date} has been cancelled.`,
    bodyHtml,
  });

  await createTransport().sendMail({
    from:    `MKIS Nail Saloon <${process.env.SMTP_USER}>`,
    to:      data.email,
    subject: "Your Booking Was Cancelled — MKIS Nail Saloon",
    html,
    attachments,
  });
}

export async function sendReminderEmail(data: NotificationData): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  const bodyHtml = `
    <p style="font-size:16px;margin:0 0 16px;line-height:1.6;color:#F5EDE6;">
      Hi <strong>${data.name}</strong>,
    </p>
    <p style="font-size:14px;color:#9A7060;margin:0 0 24px;line-height:1.7;">
      Just a friendly reminder — we'll see you tomorrow for your
      <strong style="color:#F5EDE6;">${data.service}</strong> appointment.
    </p>

    <div style="background:#111111;border:1px solid rgba(224,120,152,0.15);border-radius:14px;padding:20px 24px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#F5EDE6;">
        <tr><td style="padding:6px 0;color:#9A7060;">Date</td><td style="padding:6px 0;font-weight:600;">${data.date}</td></tr>
        <tr><td style="padding:6px 0;color:#9A7060;">Time</td><td style="padding:6px 0;font-weight:600;">${data.startTime} – ${data.endTime}</td></tr>
        <tr><td style="padding:6px 0;color:#9A7060;">Technician</td><td style="padding:6px 0;font-weight:600;">${data.technician}</td></tr>
      </table>
    </div>

    ${data.manageUrl ? `
    <div style="text-align:center;margin:0 0 20px;">
      <a href="${data.manageUrl}" style="display:inline-block;background:transparent;color:#E07898;text-decoration:none;font-weight:600;font-size:13px;padding:10px 18px;border-radius:999px;border:1px solid rgba(224,120,152,0.4);">
        Need to change it? Manage booking
      </a>
    </div>` : ""}

    <p style="font-size:13px;color:#9A7060;margin:0;line-height:1.7;">
      Questions? Call <a href="tel:+17542365112" style="color:#E07898;font-weight:600;text-decoration:none;">+1 (754) 236-5112</a>.
    </p>
  `;

  const { html, attachments } = await buildEmail({
    headline:  "See You Tomorrow",
    preheader: `Reminder: ${data.service} on ${data.date} at ${data.startTime}.`,
    bodyHtml,
  });

  await createTransport().sendMail({
    from:    `MKIS Nail Saloon <${process.env.SMTP_USER}>`,
    to:      data.email,
    subject: "Reminder: Your Appointment Tomorrow — MKIS Nail Saloon",
    html,
    attachments,
  });
}
