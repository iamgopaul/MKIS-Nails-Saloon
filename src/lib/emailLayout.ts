import { readFile } from "fs/promises";
import { join } from "path";

let cachedLogo: Buffer | null = null;
async function getLogoAttachment() {
  if (!cachedLogo) {
    cachedLogo = await readFile(join(process.cwd(), "public/tab-logo.png"));
  }
  return {
    filename: "logo.png",
    content:  cachedLogo,
    cid:      "mkis-logo",
    contentType: "image/png",
  };
}

interface LayoutOptions {
  headline:   string;
  preheader?: string;
  bodyHtml:   string;
}

/**
 * Dark, branded HTML email matching the MKIS Nail Saloon site theme.
 * Returns the html + the inline logo attachment.
 */
export async function buildEmail({ headline, preheader, bodyHtml }: LayoutOptions) {
  const logo = await getLogoAttachment();
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,Helvetica,sans-serif;color:#F5EDE6;">
  ${preheader ? `<div style="display:none;font-size:1px;color:#0A0A0A;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>` : ""}
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

    <!-- Card -->
    <div style="background:#1C1614;border-radius:24px;overflow:hidden;border:1px solid rgba(224,120,152,0.18);box-shadow:0 4px 32px rgba(0,0,0,0.5);">

      <!-- Gradient header with dark logo well -->
      <div style="background:linear-gradient(135deg,#E07898,#C9956B);padding:36px 40px 30px;text-align:center;">
        <div style="display:inline-block;background:#0A0A0A;padding:5px;border-radius:50%;border:2px solid rgba(255,255,255,0.4);">
          <img src="cid:mkis-logo" alt="MKIS Nail Saloon" width="68" height="68" style="display:block;border-radius:50%;background:#0A0A0A;" />
        </div>
        <p style="margin:14px 0 0;color:#ffffff;font-size:11px;letter-spacing:5px;text-transform:uppercase;font-weight:700;">
          MKIS Nail Saloon
        </p>
        <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.3px;font-family:Georgia,'Playfair Display',serif;">
          ${headline}
        </h1>
      </div>

      <!-- Body -->
      <div style="padding:32px 40px;background:#1C1614;color:#F5EDE6;">
        ${bodyHtml}
      </div>

      <!-- Security notice strip -->
      <div style="background:#111111;padding:16px 40px;border-top:1px solid rgba(224,120,152,0.12);">
        <p style="margin:0;font-size:11px;color:#9A7060;line-height:1.6;text-align:center;">
          <strong style="color:#E07898;">Security note:</strong> Our only official email is
          <a href="mailto:mkisservicesllc@gmail.com" style="color:#E07898;text-decoration:none;font-weight:600;">mkisservicesllc@gmail.com</a>.
          We will never ask for your password or payment details by email.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#0A0A0A;padding:28px 40px 24px;text-align:center;border-top:1px solid rgba(224,120,152,0.12);">
        <p style="margin:0 0 6px;font-family:Georgia,'Playfair Display',serif;font-size:15px;color:#F5EDE6;font-weight:700;letter-spacing:1.5px;">
          MKIS Nail Saloon
        </p>
        <p style="margin:0 0 14px;font-size:11px;color:#9A7060;letter-spacing:1px;">
          PREMIUM NAIL ART &amp; CARE
        </p>
        <p style="margin:0 0 6px;font-size:11px;color:#9A7060;line-height:1.7;">
          <a href="tel:+17542302480" style="color:#E07898;text-decoration:none;">+1 (754) 230-2480</a>
          <span style="color:#9A7060;">&nbsp;·&nbsp;</span>
          <a href="mailto:mkisservicesllc@gmail.com" style="color:#E07898;text-decoration:none;">mkisservicesllc@gmail.com</a>
        </p>
        <p style="margin:0 0 16px;font-size:11px;color:#9A7060;">Florida, USA</p>
        <p style="margin:0;font-size:10px;color:#9A7060;opacity:0.55;">
          &copy; ${year} MKIS Nail Saloon. All rights reserved.
        </p>
      </div>
    </div>

    <p style="text-align:center;font-size:10px;color:#9A7060;margin:20px 0 0;opacity:0.7;">
      You received this email because you have an account or made a booking with MKIS Nail Saloon.
    </p>
  </div>
</body>
</html>`;

  return { html, attachments: [logo] };
}
