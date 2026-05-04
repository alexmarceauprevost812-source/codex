"use client";

import { useEffect, useRef, useState } from "react";

const INTRO_DURATION_MS = 4000;

type Phase = "intro" | "app";

export function VideoStage({
  src,
  children,
}: {
  src: string;
  children: React.ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("intro");

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
    const timeout = window.setTimeout(
      () => setPhase("app"),
      INTRO_DURATION_MS,
    );
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        className={`fixed inset-0 -z-10 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
          phase === "intro" ? "opacity-100" : "opacity-40"
        }`}
      />
      <div
        className={`relative z-10 flex min-h-screen flex-col transition-opacity duration-1000 ease-in-out ${
          phase === "intro"
            ? "pointer-events-none opacity-0"
            : "opacity-100"
        }`}
      >
        {children}
      </div>
    </>
  );
}
