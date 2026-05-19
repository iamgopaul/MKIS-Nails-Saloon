"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";

interface Message {
  role:    "user" | "assistant";
  content: string;
}

const WELCOME: Message = {
  role:    "assistant",
  content: "Hi, I'm Bella 💅 Your assistant for MKIS Nails Salon. Ask me anything about our services, team, hours, or how to book an appointment.",
};

// Bella plays a small, calm queue of teasers while the chat is closed.
const FALLBACK_WELCOME  = "Welcome to MKIS Nails!";
const CLOSING_TEASER    = "Need help? Tap me anytime 💅";
const MEOW_LINES        = [
  "Meow! 🐾",
  "Purrfect day for a manicure 🐾",
  "Meow… anyone out there? 🐱",
  "Meow! Don't forget to book your nails.",
  "*stretches paws* Meow 🐾",
];
const MEOW_CHANCE       = 0.4;
const TEASER_VISIBLE_MS = 7000;
const TEASER_GAP_MS     = 22_000;
const FIRST_TEASER_MS   = 5_000;
const MAX_TEASERS       = 5;

export default function ChatWidget() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [teaser, setTeaser]     = useState<string | null>(null);
  const teaserDismissed         = useRef(false);
  const scrollRef               = useRef<HTMLDivElement>(null);
  const launcherRef             = useRef<HTMLButtonElement>(null);
  const textareaRef             = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // a11y: focus the input on open and close on Escape; restore focus to launcher on close.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => textareaRef.current?.focus(), 60);
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Show a small queue of teasers (status + live notifications) while the chat is closed.
  useEffect(() => {
    if (open) { setTeaser(null); return; }
    if (teaserDismissed.current) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function start() {
      const queue: string[] = [FALLBACK_WELCOME];

      try {
        const res  = await fetch("/api/status");
        const data = await res.json();
        queue.push(data.status === "open"
          ? "We're open now! Book an appointment or drop by."
          : "We're currently closed. You can always book an appointment for our opening hours.");
      } catch { /* skip */ }

      try {
        const res  = await fetch("/api/notifications");
        const data: { message: string }[] = await res.json();
        (data ?? []).slice(0, 2).forEach((n) => { if (n?.message) queue.push(n.message); });
      } catch { /* skip */ }

      queue.push(CLOSING_TEASER);

      if (Math.random() < MEOW_CHANCE && queue.length >= 2) {
        const meow    = MEOW_LINES[Math.floor(Math.random() * MEOW_LINES.length)];
        const insertAt = 1 + Math.floor(Math.random() * (queue.length - 1));
        queue.splice(insertAt, 0, meow);
      }

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

  // Booking complete → celebratory teaser sequence
  useEffect(() => {
    function onBooked(e: Event) {
      const detail = (e as CustomEvent<{ firstName?: string }>).detail ?? {};
      const name   = detail.firstName || "there";
      teaserDismissed.current = false;

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
      {/* Teaser speech bubble — only when closed, anchored above the launcher */}
      {!open && teaser && (
        <div
          role="status"
          aria-live="polite"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)",
            left:   "calc(env(safe-area-inset-left, 0px) + 1.5rem)",
          }}
          className="fixed z-50 max-w-[calc(100vw-3rem)] sm:max-w-[260px]
                     bg-[#2A1F18] border border-[#3A2E26] rounded-2xl rounded-bl-sm
                     px-4 py-2.5 shadow-[0_15px_30px_-12px_rgba(0,0,0,0.4)] chat-teaser-in cursor-pointer"
          onClick={() => setOpen(true)}
        >
          <p className="text-sm text-[#F0E4D8] leading-snug font-light">{teaser}</p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={(e) => { e.stopPropagation(); teaserDismissed.current = true; setTeaser(null); }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#2A1F18] border border-[#3A2E26] text-[#7A6657] hover:text-[#D89AAE] flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating launcher — fixed bottom-left (respects iOS safe area) */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat with Bella" : "Open chat with Bella"}
        aria-controls="bella-chat-panel"
        aria-haspopup="dialog"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)",
          left:   "calc(env(safe-area-inset-left,   0px) + 1.5rem)",
        }}
        className={`fixed z-50 w-14 h-14 rounded-full overflow-hidden
                    shadow-[0_12px_30px_-6px_rgba(216,154,174,0.5)]
                    hover:scale-105 active:scale-95 transition-transform
                    ${open
                      ? "bg-[#2A1F18] border border-[#3A2E26] flex items-center justify-center"
                      : "ring-2 ring-[#D89AAE]/40 ring-offset-2 ring-offset-[#1A1410]"
                    }`}
      >
        {open ? (
          <svg className="w-5 h-5 text-[#F0E4D8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Chat panel — opens up + right from the launcher */}
      {open && (
        <div
          id="bella-chat-panel"
          role="dialog"
          aria-label="Chat with Bella"
          aria-modal="false"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)",
            left:   "calc(env(safe-area-inset-left,   0px) + 1.5rem)",
            right:  "calc(env(safe-area-inset-right,  0px) + 1.5rem)",
          }}
          className="fixed sm:right-auto sm:w-96 z-50
                     bg-[#2A1F18] rounded-3xl border border-[#3A2E26]
                     shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]
                     flex flex-col max-h-[min(70vh,32rem)] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#322620] border-b border-[#3A2E26] px-5 py-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden ring-1 ring-[#D89AAE]/40 flex-shrink-0">
              <Image
                src="/bella.jpeg"
                alt="Bella"
                width={44}
                height={44}
                className="w-full h-full object-cover scale-[1.15] object-[50%_42%]"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-[family-name:var(--font-cormorant)] text-lg text-[#F0E4D8] leading-tight">Bella</p>
              <p className="text-[11px] text-[#B8A89A] font-[family-name:var(--font-montserrat)] tracking-[0.15em] uppercase">MKIS Nails Assistant</p>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#1A1410]"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed font-light
                    ${m.role === "user"
                      ? "bg-[#D89AAE] text-[#1A1410] rounded-br-sm"
                      : "bg-[#2A1F18] text-[#F0E4D8] border border-[#3A2E26] rounded-bl-sm"
                    }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#2A1F18] border border-[#3A2E26] rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D89AAE] animate-bounce typing-dot-1" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D89AAE] animate-bounce typing-dot-2" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D89AAE] animate-bounce typing-dot-3" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-3 py-3 bg-[#2A1F18] border-t border-[#3A2E26]">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type your question…"
                rows={1}
                aria-label="Type a message"
                className="flex-1 px-3 py-2 rounded-xl bg-[#1A1410] border border-[#3A2E26] text-[#F0E4D8] text-sm
                           placeholder:text-[#7A6657] focus:outline-none focus:border-[#D89AAE] focus:ring-2 focus:ring-[#D89AAE]/20 resize-none max-h-32"
              />
              <button
                type="button"
                onClick={send}
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="w-10 h-10 rounded-xl bg-[#D89AAE] text-[#1A1410] flex items-center justify-center
                           hover:bg-[#E5B0C2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
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
