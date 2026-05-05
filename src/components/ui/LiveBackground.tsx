"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#E07898", "#C9956B", "#E07898", "#D4849A", "#E07898", "#C9956B", "#E896B0"];
const PARTICLE_COUNT_DESKTOP = 110;
const PARTICLE_COUNT_MOBILE  = 55;

type ShapeType = "heart" | "kiss" | "xoxo" | "mkis";

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function sampleHeart(n: number, scale: number) {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    return {
      x: 16 * Math.sin(t) ** 3 * (scale / 16),
      y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * (scale / 13),
    };
  });
}

function sampleKiss(n: number, scale: number) {
  const s = scale * 0.8;
  const thick = scale * 0.1;
  const half = Math.ceil(n / 2);
  return Array.from({ length: n }, (_, i) => {
    const isFirst = i < half;
    const idx = isFirst ? i : i - half;
    const len = isFirst ? half : n - half;
    const t = len > 1 ? (idx / (len - 1)) * 2 - 1 : 0;
    return {
      x: t * s + rand(-thick, thick),
      y: (isFirst ? t : -t) * s + rand(-thick, thick),
    };
  });
}

function sampleXOXO(n: number, letterH: number) {
  const letterW = letterH * 0.6;
  const gap = letterH * 0.32;
  const totalW = letterW * 4 + gap * 3;
  const centers = [
    -totalW / 2 + letterW * 0.5,
    -totalW / 2 + letterW * 1.5 + gap,
    -totalW / 2 + letterW * 2.5 + gap * 2,
    -totalW / 2 + letterW * 3.5 + gap * 3,
  ];
  const perLetter = Math.floor(n / 4);
  const pts: { x: number; y: number }[] = [];
  for (let li = 0; li < 4; li++) {
    const cx = centers[li];
    const isX = li % 2 === 0;
    const count = li === 3 ? n - pts.length : perLetter;
    const sx = letterW * 0.46, sy = letterH * 0.88;
    if (isX) {
      const half = Math.ceil(count / 2);
      for (let i = 0; i < half; i++) {
        const t = half > 1 ? (i / (half - 1)) * 2 - 1 : 0;
        pts.push({ x: cx + t * sx, y: t * sy });
      }
      for (let i = 0; i < count - half; i++) {
        const rem = count - half;
        const t = rem > 1 ? (i / (rem - 1)) * 2 - 1 : 0;
        pts.push({ x: cx + t * sx, y: -t * sy });
      }
    } else {
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        pts.push({ x: cx + Math.cos(t) * sx, y: Math.sin(t) * sy });
      }
    }
  }
  return pts;
}

