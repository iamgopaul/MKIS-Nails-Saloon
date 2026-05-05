"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ─── types ────────────────────────────────────────────────────────────────────

interface TeamMember { id: string; name: string; role: string; bio: string; photoUrl: string; order: number; active: boolean; }
interface ServiceItem { id: string; name: string; description: string; duration: string; price: string; icon: string; order: number; active: boolean; }
interface GalleryItem { id: string; name: string; category: string; imageUrl: string; order: number; active: boolean; addedAt: string; }
interface ContentItem  { id: string; key: string; value: string; }

type Tab = "team" | "services" | "gallery" | "content";

// ─── helpers ─────────────────────────────────────────────────────────────────

const CONTENT_LABELS: Record<string, string> = {
  hero_badge:               "Hero Badge Text",
  hero_title:               "Hero Title",
  hero_subtitle:            "Hero Subtitle",
  about_title:              "About Section Title",
  about_subtitle:           "About Section Subtitle",
  contact_phone:            "Phone Number",
  contact_email:            "Contact Email",
  contact_address:          "Address",
  contact_hours:            "Business Hours",
};

// Keys that use the toggle control instead of a text field
const TOGGLE_KEYS = new Set(["business_status"]);

const DEFAULT_CONTENT = Object.fromEntries(
  Object.keys(CONTENT_LABELS).map((k) => [k, ""])
);

