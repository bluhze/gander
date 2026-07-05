"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertProfile } from "@/app/app/profile/actions";
import { BirthdateInput } from "@/components/birthdate-input";
import { ProfilePhotoUpload } from "@/components/profile-photo-upload";
import { GreetingRecorder } from "@/components/greeting-recorder";
import {
  US_STATES,
  inputClassName,
  labelClassName,
} from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import { uploadProfilePhoto } from "@/lib/profile-photo";
import { uploadProfileGreeting } from "@/lib/profile-greeting";

type ProfileFormProps = {
  userId?: string;
  initialDisplayName?: string;
  initialBirthdate?: string;
  initialState?: string;
  initialPhotoUrl?: string | null;
  initialGreetingUrl?: string | null;
  showPhoto?: boolean;
  showGreeting?: boolean;
  showGreetingSkip?: boolean;
  submitLabel?: string;
  redirectTo?: string;
  onSaved?: () => void;
  onCancel?: () => void;
};

export function ProfileForm({
  userId,
  initialDisplayName = "",
  initialBirthdate = "",
  initialState = "",
  initialPhotoUrl = null,
  initialGreetingUrl = null,
  showPhoto = true,
  showGreeting = false,
  showGreetingSkip = false,
  submitLabel = "Save profile",
  redirectTo,
  onSaved,
  onCancel,
}: ProfileFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [birthdate, setBirthdate] = useState(initialBirthdate);
  const [state, setState] = useState(initialState);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [greetingFile, setGreetingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await upsertProfile({
      displayName,
      birthdate,
      state,
    });

    if (result.error) {
      setMessage(result.error);
      setLoading(false);
      return;
    }

    if (photoFile && userId && showPhoto) {
      const supabase = createClient();
      const { error: photoError } = await uploadProfilePhoto(
        supabase,
        userId,
        photoFile,
      );

      if (photoError) {
        setMessage(photoError);
        setLoading(false);
        return;
      }
    }

    if (greetingFile && userId) {
      const supabase = createClient();
      const { error: greetingError } = await uploadProfileGreeting(
        supabase,
        userId,
        greetingFile,
      );

      if (greetingError) {
        setMessage(greetingError);
        setLoading(false);
        return;
      }
    }

    if (redirectTo) {
      router.push(redirectTo);
      router.refresh();
      return;
    }

    setMessage("Profile saved.");
    setLoading(false);
    router.refresh();
    onSaved?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showPhoto && (
        <ProfilePhotoUpload
          initialUrl={initialPhotoUrl}
          deferUpload
          onFileSelected={setPhotoFile}
        />
      )}

      <div>
        <label htmlFor="displayName" className={labelClassName}>
          Name
        </label>
        <input
          id="displayName"
          type="text"
          required
          maxLength={50}
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className={inputClassName}
          placeholder="Your name"
        />
      </div>

      <BirthdateInput value={birthdate} onChange={setBirthdate} />

      <div>
        <label htmlFor="state" className={labelClassName}>
          Location (state)
        </label>
        <select
          id="state"
          required
          value={state}
          onChange={(event) => setState(event.target.value)}
          className={inputClassName}
        >
          <option value="" disabled>
            Select your state
          </option>
          {US_STATES.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {showGreeting && (
        <GreetingRecorder
          userId={userId}
          initialUrl={initialGreetingUrl}
          deferUpload
          showSkip={showGreetingSkip}
          onFileSelected={setGreetingFile}
        />
      )}

      {message && (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            message === "Profile saved."
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {message}
        </p>
      )}

      <div className={onCancel ? "flex gap-3" : undefined}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
