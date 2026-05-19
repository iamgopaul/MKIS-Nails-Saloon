"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ImageCropModal from "@/components/ui/ImageCropModal";
import { PASSWORD_HINT, validatePassword } from "@/lib/password";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamMember  { id: string; user_id: string | null; name: string; role: string; bio: string; photo_url: string; display_order: number; active: boolean; }
interface ServiceItem { id: string; name: string; description: string; duration_minutes: number; price: string; icon: string; display_order: number; active: boolean; }
interface GalleryItem { id: string; name: string; category: string; image_url: string; display_order: number; active: boolean; added_at: string; }
interface BookingRow  { id: string; client_name: string; client_phone: string | null; client_email: string | null; service_name: string; technician_id: string | null; technician_name: string | null; preferred_date: string; start_time: string | null; end_time: string | null; status: string; notes: string; }

interface Session { userId: string; email: string | null; role: "admin" | "team"; fullName: string; }

interface ReviewRow {
  id:           string;
  client_name:  string;
  review:       string;
  rating:       number;
  status:       "pending" | "approved" | "rejected";
  submitted_at: string;
  approved_at:  string | null;
}

type AdminTab = "home" | "bookings" | "reviews" | "team" | "services" | "gallery" | "content" | "profile";

const CONTENT_LABELS: Record<string, string> = {
  hero_title:           "Hero Title",
  hero_subtitle:        "Hero Subtitle",
  about_title:          "About Section Title",
  about_subtitle:       "About Section Subtitle",
  contact_phone:        "Phone Number",
  contact_email:        "Contact Email",
  contact_address:      "Address",
  hours_weekday:        "Weekday Hours",
  hours_saturday:       "Saturday Hours",
  hours_sunday:         "Sunday Hours",
};

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Field({ label, value, onChange, multiline, type = "text" }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; type?: string }) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-[#B8A89A] uppercase tracking-wider mb-1.5">{label}</label>
      {multiline ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={3}
          className="w-full px-3 py-2 rounded-xl bg-[#1A1410] border border-[#D89AAE]/20 text-[#F0E4D8] text-sm focus:outline-none focus:border-[#D89AAE]/60 resize-none transition-colors" />
      ) : (
        <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-[#1A1410] border border-[#D89AAE]/20 text-[#F0E4D8] text-sm focus:outline-none focus:border-[#D89AAE]/60 transition-colors" />
      )}
    </div>
  );
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl
      ${ok ? "bg-[#2A1F18] border border-[#D89AAE]/40 text-[#D89AAE]" : "bg-red-950 border border-red-500/40 text-red-400"}`}>
      {msg}
    </div>
  );
}

function ImageUpload({ currentUrl, onUrl, label = "Photo / Image", aspect = 1 }: { currentUrl: string; onUrl: (url: string) => void; label?: string; aspect?: number }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("photo.jpg");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    // Open crop modal — actual upload happens after the user confirms
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewSrc(reader.result as string);
      setPreviewName(file.name);
    };
    reader.readAsDataURL(file);
    // Reset the input so the same file can be re-selected
    if (fileRef.current) fileRef.current.value = "";
  }

  async function uploadBlob(blob: Blob) {
    setUploading(true); setError("");
    const form = new FormData();
    form.append("file", new File([blob], previewName, { type: blob.type || "image/jpeg" }));
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    setPreviewSrc(null);
    if (res.ok) onUrl(data.url);
    else       setError(data.error ?? "Upload failed");
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-[#B8A89A] uppercase tracking-wider">{label}</label>
      <div className="flex gap-3 items-center">
        <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#D89AAE]/20 flex-shrink-0 bg-[#1A1410] flex items-center justify-center">
          {currentUrl
            ? <Image src={currentUrl} alt="" width={64} height={64} className="w-full h-full object-cover" unoptimized />
            : <svg className="w-6 h-6 text-[#B8A89A]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>}
        </div>
        <div className="flex-1">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="px-4 py-2 rounded-xl bg-[#1A1410] border border-[#D89AAE]/30 text-[#F0E4D8] text-sm font-medium hover:border-[#D89AAE]/60 hover:bg-[#D89AAE]/10 disabled:opacity-50 transition-colors">
            {uploading ? "Uploading…" : (currentUrl ? "Replace Image" : "Upload Image")}
          </button>
          {currentUrl && !uploading && (
            <button type="button" onClick={() => onUrl("")}
              className="ml-2 px-3 py-2 rounded-xl text-[#B8A89A] text-sm hover:text-red-400 transition-colors">
              Remove
            </button>
          )}
          <p className="text-xs text-[#B8A89A]/60 mt-1.5">JPEG, PNG, WebP, or GIF</p>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" aria-label="Upload image file" className="hidden" onChange={handleFile} />
      {error && <p className="text-red-400 text-xs">{error}</p>}

      {previewSrc && (
        <ImageCropModal
          src={previewSrc}
          aspect={aspect}
          onCancel={() => setPreviewSrc(null)}
          onConfirm={uploadBlob}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router   = useRouter();
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [myTeam,  setMyTeam]  = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    fetch("/api/me")
      .then(async (r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setSession(data.session); setMyTeam(data.team); setLoading(false); })
      .catch(() => { router.push("/admin/login"); });
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  if (loading || !session) {
    return <div className="min-h-screen bg-[#1A1410] flex items-center justify-center text-[#B8A89A]">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-[#1A1410] text-[#F0E4D8]">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
      <Header session={session} onLogout={logout} />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        <AdminDashboard
          session={session}
          myTeam={myTeam}
          showToast={showToast}
          reload={() => {
            fetch("/api/me").then(r => r.json()).then(d => { setSession(d.session); setMyTeam(d.team); });
          }}
        />
      </div>
    </div>
  );
}

function Header({ session, onLogout }: { session: Session; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-40 bg-[#1A1410]/95 backdrop-blur-sm border-b border-[#D89AAE]/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <Image src="/logomkis.png" alt="MKIS" width={36} height={36} className="rounded-full object-cover ring-1 ring-[#D89AAE]/30" />
          </div>
          <div className="min-w-0">
            <span className="font-[family-name:var(--font-cormorant)] text-base sm:text-lg font-bold whitespace-nowrap">
              MKIS <span className="bg-gradient-to-r from-[#D89AAE] to-[#C9956B] bg-clip-text text-transparent">{session.role === "admin" ? "Admin" : "Team"}</span>
            </span>
            {session.email && <p className="text-xs text-[#B8A89A] truncate hidden sm:block">{session.email}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          <a href="/" aria-label="Back to public site"
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm text-[#B8A89A] hover:text-[#D89AAE] hover:bg-[#D89AAE]/10 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back to Site</span>
          </a>
          <button type="button" onClick={onLogout}
            className="px-3 sm:px-4 py-1.5 rounded-full border border-[#D89AAE]/30 text-xs sm:text-sm text-[#B8A89A] hover:border-[#D89AAE]/60 hover:text-[#F0E4D8] transition-all whitespace-nowrap">
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}


// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────

function AdminDashboard({ session, myTeam, showToast, reload }: {
  session: Session;
  myTeam: TeamMember | null;
  showToast: (m: string, ok?: boolean) => void;
  reload: () => void;
}) {
  const [tab, setTab] = useState<AdminTab>("home");

  const isAdmin = session.role === "admin";
  const allTabs: { key: AdminTab; label: string; icon: string; adminOnly?: boolean }[] = [
    { key: "home",     label: "Home",       icon: "🏠" },
    { key: "bookings", label: "Bookings",   icon: "📅" },
    { key: "gallery",  label: isAdmin ? "Gallery" : "My Styles", icon: "🖼️" },
    { key: "reviews",  label: "Reviews",    icon: "⭐", adminOnly: true },
    { key: "team",     label: "Team",       icon: "👥", adminOnly: true },
    { key: "services", label: "Services",   icon: "💅", adminOnly: true },
    { key: "content",  label: "Content",    icon: "✏️", adminOnly: true },
    { key: "profile",  label: "Profile",    icon: "👤" },
  ];
  const tabs = allTabs.filter((t) => isAdmin || !t.adminOnly);

  return (
    <>
      <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 pb-2 sm:pb-0 hide-scrollbar">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
              tab === t.key
                ? "bg-gradient-to-r from-[#D89AAE] to-[#C9956B] text-white shadow-lg shadow-[#D89AAE]/25"
                : "bg-[#2A1F18] border border-[#D89AAE]/15 text-[#B8A89A] hover:border-[#D89AAE]/40 hover:text-[#F0E4D8]"
            }`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {tab === "home"     && <HomeTab     session={session} myTeam={myTeam} />}
      {tab === "bookings" && <BookingsTab />}
      {tab === "reviews"  && <ReviewsTab  showToast={showToast} />}
      {tab === "team"     && <TeamTab     showToast={showToast} />}
      {tab === "services" && <ServicesTab showToast={showToast} />}
      {tab === "gallery"  && <GalleryTab  showToast={showToast} session={session} />}
      {tab === "content"  && <ContentTab  showToast={showToast} />}
      {tab === "profile"  && <ProfileTab  session={session} myTeam={myTeam} showToast={showToast} reload={reload} />}
    </>
  );
}

