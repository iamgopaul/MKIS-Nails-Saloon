"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mkisnails.com";

export default function AdminLoginPage() {
  const router   = useRouter();
  const supabase = createClient();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus]     = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Background shows through to the page bg.png + scrim defined globally. */}
      <a href={SITE_URL} aria-label="Back to homepage"
        className="absolute top-6 left-6 flex items-center gap-2 px-3 py-2 rounded-full text-[#B8A89A] hover:text-[#D89AAE] hover:bg-[#2A1F18]/80 backdrop-blur-sm transition-all z-10">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-[11px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.18em] uppercase">Back to site</span>
      </a>

      <div className="relative w-full max-w-md">
        {/* Logo + heading */}
        <div className="flex flex-col items-center mb-10">
          <Image src="/logo-transparent.png" alt="MKIS Nails Salon" width={220} height={110} className="h-24 w-auto mb-5" />
          <p className="text-[11px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.28em] uppercase text-[#D89AAE] mb-3">
            Admin Portal
          </p>
          <h1 className="font-[family-name:var(--font-cormorant)] font-light text-4xl text-[#F0E4D8]">
            Welcome <span className="italic text-[#D89AAE]">back</span>
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#2A1F18]/95 backdrop-blur-sm rounded-xl p-8 border border-[#3A2E26]/60 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.5)]"
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-[11px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.2em] uppercase text-[#B8A89A] mb-2">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-lg bg-[#1A1410] border border-[#3A2E26]/60 text-[#F0E4D8]
                           placeholder:text-[#7A6657] focus:outline-none focus:ring-2 focus:ring-[#D89AAE]/30 focus:border-[#D89AAE] transition"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-[11px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.2em] uppercase text-[#B8A89A] mb-2">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg bg-[#1A1410] border border-[#3A2E26]/60 text-[#F0E4D8]
                           placeholder:text-[#7A6657] focus:outline-none focus:ring-2 focus:ring-[#D89AAE]/30 focus:border-[#D89AAE] transition"
              />
            </div>

            {status === "error" && (
              <div className="rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-2.5">
                <p className="text-red-300 text-sm text-center">
                  {errorMsg || "Incorrect email or password. Please try again."}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3.5 bg-[#D89AAE] text-[#1A1410] text-[11px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.2em] uppercase
                         hover:bg-[#E5B0C2] disabled:opacity-60 transition-colors"
            >
              {status === "loading" ? "Signing in…" : "Sign In"}
            </button>
          </div>
        </form>

        <p className="text-center text-[#7A6657] text-[10px] mt-6 tracking-[0.25em] uppercase font-[family-name:var(--font-montserrat)]">
          MKIS Nails · Staff Portal
        </p>
      </div>
    </div>
  );
}
