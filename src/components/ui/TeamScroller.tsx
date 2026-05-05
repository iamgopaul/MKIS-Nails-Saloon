"use client";

import { useEffect, useRef, useCallback } from "react";
import Image from "next/image";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string;
}

const CARD_W    = 256;
const CARD_GAP  = 24;
const STEP      = CARD_W + CARD_GAP;
const DURATION  = 700;

export default function TeamScroller({ members }: { members: TeamMember[] }) {
  const n        = members.length;
  const extended = [...members, ...members, ...members];

  const trackRef    = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const offsetRef   = useRef(0);   // centering offset in px
  const idxRef      = useRef(n);
  const pausedRef   = useRef(false);
  const busyRef     = useRef(false);
  const activeDotFn = useRef<(i: number) => void>(() => {});

  // Drag state
  const drag = useRef({ active: false, startX: 0, startTx: 0, moved: false });

  function computeOffset() {
    if (!viewportRef.current) return;
    offsetRef.current = Math.max(0, (viewportRef.current.offsetWidth - CARD_W) / 2);
  }

  const moveTo = useCallback((newIdx: number, animate: boolean) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = animate ? `transform ${DURATION}ms ease-in-out` : "none";
    el.style.transform  = `translateX(${offsetRef.current - newIdx * STEP}px)`;
    idxRef.current = newIdx;
    activeDotFn.current(((newIdx % n) + n) % n);
  }, [n]);

  // After a move, silently wrap if we've left the middle copy
  const afterMove = useCallback((newIdx: number) => {
    if (newIdx >= n * 2) {
      busyRef.current = true;
      setTimeout(() => { moveTo(newIdx - n, false); busyRef.current = false; }, DURATION + 20);
    } else if (newIdx < n) {
      busyRef.current = true;
      setTimeout(() => { moveTo(newIdx + n, false); busyRef.current = false; }, DURATION + 20);
    }
  }, [moveTo, n]);

  const next = useCallback(() => {
    if (busyRef.current) return;
    const newIdx = idxRef.current + 1;
    moveTo(newIdx, true);
    afterMove(newIdx);
  }, [moveTo, afterMove]);

  const prev = useCallback(() => {
    if (busyRef.current) return;
    const newIdx = idxRef.current - 1;
    moveTo(newIdx, true);
    afterMove(newIdx);
  }, [moveTo, afterMove]);

  // Initial position + resize handler
  useEffect(() => {
    computeOffset();
    moveTo(n, false);

    const onResize = () => {
      computeOffset();
      moveTo(idxRef.current, false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [moveTo, n]);

  // Auto-advance
  useEffect(() => {
    const id = setInterval(() => { if (!pausedRef.current) next(); }, 3500);
    return () => clearInterval(id);
  }, [next]);

  // ── Drag / swipe ──────────────────────────────────────────────────────────

  function onPointerDown(e: React.PointerEvent) {
    if (busyRef.current) return;
    drag.current = {
      active:  true,
      startX:  e.clientX,
      startTx: offsetRef.current - idxRef.current * STEP,
      moved:   false,
    };
    pausedRef.current = true;
    // Capture so we keep receiving events even if the pointer leaves the element
    trackRef.current?.setPointerCapture(e.pointerId);
    if (trackRef.current) trackRef.current.style.transition = "none";
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current.active) return;
    const delta = e.clientX - drag.current.startX;
    if (Math.abs(delta) > 4) drag.current.moved = true;
    if (trackRef.current) {
      trackRef.current.style.transform =
        `translateX(${drag.current.startTx + delta}px)`;
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!drag.current.active) return;
    drag.current.active = false;
    pausedRef.current = false;

    const delta = e.clientX - drag.current.startX;
    // Snap forward/back if dragged more than 25 % of a step
    if (drag.current.moved && Math.abs(delta) > STEP * 0.25) {
      if (delta < 0) next();
      else prev();
    } else {
      // Rubber-band back to current card
      moveTo(idxRef.current, true);
    }
  }

  // ── Dot state (imperative, no re-renders) ─────────────────────────────────

  const dotsRef = useRef<HTMLButtonElement[]>([]);
  activeDotFn.current = (active: number) => {
    dotsRef.current.forEach((btn, i) => {
      if (!btn) return;
      if (i === active) {
        btn.className = btn.className
          .replace("w-2 bg-[#E07898]/25", "w-6 bg-gradient-to-r from-[#E07898] to-[#C9956B]");
      } else {
        btn.className = btn.className
          .replace("w-6 bg-gradient-to-r from-[#E07898] to-[#C9956B]", "w-2 bg-[#E07898]/25");
      }
    });
  };

  return (
    <div
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {/* Viewport — clips overflow; pan-y lets vertical scroll pass through */}
      <div
        ref={viewportRef}
        className="relative overflow-hidden touch-pan-y"
      >
        <div
          ref={trackRef}
          className="flex gap-6 select-none cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {extended.map((member, i) => (
            <div
              key={`${member.id}-${i}`}
              className="group flex-shrink-0 w-64 bg-[#1C1614] rounded-3xl p-7 border border-[#E07898]/15
                         hover:border-[#E07898]/50 hover:shadow-xl hover:shadow-[#E07898]/10
                         transition-colors duration-300 flex flex-col items-center text-center"
            >
              {/* Photo */}
              <div className="relative mb-5">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#E07898] to-[#C9956B] blur-lg opacity-30 group-hover:opacity-60 transition-opacity" />
                <div className="relative w-24 h-24 rounded-full p-[3px] bg-gradient-to-br from-[#E07898] via-[#C9956B] to-[#D4A882]">
                  <div className="rounded-full bg-[#1C1614] w-full h-full overflow-hidden">
                    {member.photoUrl ? (
                      <Image
                        src={member.photoUrl}
                        alt={member.name}
                        width={96}
                        height={96}
                        draggable={false}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#E07898]/50">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <h3 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-[#F5EDE6] mb-1">
                {member.name}
              </h3>
              <span className="inline-block px-3 py-1 rounded-full bg-[#E07898]/15 border border-[#E07898]/30
                               text-[#E07898] text-xs font-semibold mb-4">
                {member.role}
              </span>
              <p className="text-[#9A7060] text-xs leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>

        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-[#0A0A0A] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-[#0A0A0A] to-transparent z-10" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 mt-8">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous team member"
          className="w-10 h-10 rounded-full border border-[#E07898]/30 flex items-center justify-center
                     text-[#9A7060] hover:bg-[#E07898] hover:text-white hover:border-[#E07898] transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          {members.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to team member ${i + 1}`}
              ref={(el) => { if (el) dotsRef.current[i] = el; }}
              onClick={() => { if (!drag.current.moved) moveTo(n + i, true); }}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === 0
                  ? "w-6 bg-gradient-to-r from-[#E07898] to-[#C9956B]"
                  : "w-2 bg-[#E07898]/25 hover:bg-[#E07898]/50"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          aria-label="Next team member"
          className="w-10 h-10 rounded-full border border-[#E07898]/30 flex items-center justify-center
                     text-[#9A7060] hover:bg-[#E07898] hover:text-white hover:border-[#E07898] transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
