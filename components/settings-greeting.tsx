"use client";

import { useRouter } from "next/navigation";
import { GreetingRecorder } from "@/components/greeting-recorder";

type SettingsGreetingProps = {
  userId?: string;
  greetingUrl?: string | null;
};

export function SettingsGreeting({ userId, greetingUrl }: SettingsGreetingProps) {
  const router = useRouter();

  return (
    <GreetingRecorder
      key={greetingUrl ?? "no-greeting"}
      userId={userId}
      initialUrl={greetingUrl}
      onUploaded={() => router.refresh()}
    />
  );
}
