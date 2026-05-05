import { notFound } from "next/navigation";
import Link from "next/link";
import { findBookingByToken } from "@/lib/manageBooking";
import ManageBookingClient from "./ManageBookingClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const hour12 = ((h + 11) % 12) + 1;
  const ampm   = h < 12 ? "AM" : "PM";
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function fmtDate(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export default async function ManagePage({ params }: Props) {
  const { token } = await params;
  const booking = await findBookingByToken(token);

  if (!booking) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#0A0A0A", color: "#F5EDE6" }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Link expired or invalid</h1>
          <p style={{ color: "#9A7060", marginBottom: 24, lineHeight: 1.6 }}>
            This management link is no longer valid. If you need to change a booking, please call us at{" "}
            <a href="tel:+17542302480" style={{ color: "#E07898" }}>+1 (754) 230-2480</a>.
          </p>
          <Link href="/" style={{ color: "#E07898", textDecoration: "none", fontWeight: 600 }}>
            ← Back to MKIS Nail Saloon
          </Link>
        </div>
      </main>
    );
  }

  if (booking.status === "Cancelled") {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#0A0A0A", color: "#F5EDE6" }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>This booking is cancelled</h1>
          <p style={{ color: "#9A7060", marginBottom: 24, lineHeight: 1.6 }}>
            Your appointment for <strong>{booking.service_name}</strong> on {fmtDate(booking.preferred_date)} has been cancelled.
          </p>
          <Link href="/#booking" style={{ color: "#E07898", textDecoration: "none", fontWeight: 600 }}>
            Book a new appointment →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <ManageBookingClient
      token={token}
      booking={{
        id:              booking.id,
        clientName:      booking.client_name,
        serviceId:       booking.service_id,
        serviceName:     booking.service_name,
        technicianId:    booking.technician_id,
        technicianName:  booking.technician_name ?? "Any Available",
        date:            booking.preferred_date,
        startTime:       String(booking.start_time).slice(0, 5),
        endTime:         String(booking.end_time).slice(0, 5),
        status:          booking.status,
        prettyDate:      fmtDate(booking.preferred_date),
        prettyStart:     fmtTime(String(booking.start_time).slice(0, 5)),
        prettyEnd:       fmtTime(String(booking.end_time).slice(0, 5)),
      }}
    />
  );
}

export const metadata = { title: "Manage Booking — MKIS Nail Saloon" };
