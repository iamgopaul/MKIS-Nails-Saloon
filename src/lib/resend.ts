import nodemailer from "nodemailer";

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
  const transporter = createTransport();
  await transporter.sendMail({
    from:    `MKIS Nails Saloon <${process.env.SMTP_USER}>`,
    to:      data.email,
    subject: "Your Booking Request — MKIS Nails Saloon",
    html:    buildEmailHtml(data),
  });
}

function buildEmailHtml(data: NotificationData): string {
  const notesRow = data.notes
    ? `<tr>
        <td style="padding:8px 0;border-top:1px solid #F0DDD3;color:#7A5544;vertical-align:top;">Notes</td>
        <td style="padding:8px 0;border-top:1px solid #F0DDD3;">${data.notes}</td>
       </tr>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF0EB;font-family:Arial,Helvetica,sans-serif;color:#2C1A14;">
  <div style="max-width:560px;margin:40px auto;padding:0 16px;">
    <div style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(233,30,140,0.08);">
      <div style="background:linear-gradient(135deg,#E07898,#C9956B);padding:40px 40px 32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Booking Received</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">MKIS Nails Saloon</p>
      </div>
      <div style="padding:36px 40px;">
        <p style="font-size:16px;margin:0 0 20px;line-height:1.6;">
          Hi <strong>${data.name}</strong>,<br>
          Thank you for booking with us! We have received your request and will confirm your appointment shortly.
        </p>
        <div style="background:#FAF0EB;border-radius:12px;padding:24px;margin-bottom:28px;">
          <h2 style="margin:0 0 16px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#C9956B;">Booking Summary</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:8px 0;color:#7A5544;width:45%;">Service</td>
              <td style="padding:8px 0;font-weight:600;">${data.service}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-top:1px solid #F0DDD3;color:#7A5544;">Date</td>
              <td style="padding:8px 0;border-top:1px solid #F0DDD3;font-weight:600;">${data.date}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-top:1px solid #F0DDD3;color:#7A5544;">Time</td>
              <td style="padding:8px 0;border-top:1px solid #F0DDD3;font-weight:600;">${data.startTime} – ${data.endTime}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-top:1px solid #F0DDD3;color:#7A5544;">Technician</td>
              <td style="padding:8px 0;border-top:1px solid #F0DDD3;font-weight:600;">${data.technician}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-top:1px solid #F0DDD3;color:#7A5544;">Phone</td>
              <td style="padding:8px 0;border-top:1px solid #F0DDD3;font-weight:600;">${data.phone}</td>
            </tr>
            ${notesRow}
          </table>
        </div>
        <p style="font-size:14px;color:#7A5544;margin:0 0 8px;">Need to make changes? Contact us at:</p>
        <p style="font-size:14px;margin:0;">
          Email: <a href="mailto:mkisservicesllc@gmail.com" style="color:#C9956B;text-decoration:none;">mkisservicesllc@gmail.com</a><br>
          Phone: <a href="tel:+17542302480" style="color:#C9956B;text-decoration:none;">+1 (754) 230-2480</a>
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
