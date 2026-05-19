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
    <p style="font-size:17px;margin:0 0 16px;line-height:1.6;color:#F0E4D8;font-weight:600;">
      Welcome to the team 💅
    </p>
    <p style="font-size:14px;color:#B8A89A;margin:0 0 32px;line-height:1.7;">
      You&apos;ve been invited to join MKIS Nails. Tap the button below to create your account — once activated, you&apos;ll be able to manage your profile, upload your photo, and view your scheduled appointments.
    </p>

    <!-- ── Activate button (bullet-proof email-safe table) ─────────────────── -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 8px;">
      <tr>
        <td align="center"
            style="border-radius:6px;background:linear-gradient(135deg,#D89AAE 0%,#C9956B 100%);box-shadow:0 8px 24px rgba(216,154,174,0.35);">
          <a href="${opts.inviteUrl}"
             style="display:inline-block;padding:16px 44px;color:#ffffff !important;font-weight:800;font-size:15px;text-decoration:none;letter-spacing:1.2px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;border-radius:6px;border:1px solid rgba(255,255,255,0.25);">
             ✨&nbsp; Activate Now &nbsp;→
          </a>
        </td>
      </tr>
    </table>
    <p style="text-align:center;font-size:11px;color:#B8A89A;margin:0 0 36px;">
      This link will expire in 7 days.
    </p>

    <!-- Divider -->
    <div style="height:1px;background:rgba(216,154,174,0.12);margin:0 0 20px;"></div>

    <p style="font-size:12px;color:#B8A89A;margin:0 0 6px;">Button not working? Paste this link in your browser:</p>
    <p style="font-size:11px;color:#D89AAE;word-break:break-all;margin:0 0 24px;line-height:1.5;">
      <a href="${opts.inviteUrl}" style="color:#D89AAE;text-decoration:none;">${opts.inviteUrl}</a>
    </p>

    <p style="font-size:12px;color:#B8A89A;margin:0;line-height:1.6;font-style:italic;">
      If you weren&apos;t expecting this invite, you can safely ignore this email — no account will be created.
    </p>
  `;

  const { html, attachments } = await buildEmail({
    headline:  "You're Invited",
    preheader: "Activate your MKIS Nails team account.",
    bodyHtml,
  });

  const transporter = createTransport();
  await transporter.sendMail({
    from:    `MKIS Nails <${process.env.SMTP_USER}>`,
    to:      opts.to,
    subject: "You're invited to join MKIS Nails",
    html,
    attachments,
  });
}
