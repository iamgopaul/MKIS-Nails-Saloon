import { readFile } from "fs/promises";
import { join } from "path";

let cachedLogo: Buffer | null = null;
async function getLogoAttachment() {
  if (!cachedLogo) {
    cachedLogo = await readFile(join(process.cwd(), "public/logo.png"));
  }
  return {
    filename: "logo.png",
    content:  cachedLogo,
    cid:      "mkis-logo",       // referenced as src="cid:mkis-logo" in HTML
    contentType: "image/png",
  };
}

interface LayoutOptions {
  headline:       string;     // "Booking Received", "You're Invited"
  preheader?:     string;     // hidden preview text
  bodyHtml:       string;     // inner content
}

/**
 * Builds a fully-branded HTML email + the inline logo attachment to ship with it.
 * Pass the returned `html` to nodemailer's `html`, and `attachments` to its `attachments`.
 */
export async function buildEmail({ headline, preheader, bodyHtml }: LayoutOptions) {
  const logo = await getLogoAttachment();
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background:#FAF0EB;font-family:Arial,Helvetica,sans-serif;color:#2C1A14;">
  ${preheader ? `<div style="display:none;font-size:1px;color:#FAF0EB;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>` : ""}
  <div style="max-width:560px;margin:40px auto;padding:0 16px;">
    <div style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(224,120,152,0.08);">

      <!-- Header with logo -->
      <div style="background:linear-gradient(135deg,#E07898,#C9956B);padding:36px 40px 28px;text-align:center;">
        <img src="cid:mkis-logo" alt="MKIS Nails Saloon" width="72" height="72"
             style="display:inline-block;border-radius:50%;border:3px solid #ffffff;background:#0A0A0A;margin-bottom:14px;" />
        <p style="margin:0;color:#ffffff;font-size:13px;letter-spacing:4px;text-transform:uppercase;font-weight:600;">
          MKIS Nails Saloon
        </p>
        <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.3px;">
          ${headline}
        </h1>
      </div>

      <!-- Body -->
      <div style="padding:36px 40px;">
        ${bodyHtml}
      </div>

      <!-- Security notice -->
      <div style="background:#FAF0EB;padding:18px 40px;border-top:1px solid #F0DDD3;">
        <p style="margin:0;font-size:11px;color:#7A5544;line-height:1.5;text-align:center;">
          <strong style="color:#C9956B;">Security note:</strong> Our only official email is
          <a href="mailto:mkisservicesllc@gmail.com" style="color:#C9956B;text-decoration:none;font-weight:600;">mkisservicesllc@gmail.com</a>.
          We will never ask for your password or payment details by email.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#1C1614;padding:24px 40px;text-align:center;color:#9A7060;">
        <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:14px;color:#F5EDE6;font-weight:600;letter-spacing:1px;">
          MKIS Nails Saloon
        </p>
        <p style="margin:0 0 12px;font-size:11px;color:#9A7060;">
          Premium Nail Art &amp; Care
        </p>
        <p style="margin:0 0 4px;font-size:11px;color:#9A7060;line-height:1.6;">
          <a href="tel:+17542302480" style="color:#9A7060;text-decoration:none;">+1 (754) 230-2480</a>
          &nbsp;·&nbsp;
          <a href="mailto:mkisservicesllc@gmail.com" style="color:#9A7060;text-decoration:none;">mkisservicesllc@gmail.com</a>
        </p>
        <p style="margin:0 0 12px;font-size:11px;color:#9A7060;">
          Florida, USA
        </p>
        <p style="margin:0;font-size:10px;color:#9A7060;opacity:0.7;">
          &copy; ${year} MKIS Nails Saloon. All rights reserved.
        </p>
      </div>
    </div>

    <p style="text-align:center;font-size:10px;color:#9A7060;margin:16px 0 0;">
      You received this email because you have an account or made a booking with MKIS Nails Saloon.
    </p>
  </div>
</body>
</html>`;

  return { html, attachments: [logo] };
}