// ─── HOME TAB (clean welcome + today's preview) ──────────────────────────────

function HomeTab({ session, myTeam }: { session: Session; myTeam: TeamMember | null }) {
  const [todayList, setTodayList] = useState<BookingRow[]>([]);
  const [stats, setStats] = useState({ todayBookings: 0, upcoming: 0, teamSize: 0 });

  useEffect(() => {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];

    // Today's bookings (full list — admin sees all; team sees own)
    const list = supabase
      .from("bookings")
      .select("*")
      .eq("preferred_date", today)
      .order("start_time", { ascending: true });
    if (session.role === "team" && myTeam) list.eq("technician_id", myTeam.id);
    list.then(({ data }) => setTodayList(data ?? []));

    // Stats (admin only)
    if (session.role === "admin") {
      Promise.all([
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("preferred_date", today),
        supabase.from("bookings").select("id", { count: "exact", head: true }).gte("preferred_date", today),
        supabase.from("team").select("id", { count: "exact", head: true }).eq("active", true),
      ]).then(([t, u, tm]) => {
        setStats({ todayBookings: t.count ?? 0, upcoming: u.count ?? 0, teamSize: tm.count ?? 0 });
      });
    }
  }, [session, myTeam]);

  // Show first name only — falls back to email prefix if no full name set
  const firstName = (session.fullName || (session.email ?? "").split("@")[0] || "there").split(" ")[0];
  const todayLong = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-[#2A1F18] to-[#1A1410] rounded-3xl p-6 sm:p-8 border border-[#D89AAE]/30 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-[#D89AAE]/10 blur-3xl" />
        <div className="relative">
          <p className="text-[#B8A89A] text-sm uppercase tracking-wider mb-2">{todayLong}</p>
          <h2 className="font-[family-name:var(--font-cormorant)] text-2xl sm:text-3xl font-bold text-[#F0E4D8]">
            Hey welcome, {firstName}! <span className="text-[#D89AAE]">👋</span>
          </h2>
          <p className="text-[#B8A89A] mt-2">
            {todayList.length === 0
              ? "No appointments scheduled today."
              : `You have ${todayList.length} appointment${todayList.length === 1 ? "" : "s"} today.`}
          </p>
        </div>
      </div>

      {/* Stats — admin only */}
      {session.role === "admin" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Today's Bookings" value={stats.todayBookings} accent="from-[#D89AAE] to-[#C9956B]" />
          <StatCard label="Total Upcoming"   value={stats.upcoming}      accent="from-[#C9956B] to-[#C9956B]" />
          <StatCard label="Active Team"      value={stats.teamSize}      accent="from-[#D89AAE] to-[#D89AAE]" />
        </div>
      )}

      {/* Today's appointments preview */}
      <div>
        <h3 className="font-[family-name:var(--font-cormorant)] text-xl font-bold mb-4">Today&apos;s Schedule</h3>
        {todayList.length === 0 ? (
          <div className="bg-[#2A1F18] rounded-3xl p-10 border border-[#D89AAE]/15 text-center">
            <p className="text-[#B8A89A]">No appointments today. Enjoy the breather ✨</p>
          </div>
        ) : (
          <BookingsTable rows={todayList} />
        )}
      </div>
    </div>
  );
}

// ─── PROFILE TAB ─────────────────────────────────────────────────────────────

function ProfileTab({ session, myTeam, showToast, reload }: {
  session: Session;
  myTeam: TeamMember | null;
  showToast: (m: string, ok?: boolean) => void;
  reload: () => void;
}) {
  async function saveField(field: "name" | "bio" | "photo_url" | "role", value: string) {
    const res = await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) { showToast("Saved"); reload(); }
    else { const d = await res.json().catch(() => ({})); showToast(d.error ?? "Failed to save", false); }
  }

  async function createMyTeamListing() {
    const res = await fetch("/api/me/create-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: session.fullName || session.email,
        role: "Owner — Head Nail Technician",
      }),
    });
    if (res.ok) { showToast("Team listing created"); reload(); }
    else showToast("Failed to create listing", false);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="font-[family-name:var(--font-cormorant)] text-xl sm:text-2xl font-bold">My Profile</h2>
        <p className="text-[#B8A89A] text-sm mt-1">Each section saves on its own.</p>
      </div>

      {/* Name */}
      <ProfileSection
        label="Full Name"
        initial={session.fullName}
        onSave={(v) => saveField("name", v)}
      />

      {/* Email change */}
      <EmailSection initial={session.email ?? ""} showToast={showToast} />

      {/* Team listing prompt for users without one */}
      {!myTeam && (
        <div className="bg-[#2A1F18] rounded-2xl p-5 border border-[#D89AAE]/15 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-[#F0E4D8]">Public team listing</p>
            <p className="text-xs text-[#B8A89A] mt-1">Create one so your job title, bio, and photo show on the website.</p>
          </div>
          <button type="button" onClick={createMyTeamListing}
            className="px-4 py-2 rounded-full border border-[#D89AAE]/40 text-[#D89AAE] text-sm font-semibold hover:bg-[#D89AAE]/10 transition-all">
            + Create my listing
          </button>
        </div>
      )}

      {/* Role / Job Title */}
      {myTeam && (
        <ProfileSection
          label="Job Title"
          hint="e.g. Owner — Head Nail Technician, Senior Nail Technician, Nail Artist."
          initial={myTeam.role}
          onSave={(v) => saveField("role", v)}
        />
      )}

      {/* Bio */}
      {myTeam && (
        <ProfileSection
          label="Bio"
          hint="Shown on the public team section."
          initial={myTeam.bio}
          multiline
          onSave={(v) => saveField("bio", v)}
        />
      )}

      {/* Photo */}
      {myTeam && (
        <ProfilePhotoSection
          initial={myTeam.photo_url}
          onSave={(url) => saveField("photo_url", url)}
        />
      )}

      <PasswordSection showToast={showToast} />

      <TwoFactorSection showToast={showToast} />
    </div>
  );
}

