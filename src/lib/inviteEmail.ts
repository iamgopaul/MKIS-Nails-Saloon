import nodemailer from "nodemailer";

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

  const transporter = createTransport();
  await transporter.sendMail({
    from:    `MKIS Nails Saloon <${process.env.SMTP_USER}>`,
    to:      opts.to,
    subject: "You're invited to join MKIS Nails Saloon",
    html:    buildHtml(opts.inviteUrl),
  });
}

function buildHtml(inviteUrl: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF0EB;font-family:Arial,Helvetica,sans-serif;color:#2C1A14;">
  <div style="max-width:560px;margin:40px auto;padding:0 16px;">
    <div style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(233,30,140,0.08);">
      <div style="background:linear-gradient(135deg,#E07898,#C9956B);padding:40px 40px 32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">You&apos;re Invited</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">MKIS Nails Saloon</p>
      </div>
      <div style="padding:36px 40px;">
        <p style="font-size:16px;margin:0 0 16px;line-height:1.6;">
          Welcome to the MKIS Nails Saloon team!
        </p>
        <p style="font-size:14px;color:#7A5544;margin:0 0 28px;line-height:1.6;">
          Click the button below to set your password and finish setting up your account. After that you&apos;ll be able to manage your profile and view your appointments.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#E07898,#C9956B);color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;border-radius:999px;">
            Activate My Account
          </a>
        </div>
        <p style="font-size:12px;color:#7A5544;margin:0 0 8px;">
          Or copy this link into your browser:
        </p>
        <p style="font-size:11px;color:#C9956B;word-break:break-all;margin:0 0 24px;">
          <a href="${inviteUrl}" style="color:#C9956B;text-decoration:none;">${inviteUrl}</a>
        </p>
        <p style="font-size:12px;color:#7A5544;margin:0;line-height:1.6;">
          If you weren&apos;t expecting this invite, you can safely ignore this email.
        </p>
      </div>
      <div style="background:#F0DDD3;padding:20px 40px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#7A5544;">&copy; ${new Date().getFullYear()} MKIS Nails Saloon</p>
      </div>
    </div>
  </div>
</body>
</html>`.trim();
}
