"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus]     = useState<"idle" | "loading" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const res = await fetch("/api/admin/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push("/admin");
    } else {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
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
              <label className="block text-sm font-medium text-[#F5EDE6]/80 mb-2">Email</label>
              <input
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
              <label className="block text-sm font-medium text-[#F5EDE6]/80 mb-2">Password</label>
              <input
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
                Incorrect email or password. Please try again.
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
          MKIS Nails Saloon · Admin Portal
        </p>
      </div>
    </div>
  );
}