function sampleMKIS(n: number, letterH: number): { x: number; y: number }[] {
  // Generous spacing so letters breathe
  const letterW = letterH * 0.78;
  const gap     = letterH * 0.50;
  const totalW  = letterW * 4 + gap * 3;
  const cxArr   = [
    -totalW / 2 + letterW * 0.5,
    -totalW / 2 + letterW * 1.5 + gap,
    -totalW / 2 + letterW * 2.5 + gap * 2,
    -totalW / 2 + letterW * 3.5 + gap * 3,
  ];

  const pts: { x: number; y: number }[] = [];
  const hy = letterH * 0.90;   // half-height of each letter
  const hw = letterW * 0.44;   // half-width of each letter

  function line(x1: number, y1: number, x2: number, y2: number, count: number) {
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0.5;
      pts.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
    }
  }

  // Particle budget per letter
  const mN = 28, kN = 22, iN = 16;
  const sN = n - mN - kN - iN;

  // ── M ────────────────────────────────────────────
  // Left vert | left-V diagonal | right-V diagonal | right vert
  {
    const cx = cxArr[0];
    const q  = Math.floor(mN / 4);
    line(cx - hw, -hy,  cx - hw, hy,   q);           // left vertical
    line(cx - hw, -hy,  cx,      0,    q);            // left  diagonal (V dips to centre)
    line(cx,      0,    cx + hw, -hy,  q);            // right diagonal
    line(cx + hw, -hy,  cx + hw, hy,   mN - q * 3);  // right vertical
  }

  // ── K ────────────────────────────────────────────
  // Left vert | upper arm (mid → top-right) | lower arm (mid → bot-right)
  {
    const cx = cxArr[1];
    const q  = Math.floor(kN / 3);
    line(cx - hw, -hy,  cx - hw, hy,   q);
    line(cx - hw, 0,    cx + hw, -hy,  q);
    line(cx - hw, 0,    cx + hw, hy,   kN - q * 2);
  }

  // ── I ────────────────────────────────────────────
  // Top serif | vertical stroke | bottom serif
  {
    const cx  = cxArr[2];
    const bw  = hw * 0.70;          // serif extends 70 % of half-width
    const q   = Math.floor(iN / 3);
    line(cx - bw, -hy,  cx + bw, -hy,  q);
    line(cx,      -hy,  cx,       hy,   q);
    line(cx - bw,  hy,  cx + bw,  hy,  iN - q * 2);
  }

  // ── S ────────────────────────────────────────────
  // Upper arc: right-facing bump ) connecting (cx,0) → (cx+rx, -hy/2) → (cx,-hy)
  // Lower arc: left-facing bump  ( connecting (cx,0) → (cx-rx, +hy/2) → (cx,+hy)
  {
    const cx  = cxArr[3];
    const half = Math.ceil(sN / 2);
    const rx  = hw * 0.92;
    const ryH = hy * 0.50;   // half letter height

    // a sweeps −π/2 → +π/2
    for (let i = 0; i < half; i++) {
      const a = -Math.PI / 2 + (i / (half - 1)) * Math.PI;
      pts.push({ x: cx + rx * Math.cos(a), y: -ryH - ryH * Math.sin(a) });
    }
    const remS = sN - half;
    for (let i = 0; i < remS; i++) {
      const a = -Math.PI / 2 + (i / (remS - 1)) * Math.PI;
      pts.push({ x: cx - rx * Math.cos(a), y:  ryH + ryH * Math.sin(a) });
    }
  }

  return pts;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  baseVx: number; baseVy: number;
  radius: number; alpha: number;
  color: string; pulse: number; pulseSpeed: number;
  targetX: number; targetY: number;
  inFormation: boolean;
}

interface Formation {
  phase: "forming" | "holding" | "dispersing";
  timer: number;
  type: ShapeType;
  cx: number; cy: number;
  indices: number[];
}

const SHAPE_SIZES: Record<ShapeType, number> = { heart: 32, kiss: 28, xoxo: 60, mkis: 88 };

