"use client";

import { useState, useEffect } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import CustomSelect from "@/components/ui/CustomSelect";
import CalendarPicker from "@/components/ui/CalendarPicker";
import Button from "@/components/ui/Button";
import { services } from "@/data/services";
import type { BookingFormData } from "@/types/booking";

interface BookingSectionProps {
  id: string;
}

const today = new Date().toISOString().split("T")[0];

const initialForm: BookingFormData = {
  name: "",
  phone: "",
  email: "",
  service: "",
  date: "",
  timeSlot: "Morning",
  technician: "",
  notes: "",
};

interface TeamMember { id: string; name: string; role: string; }

export default function BookingSection({ id }: BookingSectionProps) {
  const [form, setForm] = useState<BookingFormData>(initialForm);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data: TeamMember[]) => setTeam(data))
      .catch(() => {});
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  }

  const serviceOptions = services.map((s) => ({ value: s.name, label: s.name }));

  const technicianOptions = [
    { value: "", label: "No preference — we'll assign someone" },
    ...team.map((m) => ({ value: m.name, label: `${m.name} · ${m.role}` })),
  ];

  const timeOptions = [
    { value: "Morning",   label: "Morning (9 AM – 12 PM)" },
    { value: "Afternoon", label: "Afternoon (12 PM – 4 PM)" },
    { value: "Evening",   label: "Evening (4 PM – 7 PM)" },
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
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#F5EDE6] mb-4">
              Booking Received
            </h2>
            <p className="text-[#9A7060] text-lg mb-6">
              Thank you, <span className="font-semibold text-[#F5EDE6]">{form.name}</span>!
              Your request is in. We&apos;ll confirm your appointment shortly.
            </p>
            <div className="bg-[#0A0A0A]/60 rounded-2xl p-6 text-left mb-8 border border-[#E07898]/15">
              <div className="space-y-3 text-sm">
                {[
                  { label: "Service",          value: form.service },
                  { label: "Date",             value: form.date },
                  { label: "Time Preference",  value: form.timeSlot },
                  { label: "Technician",       value: form.technician || "Any Available" },
                  { label: "Phone",            value: form.phone },
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
            <Button onClick={() => { setStatus("idle"); setForm(initialForm); }}>
              Make Another Booking
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Book an Appointment"
            subtitle="Fill in your details below and we'll get back to you to confirm your slot."
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Info sidebar */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#1C1614] rounded-3xl p-7 border border-[#E07898]/20">
                <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#F5EDE6] mb-5">
                  Why Book With Us?
                </h3>
                {[
                  { icon: "✨", text: "Premium quality products and techniques" },
                  { icon: "🌸", text: "Personalized nail art just for you" },
                  { icon: "⏰", text: "Flexible appointment times" },
                  { icon: "💌", text: "Instant confirmation via email" },
                  { icon: "📱", text: "Easy rescheduling by phone" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-start gap-3 mb-4">
                    <span className="text-xl flex-shrink-0">{icon}</span>
                    <p className="text-[#9A7060] text-sm leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-[#E07898] to-[#C9956B] rounded-3xl p-7 text-white">
                <h3 className="font-semibold text-lg mb-2">Need help?</h3>
                <p className="text-white/80 text-sm mb-4">
                  Call or WhatsApp us directly and we&apos;ll set up your appointment.
                </p>
                <a
                  href="tel:+17542302480"
                  className="inline-block px-5 py-2 rounded-full bg-[#0A0A0A] text-[#E07898] font-semibold text-sm hover:bg-[#1C1614] transition-colors"
                >
                  Call Us Now
                </a>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="lg:col-span-3 bg-[#1C1614] rounded-3xl p-8 border border-[#E07898]/20 shadow-xl shadow-[#E07898]/5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <Input
                    label="Full Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Kristin Harricharan"
                    required
                  />
                </div>
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 (000) 000-0000"
                  required
                />
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="kristin@example.com"
                  required
                />
                <div className="sm:col-span-2">
                  <CustomSelect
                    label="Service"
                    value={form.service}
                    onChange={(val) => setForm((prev) => ({ ...prev, service: val }))}
                    options={serviceOptions}
                    placeholder="Select a service..."
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <CustomSelect
                    label="Preferred Technician"
                    value={form.technician}
                    onChange={(val) => setForm((prev) => ({ ...prev, technician: val }))}
                    options={technicianOptions}
                  />
                </div>
                <div className="sm:col-span-2">
                  <CalendarPicker
                    label="Preferred Date"
                    value={form.date}
                    onChange={(val) => setForm((prev) => ({ ...prev, date: val }))}
                    min={today}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <CustomSelect
                    label="Preferred Time"
                    value={form.timeSlot}
                    onChange={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        timeSlot: val as "Morning" | "Afternoon" | "Evening",
                      }))
                    }
                    options={timeOptions}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Textarea
                    label="Additional Notes"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Any special requests, nail inspo, allergies, etc."
                  />
                </div>
              </div>

              {status === "error" && (
                <div className="mt-4 p-4 rounded-xl bg-red-950/50 border border-red-500/30 text-red-400 text-sm">
                  {errorMessage}
                </div>
              )}

              <div className="mt-6">
                <Button type="submit" size="lg" className="w-full" disabled={status === "submitting"}>
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
