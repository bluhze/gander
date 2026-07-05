"use client";

import { useEffect, useRef, useState } from "react";

type GreetingPlayButtonProps = {
  greetingUrl: string;
  className?: string;
  size?: "sm" | "md";
};

export function GreetingPlayButton({
  greetingUrl,
  className,
  size = "md",
}: GreetingPlayButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  function getAudio() {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("ended", () => setPlaying(false));
    }
    audioRef.current.src = greetingUrl;
    return audioRef.current;
  }

  function stopGreeting() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setPlaying(false);
  }

  function handleClick() {
    if (playing) {
      stopGreeting();
      return;
    }

    const audio = getAudio();
    void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={playing ? "Stop greeting" : "Play greeting"}
      className={
        className ??
        `flex items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 ${
          size === "sm" ? "h-8 w-8" : "h-12 w-12"
        }`
      }
    >
      {playing ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5"}
        >
          <rect x="6" y="6" width="12" height="12" rx="1" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`translate-x-0.5 ${size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5"}`}
        >
          <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.26-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
        </svg>
      )}
    </button>
  );
}
