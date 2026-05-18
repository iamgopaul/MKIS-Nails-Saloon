"use client";

import { useEffect, useRef } from "react";

/**
 * Full-viewport canvas of drifting rose-pink particles. Reacts gently to
 * mouse / touch (soft repulsion). Sits behind ALL page content via
 * position: fixed + z-index: -1. Respects prefers-reduced-motion and pauses
 * while the tab is hidden.
 */

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  baseX: number; baseY: number;
  color: string;
  radius: number;
  phase: number;
}

const COLORS = [
  "rgba(216,154,174,0.65)", // rose
  "rgba(229,176,194,0.55)", // soft rose
  "rgba(201,149,107,0.40)", // muted gold
  "rgba(240,228,216,0.35)", // cream
];

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0, height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      width  = window.innerWidth;
      height = window.innerHeight;
      canvas!.width  = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width  = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const count = Math.min(110, Math.max(50, Math.round((width * height) / 20000)));
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      particles.push({
        x, y, vx: 0, vy: 0,
        baseX: x, baseY: y,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        radius: 1.4 + Math.random() * 2.0,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const pointer = { x: -9999, y: -9999, active: false };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onLeave = () => { pointer.active = false; pointer.x = pointer.y = -9999; };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    function tick(now: number) {
      ctx!.clearRect(0, 0, width, height);
      const t = now * 0.001;

      for (const p of particles) {
        // Drift wander on the home base, then spring softly toward it.
        p.baseX += Math.sin(t * 0.4 + p.phase) * 0.06;
        p.baseY += Math.cos(t * 0.35 + p.phase) * 0.06;
        // Wrap base around viewport. Snap the particle position too so it
        // doesn't streak across the screen chasing its wrapped home.
        if (p.baseX < -20)         { p.baseX = width + 20;  p.x = p.baseX; p.vx = 0; }
        if (p.baseX > width + 20)  { p.baseX = -20;          p.x = p.baseX; p.vx = 0; }
        if (p.baseY < -20)         { p.baseY = height + 20; p.y = p.baseY; p.vy = 0; }
        if (p.baseY > height + 20) { p.baseY = -20;          p.y = p.baseY; p.vy = 0; }

        p.vx += (p.baseX - p.x) * 0.008;
        p.vy += (p.baseY - p.y) * 0.008;

        // Gentle pointer nudge
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          const R = 90;
          if (d2 < R * R && d2 > 0.5) {
            const d = Math.sqrt(d2);
            const f = (1 - d / R) * 1.2;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }

        p.vx *= 0.86;
        p.vy *= 0.86;
        p.x  += p.vx;
        p.y  += p.vy;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.fill();
      }

      raf = requestAnimationFrame(tick);
    }

    let raf = requestAnimationFrame(tick);

    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: -1 }}
    />
  );
}
