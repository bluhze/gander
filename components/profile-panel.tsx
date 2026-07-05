"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { ProfilePhotoUpload } from "@/components/profile-photo-upload";
import { GreetingPlayer } from "@/components/greeting-player";
import { ageFromBirthdate, formatBirthdateDisplay, stateName } from "@/lib/profile";

type ProfilePanelProps = {
  userId?: string;
  displayName?: string;
  birthdate?: string;
  state?: string | null;
  photoUrl?: string | null;
  greetingUrl?: string | null;
};

export function ProfilePanel({
  userId,
  displayName = "",
  birthdate = "",
  state = null,
  photoUrl = null,
  greetingUrl = null,
}: ProfilePanelProps) {
  const router = useRouter();
  const hasProfile = Boolean(displayName && birthdate && state);
  const [editing, setEditing] = useState(!hasProfile);

  return (
    <div className="space-y-6">
      <ProfilePhotoUpload
        key={photoUrl ?? "no-photo"}
        userId={userId}
        initialUrl={photoUrl}
        onUploaded={() => router.refresh()}
      />

      {editing ? (
        <ProfileForm
          userId={userId}
          showPhoto={false}
          initialDisplayName={displayName}
          initialBirthdate={birthdate ? formatBirthdateDisplay(birthdate) : ""}
          initialState={state ?? ""}
          submitLabel={hasProfile ? "Save changes" : "Save profile"}
          onSaved={() => setEditing(false)}
          onCancel={hasProfile ? () => setEditing(false) : undefined}
        />
      ) : (
        <>
          <div className="space-y-1 text-center">
            <p className="text-xl font-semibold text-zinc-900">{displayName}</p>
            {birthdate ? (
              <p className="text-zinc-600">{ageFromBirthdate(birthdate)}</p>
            ) : null}
            <p className="text-zinc-600">{stateName(state)}</p>
          </div>

          <GreetingPlayer greetingUrl={greetingUrl} />

          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
          >
            Edit profile
          </button>
        </>
      )}
    </div>
  );
}
