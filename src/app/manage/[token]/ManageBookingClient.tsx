"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Booking {
  id:              string;
  clientName:      string;
  serviceId:       string;
  serviceName:     string;
  technicianId:    string | null;
  technicianName:  string;
  date:            string;
  startTime:       string;
  endTime:         string;
  status:          string;
  prettyDate:      string;
  prettyStart:     string;
  prettyEnd:       string;
}

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const hour12 = ((h + 11) % 12) + 1;
  const ampm   = h < 12 ? "AM" : "PM";
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const BG    = "#0A0A0A";
const CARD  = "#111111";
const PINK  = "#E07898";
const TEXT  = "#F5EDE6";
const MUTED = "#9A7060";

export default function ManageBookingClient({ token, booking }: { token: string; booking: Booking }) {
  const [mode, setMode]               = useState<"summary" | "reschedule" | "done">("summary");
  const [doneKind, setDoneKind]       = useState<"cancelled" | "rescheduled" | null>(null);
  const [error, setError]             = useState("");
  const [submitting, setSubmitting]   = useState(false);

  // Reschedule state
  const [date, setDate]               = useState("");
  const [slots, setSlots]             = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [pickedTime, setPickedTime]   = useState("");

  // Updated summary after reschedule
  const [updated, setUpdated]         = useState<{ date: string; startTime: string; endTime: string } | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (mode !== "reschedule" || !date) { setSlots([]); setPickedTime(""); return; }
    setLoadingSlots(true);
    const params = new URLSearchParams({ date, serviceId: booking.serviceId });
    if (booking.technicianId) params.set("technicianId", booking.technicianId);
    fetch(`/api/availability?${params.toString()}`)
      .then((r) => r.json())
      .then((j) => setSlots(Array.isArray(j.slots) ? j.slots : []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [mode, date, booking.serviceId, booking.technicianId]);

  async function cancel() {
    if (!confirm("Cancel this appointment? This can't be undone.")) return;
    setError(""); setSubmitting(true);
    try {
      const res = await fetch("/api/manage/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not cancel.");
      setDoneKind("cancelled");
      setMode("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel.");
    } finally {
      setSubmitting(false);
    }
  }

  async function reschedule() {
    setError("");
    if (!date || !pickedTime) { setError("Pick a date and time."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/manage/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, date, startTime: pickedTime }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not reschedule.");
      setUpdated({ date: json.date, startTime: json.startTime, endTime: json.endTime });
      setDoneKind("rescheduled");
      setMode("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reschedule.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", padding: "48px 24px", background: BG, color: TEXT }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <Link href="/" style={{ color: MUTED, fontSize: 13, textDecoration: "none" }}>
          ← MKIS Nail Saloon
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: "16px 0 8px" }}>Manage Booking</h1>
        <p style={{ color: MUTED, marginBottom: 28 }}>
          Hi {booking.clientName.split(" ")[0]}, here are your appointment details.
        </p>

        <div style={{ background: CARD, border: `1px solid rgba(224,120,152,0.15)`, borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <Row label="Service"    value={booking.serviceName} />
          <Row label="Date"       value={updated ? formatDate(updated.date) : booking.prettyDate} />
          <Row label="Time"       value={
            updated
              ? `${fmtTime(updated.startTime)} – ${fmtTime(updated.endTime)}`
              : `${booking.prettyStart} – ${booking.prettyEnd}`
          } />
          <Row label="Technician" value={booking.technicianName} last />
        </div>

        {mode === "summary" && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => setMode("reschedule")} disabled={submitting} style={btnPrimary}>
              Reschedule
            </button>
            <button onClick={cancel} disabled={submitting} style={btnDanger}>
              {submitting ? "Cancelling…" : "Cancel Booking"}
            </button>
          </div>
        )}

        {mode === "reschedule" && (
          <div style={{ background: CARD, border: `1px solid rgba(224,120,152,0.15)`, borderRadius: 14, padding: 24 }}>
            <h2 style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 1.5, color: PINK, fontWeight: 700, marginBottom: 16 }}>
              Pick a new time
            </h2>

            <label style={{ display: "block", fontSize: 12, color: MUTED, marginBottom: 6 }}>New date</label>
            <input
              type="date"
              min={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: BG, border: `1px solid rgba(224,120,152,0.2)`, color: TEXT, fontSize: 15, marginBottom: 18, colorScheme: "dark" }}
            />

            {date && (
              <>
                <label style={{ display: "block", fontSize: 12, color: MUTED, marginBottom: 6 }}>Available times</label>
                {loadingSlots ? (
                  <p style={{ color: MUTED, fontSize: 13 }}>Loading…</p>
                ) : slots.length === 0 ? (
                  <p style={{ color: MUTED, fontSize: 13 }}>No openings on this date. Try another.</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8, marginBottom: 18 }}>
                    {slots.map((s) => (
                      <button
                        key={s}
                        onClick={() => setPickedTime(s)}
                        style={{
                          padding: "10px 8px",
                          borderRadius: 8,
                          background: pickedTime === s ? PINK : "transparent",
                          color: pickedTime === s ? BG : TEXT,
                          border: pickedTime === s ? "none" : `1px solid rgba(224,120,152,0.25)`,
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        {fmtTime(s)}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={reschedule} disabled={submitting || !pickedTime} style={btnPrimary}>
                {submitting ? "Saving…" : "Confirm reschedule"}
              </button>
              <button onClick={() => { setMode("summary"); setError(""); }} disabled={submitting} style={btnSecondary}>
                Back
              </button>
            </div>
          </div>
        )}

        {mode === "done" && (
          <div style={{ background: CARD, border: `1px solid rgba(224,120,152,0.15)`, borderRadius: 14, padding: 28, textAlign: "center" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              {doneKind === "cancelled" ? "Booking cancelled" : "Booking updated"}
            </h2>
            <p style={{ color: MUTED, marginBottom: 16, lineHeight: 1.6 }}>
              {doneKind === "cancelled"
                ? "We've cancelled your appointment. A confirmation email is on its way."
                : "Your new appointment time is saved. A confirmation email is on its way."}
            </p>
            <Link href="/" style={{ color: PINK, textDecoration: "none", fontWeight: 600 }}>
              Back to MKIS Nail Saloon →
            </Link>
          </div>
        )}

        {error && (
          <p style={{ marginTop: 16, color: "#ff8b9d", fontSize: 13 }}>
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      gap: 16,
      padding: "10px 0",
      borderBottom: last ? "none" : "1px solid rgba(224,120,152,0.1)",
      fontSize: 14,
    }}>
      <span style={{ color: MUTED }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function formatDate(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

const btnPrimary: React.CSSProperties = {
  padding: "14px 24px", borderRadius: 999, background: PINK, color: BG,
  fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: "uppercase",
  border: "none", cursor: "pointer", flex: "1 1 160px",
};
const btnDanger: React.CSSProperties = {
  padding: "14px 24px", borderRadius: 999, background: "transparent", color: "#ff8b9d",
  fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: "uppercase",
  border: "1px solid rgba(255,139,157,0.4)", cursor: "pointer", flex: "1 1 160px",
};
const btnSecondary: React.CSSProperties = {
  padding: "14px 24px", borderRadius: 999, background: "transparent", color: TEXT,
  fontWeight: 600, fontSize: 13, letterSpacing: 1, textTransform: "uppercase",
  border: "1px solid rgba(224,120,152,0.25)", cursor: "pointer", flex: "1 1 120px",
};
