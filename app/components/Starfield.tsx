"use client";

import { useEffect, useRef } from "react";

type Star = { x: number; y: number; z: number; pz: number; hue: number };

const STAR_COUNT = 700;
const BASE_SPEED = 0.0016;
const SURGE = 0.012; // extra warp speed on each heartbeat

/** Heartbeat envelope in [0,1] — a "lub" at 44% of the cycle and a softer "dub" just after. */
function beatEnvelope(phase: number) {
  const bump = (center: number, width: number) =>
    Math.exp(-((phase - center) ** 2) / (2 * width * width));
  return Math.min(1, bump(0.45, 0.025) + 0.55 * bump(0.57, 0.025));
}

export default function Starfield({ beatMs }: { beatMs: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const spawn = (s?: Star): Star => {
      const z = s ? 1 : Math.random();
      const star = s ?? ({} as Star);
      star.x = (Math.random() - 0.5) * 2;
      star.y = (Math.random() - 0.5) * 2;
      star.z = z;
      star.pz = z;
      star.hue = Math.random() < 0.15 ? 270 : 190 + Math.random() * 20;
      return star;
    };
    const stars = Array.from({ length: STAR_COUNT }, () => spawn());

    // This loop is the single clock for the whole page: it publishes --pulse (0..1 heartbeat
    // envelope) and --sweep (0..1 ECG position) on the stage so CSS stays perfectly in sync.
    const stage = canvas.parentElement!;
    const start = performance.now();

    let raf = 0;
    const draw = (now: number) => {
      const phase = ((now - start) % beatMs) / beatMs;
      const pulse = reduced ? 0 : beatEnvelope(phase);
      const speed = reduced ? 0.0003 : BASE_SPEED + SURGE * pulse;
      stage.style.setProperty("--pulse", pulse.toFixed(3));
      stage.style.setProperty("--sweep", reduced ? "0.6" : phase.toFixed(4));

      ctx.fillStyle = `rgba(2, 3, 10, ${0.35 - pulse * 0.2})`;
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const scale = Math.max(w, h) * 0.5;

      for (const s of stars) {
        s.pz = s.z;
        s.z -= speed;
        if (s.z <= 0.02) {
          spawn(s);
          continue;
        }
        const sx = cx + (s.x / s.z) * scale;
        const sy = cy + (s.y / s.z) * scale;
        const px = cx + (s.x / s.pz) * scale;
        const py = cy + (s.y / s.pz) * scale;
        if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) {
          spawn(s);
          continue;
        }
        const depth = 1 - s.z;
        const alpha = Math.min(1, depth * 1.4);
        ctx.strokeStyle = `hsla(${s.hue}, 100%, ${75 + depth * 25}%, ${alpha})`;
        ctx.lineWidth = Math.max(0.4, depth * 2.2);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [beatMs]);

  return <canvas ref={ref} className="starfield" aria-hidden />;
}
