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
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative">
      <a href={SITE_URL} aria-label="Back to homepage"
        className="absolute top-6 left-6 flex items-center gap-2 px-3 py-2 rounded-full text-[#9A7060] hover:text-[#E07898] hover:bg-[#1C1614] transition-all">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm font-medium">Back to site</span>
      </a>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-[#E07898] blur-xl opacity-40" />
            <div className="relative rounded-full p-[3px] bg-gradient-to-br from-[#E07898] via-[#C9956B] to-[#D4A882]">
              <div className="rounded-full bg-[#0A0A0A] p-1">
                <Image src="/logo.png" alt="MKIS" width={56} height={56} className="rounded-full object-cover" />
              </div>
            </div>
          </div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#F5EDE6]">
            MKIS <span className="bg-gradient-to-r from-[#E07898] to-[#C9956B] bg-clip-text text-transparent">Admin</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1C1614] rounded-3xl p-8 border border-[#E07898]/20 shadow-2xl shadow-[#E07898]/5">
          <div className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-[#F5EDE6]/80 mb-2">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#E07898]/20 text-[#F5EDE6]
                           placeholder-[#9A7060]/50 focus:outline-none focus:border-[#E07898]/60 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-[#F5EDE6]/80 mb-2">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#E07898]/20 text-[#F5EDE6]
                           placeholder-[#9A7060]/50 focus:outline-none focus:border-[#E07898]/60 transition-colors"
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white font-semibold
                         hover:from-[#C45E7A] hover:to-[#B07A52] disabled:opacity-60 transition-all shadow-lg shadow-[#E07898]/25"
            >
              {status === "loading" ? "Signing in…" : "Sign In"}
            </button>
          </div>
        </form>

        <p className="text-center text-[#9A7060]/50 text-xs mt-6">
          MKIS Nail Saloon · Admin Portal
        </p>
      </div>
    </div>
  );
}