function EmailSection({ initial, showToast }: { initial: string; showToast: (m: string, ok?: boolean) => void }) {
  const [email, setEmail] = useState(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setEmail(initial); }, [initial]);
  const dirty = email !== initial && email.includes("@");

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email });
    setSaving(false);
    if (error) showToast(error.message, false);
    else       showToast("Confirmation email sent — click the link to finish the change");
  }

  return (
    <div className="bg-[#2A1F18] rounded-2xl p-5 border border-[#D89AAE]/15 space-y-3">
      <Field label="Email" value={email} onChange={setEmail} type="email" />
      <p className="text-xs text-[#B8A89A]/60">
        Changing email sends a confirmation link to the new address. The change applies after you click it.
      </p>
      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={!dirty || saving}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D89AAE] to-[#C9956B] text-white text-sm font-semibold hover:from-[#C45E7A] hover:to-[#C9956B] disabled:opacity-40 transition-all">
          {saving ? "Sending…" : "Update Email"}
        </button>
      </div>
    </div>
  );
}

function TwoFactorSection({ showToast }: { showToast: (m: string, ok?: boolean) => void }) {
  type Phase = "loading" | "off" | "enrolling" | "on";
  const [phase, setPhase]     = useState<Phase>("loading");
  const [factorId, setFactorId] = useState("");
  const [qr, setQr]           = useState("");
  const [secret, setSecret]   = useState("");
  const [code, setCode]       = useState("");
  const [busy, setBusy]       = useState(false);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    const totp = data?.totp ?? [];
    const verified = totp.find((f) => f.status === "verified");
    if (verified) { setPhase("on"); setFactorId(verified.id); }
    else          { setPhase("off"); setFactorId(""); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function enroll() {
    setBusy(true);
    const supabase = createClient();
    // Clean any unverified factors first to avoid "already enrolled" error
    const { data: list } = await supabase.auth.mfa.listFactors();
    for (const f of list?.totp ?? []) {
      if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setBusy(false);
    if (error || !data) { showToast(error?.message ?? "Failed to start enrollment", false); return; }
    setFactorId(data.id);
    setQr(data.totp.qr_code);
    setSecret(data.totp.secret);
    setPhase("enrolling");
  }

  async function verify() {
    if (!code.trim()) return;
    setBusy(true);
    const supabase = createClient();
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr || !ch) { setBusy(false); showToast(chErr?.message ?? "Challenge failed", false); return; }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code });
    setBusy(false);
    if (error) showToast(error.message, false);
    else { showToast("Two-factor authentication enabled"); setCode(""); refresh(); }
  }

  async function disable() {
    if (!confirm("Disable two-factor authentication?")) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (error) showToast(error.message, false);
    else { showToast("Two-factor authentication disabled"); refresh(); }
  }

  return (
    <div className="bg-[#2A1F18] rounded-2xl p-5 border border-[#D89AAE]/15 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-[#F0E4D8]">Two-Factor Authentication</h3>
          <p className="text-xs text-[#B8A89A] mt-1">Adds a 6-digit code from an authenticator app on top of your password.</p>
        </div>
        {phase === "on" && (
          <span className="px-3 py-1 rounded-full bg-emerald-900/40 text-emerald-400 text-xs font-semibold">Enabled</span>
        )}
      </div>

      {phase === "loading" && <p className="text-xs text-[#B8A89A]">Loading…</p>}

      {phase === "off" && (
        <div className="flex justify-end">
          <button type="button" onClick={enroll} disabled={busy}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D89AAE] to-[#C9956B] text-white text-sm font-semibold hover:from-[#C45E7A] hover:to-[#C9956B] disabled:opacity-40 transition-all">
            {busy ? "Starting…" : "Enable 2FA"}
          </button>
        </div>
      )}

      {phase === "enrolling" && (
        <div className="space-y-3">
          <p className="text-sm text-[#F0E4D8]">
            1. Open your authenticator app (Google Authenticator, Authy, 1Password, etc.) and scan this QR code.
          </p>
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Scan to enroll 2FA" className="w-48 h-48 bg-white rounded-xl p-2" />
          )}
          <p className="text-xs text-[#B8A89A]">
            Or enter this secret manually: <code className="bg-[#1A1410] px-2 py-1 rounded font-mono text-[#F0E4D8]">{secret}</code>
          </p>
          <p className="text-sm text-[#F0E4D8]">2. Enter the 6-digit code from the app to confirm:</p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              aria-label="6-digit verification code"
              className="flex-1 px-3 py-2 rounded-xl bg-[#1A1410] border border-[#D89AAE]/20 text-[#F0E4D8] text-sm font-mono tracking-widest focus:outline-none focus:border-[#D89AAE]/60"
            />
            <button type="button" onClick={verify} disabled={code.length !== 6 || busy}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D89AAE] to-[#C9956B] text-white text-sm font-semibold disabled:opacity-40">
              {busy ? "Verifying…" : "Verify"}
            </button>
            <button type="button" onClick={() => { setPhase("off"); setCode(""); }} className="px-3 py-2 rounded-xl text-[#B8A89A] text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {phase === "on" && (
        <div className="flex justify-end">
          <button type="button" onClick={disable} disabled={busy}
            className="px-4 py-2 rounded-xl border border-red-500/40 text-red-400 text-sm font-semibold hover:bg-red-500/10 disabled:opacity-40 transition-all">
            {busy ? "Disabling…" : "Disable 2FA"}
          </button>
        </div>
      )}
    </div>
  );
}

