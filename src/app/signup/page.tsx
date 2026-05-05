"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PASSWORD_HINT, validatePassword } from "@/lib/password";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#9A7060]">Loading…</div>}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();
  const token        = searchParams.get("token") ?? "";

  const [name, setName]         = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [status, setStatus]     = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!token) {
    return (
      <Layout>
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#F5EDE6] mb-2">Invite link missing</h1>
          <p className="text-[#9A7060] text-sm">This page must be opened from your invite email.</p>
        </div>
      </Layout>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    if (!name.trim())          { setStatus("error"); setErrorMsg("Please enter your name."); return; }
    const pwdErr = validatePassword(password);
    if (pwdErr)                { setStatus("error"); setErrorMsg(pwdErr); return; }
    if (password !== confirm)  { setStatus("error"); setErrorMsg("Passwords don't match."); return; }

    setStatus("saving");
    const res = await fetch("/api/signup", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token, name, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus("error");
      setErrorMsg(data.error ?? "Could not create account.");
      return;
    }

    // Sign them in with the credentials they just chose
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email:    data.email,
      password,
    });
    if (signInErr) {
      // Account was created — they can log in manually
      router.push("/admin/login");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <Layout>
      <div className="flex flex-col items-center mb-6">
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#F5EDE6] mb-1">
          Welcome to <span className="bg-gradient-to-r from-[#E07898] to-[#C9956B] bg-clip-text text-transparent">MKIS Nails</span>
        </h1>
        <p className="text-[#9A7060] text-sm">Create your team account to get started.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#1C1614] rounded-3xl p-6 sm:p-8 border border-[#E07898]/20 shadow-2xl shadow-[#E07898]/5 space-y-5">
        <div>
          <label htmlFor="signup-name" className="block text-sm font-medium text-[#F5EDE6]/80 mb-2">Full Name</label>
          <input
            id="signup-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Jane Doe"
            className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#E07898]/20 text-[#F5EDE6] placeholder-[#9A7060]/50 focus:outline-none focus:border-[#E07898]/60 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-[#F5EDE6]/80 mb-2">Password</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Choose a strong password"
            className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#E07898]/20 text-[#F5EDE6] placeholder-[#9A7060]/50 focus:outline-none focus:border-[#E07898]/60 transition-colors"
          />
          <p className="text-xs text-[#9A7060]/70 mt-1.5">{PASSWORD_HINT}</p>
        </div>

        <div>
          <label htmlFor="signup-confirm" className="block text-sm font-medium text-[#F5EDE6]/80 mb-2">Confirm Password</label>
          <input
            id="signup-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#E07898]/20 text-[#F5EDE6] placeholder-[#9A7060]/50 focus:outline-none focus:border-[#E07898]/60 transition-colors"
          />
        </div>

        {status === "error" && (
          <p className="text-red-400 text-sm text-center">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={status === "saving"}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white font-semibold hover:from-[#C45E7A] hover:to-[#B07A52] disabled:opacity-60 transition-all shadow-lg shadow-[#E07898]/25"
        >
          {status === "saving" ? "Creating account…" : "Create My Account"}
        </button>
      </form>
    </Layout>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-[#E07898] blur-xl opacity-40" />
            <div className="relative rounded-full p-[3px] bg-gradient-to-br from-[#E07898] via-[#C9956B] to-[#D4A882]">
              <div className="rounded-full bg-[#0A0A0A] p-1">
                <Image src="/logo.png" alt="MKIS" width={56} height={56} className="rounded-full object-cover" />
              </div>
            </div>
          </div>
        </div>
        {children}
        <p className="text-center text-[#9A7060]/50 text-xs mt-6">
          MKIS Nail Saloon · Team Sign-up
        </p>
      </div>
    </div>
  );
}
