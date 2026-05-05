"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SetupPage() {
  const router   = useRouter();
  const supabase = createClient();
  const [checking, setChecking] = useState(true);
  const [email, setEmail]       = useState("");
  const [name, setName]         = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [status, setStatus]     = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/admin/login");
        return;
      }
      setEmail(user.email ?? "");
      setName(String(user.user_metadata?.full_name ?? ""));
      setChecking(false);
    })();
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    if (password.length < 8)         { setErrorMsg("Password must be at least 8 characters."); setStatus("error"); return; }
    if (password !== confirm)        { setErrorMsg("Passwords don't match."); setStatus("error"); return; }
    if (!name.trim())                { setErrorMsg("Please enter your name."); setStatus("error"); return; }

    setStatus("saving");
    const { error } = await supabase.auth.updateUser({
      password,
      data: { full_name: name },
    });
    if (error) { setStatus("error"); setErrorMsg(error.message); return; }

    // Sync the name into the profile + team row
    await fetch("/api/me/setup-name", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name }),
    }).catch(() => {});

    router.push("/admin");
    router.refresh();
  }

  if (checking) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#9A7060]">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-[#E07898] blur-xl opacity-40" />
            <div className="relative rounded-full p-[3px] bg-gradient-to-br from-[#E07898] via-[#C9956B] to-[#D4A882]">
              <div className="rounded-full bg-[#0A0A0A] p-1">
                <Image src="/logo.png" alt="MKIS" width={56} height={56} className="rounded-full object-cover" />
              </div>
            </div>
          </div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#F5EDE6] mb-1">
            Welcome to <span className="bg-gradient-to-r from-[#E07898] to-[#C9956B] bg-clip-text text-transparent">MKIS Nails</span>
          </h1>
          <p className="text-[#9A7060] text-sm">Finish setting up your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1C1614] rounded-3xl p-8 border border-[#E07898]/20 shadow-2xl shadow-[#E07898]/5">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#F5EDE6]/80 mb-2">Email</label>
              <p className="px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#E07898]/10 text-[#9A7060] text-sm">
                {email}
              </p>
            </div>

            <div>
              <label htmlFor="setup-name" className="block text-sm font-medium text-[#F5EDE6]/80 mb-2">Your Name</label>
              <input
                id="setup-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Jane Doe"
                className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#E07898]/20 text-[#F5EDE6] placeholder-[#9A7060]/50 focus:outline-none focus:border-[#E07898]/60 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="setup-password" className="block text-sm font-medium text-[#F5EDE6]/80 mb-2">Password</label>
              <input
                id="setup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#E07898]/20 text-[#F5EDE6] placeholder-[#9A7060]/50 focus:outline-none focus:border-[#E07898]/60 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="setup-confirm" className="block text-sm font-medium text-[#F5EDE6]/80 mb-2">Confirm Password</label>
              <input
                id="setup-confirm"
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
              {status === "saving" ? "Setting up…" : "Activate Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
