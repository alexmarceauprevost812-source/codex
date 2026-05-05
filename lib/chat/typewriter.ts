"use client";

import { useEffect, useRef, useState } from "react";

const CHARS_PER_FRAME = 3;

/**
 * Smoothly reveals streaming text character-by-character.
 *
 * - While `done` is false, the displayed string catches up to `target`
 *   at CHARS_PER_FRAME chars per requestAnimationFrame (~180 chars/s
 *   at 60fps). New tokens arriving from the SSE stream get queued and
 *   are flushed gracefully instead of popping in.
 * - When `done` flips to true, the remaining suffix is flushed
 *   immediately so the message is complete the moment streaming ends.
 */
export function useTypewriter(target: string, done: boolean): string {
  const [displayed, setDisplayed] = useState(() => (done ? target : ""));
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    if (done) {
      setDisplayed(target);
      return;
    }
    let alive = true;
    let raf = 0;
    function tick() {
      if (!alive) return;
      setDisplayed((prev) => {
        const t = targetRef.current;
        if (prev.length >= t.length) return prev;
        const advance = Math.min(t.length - prev.length, CHARS_PER_FRAME);
        return t.slice(0, prev.length + advance);
      });
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [done, target]);

  return done ? target : displayed;
}
