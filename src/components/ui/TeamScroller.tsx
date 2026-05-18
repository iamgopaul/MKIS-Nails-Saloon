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

const STATIC_THRESHOLD = 4;

function MemberCard({ member }: { member: TeamMember }) {
  return (
    <div
      className="group flex-shrink-0 w-64 bg-[#2A1F18] rounded-3xl p-7 border border-[#3A2E26]
                 hover:border-[#D89AAE]/40 hover:shadow-[0_18px_40px_-20px_rgba(26,20,16,0.15)]
                 transition-all duration-300 flex flex-col items-center text-center"
    >
      <div className="relative mb-5">
        <div className="relative w-24 h-24 rounded-full p-[2px] bg-[#D89AAE]">
          <div className="rounded-full bg-[#2A1F18] w-full h-full overflow-hidden">
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
              <div className="w-full h-full flex items-center justify-center display-md text-3xl text-[#D89AAE]">
                {member.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>

      <h3 className="display-md text-lg text-[#F0E4D8] mb-1">{member.name}</h3>
      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#2E1F24] text-[#D89AAE] text-[11px] font-medium mb-4">
        {member.role}
      </span>
      <p className="text-[#B8A89A] text-xs leading-relaxed font-light">{member.bio}</p>
    </div>
  );
}

export default function TeamScroller({ members }: { members: TeamMember[] }) {
  const n = members.length;
  if (n === 0) return null;
  if (n <= STATIC_THRESHOLD) return <StaticGrid members={members} />;
  const extended = [...members, ...members, ...members];

  const trackRef    = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const offsetRef   = useRef(0);
  const idxRef      = useRef(n);
  const pausedRef   = useRef(false);
  const busyRef     = useRef(false);
  const activeDotFn = useRef<(i: number) => void>(() => {});

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

  useEffect(() => {
    const id = setInterval(() => { if (!pausedRef.current) next(); }, 3500);
    return () => clearInterval(id);
  }, [next]);

  function onPointerDown(e: React.PointerEvent) {
    if (busyRef.current) return;
    drag.current = {
      active:  true,
      startX:  e.clientX,
      startTx: offsetRef.current - idxRef.current * STEP,
      moved:   false,
    };
    pausedRef.current = true;
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
    if (drag.current.moved && Math.abs(delta) > STEP * 0.25) {
      if (delta < 0) next();
      else prev();
    } else {
      moveTo(idxRef.current, true);
    }
  }

  const dotsRef = useRef<HTMLButtonElement[]>([]);
  activeDotFn.current = (active: number) => {
    dotsRef.current.forEach((btn, i) => {
      if (!btn) return;
      if (i === active) {
        btn.className = btn.className
          .replace("w-2 bg-[#EADBD2]", "w-6 bg-[#D89AAE]");
      } else {
        btn.className = btn.className
          .replace("w-6 bg-[#D89AAE]", "w-2 bg-[#EADBD2]");
      }
    });
  };

  return (
    <div
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <div ref={viewportRef} className="relative overflow-hidden touch-pan-y">
        <div
          ref={trackRef}
          className="flex gap-6 select-none cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {extended.map((member, i) => (
            <div key={`${member.id}-${i}`}>
              <MemberCard member={member} />
            </div>
          ))}
        </div>

        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-[#221915] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-[#221915] to-transparent z-10" />
      </div>

      <div className="flex items-center justify-center gap-6 mt-8">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous team member"
          className="w-10 h-10 rounded-full bg-[#2A1F18] border border-[#3A2E26] flex items-center justify-center
                     text-[#B8A89A] hover:bg-[#D89AAE] hover:text-white hover:border-[#D89AAE] transition-all"
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
                  ? "w-6 bg-[#D89AAE]"
                  : "w-2 bg-[#EADBD2] hover:bg-[#D89AAE]/60"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          aria-label="Next team member"
          className="w-10 h-10 rounded-full bg-[#2A1F18] border border-[#3A2E26] flex items-center justify-center
                     text-[#B8A89A] hover:bg-[#D89AAE] hover:text-white hover:border-[#D89AAE] transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function StaticGrid({ members }: { members: TeamMember[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      {members.map((member) => (
        <MemberCard key={member.id} member={member} />
      ))}
    </div>
  );
}
