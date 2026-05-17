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
    <div className="min-h-screen bg-[#FBF7F4] flex items-center justify-center px-4 relative">
      {/* Soft decorative blooms */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#FCE7EE] blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#F1E3D3] blur-3xl opacity-50 pointer-events-none" />

      <a href={SITE_URL} aria-label="Back to homepage"
        className="absolute top-6 left-6 flex items-center gap-2 px-3 py-2 rounded-full text-[#6B5448] hover:text-[#C45E7A] hover:bg-white transition-all z-10">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm font-medium">Back to site</span>
      </a>
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <Image src="/mkislogo.png" alt="MKIS" width={80} height={80} className="rounded-2xl ring-1 ring-[#EADBD2] shadow-[0_14px_30px_-12px_rgba(26,20,16,0.3)]" />
          </div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-normal text-[#1A1410]">
            MKIS <span className="italic text-[#C45E7A]">Admin</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-[#EADBD2] shadow-[0_30px_60px_-25px_rgba(26,20,16,0.15)]">
          <div className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-[13px] font-medium text-[#1A1410] mb-1.5">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl bg-white border border-[#EADBD2] text-[#1A1410]
                           placeholder:text-[#A89484] focus:outline-none focus:ring-2 focus:ring-[#E07898]/30 focus:border-[#E07898] transition"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-[13px] font-medium text-[#1A1410] mb-1.5">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-white border border-[#EADBD2] text-[#1A1410]
                           placeholder:text-[#A89484] focus:outline-none focus:ring-2 focus:ring-[#E07898]/30 focus:border-[#E07898] transition"
              />
            </div>

            {status === "error" && (
              <p className="text-red-500 text-sm text-center">
                {errorMsg || "Incorrect email or password. Please try again."}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 rounded-full bg-[#E07898] text-white font-medium tracking-wide
                         hover:bg-[#C45E7A] hover:-translate-y-[1px] disabled:opacity-60 disabled:hover:translate-y-0
                         transition-all shadow-[0_8px_24px_-8px_rgba(224,120,152,0.55)]"
            >
              {status === "loading" ? "Signing in…" : "Sign In"}
            </button>
          </div>
        </form>

        <p className="text-center text-[#A89484] text-xs mt-6 tracking-wide">
          MKIS Nail Saloon · Admin Portal
        </p>
      </div>
    </div>
  );
}
