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

// Bubble teasers shown next to the launcher while the chat is closed.
// { delay: ms after page load, text: shown for ~6s }
const TEASERS: { delay: number; text: string }[] = [
  { delay:  10_000, text: "Hi 👋 Welcome to MKIS Nails!" },
  { delay:  45_000, text: "Need help? Tap me anytime." },
  { delay:  90_000, text: "Hope you're having a wonderful day :)" },
  { delay: 150_000, text: "Have a question? I'm here 💅" },
];
const TEASER_VISIBLE_MS = 6500;

export default function ChatWidget() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [teaser, setTeaser]     = useState<string | null>(null);
  const teaserDismissed         = useRef(false);
  const scrollRef               = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Schedule teaser messages — once the chat is opened, stop showing them
  useEffect(() => {
    if (open) {
      teaserDismissed.current = true;
      setTeaser(null);
      return;
    }
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    TEASERS.forEach(({ delay, text }) => {
      timeouts.push(setTimeout(() => {
        if (teaserDismissed.current) return;
        setTeaser(text);
        timeouts.push(setTimeout(() => setTeaser(null), TEASER_VISIBLE_MS));
      }, delay));
    });
    return () => timeouts.forEach(clearTimeout);
  }, [open]);

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
      {/* Teaser speech bubble — only when closed */}
      {!open && teaser && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-24 z-50 max-w-[220px] sm:max-w-xs
                     bg-[#1C1614] border border-[#E07898]/30 rounded-2xl rounded-bl-sm
                     px-4 py-2.5 shadow-xl shadow-black/40 chat-teaser-in cursor-pointer"
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

      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat with Bella" : "Open chat with Bella"}
        title="Chat with Bella"
        className={`fixed bottom-5 left-5 z-50 w-14 h-14 rounded-full shadow-2xl shadow-[#E07898]/40 transition-all overflow-hidden
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
            className="w-full h-full rounded-full object-cover scale-[1.6] object-[50%_30%]"
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
                className="w-full h-full object-cover scale-[1.6] object-[50%_30%]"
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
