"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";

interface Message {
  role:    "user" | "assistant";
  content: string;
}

const WELCOME: Message = {
  role:    "assistant",
  content: "Hi, I'm Bella 💅 Your assistant for MKIS Nail Saloon. Ask me anything about our services, team, hours, or how to book an appointment.",
};

// Bella plays a small, calm queue of teasers while the chat is closed.
const FALLBACK_WELCOME  = "Welcome to MKIS Nails!";
const CLOSING_TEASER    = "Need help? Tap me anytime 💅";
const TEASER_VISIBLE_MS = 7000;     // how long each bubble stays (slightly longer to read)
const TEASER_GAP_MS     = 22_000;   // gap before the next bubble
const FIRST_TEASER_MS   = 5_000;    // delay before the first bubble after page load
const MAX_TEASERS       = 5;        // total bubbles per page session

// Initial position is computed on mount (defaults to bottom-right).
const DEFAULT_POS = { left: 0, bottom: 20 };
const POS_STORAGE_KEY = "mkis-bella-pos";
const LAUNCHER_SIZE   = 56;
const BUBBLE_GAP      = 12;

export default function ChatWidget() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [teaser, setTeaser]     = useState<string | null>(null);
  const [pos, setPos]           = useState(DEFAULT_POS);
  const [dragging, setDragging] = useState(false);
  const teaserDismissed         = useRef(false);
  const scrollRef               = useRef<HTMLDivElement>(null);
  const launcherRef             = useRef<HTMLButtonElement>(null);
  const bubbleRef               = useRef<HTMLDivElement>(null);
  const dragRef                 = useRef({
    active:        false,
    startX:        0,
    startY:        0,
    startLeft:     0,
    startBottom:   0,
    moved:         false,
    pointerId:     -1,
  });

  // Apply launcher + bubble positions imperatively (avoids inline style on JSX)
  useEffect(() => {
    if (launcherRef.current) {
      launcherRef.current.style.left   = `${pos.left}px`;
      launcherRef.current.style.bottom = `${pos.bottom}px`;
    }
    if (bubbleRef.current && typeof window !== "undefined") {
      const onLeftHalf = pos.left + LAUNCHER_SIZE / 2 < window.innerWidth / 2;
      bubbleRef.current.style.bottom = `${pos.bottom + 8}px`;
      if (onLeftHalf) {
        // Bella on left → bubble to her right
        bubbleRef.current.style.left  = `${pos.left + LAUNCHER_SIZE + BUBBLE_GAP}px`;
        bubbleRef.current.style.right = "auto";
      } else {
        // Bella on right → bubble to her left
        const fromRight = window.innerWidth - pos.left + BUBBLE_GAP;
        bubbleRef.current.style.right = `${fromRight}px`;
        bubbleRef.current.style.left  = "auto";
      }
    }
  }, [pos, teaser]);

  // Restore launcher position from localStorage (defaults to bottom-right)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(POS_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.left === "number" && typeof saved.bottom === "number") {
          setPos(clampPos(saved));
          return;
        }
      }
    } catch { /* ignore */ }
    // No saved position — pin to bottom-right of the viewport
    setPos(clampPos({
      left:   window.innerWidth - LAUNCHER_SIZE - 20,
      bottom: 20,
    }));
  }, []);

  // Re-clamp on resize so the launcher never lands off-screen
  useEffect(() => {
    function onResize() { setPos((p) => clampPos(p)); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Decide which side to render the teaser bubble on, based on launcher x-position
  const teaserOnLeft = typeof window !== "undefined" && pos.left > window.innerWidth / 2;

  function clampPos(p: { left: number; bottom: number }) {
    if (typeof window === "undefined") return p;
    const margin = 8;
    return {
      left:   Math.max(margin, Math.min(p.left,   window.innerWidth  - LAUNCHER_SIZE - margin)),
      bottom: Math.max(margin, Math.min(p.bottom, window.innerHeight - LAUNCHER_SIZE - margin)),
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    dragRef.current = {
      active:      true,
      startX:      e.clientX,
      startY:      e.clientY,
      startLeft:   pos.left,
      startBottom: pos.bottom,
      moved:       false,
      pointerId:   e.pointerId,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!dragRef.current.active) return;                     // ignore mouse hover
    if (e.pointerId !== dragRef.current.pointerId) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (!dragRef.current.moved && Math.hypot(dx, dy) < 6) return; // small tap, not a drag
    dragRef.current.moved = true;
    if (!dragging) setDragging(true);
    setPos(clampPos({
      left:   dragRef.current.startLeft   + dx,
      bottom: dragRef.current.startBottom - dy,
    }));
  }

  function onPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    if (!dragRef.current.active) return;
    if (e.pointerId !== dragRef.current.pointerId) return;
    const wasDrag = dragRef.current.moved;
    dragRef.current.active = false;
    dragRef.current.moved  = false;
    setDragging(false);
    if (wasDrag) {
      try { localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(pos)); } catch { /* ignore */ }
      e.preventDefault();
      e.stopPropagation();
    } else {
      setOpen((v) => !v);
    }
  }

  function onPointerCancel() {
    dragRef.current.active = false;
    dragRef.current.moved  = false;
    setDragging(false);
  }

  // Auto-scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Show a small queue of teasers (status + live notifications) while the chat is closed.
  // Plays through once per session — capped at MAX_TEASERS to avoid spam.
  useEffect(() => {
    // Hide any visible bubble while chat is open, but don't permanently silence
    if (open) { setTeaser(null); return; }
    // If user explicitly dismissed via the ✕, stay silent
    if (teaserDismissed.current) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function start() {
      const queue: string[] = [];

      // 1) Always start with a friendly welcome
      queue.push(FALLBACK_WELCOME);

      // 2) Status-aware open / closed message
      try {
        const res  = await fetch("/api/status");
        const data = await res.json();
        queue.push(data.status === "open"
          ? "We're open now! Book an appointment or drop by."
          : "We're currently closed. You can always book an appointment for our opening hours.");
      } catch { /* skip if status unavailable */ }

      // 3) Live notifications (today's bookings, new gallery design, etc.)
      try {
        const res  = await fetch("/api/notifications");
        const data: { message: string }[] = await res.json();
        (data ?? []).slice(0, 2).forEach((n) => { if (n?.message) queue.push(n.message); });
      } catch { /* ignore */ }

      // 4) Friendly closer
      queue.push(CLOSING_TEASER);

      const sliced = queue.slice(0, MAX_TEASERS);
      if (cancelled) return;

      let i = 0;
      function next() {
        if (cancelled || teaserDismissed.current) return;
        if (i >= sliced.length) return;
        setTeaser(sliced[i++]);
        timeoutId = setTimeout(() => {
          if (cancelled) return;
          setTeaser(null);
          if (i < sliced.length) {
            timeoutId = setTimeout(next, TEASER_GAP_MS);
          }
        }, TEASER_VISIBLE_MS);
      }
      timeoutId = setTimeout(next, FIRST_TEASER_MS);
    }
    start();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [open]);

  // When the booking form completes, pop a sequence of thank-you bubbles
  useEffect(() => {
    function onBooked(e: Event) {
      const detail = (e as CustomEvent<{ firstName?: string }>).detail ?? {};
      const name   = detail.firstName || "there";
      teaserDismissed.current = false;     // re-allow teasers for this celebratory sequence

      const sequence: string[] = [
        `Thank you for choosing us, ${name}! 💖`,
        "Hope you enjoy your visit. Your booking is on its way to confirmation.",
        "Feel free to leave us a review afterwards :)",
      ];
      const timeouts: ReturnType<typeof setTimeout>[] = [];
      sequence.forEach((text, i) => {
        timeouts.push(setTimeout(() => {
          setTeaser(text);
          timeouts.push(setTimeout(() => setTeaser(null), TEASER_VISIBLE_MS));
        }, i * (TEASER_VISIBLE_MS + 500)));
      });
    }
    window.addEventListener("mkis:booking-complete", onBooked);
    return () => window.removeEventListener("mkis:booking-complete", onBooked);
  }, []);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const next: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          messages: next.filter((m) => m !== WELCOME).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sorry, the assistant is unavailable.";
      setMessages([...next, { role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Teaser speech bubble — only when closed; positioned next to Bella imperatively */}
      {!open && teaser && (
        <div
          ref={bubbleRef}
          role="status"
          aria-live="polite"
          className={`fixed z-50 max-w-[220px] sm:max-w-xs
                     bg-[#1C1614] border border-[#E07898]/30 rounded-2xl
                     ${teaserOnLeft ? "rounded-br-sm" : "rounded-bl-sm"}
                     px-4 py-2.5 shadow-xl shadow-black/40 chat-teaser-in cursor-pointer`}
          onClick={() => setOpen(true)}
        >
          <p className="text-sm text-[#F5EDE6] leading-snug">{teaser}</p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={(e) => { e.stopPropagation(); teaserDismissed.current = true; setTeaser(null); }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#0A0A0A] border border-[#E07898]/30 text-[#9A7060] hover:text-[#E07898] flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating launcher (draggable) */}
      <button
        ref={launcherRef}
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        aria-label={open ? "Close chat with Bella" : "Open chat with Bella (long-press to drag)"}
        title="Chat with Bella · drag to move"
        className={`fixed z-50 w-14 h-14 rounded-full shadow-2xl shadow-[#E07898]/40 overflow-hidden touch-none select-none
          ${dragging ? "cursor-grabbing" : "cursor-grab"}
          ${dragging ? "" : "transition-shadow"}
          ${open
            ? "bg-[#1C1614] border-2 border-[#E07898]/60 hover:bg-[#0E0B09] flex items-center justify-center"
            : "bg-gradient-to-br from-[#E07898] to-[#C9956B] hover:scale-105 p-[2px]"
          }`}
      >
        {open ? (
          <svg className="w-6 h-6 text-[#E07898]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <Image
            src="/bella.jpeg"
            alt="Bella"
            width={56}
            height={56}
            className="w-full h-full rounded-full object-cover scale-[1.15] object-[50%_42%]"
          />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-x-3 bottom-24 sm:inset-auto sm:bottom-24 sm:left-5 sm:w-96 z-50
                        bg-[#1C1614] rounded-3xl border border-[#E07898]/25 shadow-2xl shadow-black/40
                        flex flex-col max-h-[70vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#E07898] to-[#C9956B] px-5 py-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/60 flex-shrink-0 bg-white/10">
              <Image
                src="/bella.jpeg"
                alt="Bella"
                width={44}
                height={44}
                className="w-full h-full object-cover scale-[1.15] object-[50%_42%]"
              />
            </div>
            <div>
              <p className="font-[family-name:var(--font-playfair)] text-base font-bold text-white leading-tight">Bella</p>
              <p className="text-xs text-white/80">MKIS Nail Saloon assistant</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#0E0B09]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                    ${m.role === "user"
                      ? "bg-gradient-to-br from-[#E07898] to-[#C9956B] text-white rounded-br-sm"
                      : "bg-[#1C1614] text-[#F5EDE6] border border-[#E07898]/15 rounded-bl-sm"
                    }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1C1614] border border-[#E07898]/15 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E07898]/70 animate-bounce typing-dot-1" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E07898]/70 animate-bounce typing-dot-2" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E07898]/70 animate-bounce typing-dot-3" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-3 py-3 bg-[#1C1614] border-t border-[#E07898]/15">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type your question…"
                rows={1}
                aria-label="Type a message"
                className="flex-1 px-3 py-2 rounded-xl bg-[#0A0A0A] border border-[#E07898]/20 text-[#F5EDE6] text-sm
                           placeholder-[#9A7060]/60 focus:outline-none focus:border-[#E07898]/60 resize-none max-h-32"
              />
              <button
                type="button"
                onClick={send}
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E07898] to-[#C9956B] text-white flex items-center justify-center
                           hover:from-[#C45E7A] hover:to-[#B07A52] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
