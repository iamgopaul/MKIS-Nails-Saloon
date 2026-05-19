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

function formatDate(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

const CARD_CLS    = "bg-[#1A1410] border border-[#D89AAE]/15 rounded-2xl";
const BTN_PRIMARY = "flex-1 min-w-[160px] px-6 py-3.5 rounded-full bg-[#D89AAE] text-[#1A1410] font-bold text-xs uppercase tracking-wider hover:bg-[#C45E7A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
const BTN_DANGER  = "flex-1 min-w-[160px] px-6 py-3.5 rounded-full bg-transparent text-[#D89AAE] font-bold text-xs uppercase tracking-wider border border-[#D89AAE]/40 hover:bg-[#D89AAE]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
const BTN_GHOST   = "flex-1 min-w-[120px] px-6 py-3.5 rounded-full bg-transparent text-[#F0E4D8] font-semibold text-xs uppercase tracking-wider border border-[#D89AAE]/25 hover:border-[#D89AAE]/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

export default function ManageBookingClient({ token, booking }: { token: string; booking: Booking }) {
  const [mode, setMode]               = useState<"summary" | "reschedule" | "done">("summary");
  const [doneKind, setDoneKind]       = useState<"cancelled" | "rescheduled" | null>(null);
  const [error, setError]             = useState("");
  const [submitting, setSubmitting]   = useState(false);

  const [date, setDate]               = useState("");
  const [slots, setSlots]             = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [pickedTime, setPickedTime]   = useState("");

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
    <main className="min-h-screen bg-[#1A1410] text-[#F0E4D8] py-12 px-6">
      <div className="max-w-xl mx-auto">
        <Link href="/" className="text-[#B8A89A] text-sm no-underline hover:text-[#D89AAE] transition-colors">
          ← MKIS Nail Salon
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-2 font-[family-name:var(--font-cormorant)]">Manage Booking</h1>
        <p className="text-[#B8A89A] mb-7">
          Hi {booking.clientName.split(" ")[0]}, here are your appointment details.
        </p>

        <div className={`${CARD_CLS} p-6 mb-6`}>
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
          <div className="flex gap-3 flex-wrap">
            <button type="button" onClick={() => setMode("reschedule")} disabled={submitting} className={BTN_PRIMARY}>
              Reschedule
            </button>
            <button type="button" onClick={cancel} disabled={submitting} className={BTN_DANGER}>
              {submitting ? "Cancelling…" : "Cancel Booking"}
            </button>
          </div>
        )}

        {mode === "reschedule" && (
          <div className={`${CARD_CLS} p-6`}>
            <h2 className="text-sm uppercase tracking-widest text-[#D89AAE] font-bold mb-4">
              Pick a new time
            </h2>

            <label htmlFor="reschedule-date" className="block text-xs text-[#B8A89A] mb-1.5">
              New date
            </label>
            <input
              id="reschedule-date"
              type="date"
              min={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl bg-[#1A1410] border border-[#D89AAE]/20 text-[#F0E4D8] text-base mb-4 [color-scheme:dark] focus:outline-none focus:border-[#D89AAE]/60"
            />

            {date && (
              <>
                <span className="block text-xs text-[#B8A89A] mb-1.5">Available times</span>
                {loadingSlots ? (
                  <p className="text-[#B8A89A] text-sm">Loading…</p>
                ) : slots.length === 0 ? (
                  <p className="text-[#B8A89A] text-sm">No openings on this date. Try another.</p>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2 mb-4">
                    {slots.map((s) => {
                      const selected = pickedTime === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setPickedTime(s)}
                          className={`px-2 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                            selected
                              ? "bg-[#D89AAE] text-[#1A1410] border-none"
                              : "bg-transparent text-[#F0E4D8] border border-[#D89AAE]/25 hover:border-[#D89AAE]/60"
                          }`}
                        >
                          {fmtTime(s)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 flex-wrap">
              <button type="button" onClick={reschedule} disabled={submitting || !pickedTime} className={BTN_PRIMARY}>
                {submitting ? "Saving…" : "Confirm reschedule"}
              </button>
              <button type="button" onClick={() => { setMode("summary"); setError(""); }} disabled={submitting} className={BTN_GHOST}>
                Back
              </button>
            </div>
          </div>
        )}

        {mode === "done" && (
          <div className={`${CARD_CLS} p-7 text-center`}>
            <h2 className="text-xl font-bold mb-2">
              {doneKind === "cancelled" ? "Booking cancelled" : "Booking updated"}
            </h2>
            <p className="text-[#B8A89A] mb-4 leading-relaxed">
              {doneKind === "cancelled"
                ? "We've cancelled your appointment. A confirmation email is on its way."
                : "Your new appointment time is saved. A confirmation email is on its way."}
            </p>
            <Link href="/" className="text-[#D89AAE] no-underline font-semibold hover:underline">
              Back to MKIS Nail Salon →
            </Link>
          </div>
        )}

        {error && (
          <p className="mt-4 text-[#D89AAE] text-sm">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-2.5 text-sm ${last ? "" : "border-b border-[#D89AAE]/10"}`}>
      <span className="text-[#B8A89A]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
