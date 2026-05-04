"use client";

import { useEffect, useRef, useState } from "react";

import { useTheme } from "./theme-provider";

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
  const { bgMode, bgOpacity } = useTheme();

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
    const timeout = window.setTimeout(
      () => setPhase("app"),
      INTRO_DURATION_MS,
    );
    return () => window.clearTimeout(timeout);
  }, []);

  // During the intro the video is always shown at full opacity.
  // After the intro, opacity follows the chosen bg mode + slider.
  const isIntro = phase === "intro";
  const videoVisible = isIntro || bgMode === "video";
  const videoOpacity = isIntro
    ? 1
    : bgMode === "video"
      ? bgOpacity
      : 0;

  return (
    <>
      {videoVisible ? (
        <video
          ref={videoRef}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          style={{ opacity: videoOpacity }}
          className="fixed inset-0 -z-10 h-full w-full object-cover transition-opacity duration-1000 ease-in-out"
        />
      ) : null}
      <div
        className={`relative z-10 flex min-h-screen flex-col transition-opacity duration-1000 ease-in-out ${
          isIntro ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        {children}
      </div>
    </>
  );
}
