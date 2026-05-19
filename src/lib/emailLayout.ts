import { readFile } from "fs/promises";
import { join } from "path";

let cachedLogo: Buffer | null = null;
async function getLogoAttachment() {
  if (!cachedLogo) {
    // Transparent MKIS Nails wordmark — matches the public site logo.
    cachedLogo = await readFile(join(process.cwd(), "public/logo-transparent.png"));
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
 * Editorial dark HTML email matching the new MKIS Nails site theme.
 * - Warm dark body (#1A1410)
 * - Rose pink accent (#D89AAE)
 * - Cream copy (#F0E4D8)
 * - Cormorant-flavored serif headlines, Montserrat-flavored uppercase tracking
 * - Email-safe (table + inline styles), no external CSS, no remote fonts
 */
export async function buildEmail({ headline, preheader, bodyHtml }: LayoutOptions) {
  const logo = await getLogoAttachment();
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background:#1A1410;font-family:'Helvetica Neue',Arial,sans-serif;color:#F0E4D8;-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;font-size:1px;color:#1A1410;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>` : ""}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#1A1410;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#2A1F18;border:1px solid rgba(58,46,38,0.7);border-radius:16px;overflow:hidden;">

          <!-- Header — logo + eyebrow + serif headline on warm dark plate -->
          <tr>
            <td align="center" style="padding:40px 32px 28px;background:#2A1F18;border-bottom:1px solid rgba(58,46,38,0.6);">
              <img src="cid:mkis-logo" alt="MKIS Nails Salon" width="140" style="display:block;height:auto;margin:0 auto 18px;max-width:140px;" />
              <p style="margin:0 0 10px;color:#D89AAE;font-size:10px;letter-spacing:5px;text-transform:uppercase;font-weight:600;">
                MKIS Nails Salon
              </p>
              <h1 style="margin:0;color:#F0E4D8;font-size:28px;font-weight:300;letter-spacing:-0.3px;line-height:1.15;font-family:Georgia,'Cormorant Garamond',serif;">
                ${headline}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;background:#2A1F18;color:#F0E4D8;font-size:15px;line-height:1.65;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Security strip -->
          <tr>
            <td style="background:#1A1410;padding:16px 36px;border-top:1px solid rgba(58,46,38,0.6);">
              <p style="margin:0;font-size:11px;color:#7A6657;line-height:1.6;text-align:center;">
                <span style="color:#D89AAE;font-weight:600;">Security note:</span>
                our only official email is
                <a href="mailto:mkisservicesllc@gmail.com" style="color:#D89AAE;text-decoration:none;font-weight:600;">mkisservicesllc@gmail.com</a>.
                We will never ask for your password or payment details by email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background:#1A1410;padding:28px 36px 26px;border-top:1px solid rgba(58,46,38,0.4);">
              <p style="margin:0 0 8px;font-family:Georgia,'Cormorant Garamond',serif;font-size:18px;color:#F0E4D8;font-weight:400;letter-spacing:0.5px;">
                MKIS <em style="color:#D89AAE;font-style:italic;">Nails</em>
              </p>
              <p style="margin:0 0 14px;font-size:10px;color:#7A6657;letter-spacing:3px;text-transform:uppercase;">
                Premium Nail Studio
              </p>
              <p style="margin:0 0 6px;font-size:12px;color:#B8A89A;line-height:1.7;">
                <a href="tel:+17542365112" style="color:#D89AAE;text-decoration:none;">+1 (754) 236-5112</a>
                <span style="color:#7A6657;">&nbsp;·&nbsp;</span>
                <a href="mailto:mkisservicesllc@gmail.com" style="color:#D89AAE;text-decoration:none;">mkisservicesllc@gmail.com</a>
              </p>
              <p style="margin:0 0 16px;font-size:12px;color:#B8A89A;">7000 NW 17th St, Building 2, Plantation, FL 33313</p>
              <p style="margin:0;font-size:10px;color:#7A6657;opacity:0.7;">
                &copy; ${year} MKIS Nails Salon. All rights reserved.
              </p>
            </td>
          </tr>
        </table>

        <p style="text-align:center;font-size:10px;color:#7A6657;margin:20px 0 0;opacity:0.7;font-family:Helvetica,Arial,sans-serif;">
          You received this email because you have an account or made a booking with MKIS Nails Salon.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, attachments: [logo] };
}