function ProfileSection({ label, hint, initial, multiline, onSave }: {
  label: string;
  hint?: string;
  initial: string;
  multiline?: boolean;
  onSave: (v: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setValue(initial); }, [initial]);
  const dirty = value !== initial;

  async function save() {
    setSaving(true);
    await onSave(value);
    setSaving(false);
  }

  return (
    <div className="bg-[#2A1F18] rounded-2xl p-5 border border-[#D89AAE]/15 space-y-3">
      <Field label={label} value={value} onChange={setValue} multiline={multiline} />
      {hint && <p className="text-xs text-[#B8A89A]/60">{hint}</p>}
      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={!dirty || saving}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D89AAE] to-[#C9956B] text-white text-sm font-semibold hover:from-[#C45E7A] hover:to-[#C9956B] disabled:opacity-40 transition-all">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function ProfilePhotoSection({ initial, onSave }: { initial: string; onSave: (url: string) => Promise<void> | void }) {
  const [photo, setPhoto] = useState(initial);
  useEffect(() => { setPhoto(initial); }, [initial]);

  // Save the URL as soon as upload completes (since file upload returns the URL)
  async function handleUrl(url: string) {
    setPhoto(url);
    if (url !== initial) await onSave(url);
  }

  return (
    <div className="bg-[#2A1F18] rounded-2xl p-5 border border-[#D89AAE]/15">
      <ImageUpload label="Profile Photo" currentUrl={photo} onUrl={handleUrl} />
    </div>
  );
}

function PasswordSection({ showToast }: { showToast: (m: string, ok?: boolean) => void }) {
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving]   = useState(false);

  async function save() {
    const pwdErr = validatePassword(next);
    if (pwdErr)            { showToast(pwdErr, false); return; }
    if (next !== confirm)  { showToast("Passwords don't match", false); return; }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (error) showToast(error.message, false);
    else { showToast("Password updated"); setNext(""); setConfirm(""); }
  }

  return (
    <div className="bg-[#2A1F18] rounded-2xl p-5 border border-[#D89AAE]/15 space-y-3">
      <h3 className="text-sm font-semibold text-[#F0E4D8]">Change Password</h3>
      <p className="text-xs text-[#B8A89A]/70">{PASSWORD_HINT}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="New Password"     value={next}    onChange={setNext}    type="password" />
        <Field label="Confirm Password" value={confirm} onChange={setConfirm} type="password" />
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={!next || saving}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D89AAE] to-[#C9956B] text-white text-sm font-semibold hover:from-[#C45E7A] hover:to-[#C9956B] disabled:opacity-40 transition-all">
          {saving ? "Updating…" : "Update Password"}
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-[#2A1F18] rounded-3xl p-4 sm:p-6 border border-[#D89AAE]/15">
      <p className="text-xs font-semibold text-[#B8A89A] uppercase tracking-wider">{label}</p>
      <p className={`mt-2 text-4xl font-bold bg-gradient-to-r ${accent} bg-clip-text text-transparent`}>
        {value}
      </p>
    </div>
  );
}

// ─── BOOKINGS TAB ─────────────────────────────────────────────────────────────

function BookingsTab() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [filter, setFilter] = useState("");
  const [techFilter, setTechFilter] = useState<string>("all"); // "all" | "mine" | <team.id>
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [myRole, setMyRole]   = useState<"admin" | "team" | null>(null);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("bookings")
      .select("*")
      .order("preferred_date", { ascending: false })
      .order("start_time", { ascending: false })
      .limit(500)
      .then(({ data }) => setRows(data ?? []));
    supabase.from("team").select("*").eq("active", true).order("display_order").then(({ data }) => setTeam(data ?? []));
    fetch("/api/me").then((r) => r.json()).then((d) => {
      setMyTeamId(d.team?.id ?? null);
      setMyRole((d.session?.role as "admin" | "team") ?? null);
    });
  }, []);

  const filtered = rows.filter((r) => {
    // Technician filter
    if (techFilter === "mine" && myTeamId) {
      if (r.technician_id !== myTeamId) return false;
    } else if (techFilter !== "all" && techFilter !== "mine") {
      if (r.technician_id !== techFilter) return false;
    }
    // Search
    if (filter) {
      const s = filter.toLowerCase();
      if (!r.client_name.toLowerCase().includes(s) &&
          !r.service_name.toLowerCase().includes(s) &&
          !(r.technician_name ?? "").toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const upcoming = filtered.filter((r) => r.preferred_date >= new Date().toISOString().split("T")[0]);
  const past     = filtered.filter((r) => r.preferred_date <  new Date().toISOString().split("T")[0]);

  const canEdit = (r: BookingRow) =>
    myRole === "admin" || (myTeamId !== null && r.technician_id === myTeamId);

  async function changeStatus(row: BookingRow, next: string) {
    const previous = row.status;
    setRows((rs) => rs.map((r) => r.id === row.id ? { ...r, status: next } : r)); // optimistic
    const res = await fetch(`/api/bookings/${row.id}/status`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      // revert
      setRows((rs) => rs.map((r) => r.id === row.id ? { ...r, status: previous } : r));
      const json = await res.json().catch(() => ({}));
      alert(json.error ?? "Could not update status");
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="font-[family-name:var(--font-cormorant)] text-xl sm:text-2xl font-bold">Bookings</h2>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <select value={techFilter} onChange={(e) => setTechFilter(e.target.value)}
          aria-label="Filter by technician"
          className="px-3 py-2 rounded-xl bg-[#2A1F18] border border-[#D89AAE]/20 text-[#F0E4D8] text-sm focus:outline-none focus:border-[#D89AAE]/60 w-full sm:w-auto">
          <option value="all">All technicians</option>
          {myTeamId && <option value="mine">My bookings</option>}
          <optgroup label="By technician">
            {team.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </optgroup>
        </select>
        <input value={filter} onChange={(e) => setFilter(e.target.value)}
          placeholder="Search…"
          aria-label="Search bookings"
          className="px-4 py-2 rounded-xl bg-[#2A1F18] border border-[#D89AAE]/20 text-[#F0E4D8] text-sm focus:outline-none focus:border-[#D89AAE]/60 w-full sm:w-48" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#B8A89A] uppercase tracking-wider mb-3">Upcoming ({upcoming.length})</h3>
        {upcoming.length === 0 ? (
          <p className="text-[#B8A89A] text-sm">No upcoming bookings match your filters.</p>
        ) : <BookingsTable rows={upcoming} canEdit={canEdit} onStatusChange={changeStatus} />}
      </div>

      {past.length > 0 && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="text-sm font-semibold text-[#B8A89A] uppercase tracking-wider hover:text-[#D89AAE] transition-colors"
          >
            {showPast ? "▾" : "▸"} Past ({past.length})
          </button>
          {showPast && (
            <div className="mt-3">
              <BookingsTable rows={past} canEdit={canEdit} onStatusChange={changeStatus} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function statusBadge(status: string) {
  const cls = status === "Confirmed" ? "bg-emerald-900/40 text-emerald-400"
            : status === "Cancelled" ? "bg-red-900/40 text-red-400"
            : status === "Completed" ? "bg-[#D89AAE]/15 text-[#D89AAE]"
            : status === "No Show"   ? "bg-zinc-800/60 text-zinc-400"
            : "bg-amber-900/40 text-amber-400";
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{status}</span>;
}

const STATUS_OPTIONS = ["Pending", "Confirmed", "Completed", "No Show", "Cancelled"] as const;

function StatusSelect({ row, onChange }: { row: BookingRow; onChange: (next: string) => void }) {
  return (
    <select
      value={row.status}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`Status for ${row.client_name}`}
      className="bg-[#1A1410] border border-[#D89AAE]/25 text-[#F0E4D8] text-xs rounded-md px-2 py-1 focus:outline-none focus:border-[#D89AAE]/60"
    >
      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

function BookingsTable({
  rows,
  canEdit,
  onStatusChange,
}: {
  rows: BookingRow[];
  canEdit?: (row: BookingRow) => boolean;
  onStatusChange?: (row: BookingRow, next: string) => void;
}) {
  const renderStatus = (r: BookingRow) =>
    canEdit && onStatusChange && canEdit(r)
      ? <StatusSelect row={r} onChange={(next) => onStatusChange(r, next)} />
      : statusBadge(r.status);
  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {rows.map((r) => (
          <div key={r.id} className="bg-[#2A1F18] rounded-2xl border border-[#D89AAE]/15 p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-semibold text-[#F0E4D8]">{r.client_name}</p>
                {r.client_phone && <p className="text-xs text-[#B8A89A]">{r.client_phone}</p>}
              </div>
              {renderStatus(r)}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mt-3">
              <div>
                <p className="text-[#B8A89A] uppercase tracking-wider mb-0.5">Date</p>
                <p className="text-[#F0E4D8]">{r.preferred_date}</p>
              </div>
              <div>
                <p className="text-[#B8A89A] uppercase tracking-wider mb-0.5">Time</p>
                <p className="text-[#F0E4D8]">{r.start_time?.slice(0, 5) ?? "—"} – {r.end_time?.slice(0, 5) ?? "—"}</p>
              </div>
              <div>
                <p className="text-[#B8A89A] uppercase tracking-wider mb-0.5">Service</p>
                <p className="text-[#F0E4D8]">{r.service_name}</p>
              </div>
              <div>
                <p className="text-[#B8A89A] uppercase tracking-wider mb-0.5">Technician</p>
                <p className="text-[#F0E4D8]">{r.technician_name ?? "—"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-[#2A1F18] rounded-2xl border border-[#D89AAE]/15 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#1A1410]/50">
              <tr className="text-left text-[#B8A89A]">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">Technician</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-[#D89AAE]/10">
                  <td className="px-4 py-3 text-[#F0E4D8]">{r.preferred_date}</td>
                  <td className="px-4 py-3 text-[#B8A89A]">{r.start_time?.slice(0, 5) ?? "—"} – {r.end_time?.slice(0, 5) ?? "—"}</td>
                  <td className="px-4 py-3 text-[#F0E4D8]">
                    <div className="font-medium">{r.client_name}</div>
                    {r.client_phone && <div className="text-xs text-[#B8A89A]">{r.client_phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-[#B8A89A]">{r.service_name}</td>
                  <td className="px-4 py-3 text-[#B8A89A]">{r.technician_name ?? "—"}</td>
                  <td className="px-4 py-3">{renderStatus(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── REVIEWS TAB ──────────────────────────────────────────────────────────────

function ReviewsTab({ showToast }: { showToast: (m: string, ok?: boolean) => void }) {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const reload = useCallback(() => {
    fetch("/api/admin/reviews").then((r) => r.json()).then((d) => setRows(Array.isArray(d) ? d : []));
  }, []);
  useEffect(() => { reload(); }, [reload]);

  async function setStatus(id: string, status: "approved" | "rejected" | "pending") {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    });
    if (res.ok) {
      const verb = status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Reset to pending";
      showToast(verb);
      reload();
    } else showToast("Failed to update review", false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("Deleted"); reload(); }
    else showToast("Failed to delete", false);
  }

  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const pendingCount = rows.filter((r) => r.status === "pending").length;

  const filters: { key: typeof filter; label: string }[] = [
    { key: "pending",  label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all",      label: "All" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-[family-name:var(--font-cormorant)] text-xl sm:text-2xl font-bold">Client Reviews</h2>
          <p className="text-[#B8A89A] text-sm mt-1">Approve reviews to show them on the website.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap
                ${filter === f.key
                  ? "bg-gradient-to-r from-[#D89AAE] to-[#C9956B] text-white"
                  : "bg-[#2A1F18] border border-[#D89AAE]/15 text-[#B8A89A] hover:text-[#F0E4D8] hover:border-[#D89AAE]/40"
                }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="bg-[#2A1F18] rounded-3xl p-10 border border-[#D89AAE]/15 text-center text-[#B8A89A]">
          No {filter} reviews.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map((r) => (
            <div key={r.id} className="bg-[#2A1F18] rounded-2xl p-5 border border-[#D89AAE]/15">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-semibold text-[#F0E4D8]">{r.client_name}</p>
                  <div className="flex items-center gap-1 mt-1 text-sm" aria-label={`${r.rating} stars`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={n <= r.rating ? "text-[#D89AAE]" : "text-[#B8A89A]/30"}>★</span>
                    ))}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                  ${r.status === "approved" ? "bg-emerald-900/40 text-emerald-400"
                  : r.status === "rejected" ? "bg-red-900/40 text-red-400"
                  : "bg-amber-900/40 text-amber-400"}`}>
                  {r.status}
                </span>
              </div>
              <p className="text-[#F0E4D8] text-sm leading-relaxed italic mb-3">&ldquo;{r.review}&rdquo;</p>
              <p className="text-xs text-[#B8A89A]/60 mb-3">
                Submitted {new Date(r.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
              <div className="flex gap-2 flex-wrap">
                {r.status !== "approved" && (
                  <button type="button" onClick={() => setStatus(r.id, "approved")}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#D89AAE] to-[#C9956B] text-white">
                    ✓ Approve
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button type="button" onClick={() => setStatus(r.id, "rejected")}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-500/40 text-red-400 hover:bg-red-500/10">
                    ✕ Reject
                  </button>
                )}
                {r.status !== "pending" && (
                  <button type="button" onClick={() => setStatus(r.id, "pending")}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#D89AAE]/25 text-[#B8A89A] hover:text-[#F0E4D8] hover:border-[#D89AAE]/50">
                    Reset
                  </button>
                )}
                <button type="button" onClick={() => remove(r.id)}
                  className="ml-auto p-1.5 rounded-xl text-[#B8A89A]/50 hover:text-red-400 transition-colors text-xs">
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TEAM TAB ─────────────────────────────────────────────────────────────────

function TeamTab({ showToast }: { showToast: (m: string, ok?: boolean) => void }) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [draft, setDraft] = useState<Partial<TeamMember>>({});
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  const reload = useCallback(() => {
    fetch("/api/admin/team").then((r) => r.json()).then((d) => setTeam(Array.isArray(d) ? d : []));
  }, []);
  useEffect(() => { reload(); }, [reload]);

  async function sendInvite() {
    if (sendingInvite) return; // guard against double-click
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      showToast("Please enter a valid email", false); return;
    }
    setSendingInvite(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast("Invite sent! They'll receive an email shortly.");
        setInviting(false);
        setInviteEmail("");
        reload();
      } else {
        showToast(data.error ?? "Failed to send invite", false);
      }
    } finally {
      setSendingInvite(false);
    }
  }

  async function save() {
    if ("name" in draft && !draft.name?.trim()) { showToast("Name cannot be empty", false); return; }
    if (Object.keys(draft).length === 0) { setEditingId(null); return; }
    const res = await fetch(`/api/admin/team/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (res.ok) { showToast("Saved!"); setEditingId(null); setDraft({}); reload(); }
    else showToast("Failed to save", false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this team member?")) return;
    const res = await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
    if (res.ok) { reload(); showToast("Deleted"); }
    else showToast("Failed to delete", false);
  }

  async function toggle(m: TeamMember) {
    await fetch(`/api/admin/team/${m.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !m.active }) });
    reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-[family-name:var(--font-cormorant)] text-xl sm:text-2xl font-bold">Team Members</h2>
        <button type="button" onClick={() => { setInviting(true); setEditingId(null); }}
          className="px-4 py-2 rounded-full bg-gradient-to-r from-[#D89AAE] to-[#C9956B] text-white text-sm font-semibold hover:from-[#C45E7A] hover:to-[#C9956B] transition-all">
          ✉ Invite Team Member
        </button>
      </div>

      {inviting && (
        <div className="bg-[#2A1F18] rounded-3xl p-4 sm:p-6 border border-[#D89AAE]/40 space-y-4">
          <div>
            <h3 className="font-semibold text-[#D89AAE]">Invite Team Member</h3>
            <p className="text-xs text-[#B8A89A] mt-1">
              Enter their email — they&apos;ll get a sign-up link. Once they activate, they can fill in their name, role, bio, and photo themselves.
            </p>
          </div>
          <Field label="Email" value={inviteEmail} onChange={setInviteEmail} />
          <div className="flex gap-3">
            <button type="button" onClick={sendInvite} disabled={sendingInvite}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D89AAE] to-[#C9956B] text-white text-sm font-semibold hover:from-[#C45E7A] hover:to-[#C9956B] disabled:opacity-60 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2">
              {sendingInvite && <span className="inline-block w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />}
              {sendingInvite ? "Sending…" : "Send Invite Email"}
            </button>
            <button type="button" onClick={() => { setInviting(false); setInviteEmail(""); }} disabled={sendingInvite}
              className="px-5 py-2 rounded-xl border border-[#D89AAE]/25 text-[#B8A89A] text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((m) => (
          <div key={m.id} className={`bg-[#2A1F18] rounded-3xl border overflow-hidden ${editingId === m.id ? "border-[#D89AAE]/60" : "border-[#D89AAE]/15"}`}>
            {editingId === m.id ? (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Name" value={draft.name ?? m.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
                  <Field label="Role" value={draft.role ?? m.role} onChange={(v) => setDraft((d) => ({ ...d, role: v }))} />
                </div>
                <Field label="Bio" value={draft.bio ?? m.bio} onChange={(v) => setDraft((d) => ({ ...d, bio: v }))} multiline />
                <ImageUpload currentUrl={draft.photo_url ?? m.photo_url} onUrl={(url) => setDraft((d) => ({ ...d, photo_url: url }))} />
                <div className="flex gap-2">
                  <button type="button" onClick={save} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D89AAE] to-[#C9956B] text-white text-sm font-semibold">Save</button>
                  <button type="button" onClick={() => { setEditingId(null); setDraft({}); }} className="px-4 py-2 rounded-xl border border-[#D89AAE]/25 text-[#B8A89A] text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[#D89AAE]/20 flex-shrink-0 bg-[#1A1410]">
                    {m.photo_url
                      ? <Image src={m.photo_url} alt={m.name} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">💅</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#F0E4D8] truncate">{m.name}</p>
                    <p className="text-sm text-[#D89AAE]">{m.role}</p>
                    {m.user_id && <p className="text-xs text-[#B8A89A]/60 mt-0.5">Linked account</p>}
                  </div>
                </div>
                <p className="text-xs text-[#B8A89A] leading-relaxed line-clamp-2 mb-4">{m.bio}</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => { setEditingId(m.id); setDraft({}); }}
                    className="flex-1 py-1.5 rounded-xl border border-[#D89AAE]/25 text-[#B8A89A] text-xs font-medium hover:border-[#D89AAE]/50 hover:text-[#F0E4D8] transition-all">Edit</button>
                  <button type="button" onClick={() => toggle(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium ${m.active ? "bg-[#D89AAE]/15 text-[#D89AAE]" : "bg-[#1A1410] text-[#B8A89A]"}`}>
                    {m.active ? "Visible" : "Hidden"}
                  </button>
                  <button type="button" onClick={() => remove(m.id)} className="p-1.5 rounded-xl text-[#B8A89A]/50 hover:text-red-400 transition-colors text-xs">🗑</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SERVICES TAB ─────────────────────────────────────────────────────────────

function ServicesTab({ showToast }: { showToast: (m: string, ok?: boolean) => void }) {
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Partial<ServiceItem>>({});

  const reload = useCallback(() => {
    fetch("/api/admin/services").then((r) => r.json()).then((d) => setItems(Array.isArray(d) ? d : []));
  }, []);
  useEffect(() => { reload(); }, [reload]);

  async function save(isNew: boolean) {
    if (isNew && !draft.name?.trim())                  { showToast("Name is required", false); return; }
    if (!isNew && "name" in draft && !draft.name?.trim()) { showToast("Name cannot be empty", false); return; }
    if (!isNew && Object.keys(draft).length === 0)     { setEditingId(null); return; }
    const url = isNew ? "/api/admin/services" : `/api/admin/services/${editingId}`;
    const method = isNew ? "POST" : "PUT";
    const body: Record<string, unknown> = { ...draft };
    if ("duration_minutes" in body) body.duration_minutes = Number(body.duration_minutes) || 60;
    if (isNew) Object.assign(body, { display_order: items.length + 1, active: true, duration_minutes: Number(draft.duration_minutes) || 60 });
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { showToast("Saved!"); setEditingId(null); setAdding(false); setDraft({}); reload(); }
    else showToast("Failed to save", false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this service?")) return;
    const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (res.ok) { reload(); showToast("Deleted"); }
    else showToast("Failed to delete", false);
  }

  async function toggle(s: ServiceItem) {
    await fetch(`/api/admin/services/${s.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !s.active }) });
    reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-cormorant)] text-xl sm:text-2xl font-bold">Services</h2>
        <button type="button" onClick={() => { setAdding(true); setEditingId(null); setDraft({ active: true, icon: "💅", duration_minutes: 60 }); }}
          className="px-4 py-2 rounded-full bg-gradient-to-r from-[#D89AAE] to-[#C9956B] text-white text-sm font-semibold hover:from-[#C45E7A] hover:to-[#C9956B] transition-all">
          + Add Service
        </button>
      </div>
      <p className="text-[#B8A89A] text-sm">Duration sets how long the booking blocks for the technician. Use 30-min increments for cleanest scheduling.</p>

      {adding && (
        <div className="bg-[#2A1F18] rounded-3xl p-4 sm:p-6 border border-[#D89AAE]/40 space-y-4">
          <h3 className="font-semibold text-[#D89AAE]">New Service</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Icon" value={draft.icon ?? "💅"} onChange={(v) => setDraft((d) => ({ ...d, icon: v }))} />
            <div className="sm:col-span-2"><Field label="Service Name" value={draft.name ?? ""} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} /></div>
          </div>
          <Field label="Description" value={draft.description ?? ""} onChange={(v) => setDraft((d) => ({ ...d, description: v }))} multiline />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (e.g. $40)" value={draft.price ?? ""} onChange={(v) => setDraft((d) => ({ ...d, price: v }))} />
            <Field label="Duration (minutes)" type="number" value={String(draft.duration_minutes ?? 60)} onChange={(v) => setDraft((d) => ({ ...d, duration_minutes: Number(v) }))} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => save(true)} className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D89AAE] to-[#C9956B] text-white text-sm font-semibold">Save Service</button>
            <button type="button" onClick={() => { setAdding(false); setDraft({}); }} className="px-5 py-2 rounded-xl border border-[#D89AAE]/25 text-[#B8A89A] text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((s) => (
          <div key={s.id} className={`bg-[#2A1F18] rounded-3xl border overflow-hidden ${editingId === s.id ? "border-[#D89AAE]/60" : "border-[#D89AAE]/15"}`}>
            {editingId === s.id ? (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Icon" value={draft.icon ?? s.icon} onChange={(v) => setDraft((d) => ({ ...d, icon: v }))} />
                  <div className="sm:col-span-2"><Field label="Name" value={draft.name ?? s.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} /></div>
                </div>
                <Field label="Description" value={draft.description ?? s.description} onChange={(v) => setDraft((d) => ({ ...d, description: v }))} multiline />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Price" value={draft.price ?? s.price} onChange={(v) => setDraft((d) => ({ ...d, price: v }))} />
                  <Field label="Duration (minutes)" type="number" value={String(draft.duration_minutes ?? s.duration_minutes)} onChange={(v) => setDraft((d) => ({ ...d, duration_minutes: Number(v) }))} />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => save(false)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D89AAE] to-[#C9956B] text-white text-sm font-semibold">Save</button>
                  <button type="button" onClick={() => { setEditingId(null); setDraft({}); }} className="px-4 py-2 rounded-xl border border-[#D89AAE]/25 text-[#B8A89A] text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-2xl flex-shrink-0">{s.icon || "💅"}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-[#F0E4D8]">{s.name}</p>
                    <p className="text-xs text-[#B8A89A] mt-0.5 line-clamp-2">{s.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm mb-4">
                  <span className="text-[#D89AAE] font-bold">{s.price}</span>
                  <span className="text-[#B8A89A]">·</span>
                  <span className="text-[#B8A89A]">{s.duration_minutes} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => { setEditingId(s.id); setAdding(false); setDraft({}); }}
                    className="flex-1 py-1.5 rounded-xl border border-[#D89AAE]/25 text-[#B8A89A] text-xs font-medium hover:border-[#D89AAE]/50 hover:text-[#F0E4D8] transition-all">Edit</button>
                  <button type="button" onClick={() => toggle(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium ${s.active ? "bg-[#D89AAE]/15 text-[#D89AAE]" : "bg-[#1A1410] text-[#B8A89A]"}`}>
                    {s.active ? "Visible" : "Hidden"}
                  </button>
                  <button type="button" onClick={() => remove(s.id)} className="p-1.5 rounded-xl text-[#B8A89A]/50 hover:text-red-400 transition-colors text-xs">🗑</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GALLERY TAB ──────────────────────────────────────────────────────────────

function GalleryTab({ showToast, session }: { showToast: (m: string, ok?: boolean) => void; session: Session }) {
  const isAdmin = session.role === "admin";
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Partial<GalleryItem>>({});

  const reload = useCallback(() => {
    fetch("/api/admin/gallery").then((r) => r.json()).then((d) => setItems(Array.isArray(d) ? d : []));
  }, []);
  useEffect(() => { reload(); }, [reload]);

  async function save(isNew: boolean) {
    if (isNew && !draft.name?.trim())                  { showToast("Name is required", false); return; }
    if (!isNew && "name" in draft && !draft.name?.trim()) { showToast("Name cannot be empty", false); return; }
    if (!isNew && Object.keys(draft).length === 0)     { setEditingId(null); return; }
    const url = isNew ? "/api/admin/gallery" : `/api/admin/gallery/${editingId}`;
    const method = isNew ? "POST" : "PUT";
    const body = { ...draft };
    if (isNew) Object.assign(body, { display_order: items.length + 1, active: true });
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { showToast("Saved!"); setEditingId(null); setAdding(false); setDraft({}); reload(); }
    else showToast("Failed to save", false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this gallery item?")) return;
    const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
    if (res.ok) { reload(); showToast("Deleted"); }
    else showToast("Failed to delete", false);
  }

  async function toggle(g: GalleryItem) {
    await fetch(`/api/admin/gallery/${g.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !g.active }) });
    reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-cormorant)] text-xl sm:text-2xl font-bold">Gallery</h2>
        <button type="button" onClick={() => { setAdding(true); setEditingId(null); setDraft({ active: true }); }}
          className="px-4 py-2 rounded-full bg-gradient-to-r from-[#D89AAE] to-[#C9956B] text-white text-sm font-semibold hover:from-[#C45E7A] hover:to-[#C9956B] transition-all">
          + Add Design
        </button>
      </div>

      {adding && (
        <div className="bg-[#2A1F18] rounded-3xl p-4 sm:p-6 border border-[#D89AAE]/40 space-y-4">
          <h3 className="font-semibold text-[#D89AAE]">New Gallery Item</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Design Name" value={draft.name ?? ""} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
            <Field label="Category" value={draft.category ?? ""} onChange={(v) => setDraft((d) => ({ ...d, category: v }))} />
          </div>
          <ImageUpload currentUrl={draft.image_url ?? ""} onUrl={(url) => setDraft((d) => ({ ...d, image_url: url }))} />
          <div className="flex gap-3">
            <button type="button" onClick={() => save(true)} className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D89AAE] to-[#C9956B] text-white text-sm font-semibold">Save Design</button>
            <button type="button" onClick={() => { setAdding(false); setDraft({}); }} className="px-5 py-2 rounded-xl border border-[#D89AAE]/25 text-[#B8A89A] text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((g) => (
          <div key={g.id} className={`bg-[#2A1F18] rounded-2xl border overflow-hidden ${editingId === g.id ? "border-[#D89AAE]/60 col-span-2" : "border-[#D89AAE]/15"}`}>
            {editingId === g.id ? (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name" value={draft.name ?? g.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
                  <Field label="Category" value={draft.category ?? g.category} onChange={(v) => setDraft((d) => ({ ...d, category: v }))} />
                </div>
                <ImageUpload currentUrl={draft.image_url ?? g.image_url} onUrl={(url) => setDraft((d) => ({ ...d, image_url: url }))} />
                <div className="flex gap-2">
                  <button type="button" onClick={() => save(false)} className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#D89AAE] to-[#C9956B] text-white text-xs font-semibold">Save</button>
                  <button type="button" onClick={() => { setEditingId(null); setDraft({}); }} className="px-4 py-1.5 rounded-xl border border-[#D89AAE]/25 text-[#B8A89A] text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="aspect-square bg-[#1A1410] overflow-hidden">
                  {g.image_url
                    ? <Image src={g.image_url} alt={g.name} width={200} height={200} className="w-full h-full object-cover" unoptimized />
                    : <div className="w-full h-full flex items-center justify-center text-3xl text-[#B8A89A]">💅</div>}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-[#F0E4D8] truncate">{g.name}</p>
                  <p className="text-xs text-[#B8A89A]">{g.category}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <button type="button" onClick={() => { setEditingId(g.id); setAdding(false); setDraft({}); }}
                      className="flex-1 py-1 rounded-lg border border-[#D89AAE]/25 text-[#B8A89A] text-xs hover:border-[#D89AAE]/50 hover:text-[#F0E4D8] transition-all">Edit</button>
                    {isAdmin ? (
                      <button type="button" onClick={() => toggle(g)}
                        className={`px-2 py-1 rounded-lg text-xs ${g.active ? "bg-[#D89AAE]/15 text-[#D89AAE]" : "bg-[#1A1410] text-[#B8A89A]"}`}>
                        {g.active ? "✓" : "–"}
                      </button>
                    ) : (
                      <span className={`px-2 py-1 rounded-lg text-xs ${g.active ? "bg-emerald-900/30 text-emerald-400" : "bg-amber-900/30 text-amber-400"}`} title={g.active ? "Live on the site" : "Awaiting admin approval"}>
                        {g.active ? "Live" : "Pending"}
                      </span>
                    )}
                    <button type="button" onClick={() => remove(g.id)} className="py-1 px-2 rounded-lg text-[#B8A89A]/50 hover:text-red-400 transition-colors text-xs">🗑</button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CONTENT TAB ──────────────────────────────────────────────────────────────

function ContentTab({ showToast }: { showToast: (m: string, ok?: boolean) => void }) {
  const [content, setContent] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/content").then((r) => r.json()).then((d) => {
      const map: Record<string, string> = {};
      (Array.isArray(d) ? d : []).forEach((row: { key: string; value: string }) => {
        map[row.key] = row.value ?? "";
      });
      setContent(map);
    });
  }, []);

  async function save(key: string, value: string) {
    const res = await fetch("/api/admin/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
    if (res.ok) { setContent((p) => ({ ...p, [key]: value })); showToast("Saved!"); }
    else showToast("Failed to save", false);
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="font-[family-name:var(--font-cormorant)] text-xl sm:text-2xl font-bold mb-6">Site Content</h2>
      <p className="text-[#B8A89A] text-sm mb-6">Edit text blocks on the public site. Changes update immediately.</p>

      <div className="bg-[#2A1F18] rounded-2xl p-5 border border-[#D89AAE]/15">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#B8A89A] uppercase tracking-wider mb-1">Business Status</p>
            <p className="text-[#F0E4D8] font-semibold">
              {content["business_status"] === "closed" ? "🔴 Currently Closed" : "🟢 Currently Open"}
            </p>
            <p className="text-xs text-[#B8A89A] mt-1">
              Auto-detects business hours (Mon–Fri 9 AM–7 PM, Sat 9 AM–6 PM, Sun closed).<br />
              Toggle to <strong className="text-red-400">force closed</strong> for holidays.
            </p>
          </div>
          <button type="button"
            aria-label={content["business_status"] === "closed" ? "Set status to Open" : "Set status to Closed"}
            onClick={() => save("business_status", content["business_status"] === "closed" ? "open" : "closed")}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors flex-shrink-0
              ${content["business_status"] === "closed" ? "bg-red-900/60 border border-red-500/40" : "bg-emerald-900/60 border border-emerald-500/40"}`}>
            <span className={`inline-block h-6 w-6 rounded-full shadow transition-transform
              ${content["business_status"] === "closed" ? "translate-x-1 bg-red-400" : "translate-x-7 bg-emerald-400"}`} />
          </button>
        </div>
      </div>

      <ContentRow label="Status Message (optional — e.g. 'Back at 3 PM')"
        value={content["business_status_message"] ?? ""} onSave={(v) => save("business_status_message", v)} />

      <ContentRow label="Booking Buffer (minutes between appointments)"
        value={content["booking_buffer_minutes"] ?? "15"} onSave={(v) => save("booking_buffer_minutes", v)} />

      <div className="border-t border-[#D89AAE]/10 pt-4 mt-2" />

      {Object.entries(CONTENT_LABELS).map(([key, label]) => (
        <ContentRow key={key} label={label}
          value={content[key] ?? ""}
          multiline={key.includes("subtitle") || key.includes("address") || key.includes("hours")}
          onSave={(v) => save(key, v)} />
      ))}
    </div>
  );
}

function ContentRow({ label, value, multiline, onSave }: { label: string; value: string; multiline?: boolean; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [saved, setSaved] = useState(false);
  const fieldId = `content-${label.toLowerCase().replace(/\s+/g, "-")}`;

  useEffect(() => { setDraft(value); }, [value]);

  function handleSave() {
    if (draft === value) return;
    onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-[#2A1F18] rounded-2xl p-5 border border-[#D89AAE]/15">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={fieldId} className="text-xs font-semibold text-[#B8A89A] uppercase tracking-wider">{label}</label>
        {saved && <span className="text-xs text-[#D89AAE]">Saved ✓</span>}
      </div>
      {multiline ? (
        <textarea id={fieldId} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={handleSave} rows={3}
          className="w-full px-3 py-2 rounded-xl bg-[#1A1410] border border-[#D89AAE]/20 text-[#F0E4D8] text-sm focus:outline-none focus:border-[#D89AAE]/60 resize-none transition-colors" />
      ) : (
        <input id={fieldId} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={handleSave}
          className="w-full px-3 py-2 rounded-xl bg-[#1A1410] border border-[#D89AAE]/20 text-[#F0E4D8] text-sm focus:outline-none focus:border-[#D89AAE]/60 transition-colors" />
      )}
      <p className="text-xs text-[#B8A89A]/50 mt-1.5">Click away to save automatically</p>
    </div>
  );
}
