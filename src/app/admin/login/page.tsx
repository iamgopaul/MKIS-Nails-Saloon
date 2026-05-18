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
    <div className="min-h-screen bg-[#1A1410] flex items-center justify-center px-4 relative">
      {/* Soft decorative blooms */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#2E1F24] blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#2E251E] blur-3xl opacity-50 pointer-events-none" />

      <a href={SITE_URL} aria-label="Back to homepage"
        className="absolute top-6 left-6 flex items-center gap-2 px-3 py-2 rounded-full text-[#B8A89A] hover:text-[#D89AAE] hover:bg-[#2A1F18] transition-all z-10">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm font-medium">Back to site</span>
      </a>
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo-transparent.png" alt="MKIS Nails Salon" width={180} height={90} className="h-20 w-auto mb-4" />
          <h1 className="font-[family-name:var(--font-cormorant)] font-light text-3xl text-[#F0E4D8]">
            MKIS <span className="italic text-[#D89AAE]">Admin</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#2A1F18] rounded-lg p-8 border border-[#3A2E26]/60">
          <div className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-[13px] font-medium text-[#F0E4D8] mb-1.5">Email</label>
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
              <label htmlFor="login-password" className="block text-[13px] font-medium text-[#F0E4D8] mb-1.5">Password</label>
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
              <p className="text-red-400 text-sm text-center">
                {errorMsg || "Incorrect email or password. Please try again."}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 rounded-full bg-[#D89AAE] text-[#1A1410] font-medium tracking-wide
                         hover:bg-[#E5B0C2] hover:-translate-y-[1px] disabled:opacity-60 disabled:hover:translate-y-0
                         transition-all shadow-[0_8px_24px_-8px_rgba(216,154,174,0.4)]"
            >
              {status === "loading" ? "Signing in…" : "Sign In"}
            </button>
          </div>
        </form>

        <p className="text-center text-[#7A6657] text-xs mt-6 tracking-wide">
          MKIS Nail Salon · Admin Portal
        </p>
      </div>
    </div>
  );
}
