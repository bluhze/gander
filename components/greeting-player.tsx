"use client";

import { GreetingPlayButton } from "@/components/greeting-play-button";

type GreetingPlayerProps = {
  greetingUrl?: string | null;
};

export function GreetingPlayer({ greetingUrl }: GreetingPlayerProps) {
  if (!greetingUrl) return null;

  return (
    <div className="flex justify-center">
      <GreetingPlayButton greetingUrl={greetingUrl} />
    </div>
  );
}
