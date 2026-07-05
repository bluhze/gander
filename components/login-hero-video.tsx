"use client";

import { useState } from "react";

const VIDEO_SRC = "/hero.mp4";

export function LoginHeroVideo() {
  const [videoReady, setVideoReady] = useState(false);

  return (
    <div className="relative flex h-full min-h-[280px] w-full items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-200 via-orange-100 to-amber-100 shadow-[0_24px_80px_-24px_rgba(244,63,94,0.45)] ring-1 ring-rose-200/60 lg:min-h-0">
      {!videoReady && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-rose-300/40 via-transparent to-amber-200/50" />
      )}

      <video
        autoPlay
        loop
        muted
        playsInline
        className={`h-full w-full object-cover transition-opacity duration-700 ${
          videoReady ? "opacity-100" : "opacity-0"
        }`}
        onCanPlay={() => setVideoReady(true)}
        onError={() => setVideoReady(false)}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

      {!videoReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-rose-700/80">
            Gander
          </p>
          <p className="max-w-xs text-lg font-semibold leading-snug text-rose-950/80">
            Drop your hero clip at{" "}
            <code className="rounded-md bg-white/50 px-1.5 py-0.5 text-sm font-normal">
              public/hero.mp4
            </code>
          </p>
        </div>
      )}
    </div>
  );
}
