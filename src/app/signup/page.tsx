"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { PASSWORD_HINT, validatePassword } from "@/lib/password";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.mkisnails.com";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1A1410] flex items-center justify-center text-[#B8A89A]">Loading…</div>}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const searchParams = useSearchParams();
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
          <h1 className="font-[family-name:var(--font-cormorant)] text-2xl font-normal text-[#F0E4D8] mb-2">Invite link missing</h1>
          <p className="text-[#B8A89A] text-sm font-light">This page must be opened from your invite email.</p>
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
    let res: Response;
    try {
      res = await fetch("/api/signup", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, name, password }),
      });
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? `Network error: ${e.message}` : "Network error.");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setErrorMsg(`${data.error ?? "Could not create account."} (status ${res.status})`);
      return;
    }

    // Account exists — sign in happens on the admin subdomain so the
    // session cookie lands on the right host.
    const target = new URL("/admin/login", ADMIN_URL);
    if (data.email) target.searchParams.set("email", data.email);
    window.location.assign(target.toString());
  }

  return (
    <Layout>
      <div className="flex flex-col items-center mb-6">
        <h1 className="font-[family-name:var(--font-cormorant)] font-light text-4xl text-[#F0E4D8] mb-2 text-center">
          Welcome to <span className="italic text-[#D89AAE]">MKIS Nails</span>
        </h1>
        <p className="text-[#B8A89A] text-sm font-light">Create your account to get started.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#2A1F18]/95 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-[#3A2E26]/60 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.5)] space-y-5"
      >
        <div>
          <label htmlFor="signup-name" className="block text-[11px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.2em] uppercase text-[#B8A89A] mb-2">
            Full Name
          </label>
          <input
            id="signup-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Jane Doe"
            className="w-full px-4 py-3 rounded-lg bg-[#1A1410] border border-[#3A2E26]/60 text-[#F0E4D8] placeholder:text-[#7A6657] focus:outline-none focus:ring-2 focus:ring-[#D89AAE]/30 focus:border-[#D89AAE] transition"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-[11px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.2em] uppercase text-[#B8A89A] mb-2">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Choose a strong password"
            className="w-full px-4 py-3 rounded-lg bg-[#1A1410] border border-[#3A2E26]/60 text-[#F0E4D8] placeholder:text-[#7A6657] focus:outline-none focus:ring-2 focus:ring-[#D89AAE]/30 focus:border-[#D89AAE] transition"
          />
          <p className="text-xs text-[#7A6657] mt-1.5 font-light">{PASSWORD_HINT}</p>
        </div>

        <div>
          <label htmlFor="signup-confirm" className="block text-[11px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.2em] uppercase text-[#B8A89A] mb-2">
            Confirm Password
          </label>
          <input
            id="signup-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-lg bg-[#1A1410] border border-[#3A2E26]/60 text-[#F0E4D8] placeholder:text-[#7A6657] focus:outline-none focus:ring-2 focus:ring-[#D89AAE]/30 focus:border-[#D89AAE] transition"
          />
        </div>

        {status === "error" && (
          <div className="rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-2.5">
            <p className="text-red-300 text-sm text-center">{errorMsg}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={status === "saving"}
          className="w-full py-3.5 bg-[#D89AAE] text-[#1A1410] text-[11px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.2em] uppercase
                     hover:bg-[#E5B0C2] disabled:opacity-60 transition-colors"
        >
          {status === "saving" ? "Creating account…" : "Create My Account"}
        </button>
      </form>
    </Layout>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative">
      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo-transparent.png" alt="MKIS Nails Salon" width={220} height={110} className="h-24 w-auto mb-5" />
          <p className="text-[11px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.28em] uppercase text-[#D89AAE]">
            Team Sign-up
          </p>
        </div>
        {children}
        <p className="text-center text-[#7A6657] text-[10px] mt-6 tracking-[0.25em] uppercase font-[family-name:var(--font-montserrat)]">
          MKIS Nails · Staff Portal
        </p>
      </div>
    </div>
  );
}
