"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * Intro overlay that plays a warm-tinted sakura-petals transition over the
 * full viewport on every page load, with the MKIS Nails Salon logo centered
 * on top. The video has bg.png + warm-gold-tinted petals baked in. A 78%
 * dark scrim is overlaid via CSS to match the page background, then the
 * whole overlay slow-fades to reveal the page underneath.
 *
 * Respects prefers-reduced-motion.
 */

const FADE_MS = 1200;

export default function SakuraIntro() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [fadingOut, setFadingOut] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Users who prefer reduced motion get the intro skipped, but the overlay
    // has already painted server-side — dismiss it immediately.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDone(true);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    video.play().catch(() => {
      setFadingOut(true);
      setTimeout(() => setDone(true), 400);
    });

    const safety = window.setTimeout(
      () => beginFade(),
      (video.duration || 8.5) * 1000 + 600
    );
    return () => window.clearTimeout(safety);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function beginFade() {
    setFadingOut(true);
    window.setTimeout(() => setDone(true), FADE_MS);
  }

  if (done) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none ${fadingOut ? "opacity-0" : "opacity-100"}`}
      style={{
        zIndex: 60,
        transition: `opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
    >
      <video
        ref={videoRef}
        src="/sakura-intro.mp4"
        muted
        autoPlay
        playsInline
        preload="auto"
        onEnded={beginFade}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dark scrim — exact same rgba as body::before in globals.css. */}
      <div className="absolute inset-0" style={{ background: "rgba(26, 20, 16, 0.78)" }} />

      {/* Centered logo with rose halo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative animate-[sakura-logo-in_1100ms_cubic-bezier(0.16,1,0.3,1)_200ms_both]">
          <div className="absolute inset-0 -m-12 rounded-full bg-[#D89AAE]/25 blur-3xl logo-glow" />
          <Image
            src="/logo-transparent.png"
            alt="MKIS Nails Salon"
            width={520}
            height={520}
            priority
            className="relative w-[62vw] max-w-[480px] h-auto drop-shadow-[0_24px_48px_rgba(0,0,0,0.55)]"
          />
        </div>
      </div>

      <style>{`
        /* Scroll lock while the overlay is mounted; unmount removes the rule. */
        body { overflow: hidden !important; }
        html { overflow: hidden !important; }

        @keyframes sakura-logo-in {
          0%   { opacity: 0; transform: scale(0.88) translateY(8px); }
          100% { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}
