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
        <h1 className="font-[family-name:var(--font-cormorant)] text-2xl font-normal text-[#F0E4D8] mb-1">
          Welcome to <span className="italic text-[#D89AAE]">MKIS Nails</span>
        </h1>
        <p className="text-[#B8A89A] text-sm font-light">Create your team account to get started.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#2A1F18] rounded-3xl p-6 sm:p-8 border border-[#3A2E26] shadow-[0_30px_60px_-25px_rgba(26,20,16,0.15)] space-y-5">
        <div>
          <label htmlFor="signup-name" className="block text-[13px] font-medium text-[#F0E4D8] mb-1.5">Full Name</label>
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
          <label htmlFor="signup-password" className="block text-[13px] font-medium text-[#F0E4D8] mb-1.5">Password</label>
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
          <label htmlFor="signup-confirm" className="block text-[13px] font-medium text-[#F0E4D8] mb-1.5">Confirm Password</label>
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
          <p className="text-red-400 text-sm text-center">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={status === "saving"}
          className="w-full py-3 rounded-full bg-[#D89AAE] text-[#1A1410] font-medium tracking-wide
                     hover:bg-[#E5B0C2] hover:-translate-y-[1px] disabled:opacity-60 disabled:hover:translate-y-0
                     transition-all shadow-[0_8px_24px_-8px_rgba(216,154,174,0.4)]"
        >
          {status === "saving" ? "Creating account…" : "Create My Account"}
        </button>
      </form>
    </Layout>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#1A1410] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#2E1F24] blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#2E251E] blur-3xl opacity-50 pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Image src="/logo-transparent.png" alt="MKIS Nails Salon" width={180} height={90} className="h-20 w-auto mb-4" />
        </div>
        {children}
        <p className="text-center text-[#7A6657] text-xs mt-6 tracking-wide">
          MKIS Nail Salon · Team Sign-up
        </p>
      </div>
    </div>
  );
}
