"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { PASSWORD_HINT, validatePassword } from "@/lib/password";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.mkisnails.com";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#9A7060]">Loading…</div>}>
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
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-normal text-[#1A1410] mb-2">Invite link missing</h1>
          <p className="text-[#6B5448] text-sm font-light">This page must be opened from your invite email.</p>
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
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-normal text-[#1A1410] mb-1">
          Welcome to <span className="italic text-[#C45E7A]">MKIS Nails</span>
        </h1>
        <p className="text-[#6B5448] text-sm font-light">Create your team account to get started.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADBD2] shadow-[0_30px_60px_-25px_rgba(26,20,16,0.15)] space-y-5">
        <div>
          <label htmlFor="signup-name" className="block text-[13px] font-medium text-[#1A1410] mb-1.5">Full Name</label>
          <input
            id="signup-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Jane Doe"
            className="w-full px-4 py-3 rounded-xl bg-white border border-[#EADBD2] text-[#1A1410] placeholder:text-[#A89484] focus:outline-none focus:ring-2 focus:ring-[#E07898]/30 focus:border-[#E07898] transition"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-[13px] font-medium text-[#1A1410] mb-1.5">Password</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Choose a strong password"
            className="w-full px-4 py-3 rounded-xl bg-white border border-[#EADBD2] text-[#1A1410] placeholder:text-[#A89484] focus:outline-none focus:ring-2 focus:ring-[#E07898]/30 focus:border-[#E07898] transition"
          />
          <p className="text-xs text-[#A89484] mt-1.5 font-light">{PASSWORD_HINT}</p>
        </div>

        <div>
          <label htmlFor="signup-confirm" className="block text-[13px] font-medium text-[#1A1410] mb-1.5">Confirm Password</label>
          <input
            id="signup-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl bg-white border border-[#EADBD2] text-[#1A1410] placeholder:text-[#A89484] focus:outline-none focus:ring-2 focus:ring-[#E07898]/30 focus:border-[#E07898] transition"
          />
        </div>

        {status === "error" && (
          <p className="text-red-500 text-sm text-center">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={status === "saving"}
          className="w-full py-3 rounded-full bg-[#E07898] text-white font-medium tracking-wide
                     hover:bg-[#C45E7A] hover:-translate-y-[1px] disabled:opacity-60 disabled:hover:translate-y-0
                     transition-all shadow-[0_8px_24px_-8px_rgba(224,120,152,0.55)]"
        >
          {status === "saving" ? "Creating account…" : "Create My Account"}
        </button>
      </form>
    </Layout>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FBF7F4] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#FCE7EE] blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#F1E3D3] blur-3xl opacity-50 pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <div className="rounded-full bg-[#1A1410] p-4 ring-1 ring-[#EADBD2] shadow-[0_12px_30px_-10px_rgba(26,20,16,0.3)]">
              <Image src="/logo.png" alt="MKIS" width={56} height={56} className="object-contain" />
            </div>
          </div>
        </div>
        {children}
        <p className="text-center text-[#A89484] text-xs mt-6 tracking-wide">
          MKIS Nail Saloon · Team Sign-up
        </p>
      </div>
    </div>
  );
}