// ─── small shared components ─────────────────────────────────────────────────

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#9A7060] uppercase tracking-wider mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-[#E07898]/20 text-[#F5EDE6] text-sm
                     focus:outline-none focus:border-[#E07898]/60 resize-none transition-colors"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-[#E07898]/20 text-[#F5EDE6] text-sm
                     focus:outline-none focus:border-[#E07898]/60 transition-colors"
        />
      )}
    </div>
  );
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl
      ${ok ? "bg-[#1C1614] border border-[#E07898]/40 text-[#E07898]" : "bg-red-950 border border-red-500/40 text-red-400"}`}>
      {msg}
    </div>
  );
}

// ─── image upload helper ──────────────────────────────────────────────────────

function ImageUpload({ currentUrl, onUrl }: { currentUrl: string; onUrl: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const [urlInput, setUrlInput]   = useState(currentUrl);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (res.ok) {
      onUrl(data.url);
      setUrlInput(data.url);
    } else {
      setError(data.error ?? "Upload failed");
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-[#9A7060] uppercase tracking-wider">Photo / Image</label>
      <div className="flex gap-2 items-center">
        {(urlInput || currentUrl) && (
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#E07898]/20 flex-shrink-0">
            <Image src={urlInput || currentUrl} alt="" width={48} height={48} className="w-full h-full object-cover" unoptimized />
          </div>
        )}
        <div className="flex-1 space-y-1.5">
          <input
            value={urlInput}
            onChange={(e) => { setUrlInput(e.target.value); onUrl(e.target.value); }}
            placeholder="Paste image URL…"
            className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-[#E07898]/20 text-[#F5EDE6] text-sm
                       focus:outline-none focus:border-[#E07898]/60 transition-colors"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-xs text-[#E07898] hover:text-[#C45E7A] disabled:opacity-50 transition-colors"
          >
            {uploading ? "Uploading…" : "Or upload a file ↑"}
          </button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("team");

  // Data
  const [team,     setTeam]     = useState<TeamMember[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [gallery,  setGallery]  = useState<GalleryItem[]>([]);
  const [content,  setContent]  = useState<Record<string, string>>(DEFAULT_CONTENT);

  // UI state
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Drafts for editing
  const [teamDraft,    setTeamDraft]    = useState<Partial<TeamMember>>({});
  const [serviceDraft, setServiceDraft] = useState<Partial<ServiceItem>>({});
  const [galleryDraft, setGalleryDraft] = useState<Partial<GalleryItem>>({});
  const [addingType, setAddingType]     = useState<Tab | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  // ── fetch all data ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadAll() {
      const [t, s, g, c] = await Promise.all([
        fetch("/api/admin/team").then((r) => r.json()),
        fetch("/api/admin/services").then((r) => r.json()),
        fetch("/api/admin/gallery").then((r) => r.json()),
        fetch("/api/admin/content").then((r) => r.json()),
      ]);
      setTeam(Array.isArray(t) ? t : []);
      setServices(Array.isArray(s) ? s : []);
      setGallery(Array.isArray(g) ? g : []);
      if (Array.isArray(c)) {
        const map: Record<string, string> = { ...DEFAULT_CONTENT };
        (c as ContentItem[]).forEach(({ key, value }) => { map[key] = value; });
        setContent(map);
      }
      setLoading(false);
    }
    loadAll();
  }, []);

  // ── logout ──────────────────────────────────────────────────────────────────
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  // ── generic CRUD helpers ────────────────────────────────────────────────────
  async function api(method: string, url: string, body?: object) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res;
  }

  // ── TEAM ────────────────────────────────────────────────────────────────────
  async function saveTeamMember(isNew: boolean) {
    const draft = teamDraft as TeamMember;
    if (!draft.name?.trim()) { showToast("Name is required", false); return; }
    let res: Response;
    if (isNew) {
      res = await api("POST", "/api/admin/team", { ...draft, order: team.length + 1, active: true });
      if (res.ok) {
        const created = await res.json();
        setTeam((prev) => [...prev, created]);
      }
    } else {
      res = await api("PUT", `/api/admin/team/${editingId}`, draft);
      if (res.ok) setTeam((prev) => prev.map((m) => m.id === editingId ? { ...m, ...draft } : m));
    }
    if (res.ok) { showToast("Saved!"); setEditingId(null); setAddingType(null); setTeamDraft({}); }
    else showToast("Failed to save", false);
  }

  async function deleteTeamMember(id: string) {
    if (!confirm("Delete this team member?")) return;
    const res = await api("DELETE", `/api/admin/team/${id}`);
    if (res.ok) setTeam((prev) => prev.filter((m) => m.id !== id));
    else showToast("Failed to delete", false);
  }

  async function toggleTeamActive(member: TeamMember) {
    await api("PUT", `/api/admin/team/${member.id}`, { active: !member.active });
    setTeam((prev) => prev.map((m) => m.id === member.id ? { ...m, active: !m.active } : m));
  }

  // ── SERVICES ─────────────────────────────────────────────────────────────────
  async function saveService(isNew: boolean) {
    const draft = serviceDraft as ServiceItem;
    if (!draft.name?.trim()) { showToast("Name is required", false); return; }
    let res: Response;
    if (isNew) {
      res = await api("POST", "/api/admin/services", { ...draft, order: services.length + 1, active: true });
      if (res.ok) {
        const created = await res.json();
        setServices((prev) => [...prev, created]);
      }
    } else {
      res = await api("PUT", `/api/admin/services/${editingId}`, draft);
      if (res.ok) setServices((prev) => prev.map((s) => s.id === editingId ? { ...s, ...draft } : s));
    }
    if (res.ok) { showToast("Saved!"); setEditingId(null); setAddingType(null); setServiceDraft({}); }
    else showToast("Failed to save", false);
  }

  async function deleteService(id: string) {
    if (!confirm("Delete this service?")) return;
    const res = await api("DELETE", `/api/admin/services/${id}`);
    if (res.ok) setServices((prev) => prev.filter((s) => s.id !== id));
    else showToast("Failed to delete", false);
  }

  async function toggleServiceActive(svc: ServiceItem) {
    await api("PUT", `/api/admin/services/${svc.id}`, { active: !svc.active });
    setServices((prev) => prev.map((s) => s.id === svc.id ? { ...s, active: !s.active } : s));
  }

  // ── GALLERY ──────────────────────────────────────────────────────────────────
  async function saveGalleryItem(isNew: boolean) {
    const draft = galleryDraft as GalleryItem;
    if (!draft.name?.trim()) { showToast("Name is required", false); return; }
    let res: Response;
    if (isNew) {
      res = await api("POST", "/api/admin/gallery", { ...draft, order: gallery.length + 1, active: true });
      if (res.ok) {
        const created = await res.json();
        setGallery((prev) => [...prev, created]);
      }
    } else {
      res = await api("PUT", `/api/admin/gallery/${editingId}`, draft);
      if (res.ok) setGallery((prev) => prev.map((g) => g.id === editingId ? { ...g, ...draft } : g));
    }
    if (res.ok) { showToast("Saved!"); setEditingId(null); setAddingType(null); setGalleryDraft({}); }
    else showToast("Failed to save", false);
  }

  async function deleteGalleryItem(id: string) {
    if (!confirm("Delete this gallery item?")) return;
    const res = await api("DELETE", `/api/admin/gallery/${id}`);
    if (res.ok) setGallery((prev) => prev.filter((g) => g.id !== id));
    else showToast("Failed to delete", false);
  }

  async function toggleGalleryActive(item: GalleryItem) {
    await api("PUT", `/api/admin/gallery/${item.id}`, { active: !item.active });
    setGallery((prev) => prev.map((g) => g.id === item.id ? { ...g, active: !g.active } : g));
  }

  // ── CONTENT ──────────────────────────────────────────────────────────────────
  async function saveContentKey(key: string, value: string) {
    const res = await api("PUT", "/api/admin/content", { key, value });
    if (res.ok) { setContent((prev) => ({ ...prev, [key]: value })); showToast("Saved!"); }
    else showToast("Failed to save", false);
  }

  // ─────────────────────────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "team",     label: "Team",     icon: "👥" },
    { key: "services", label: "Services", icon: "💅" },
    { key: "gallery",  label: "Gallery",  icon: "🖼️" },
    { key: "content",  label: "Content",  icon: "✏️" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5EDE6]">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-[#E07898]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#E07898] blur-md opacity-40" />
              <div className="relative rounded-full p-[2px] bg-gradient-to-br from-[#E07898] via-[#C9956B] to-[#D4A882]">
                <div className="rounded-full bg-[#0A0A0A] p-0.5">
                  <Image src="/logo.png" alt="MKIS" width={30} height={30} className="rounded-full object-cover" />
                </div>
              </div>
            </div>
            <span className="font-[family-name:var(--font-playfair)] text-lg font-bold">
              MKIS <span className="bg-gradient-to-r from-[#E07898] to-[#C9956B] bg-clip-text text-transparent">Admin</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" target="_blank" className="text-sm text-[#9A7060] hover:text-[#E07898] transition-colors">
              View Site ↗
            </a>
            <button
              onClick={logout}
              className="px-4 py-1.5 rounded-full border border-[#E07898]/30 text-sm text-[#9A7060]
                         hover:border-[#E07898]/60 hover:text-[#F5EDE6] transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setEditingId(null); setAddingType(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                tab === t.key
                  ? "bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white shadow-lg shadow-[#E07898]/25"
                  : "bg-[#1C1614] border border-[#E07898]/15 text-[#9A7060] hover:border-[#E07898]/40 hover:text-[#F5EDE6]"
              }`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32 text-[#9A7060]">Loading…</div>
        ) : (
          <>
            {/* ── TEAM tab ─────────────────────────────────────────────────── */}
            {tab === "team" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">Team Members</h2>
                  <button
                    onClick={() => { setAddingType("team"); setTeamDraft({ active: true }); setEditingId(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#E07898] to-[#C9956B]
                               text-white text-sm font-semibold hover:from-[#C45E7A] hover:to-[#B07A52] transition-all"
                  >
                    + Add Member
                  </button>
                </div>

                {/* Add form */}
                {addingType === "team" && (
                  <div className="bg-[#1C1614] rounded-3xl p-6 border border-[#E07898]/40 space-y-4">
                    <h3 className="font-semibold text-[#E07898]">New Team Member</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Name" value={teamDraft.name ?? ""} onChange={(v) => setTeamDraft((d) => ({ ...d, name: v }))} />
                      <Field label="Role / Title" value={teamDraft.role ?? ""} onChange={(v) => setTeamDraft((d) => ({ ...d, role: v }))} />
                    </div>
                    <Field label="Bio" value={teamDraft.bio ?? ""} onChange={(v) => setTeamDraft((d) => ({ ...d, bio: v }))} multiline />
                    <ImageUpload currentUrl={teamDraft.photoUrl ?? ""} onUrl={(url) => setTeamDraft((d) => ({ ...d, photoUrl: url }))} />
                    <div className="flex gap-3">
                      <button onClick={() => saveTeamMember(true)}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white text-sm font-semibold">
                        Save Member
                      </button>
                      <button onClick={() => { setAddingType(null); setTeamDraft({}); }}
                        className="px-5 py-2 rounded-xl border border-[#E07898]/25 text-[#9A7060] text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {team.length === 0 && addingType !== "team" && (
                  <div className="text-center py-16 text-[#9A7060]">
                    <p className="text-4xl mb-3">👥</p>
                    <p>No team members yet. Add your first one!</p>
                    <p className="text-xs mt-2 text-[#9A7060]/60">Make sure your Airtable <strong>Team</strong> table is set up.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {team.map((member) => (
                    <div key={member.id} className={`bg-[#1C1614] rounded-3xl border transition-all duration-200 overflow-hidden
                      ${editingId === member.id ? "border-[#E07898]/60" : "border-[#E07898]/15"}`}>
                      {editingId === member.id ? (
                        /* inline edit */
                        <div className="p-5 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Name" value={teamDraft.name ?? member.name} onChange={(v) => setTeamDraft((d) => ({ ...d, name: v }))} />
                            <Field label="Role" value={teamDraft.role ?? member.role} onChange={(v) => setTeamDraft((d) => ({ ...d, role: v }))} />
                          </div>
                          <Field label="Bio" value={teamDraft.bio ?? member.bio} onChange={(v) => setTeamDraft((d) => ({ ...d, bio: v }))} multiline />
                          <ImageUpload currentUrl={teamDraft.photoUrl ?? member.photoUrl} onUrl={(url) => setTeamDraft((d) => ({ ...d, photoUrl: url }))} />
                          <div className="flex gap-2">
                            <button onClick={() => saveTeamMember(false)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white text-sm font-semibold">
                              Save
                            </button>
                            <button onClick={() => { setEditingId(null); setTeamDraft({}); }}
                              className="px-4 py-2 rounded-xl border border-[#E07898]/25 text-[#9A7060] text-sm">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* read card */
                        <div className="p-5">
                          <div className="flex items-start gap-4 mb-3">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[#E07898]/20 flex-shrink-0 bg-[#0A0A0A]">
                              {member.photoUrl ? (
                                <Image src={member.photoUrl} alt={member.name} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                              ) : <div className="w-full h-full flex items-center justify-center text-2xl">💅</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[#F5EDE6] truncate">{member.name}</p>
                              <p className="text-sm text-[#E07898]">{member.role}</p>
                            </div>
                          </div>
                          <p className="text-xs text-[#9A7060] leading-relaxed line-clamp-2 mb-4">{member.bio}</p>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setEditingId(member.id); setTeamDraft({}); setAddingType(null); }}
                              className="flex-1 py-1.5 rounded-xl border border-[#E07898]/25 text-[#9A7060] text-xs font-medium hover:border-[#E07898]/50 hover:text-[#F5EDE6] transition-all">
                              Edit
                            </button>
                            <button onClick={() => toggleTeamActive(member)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                                member.active ? "bg-[#E07898]/15 text-[#E07898]" : "bg-[#0A0A0A] text-[#9A7060]"}`}>
                              {member.active ? "Visible" : "Hidden"}
                            </button>
                            <button onClick={() => deleteTeamMember(member.id)}
                              className="p-1.5 rounded-xl text-[#9A7060]/50 hover:text-red-400 transition-colors text-xs">
                              🗑
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SERVICES tab ─────────────────────────────────────────────── */}
            {tab === "services" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">Services</h2>
                  <button
                    onClick={() => { setAddingType("services"); setServiceDraft({ active: true, icon: "💅" }); setEditingId(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#E07898] to-[#C9956B]
                               text-white text-sm font-semibold hover:from-[#C45E7A] hover:to-[#B07A52] transition-all"
                  >
                    + Add Service
                  </button>
                </div>
                <p className="text-[#9A7060] text-sm">
                  {services.some((s) => s.id.startsWith("static"))
                    ? "Showing default services. Add a Services table in Airtable to make these editable."
                    : "Changes save directly to Airtable and appear on the site immediately."}
                </p>

                {/* Add form */}
                {addingType === "services" && (
                  <div className="bg-[#1C1614] rounded-3xl p-6 border border-[#E07898]/40 space-y-4">
                    <h3 className="font-semibold text-[#E07898]">New Service</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label="Icon (emoji)" value={serviceDraft.icon ?? "💅"} onChange={(v) => setServiceDraft((d) => ({ ...d, icon: v }))} />
                      <div className="sm:col-span-2">
                        <Field label="Service Name" value={serviceDraft.name ?? ""} onChange={(v) => setServiceDraft((d) => ({ ...d, name: v }))} />
                      </div>
                    </div>
                    <Field label="Description" value={serviceDraft.description ?? ""} onChange={(v) => setServiceDraft((d) => ({ ...d, description: v }))} multiline />
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Price (e.g. $40)" value={serviceDraft.price ?? ""} onChange={(v) => setServiceDraft((d) => ({ ...d, price: v }))} />
                      <Field label="Duration (e.g. 60 min)" value={serviceDraft.duration ?? ""} onChange={(v) => setServiceDraft((d) => ({ ...d, duration: v }))} />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => saveService(true)}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white text-sm font-semibold">
                        Save Service
                      </button>
                      <button onClick={() => { setAddingType(null); setServiceDraft({}); }}
                        className="px-5 py-2 rounded-xl border border-[#E07898]/25 text-[#9A7060] text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((svc) => (
                    <div key={svc.id} className={`bg-[#1C1614] rounded-3xl border transition-all duration-200 overflow-hidden
                      ${editingId === svc.id ? "border-[#E07898]/60" : "border-[#E07898]/15"}`}>
                      {editingId === svc.id ? (
                        <div className="p-5 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Field label="Icon" value={serviceDraft.icon ?? svc.icon} onChange={(v) => setServiceDraft((d) => ({ ...d, icon: v }))} />
                            <div className="sm:col-span-2">
                              <Field label="Name" value={serviceDraft.name ?? svc.name} onChange={(v) => setServiceDraft((d) => ({ ...d, name: v }))} />
                            </div>
                          </div>
                          <Field label="Description" value={serviceDraft.description ?? svc.description} onChange={(v) => setServiceDraft((d) => ({ ...d, description: v }))} multiline />
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Price" value={serviceDraft.price ?? svc.price} onChange={(v) => setServiceDraft((d) => ({ ...d, price: v }))} />
                            <Field label="Duration" value={serviceDraft.duration ?? svc.duration} onChange={(v) => setServiceDraft((d) => ({ ...d, duration: v }))} />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => saveService(false)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white text-sm font-semibold">
                              Save
                            </button>
                            <button onClick={() => { setEditingId(null); setServiceDraft({}); }}
                              className="px-4 py-2 rounded-xl border border-[#E07898]/25 text-[#9A7060] text-sm">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-5">
                          <div className="flex items-start gap-3 mb-2">
                            <span className="text-2xl flex-shrink-0">{svc.icon}</span>
                            <div className="flex-1">
                              <p className="font-semibold text-[#F5EDE6]">{svc.name}</p>
                              <p className="text-xs text-[#9A7060] mt-0.5 line-clamp-2">{svc.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm mb-4">
                            <span className="text-[#E07898] font-bold">{svc.price}</span>
                            <span className="text-[#9A7060]">·</span>
                            <span className="text-[#9A7060]">{svc.duration}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {!svc.id.startsWith("static") && (
                              <>
                                <button onClick={() => { setEditingId(svc.id); setServiceDraft({}); setAddingType(null); }}
                                  className="flex-1 py-1.5 rounded-xl border border-[#E07898]/25 text-[#9A7060] text-xs font-medium hover:border-[#E07898]/50 hover:text-[#F5EDE6] transition-all">
                                  Edit
                                </button>
                                <button onClick={() => toggleServiceActive(svc)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-medium ${svc.active ? "bg-[#E07898]/15 text-[#E07898]" : "bg-[#0A0A0A] text-[#9A7060]"}`}>
                                  {svc.active ? "Visible" : "Hidden"}
                                </button>
                                <button onClick={() => deleteService(svc.id)}
                                  className="p-1.5 rounded-xl text-[#9A7060]/50 hover:text-red-400 transition-colors text-xs">
                                  🗑
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── GALLERY tab ───────────────────────────────────────────────── */}
            {tab === "gallery" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">Gallery</h2>
                  <button
                    onClick={() => { setAddingType("gallery"); setGalleryDraft({ active: true, category: "Gel" }); setEditingId(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#E07898] to-[#C9956B]
                               text-white text-sm font-semibold hover:from-[#C45E7A] hover:to-[#B07A52] transition-all"
                  >
                    + Add Design
                  </button>
                </div>

                {/* Add form */}
                {addingType === "gallery" && (
                  <div className="bg-[#1C1614] rounded-3xl p-6 border border-[#E07898]/40 space-y-4">
                    <h3 className="font-semibold text-[#E07898]">New Gallery Item</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Design Name" value={galleryDraft.name ?? ""} onChange={(v) => setGalleryDraft((d) => ({ ...d, name: v }))} />
                      <Field label="Category" value={galleryDraft.category ?? ""} onChange={(v) => setGalleryDraft((d) => ({ ...d, category: v }))} />
                    </div>
                    <ImageUpload currentUrl={galleryDraft.imageUrl ?? ""} onUrl={(url) => setGalleryDraft((d) => ({ ...d, imageUrl: url }))} />
                    <div className="flex gap-3">
                      <button onClick={() => saveGalleryItem(true)}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white text-sm font-semibold">
                        Save Design
                      </button>
                      <button onClick={() => { setAddingType(null); setGalleryDraft({}); }}
                        className="px-5 py-2 rounded-xl border border-[#E07898]/25 text-[#9A7060] text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {gallery.map((item) => (
                    <div key={item.id} className={`bg-[#1C1614] rounded-2xl border overflow-hidden transition-all duration-200
                      ${editingId === item.id ? "border-[#E07898]/60 col-span-2" : "border-[#E07898]/15"}`}>
                      {editingId === item.id ? (
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Name" value={galleryDraft.name ?? item.name} onChange={(v) => setGalleryDraft((d) => ({ ...d, name: v }))} />
                            <Field label="Category" value={galleryDraft.category ?? item.category} onChange={(v) => setGalleryDraft((d) => ({ ...d, category: v }))} />
                          </div>
                          <ImageUpload currentUrl={galleryDraft.imageUrl ?? item.imageUrl} onUrl={(url) => setGalleryDraft((d) => ({ ...d, imageUrl: url }))} />
                          <div className="flex gap-2">
                            <button onClick={() => saveGalleryItem(false)}
                              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white text-xs font-semibold">
                              Save
                            </button>
                            <button onClick={() => { setEditingId(null); setGalleryDraft({}); }}
                              className="px-4 py-1.5 rounded-xl border border-[#E07898]/25 text-[#9A7060] text-xs">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="aspect-square bg-[#0A0A0A] overflow-hidden">
                            {item.imageUrl ? (
                              <Image src={item.imageUrl} alt={item.name} width={200} height={200} className="w-full h-full object-cover" unoptimized />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-3xl text-[#9A7060]">💅</div>
                            )}
                          </div>
                          <div className="p-2.5">
                            <p className="text-xs font-semibold text-[#F5EDE6] truncate">{item.name}</p>
                            <p className="text-xs text-[#9A7060]">{item.category}</p>
                            <div className="flex items-center gap-1 mt-2">
                              {!item.id.startsWith("static") && (
                                <>
                                  <button onClick={() => { setEditingId(item.id); setGalleryDraft({}); setAddingType(null); }}
                                    className="flex-1 py-1 rounded-lg border border-[#E07898]/25 text-[#9A7060] text-xs hover:border-[#E07898]/50 hover:text-[#F5EDE6] transition-all">
                                    Edit
                                  </button>
                                  <button onClick={() => toggleGalleryActive(item)}
                                    className={`px-2 py-1 rounded-lg text-xs ${item.active ? "bg-[#E07898]/15 text-[#E07898]" : "bg-[#0A0A0A] text-[#9A7060]"}`}>
                                    {item.active ? "✓" : "–"}
                                  </button>
                                  <button onClick={() => deleteGalleryItem(item.id)}
                                    className="py-1 px-2 rounded-lg text-[#9A7060]/50 hover:text-red-400 transition-colors text-xs">
                                    🗑
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── CONTENT tab ───────────────────────────────────────────────── */}
            {tab === "content" && (
              <div className="space-y-4 max-w-2xl">
                <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold mb-6">Site Content</h2>
                <p className="text-[#9A7060] text-sm mb-6">
                  Edit the text blocks on your public website. Changes update immediately.
                </p>

                {/* ── Business Status toggle ─────────────────────────────── */}
                <div className="bg-[#1C1614] rounded-2xl p-5 border border-[#E07898]/15">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#9A7060] uppercase tracking-wider mb-1">Business Status</p>
                      <p className="text-[#F5EDE6] font-semibold">
                        {content["business_status"] === "closed" ? "🔴 Currently Closed" : "🟢 Currently Open"}
                      </p>
                      <p className="text-xs text-[#9A7060] mt-1">
                        Auto-detects business hours (Mon–Fri 9 AM–7 PM, Sat 9 AM–6 PM, Sun closed).<br />
                        Toggle to <strong className="text-red-400">force closed</strong> for holidays or early closing.
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={content["business_status"] === "closed" ? "Set status to Open" : "Set status to Closed"}
                      onClick={async () => {
                        const next = content["business_status"] === "closed" ? "open" : "closed";
                        await saveContentKey("business_status", next);
                      }}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors flex-shrink-0
                        ${content["business_status"] === "closed"
                          ? "bg-red-900/60 border border-red-500/40"
                          : "bg-emerald-900/60 border border-emerald-500/40"
                        }`}
                    >
                      <span className={`inline-block h-6 w-6 rounded-full shadow transition-transform
                        ${content["business_status"] === "closed"
                          ? "translate-x-1 bg-red-400"
                          : "translate-x-7 bg-emerald-400"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Optional status message */}
                <ContentRow
                  key="business_status_message"
                  label="Status Message (optional — e.g. 'Back at 3 PM')"
                  value={content["business_status_message"] ?? ""}
                  onSave={(v) => saveContentKey("business_status_message", v)}
                />

                <div className="border-t border-[#E07898]/10 pt-4 mt-2" />

                {Object.entries(CONTENT_LABELS).map(([key, label]) => (
                  <ContentRow
                    key={key}
                    label={label}
                    value={content[key] ?? ""}
                    multiline={key.includes("subtitle") || key.includes("address") || key.includes("hours")}
                    onSave={(v) => saveContentKey(key, v)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── ContentRow component (saves on blur) ────────────────────────────────────

function ContentRow({
  label, value, multiline, onSave,
}: { label: string; value: string; multiline?: boolean; onSave: (v: string) => void }) {
  const [draft, setDraft]   = useState(value);
  const [saved, setSaved]   = useState(false);
  const fieldId = `content-${label.toLowerCase().replace(/\s+/g, "-")}`;

  useEffect(() => { setDraft(value); }, [value]);

  function handleSave() {
    if (draft === value) return;
    onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-[#1C1614] rounded-2xl p-5 border border-[#E07898]/15">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={fieldId} className="text-xs font-semibold text-[#9A7060] uppercase tracking-wider">{label}</label>
        {saved && <span className="text-xs text-[#E07898]">Saved ✓</span>}
      </div>
      {multiline ? (
        <textarea
          id={fieldId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          rows={3}
          className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-[#E07898]/20 text-[#F5EDE6] text-sm
                     focus:outline-none focus:border-[#E07898]/60 resize-none transition-colors"
        />
      ) : (
        <input
          id={fieldId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-[#E07898]/20 text-[#F5EDE6] text-sm
                     focus:outline-none focus:border-[#E07898]/60 transition-colors"
        />
      )}
      <p className="text-xs text-[#9A7060]/50 mt-1.5">Click away to save automatically</p>
    </div>
  );
}
