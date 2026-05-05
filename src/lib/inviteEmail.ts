import nodemailer from "nodemailer";
import { buildEmail } from "@/lib/emailLayout";

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

export async function sendInviteEmail(opts: { to: string; inviteUrl: string }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP not configured — set SMTP_USER and SMTP_PASS");
  }

  const bodyHtml = `
    <p style="font-size:16px;margin:0 0 16px;line-height:1.6;">
      Welcome to the team! 💅
    </p>
    <p style="font-size:14px;color:#7A5544;margin:0 0 28px;line-height:1.6;">
      You&apos;ve been invited to join MKIS Nails Saloon. Click the button below to set your password and finish setting up your account. Once activated, you&apos;ll be able to manage your profile, upload your photo, and view your scheduled appointments.
    </p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.inviteUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#E07898,#C9956B);color:#ffffff !important;font-weight:700;font-size:14px;text-decoration:none;border-radius:999px;letter-spacing:0.5px;">
        Activate My Account
      </a>
    </div>

    <p style="font-size:12px;color:#7A5544;margin:24px 0 4px;">Or copy this link into your browser:</p>
    <p style="font-size:11px;color:#C9956B;word-break:break-all;margin:0 0 24px;">
      <a href="${opts.inviteUrl}" style="color:#C9956B;text-decoration:none;">${opts.inviteUrl}</a>
    </p>

    <p style="font-size:12px;color:#7A5544;margin:0;line-height:1.6;font-style:italic;">
      If you weren&apos;t expecting this invite, you can safely ignore this email — no account will be created.
    </p>
  `;

  const { html, attachments } = await buildEmail({
    headline:  "You're Invited",
    preheader: "Activate your MKIS Nails Saloon team account.",
    bodyHtml,
  });

  const transporter = createTransport();
  await transporter.sendMail({
    from:    `MKIS Nails Saloon <${process.env.SMTP_USER}>`,
    to:      opts.to,
    subject: "You're invited to join MKIS Nails Saloon",
    html,
    attachments,
  });
}
