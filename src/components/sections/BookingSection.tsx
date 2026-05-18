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
    { value: "", label: "No preference. We'll assign someone" },
    ...team.map((t) => ({ value: t.id, label: `${t.name} · ${t.role}` })),
  ];

  return (
    <section id={id} className="py-24 lg:py-32">
      {status === "success" ? (
        <div className="max-w-2xl mx-auto px-6 lg:px-8 text-center">
          <div className="bg-[#2A1F18] rounded-lg p-12 border border-[#3A2E26]/60">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#D89AAE] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#1A1410]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-[family-name:var(--font-cormorant)] font-light text-4xl text-[#F0E4D8] mb-4">
              Booking <span className="italic text-[#D89AAE]">received</span>
            </h2>
            <p className="text-[#B8A89A] text-base mb-8 font-light">
              Thank you, <span className="font-medium text-[#F0E4D8]">{form.name}</span>!
              Your request is in. We&apos;ll confirm your appointment shortly.
            </p>
            <div className="bg-[#1A1410] rounded-lg p-6 text-left mb-8 border border-[#3A2E26]/60">
              <div className="space-y-3 text-sm">
                {[
                  { label: "Service",    value: selectedService?.name ?? "" },
                  { label: "Date",       value: form.date },
                  { label: "Time",       value: timeLabel(form.startTime) },
                  { label: "Technician", value: selectedTech?.name ?? "Any Available" },
                  { label: "Phone",      value: form.phone },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-[#7A6657]">{label}</span>
                    <span className="font-medium text-[#F0E4D8]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-[#B8A89A] mb-6 font-light">
              A confirmation email has been sent to{" "}
              <span className="text-[#D89AAE] font-medium">{form.email}</span>.
            </p>
            <Button onClick={() => { setStatus("idle"); setForm(initialForm); }}>Make another booking</Button>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <SectionHeading
            eyebrow="Reservations"
            title="Book An Appointment"
            subtitle="Pick your service, technician, and time. We'll confirm your slot."
          />

          <div className="reveal-stagger grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#2A1F18] rounded-lg p-8 border border-[#3A2E26]/60">
                <h3 className="font-[family-name:var(--font-cormorant)] font-light text-2xl text-[#F0E4D8] mb-6">
                  Why book with <span className="italic text-[#D89AAE]">us</span>
                </h3>
                {[
                  "Premium products and techniques",
                  "Personalized nail art just for you",
                  "Real-time availability with no double bookings",
                  "Instant confirmation via email",
                  "Easy rescheduling by phone",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3 mb-3">
                    <span className="w-1 h-1 rounded-full bg-[#D89AAE] mt-2.5 flex-shrink-0" />
                    <p className="text-[#B8A89A] text-sm leading-relaxed font-light">{text}</p>
                  </div>
                ))}
              </div>

              <div className="bg-[#2E1F24] rounded-lg p-8 border border-[#D89AAE]/20">
                <h3 className="font-[family-name:var(--font-cormorant)] font-light text-2xl text-[#F0E4D8] mb-2">
                  Need <span className="italic text-[#D89AAE]">help?</span>
                </h3>
                <p className="text-[#B8A89A] text-sm mb-5 font-light leading-relaxed">
                  Call or WhatsApp us directly and we&apos;ll set up your appointment.
                </p>
                <a href="tel:+17542365112"
                   className="inline-block px-6 py-2.5 bg-[#D89AAE] text-[#1A1410] font-[family-name:var(--font-montserrat)] font-medium text-[11px] tracking-[0.2em] uppercase hover:bg-[#E5B0C2] transition-colors">
                  Call us now
                </a>
              </div>
            </div>

            <form onSubmit={handleSubmit}
                  className="lg:col-span-3 bg-[#2A1F18] rounded-lg p-8 lg:p-10 border border-[#3A2E26]/60">
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
                  <span className="text-[13px] font-medium text-[#F0E4D8] mb-1.5 block">
                    Preferred Time
                    <span className="text-[#D89AAE] ml-0.5">*</span>
                  </span>
                  {!form.serviceId ? (
                    <div className="bg-[#1A1410] rounded-lg border border-dashed border-[#3A2E26]/60 p-6 text-center">
                      <p className="text-[#7A6657] text-sm font-light">Select a service to see available times.</p>
                    </div>
                  ) : !form.date ? (
                    <div className="bg-[#1A1410] rounded-lg border border-dashed border-[#3A2E26]/60 p-6 text-center">
                      <p className="text-[#7A6657] text-sm font-light">Pick a date to see available times.</p>
                    </div>
                  ) : loadingSlots ? (
                    <div className="bg-[#1A1410] rounded-lg border border-[#3A2E26]/60 p-6 text-center">
                      <p className="text-[#7A6657] text-sm font-light">Checking availability…</p>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="bg-[#1A1410] rounded-lg border border-[#3A2E26]/60 p-6 text-center">
                      <p className="text-[#B8A89A] text-sm font-light">
                        {form.technicianId
                          ? "This technician is fully booked on this date. Try another date or a different technician."
                          : "No availability on this date. Try another."}
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
                            className={`px-2 py-2.5 rounded-lg text-sm font-medium transition-colors
                              ${active
                                ? "bg-[#D89AAE] text-[#1A1410]"
                                : "bg-[#1A1410] text-[#F0E4D8] border border-[#3A2E26]/60 hover:border-[#D89AAE]/60"
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
                <div className="mt-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                  {errorMsg}
                </div>
              )}

              <div className="mt-7">
                <Button type="submit" size="lg" className="w-full"
                        disabled={status === "submitting" || !form.startTime}>
                  {status === "submitting" ? "Sending your request..." : "Book My Appointment"}
                </Button>
                <p className="text-center text-xs text-[#7A6657] mt-3 font-light">
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
