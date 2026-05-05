"use client";

import { useState, useEffect, useCallback } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import CustomSelect from "@/components/ui/CustomSelect";
import CalendarPicker from "@/components/ui/CalendarPicker";
import Button from "@/components/ui/Button";
import type { BookingFormData } from "@/types/booking";

interface BookingSectionProps { id: string; }

interface Service { id: string; name: string; duration_minutes: number; price: string; }
interface Tech    { id: string; name: string; role: string; }

const today = new Date().toISOString().split("T")[0];

const initialForm: BookingFormData = {
  name: "", phone: "", email: "",
  serviceId: "", date: "", startTime: "",
  technicianId: "", notes: "",
};

function durationLabel(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

function timeLabel(t: string) {
  const [h, m] = t.split(":").map(Number);
  const hour12 = ((h + 11) % 12) + 1;
  const ampm   = h < 12 ? "AM" : "PM";
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function BookingSection({ id }: BookingSectionProps) {
  const [form, setForm]       = useState<BookingFormData>(initialForm);
  const [status, setStatus]   = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrMsg] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [team, setTeam]       = useState<Tech[]>([]);
  const [slots, setSlots]     = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Load services + team on mount
  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then(setServices).catch(() => {});
    fetch("/api/team").then((r) => r.json()).then(setTeam).catch(() => {});
  }, []);

  // Re-fetch availability when service / date / technician changes
  const fetchSlots = useCallback(async () => {
    if (!form.date || !form.serviceId) { setSlots([]); return; }
    setLoadingSlots(true);
    const params = new URLSearchParams({ date: form.date, serviceId: form.serviceId });
    if (form.technicianId) params.set("technicianId", form.technicianId);
    try {
      const res = await fetch(`/api/availability?${params}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch { setSlots([]); }
    finally { setLoadingSlots(false); }
  }, [form.date, form.serviceId, form.technicianId]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  function updateField<K extends keyof BookingFormData>(key: K, val: BookingFormData[K]) {
    setForm((p) => ({ ...p, [key]: val, ...(key === "date" || key === "serviceId" || key === "technicianId" ? { startTime: "" } : {}) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting"); setErrMsg("");
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setStatus("success");
      // Notify Bella so she can pop a thank-you bubble
      const firstName = (form.name || "").trim().split(" ")[0] || "there";
      window.dispatchEvent(new CustomEvent("mkis:booking-complete", { detail: { firstName } }));
    } catch (err) {
      setStatus("error");
      setErrMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  }

  const selectedService = services.find((s) => s.id === form.serviceId);
  const selectedTech    = team.find((t) => t.id === form.technicianId);

  const serviceOptions = services.map((s) => ({
    value: s.id,
    label: `${s.name} · ${durationLabel(s.duration_minutes)} · ${s.price}`,
  }));

  const techOptions = [
    { value: "", label: "No preference — we'll assign someone" },
    ...team.map((t) => ({ value: t.id, label: `${t.name} · ${t.role}` })),
  ];

  return (
    <section id={id} className="py-24 bg-[#0A0A0A]/85 backdrop-blur-sm">
      {status === "success" ? (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-[#1C1614] rounded-3xl p-12 shadow-2xl border border-[#E07898]/25 shadow-[#E07898]/10">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#E07898] to-[#C9956B] flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#F5EDE6] mb-4">Booking Received</h2>
            <p className="text-[#9A7060] text-lg mb-6">
              Thank you, <span className="font-semibold text-[#F5EDE6]">{form.name}</span>!
              Your request is in. We&apos;ll confirm your appointment shortly.
            </p>
            <div className="bg-[#0A0A0A]/60 rounded-2xl p-6 text-left mb-8 border border-[#E07898]/15">
              <div className="space-y-3 text-sm">
                {[
                  { label: "Service",    value: selectedService?.name ?? "" },
                  { label: "Date",       value: form.date },
                  { label: "Time",       value: timeLabel(form.startTime) },
                  { label: "Technician", value: selectedTech?.name ?? "Any Available" },
                  { label: "Phone",      value: form.phone },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-[#9A7060]">{label}</span>
                    <span className="font-semibold text-[#F5EDE6]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-[#9A7060] mb-6">
              A confirmation email has been sent to{" "}
              <span className="text-[#E07898] font-medium">{form.email}</span>.
            </p>
            <Button onClick={() => { setStatus("idle"); setForm(initialForm); }}>Make Another Booking</Button>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Book an Appointment"
            subtitle="Pick your service, technician, and time. We'll confirm your slot."
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#1C1614] rounded-3xl p-7 border border-[#E07898]/20">
                <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#F5EDE6] mb-5">
                  Why Book With Us?
                </h3>
                {[
                  "Premium quality products and techniques",
                  "Personalized nail art just for you",
                  "Real-time availability — no double bookings",
                  "Instant confirmation via email",
                  "Easy rescheduling by phone",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E07898] mt-2 flex-shrink-0" />
                    <p className="text-[#9A7060] text-sm leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-[#E07898] to-[#C9956B] rounded-3xl p-7 text-white">
                <h3 className="font-semibold text-lg mb-2">Need help?</h3>
                <p className="text-white/80 text-sm mb-4">
                  Call or WhatsApp us directly and we&apos;ll set up your appointment.
                </p>
                <a href="tel:+17542302480"
                   className="inline-block px-5 py-2 rounded-full bg-[#0A0A0A] text-[#E07898] font-semibold text-sm hover:bg-[#1C1614] transition-colors">
                  Call Us Now
                </a>
              </div>
            </div>

            <form onSubmit={handleSubmit}
                  className="lg:col-span-3 bg-[#1C1614] rounded-3xl p-8 border border-[#E07898]/20 shadow-xl shadow-[#E07898]/5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <Input label="Full Name" name="name" value={form.name}
                         onChange={(e) => updateField("name", e.target.value)}
                         placeholder="Kristin Harricharan" required />
                </div>
                <Input label="Phone Number" name="phone" type="tel" value={form.phone}
                       onChange={(e) => updateField("phone", e.target.value)}
                       placeholder="+1 (000) 000-0000" required />
                <Input label="Email Address" name="email" type="email" value={form.email}
                       onChange={(e) => updateField("email", e.target.value)}
                       placeholder="kristin@example.com" required />

                <div className="sm:col-span-2">
                  <CustomSelect
                    label="Service"
                    value={form.serviceId}
                    onChange={(val) => updateField("serviceId", val)}
                    options={serviceOptions}
                    placeholder="Select a service..."
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <CustomSelect
                    label="Preferred Technician"
                    value={form.technicianId}
                    onChange={(val) => updateField("technicianId", val)}
                    options={techOptions}
                  />
                </div>

                <div className="sm:col-span-2">
                  <CalendarPicker
                    label="Preferred Date"
                    value={form.date}
                    onChange={(val) => updateField("date", val)}
                    min={today}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <span className="text-sm font-medium text-[#F5EDE6] mb-2 block">
                    Preferred Time
                    <span className="text-[#E07898] ml-0.5">*</span>
                  </span>
                  {!form.serviceId ? (
                    <div className="bg-[#0A0A0A]/60 rounded-xl border border-dashed border-[#E07898]/20 p-6 text-center">
                      <p className="text-[#9A7060] text-sm">Select a service to see available times.</p>
                    </div>
                  ) : !form.date ? (
                    <div className="bg-[#0A0A0A]/60 rounded-xl border border-dashed border-[#E07898]/20 p-6 text-center">
                      <p className="text-[#9A7060] text-sm">Pick a date to see available times.</p>
                    </div>
                  ) : loadingSlots ? (
                    <div className="bg-[#0A0A0A]/60 rounded-xl border border-[#E07898]/15 p-6 text-center">
                      <p className="text-[#9A7060] text-sm">Checking availability…</p>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="bg-[#0A0A0A]/60 rounded-xl border border-[#E07898]/15 p-6 text-center">
                      <p className="text-[#9A7060] text-sm">
                        {form.technicianId
                          ? "This technician is fully booked on this date — try another date or a different technician."
                          : "No availability on this date — try another."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {slots.map((slot) => {
                        const active = form.startTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => updateField("startTime", slot)}
                            className={`px-2 py-2 rounded-lg text-sm font-medium transition-all
                              ${active
                                ? "bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white shadow-md shadow-[#E07898]/30"
                                : "bg-[#0A0A0A] text-[#F5EDE6] border border-[#E07898]/20 hover:border-[#E07898]/50 hover:bg-[#E07898]/10"
                              }`}
                          >
                            {timeLabel(slot)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <Textarea label="Additional Notes" name="notes" value={form.notes}
                            onChange={(e) => updateField("notes", e.target.value)}
                            placeholder="Any special requests, nail inspo, allergies, etc." />
                </div>
              </div>

              {status === "error" && (
                <div className="mt-4 p-4 rounded-xl bg-red-950/50 border border-red-500/30 text-red-400 text-sm">
                  {errorMsg}
                </div>
              )}

              <div className="mt-6">
                <Button type="submit" size="lg" className="w-full"
                        disabled={status === "submitting" || !form.startTime}>
                  {status === "submitting" ? "Sending your request..." : "Book My Appointment"}
                </Button>
                <p className="text-center text-xs text-[#9A7060] mt-3">
                  We&apos;ll confirm your slot within 24 hours.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