export default function LiveBackground() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const mouseRef     = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const formationRef = useRef<Formation | null>(null);
  const cooldownRef  = useRef(300);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    let animId: number;

    // Hearts appear most often; MKIS appears occasionally
    const shapePool: ShapeType[] = ["heart","heart","heart","heart","kiss","xoxo","mkis"];
    let lastShape: ShapeType | null = null;

    function pickShape(): ShapeType {
      const pool = shapePool.filter(s => s !== lastShape);
      const choice = pool[Math.floor(Math.random() * pool.length)];
      lastShape = choice;
      return choice;
    }

    const BLOCKING_TAGS = new Set([
      "h1","h2","h3","h4","h5","h6","p","span","a","button",
      "input","textarea","select","label","img","svg","li","ul","ol",
      "form","nav","header","table","td","th",
    ]);

    // Walk the ancestor chain at a point — blocks if any ancestor is a card or content element
    function isPointClear(x: number, y: number): boolean {
      if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) return false;
      const el = document.elementFromPoint(x, y);
      if (!el) return true;
      let node: Element | null = el;
      while (node && node.tagName.toLowerCase() !== "body") {
        const tag = node.tagName.toLowerCase();
        if (BLOCKING_TAGS.has(tag)) return false;
        const cls = node.getAttribute("class") ?? "";
        if (
          cls.includes("rounded-3xl") || cls.includes("rounded-2xl") ||
          cls.includes("rounded-xl")  ||
          cls.includes("bg-[#1C1614]") ||
          cls.includes("bg-gradient") ||
          cls.includes("shadow-xl")   || cls.includes("shadow-2xl") ||
          cls.includes("border border-[#E07898]") ||
          cls.includes("backdrop-blur")
        ) return false;
        node = node.parentElement;
      }
      return true;
    }

    function findSafeCenter(type: ShapeType): { cx: number; cy: number } | null {
      const scale   = Math.min(canvas.width, canvas.height) * 0.11;
      const letterH = scale * 0.70;                          // larger text
      const mkisLH  = scale * 0.85;
      const halfW   = type === "mkis"
        ? (mkisLH * 0.78 * 4 + mkisLH * 0.50 * 3) / 2 + 30
        : type === "xoxo"
        ? (letterH * 0.60 * 4 + letterH * 0.32 * 3) / 2 + 30
        : scale + 30;
      const halfH = scale + 30;
      const navH  = 80;

      for (let attempt = 0; attempt < 35; attempt++) {
        const cx = rand(halfW, canvas.width - halfW);
        const cy = rand(navH + halfH, canvas.height - halfH);

        // Dense grid of test points covering the full shape bounding box
        const tests: [number, number][] = [
          [cx,               cy],
          [cx - halfW * 0.8, cy],
          [cx + halfW * 0.8, cy],
          [cx,               cy - halfH * 0.8],
          [cx,               cy + halfH * 0.8],
          [cx - halfW * 0.5, cy - halfH * 0.5],
          [cx + halfW * 0.5, cy - halfH * 0.5],
          [cx - halfW * 0.5, cy + halfH * 0.5],
          [cx + halfW * 0.5, cy + halfH * 0.5],
        ];
        if (tests.every(([x, y]) => isPointClear(x, y))) return { cx, cy };
      }
      return null;
    }

    function buildTargets(type: ShapeType, cx: number, cy: number, n: number) {
      const scale = Math.min(canvas.width, canvas.height) * 0.11;
      let pts: { x: number; y: number }[];
      if (type === "heart")       pts = sampleHeart(n, scale);
      else if (type === "kiss")   pts = sampleKiss(n, scale);
      else if (type === "xoxo")   pts = sampleXOXO(n, scale * 0.70);
      else                        pts = sampleMKIS(n, scale * 0.85);
      return pts.map(p => ({ x: cx + p.x, y: cy + p.y }));
    }

    function init() {
      const count = canvas.width < 768 ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;
      particlesRef.current = Array.from({ length: count }, () => {
        const baseVx = rand(-0.3, 0.3);
        const baseVy = rand(-0.6, -0.15);
        return {
          x: rand(0, canvas.width), y: rand(0, canvas.height),
          vx: baseVx, vy: baseVy, baseVx, baseVy,
          radius: rand(1.5, 5), alpha: rand(0.15, 0.55),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          pulse: rand(0, Math.PI * 2), pulseSpeed: rand(0.008, 0.025),
          targetX: 0, targetY: 0, inFormation: false,
        };
      });
      formationRef.current = null;
      cooldownRef.current  = Math.round(rand(360, 540));
    }

    function startFormation() {
      const type = pickShape();
      const n    = SHAPE_SIZES[type];

      const center = findSafeCenter(type);
      if (!center) { cooldownRef.current = 90; return; }
      const { cx, cy } = center;

      const particles = particlesRef.current;

      // Pick the n free particles already closest to the formation center
      const chosen = particles
        .map((p, i) => ({ i, d2: (p.x - cx) ** 2 + (p.y - cy) ** 2 }))
        .filter(({ i }) => !particles[i].inFormation)
        .sort((a, b) => a.d2 - b.d2)
        .slice(0, n)
        .map(({ i }) => i);

      if (chosen.length < n) return;

      const targets  = buildTargets(type, cx, cy, n);

      // Greedy nearest-neighbour assignment — each particle gets the target
      // closest to its current position so travel distances stay short
      const assigned = new Array(targets.length).fill(false);
      chosen.forEach(pi => {
        const p = particles[pi];
        let bestIdx = -1, bestDist = Infinity;
        for (let ti = 0; ti < targets.length; ti++) {
          if (assigned[ti]) continue;
          const d2 = (targets[ti].x - p.x) ** 2 + (targets[ti].y - p.y) ** 2;
          if (d2 < bestDist) { bestDist = d2; bestIdx = ti; }
        }
        if (bestIdx >= 0) {
          assigned[bestIdx] = true;
          particles[pi].inFormation = true;
          particles[pi].targetX     = targets[bestIdx].x;
          particles[pi].targetY     = targets[bestIdx].y;
        }
      });

      formationRef.current = { phase: "forming", timer: 900, type, cx, cy, indices: chosen };
    }

    function disperseFormation() {
      const f = formationRef.current!;
      const particles = particlesRef.current;
      f.phase = "dispersing";
      f.timer = 110;
      f.indices.forEach(pi => {
        const p = particles[pi];
        const dx = p.x - f.cx, dy = p.y - f.cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = rand(0.6, 1.6);
        p.vx = (dx / dist) * speed + rand(-0.3, 0.3);
        p.vy = (dy / dist) * speed + rand(-0.3, 0.3);
        p.baseVx = rand(-0.3, 0.3);
        p.baseVy = rand(-0.6, -0.15);
      });
    }

    function releaseFormation() {
      formationRef.current!.indices.forEach(pi => {
        particlesRef.current[pi].inFormation = false;
      });
      formationRef.current = null;
      cooldownRef.current  = Math.round(rand(420, 600));
    }

    // clientWidth/clientHeight are stable on iOS (don't shift with browser chrome)
    function getSize() {
      return {
        w: document.documentElement.clientWidth,
        h: document.documentElement.clientHeight,
      };
    }

    function resize() {
      const { w, h } = getSize();
      canvas.width  = w;
      canvas.height = h;
      // On subsequent resizes just clamp particles — don't re-init (avoids iOS chrome glitch)
      if (particlesRef.current.length === 0) {
        init();
      } else {
        particlesRef.current.forEach((p) => {
          p.x = Math.min(p.x, w);
          p.y = Math.min(p.y, h);
        });
        if (formationRef.current) releaseFormation();
        cooldownRef.current = 180;
      }
    }

    function hardResize() {
      const { w, h } = getSize();
      canvas.width  = w;
      canvas.height = h;
      init();
    }

    function drawBg() {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#0A0A0A");
      grad.addColorStop(0.5, "#0E0B09");
      grad.addColorStop(1, "#120D0A");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function draw() {
      drawBg();

      const particles = particlesRef.current;
      const mouse     = mouseRef.current;
      const formation = formationRef.current;

      // Advance formation state machine
      if (formation) {
        formation.timer--;
        if (formation.timer <= 0) {
          if      (formation.phase === "forming")    { formation.phase = "holding"; formation.timer = Math.round(rand(160, 260)); }
          else if (formation.phase === "holding")    disperseFormation();
          else if (formation.phase === "dispersing") releaseFormation();
        }
      } else {
        cooldownRef.current--;
        if (cooldownRef.current <= 0) startFormation();
      }

      // Connection lines between nearby free particles
      const connDist  = 100;
      const connDist2 = connDist * connDist;
      for (let i = 0; i < particles.length; i++) {
        if (particles[i].inFormation) continue;
        for (let j = i + 1; j < particles.length; j++) {
          if (particles[j].inFormation) continue;
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < connDist2) {
            const opacity = (1 - Math.sqrt(d2) / connDist) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(201,149,107,${opacity * 0.6})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Pink constellation lines between nearby formation particles
      if (formation && (formation.phase === "forming" || formation.phase === "holding")) {
        const fConnDist  = 30;
        const fConnDist2 = fConnDist * fConnDist;
        const lineOpacity = formation.phase === "holding" ? 0.28 : 0.16;
        for (let i = 0; i < formation.indices.length; i++) {
          for (let j = i + 1; j < formation.indices.length; j++) {
            const a = particles[formation.indices[i]];
            const b = particles[formation.indices[j]];
            const dx = a.x - b.x, dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < fConnDist2) {
              const a2 = (1 - Math.sqrt(d2) / fConnDist) * lineOpacity;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `${COLORS[0]}${Math.round(a2 * 255).toString(16).padStart(2, "0")}`;
              ctx.lineWidth = 0.7;
              ctx.stroke();
            }
          }
        }
      }

      // Update and draw every particle
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!p.inFormation) {
          // Free drift
          p.vx += (p.baseVx - p.vx) * 0.04;
          p.vy += (p.baseVy - p.vy) * 0.04;

          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140 && dist > 0) {
            p.vx += (dx / dist) * ((140 - dist) / 140) * 0.8;
            p.vy += (dy / dist) * ((140 - dist) / 140) * 0.8;
          } else if (dist < 280 && dist > 140) {
            p.vx -= (dx / dist) * ((280 - dist) / 280) * 0.04;
            p.vy -= (dy / dist) * ((280 - dist) / 280) * 0.04;
          }

          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (speed > 4) { p.vx = (p.vx / speed) * 4; p.vy = (p.vy / speed) * 4; }

          p.x += p.vx;
          p.y += p.vy;

          if (p.y < -10) { p.y = canvas.height + 10; p.x = rand(0, canvas.width); }
          if (p.x < -10)  p.x = canvas.width + 10;
          if (p.x > canvas.width + 10) p.x = -10;

        } else if (formation) {
          if (formation.phase === "forming" || formation.phase === "holding") {
            // Very slow spring toward target
            const springK = formation.phase === "holding" ? 0.045 : 0.0008;
            const damping = formation.phase === "holding" ? 0.88 : 0.989;
            p.vx += (p.targetX - p.x) * springK;
            p.vy += (p.targetY - p.y) * springK;
            // Gentle wandering noise so particles meander rather than beeline
            if (formation.phase === "forming") {
              p.vx += rand(-0.04, 0.04);
              p.vy += rand(-0.04, 0.04);
            }

            const dx = p.x - mouse.x, dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100 && dist > 0) {
              p.vx += (dx / dist) * ((100 - dist) / 100) * 0.7;
              p.vy += (dy / dist) * ((100 - dist) / 100) * 0.7;
            }

            p.vx *= damping;
            p.vy *= damping;
            p.x += p.vx;
            p.y += p.vy;

            if (formation.phase === "holding") {
              p.x += rand(-0.2, 0.2);
              p.y += rand(-0.2, 0.2);
            }
          } else {
            // Dispersing: gentle ease back to free drift
            p.vx += (p.baseVx - p.vx) * 0.02;
            p.vy += (p.baseVy - p.vy) * 0.02;
            p.x += p.vx;
            p.y += p.vy;
            if (p.y < -10) { p.y = canvas.height + 10; p.x = rand(0, canvas.width); }
            if (p.x < -10)  p.x = canvas.width + 10;
            if (p.x > canvas.width + 10) p.x = -10;
          }
        }

        // Draw: radial gradient glow + solid core
        p.pulse += p.pulseSpeed;
        const displayAlpha = p.alpha + Math.sin(p.pulse) * 0.1;

        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        glow.addColorStop(0, p.color + Math.round(displayAlpha * 255).toString(16).padStart(2, "0"));
        glow.addColorStop(1, p.color + "00");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(Math.min(displayAlpha + 0.2, 1) * 255).toString(16).padStart(2, "0");
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    hardResize();
    draw();

    // Debounced resize — prevents iOS pull-to-refresh and chrome-height changes
    // from re-initialising particles on every intermediate frame
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 250);
    };
    const onMouseMove  = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onMouseLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-[1]"
    />
  );
}
