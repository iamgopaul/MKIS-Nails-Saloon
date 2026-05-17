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

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then(setServices).catch(() => {});
    fetch("/api/team").then((r) => r.json()).then(setTeam).catch(() => {});
  }, []);

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
    <section id={id} className="py-24 bg-[#F5EDE6]">
      {status === "success" ? (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-3xl p-12 shadow-[0_30px_60px_-30px_rgba(26,20,16,0.2)] border border-[#EADBD2]">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#E07898] flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="display text-3xl text-[#1A1410] mb-4">Booking received</h2>
            <p className="text-[#6B5448] text-base mb-8 font-light">
              Thank you, <span className="font-medium text-[#1A1410]">{form.name}</span>!
              Your request is in. We&apos;ll confirm your appointment shortly.
            </p>
            <div className="bg-[#FBF7F4] rounded-2xl p-6 text-left mb-8 border border-[#EADBD2]">
              <div className="space-y-3 text-sm">
                {[
                  { label: "Service",    value: selectedService?.name ?? "" },
                  { label: "Date",       value: form.date },
                  { label: "Time",       value: timeLabel(form.startTime) },
                  { label: "Technician", value: selectedTech?.name ?? "Any Available" },
                  { label: "Phone",      value: form.phone },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-[#A89484]">{label}</span>
                    <span className="font-medium text-[#1A1410]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-[#6B5448] mb-6 font-light">
              A confirmation email has been sent to{" "}
              <span className="text-[#C45E7A] font-medium">{form.email}</span>.
            </p>
            <Button onClick={() => { setStatus("idle"); setForm(initialForm); }}>Make another booking</Button>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <SectionHeading
            eyebrow="Reservations"
            title="Book an appointment"
            subtitle="Pick your service, technician, and time. We'll confirm your slot."
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-[#EADBD2]">
                <h3 className="display-md text-xl text-[#1A1410] mb-6">
                  Why book with us
                </h3>
                {[
                  "Premium products and techniques",
                  "Personalized nail art just for you",
                  "Real-time availability — no double bookings",
                  "Instant confirmation via email",
                  "Easy rescheduling by phone",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3 mb-3">
                    <span className="w-1 h-1 rounded-full bg-[#E07898] mt-2.5 flex-shrink-0" />
                    <p className="text-[#6B5448] text-sm leading-relaxed font-light">{text}</p>
                  </div>
                ))}
              </div>

              <div className="bg-[#1A1410] rounded-3xl p-8 text-white">
                <h3 className="display-md text-xl mb-2">Need help?</h3>
                <p className="text-white/70 text-sm mb-5 font-light leading-relaxed">
                  Call or WhatsApp us directly and we&apos;ll set up your appointment.
                </p>
                <a href="tel:+17542365112"
                   className="inline-block px-5 py-2.5 rounded-full bg-white text-[#1A1410] font-medium text-sm hover:bg-[#FBF7F4] transition-colors">
                  Call us now
                </a>
              </div>
            </div>

            <form onSubmit={handleSubmit}
                  className="lg:col-span-3 bg-white rounded-3xl p-10 border border-[#EADBD2] shadow-[0_20px_50px_-25px_rgba(26,20,16,0.12)]">
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
                  <span className="text-[13px] font-medium text-[#1A1410] mb-1.5 block">
                    Preferred Time
                    <span className="text-[#C45E7A] ml-0.5">*</span>
                  </span>
                  {!form.serviceId ? (
                    <div className="bg-[#FBF7F4] rounded-xl border border-dashed border-[#EADBD2] p-6 text-center">
                      <p className="text-[#A89484] text-sm font-light">Select a service to see available times.</p>
                    </div>
                  ) : !form.date ? (
                    <div className="bg-[#FBF7F4] rounded-xl border border-dashed border-[#EADBD2] p-6 text-center">
                      <p className="text-[#A89484] text-sm font-light">Pick a date to see available times.</p>
                    </div>
                  ) : loadingSlots ? (
                    <div className="bg-[#FBF7F4] rounded-xl border border-[#EADBD2] p-6 text-center">
                      <p className="text-[#A89484] text-sm font-light">Checking availability…</p>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="bg-[#FBF7F4] rounded-xl border border-[#EADBD2] p-6 text-center">
                      <p className="text-[#6B5448] text-sm font-light">
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
                            className={`px-2 py-2.5 rounded-lg text-sm font-medium transition-all
                              ${active
                                ? "bg-[#E07898] text-white shadow-[0_6px_16px_-6px_rgba(224,120,152,0.55)]"
                                : "bg-white text-[#1A1410] border border-[#EADBD2] hover:border-[#E07898]/60 hover:bg-[#FCE7EE]/30"
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
                <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {errorMsg}
                </div>
              )}

              <div className="mt-7">
                <Button type="submit" size="lg" className="w-full"
                        disabled={status === "submitting" || !form.startTime}>
                  {status === "submitting" ? "Sending your request..." : "Book My Appointment"}
                </Button>
                <p className="text-center text-xs text-[#A89484] mt-3 font-light">
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
