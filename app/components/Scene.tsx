"use client";

import { useEffect, useRef } from "react";
import { createStarfield } from "./starfield";
import { createWordmark } from "./wordmark";

const BEAT_MS = 2000; // one heartbeat (one swipe) every 2 seconds
const SWIPE = 0.6; // swipe takes 60% of the beat (~1.2s) to cross the word, then rests
const INTRO_DELAY = 300;
const INTRO_MS = 1400;

// Band travels from just off the left edge to just off the right edge.
const FROM = -0.12;
const TO = 1.12;

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/**
 * One swipe per heartbeat, crossing the whole word from left to right.
 * Also returns `pulse` (0..1), used for the glow.
 */
function swipesAt(phase: number) {
  const t = phase / SWIPE;
  if (t > 1) return { swipes: [], pulse: 0 };
  return {
    swipes: [{ pos: FROM + (TO - FROM) * easeInOutSine(t), amp: 1 }],
    pulse: Math.sin(Math.PI * t),
  };
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function Scene() {
  const stageRef = useRef<HTMLElement>(null);
  const starsRef = useRef<HTMLCanvasElement>(null);
  const wordRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stage = stageRef.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const family =
      getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() ||
      "sans-serif";

    const stars = createStarfield(starsRef.current!);
    const word = createWordmark(wordRef.current!, family);

    let raf = 0;
    let cancelled = false;
    const onResize = () => {
      stars.layout();
      word.layout();
    };

    document.fonts.load(`900 100px ${family}`).finally(() => {
      if (cancelled) return;
      onResize();
      window.addEventListener("resize", onResize);
      const t0 = performance.now();
      const beatStart = t0 + INTRO_DELAY + INTRO_MS + 150;

      const frame = (now: number) => {
        // Intro: the word is swiped in from left to right, healing to solid behind it.
        const it = reduced ? 1 : Math.min(1, Math.max(0, (now - t0 - INTRO_DELAY) / INTRO_MS));
        const introPos = reduced ? 2 : FROM + (TO + 0.2 - FROM) * easeInOutSine(it);
        const alpha = reduced ? 1 : Math.min(1, it * 6);

        const beat =
          reduced || now < beatStart
            ? { swipes: [], pulse: 0 }
            : swipesAt(((now - beatStart) % BEAT_MS) / BEAT_MS);
        const swipes = it < 1 ? [...beat.swipes, { pos: introPos, amp: 1 }] : beat.swipes;
        const pulse = beat.pulse;

        stars.draw(reduced);
        word.draw({ swipes, reveal: it < 1 ? introPos + 0.02 : 2, alpha });
        stage.style.setProperty("--pulse", pulse.toFixed(3));
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <main ref={stageRef} className="stage">
      <canvas ref={starsRef} className="starfield" aria-hidden />
      <div className="nebula" aria-hidden />
      <div className="horizon" aria-hidden />
      <div className="grain" aria-hidden />

      <section className="center">
        <h1 className="title">
          <span className="sr-only">ORSI</span>
          <canvas ref={wordRef} className="wordmark" aria-hidden />
        </h1>
        <p className="tagline">
          <span className="dot" aria-hidden />
          Coming&nbsp;Soon
        </p>
      </section>
    </main>
  );
}
