"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { BirthdateInput } from "@/components/birthdate-input";
import { ProfilePhotoUpload } from "@/components/profile-photo-upload";
import { GreetingRecorder } from "@/components/greeting-recorder";
import {
  inputClassName,
  labelClassName,
  parseBirthdateInput,
  US_STATES,
} from "@/lib/profile";
import { uploadProfilePhoto } from "@/lib/profile-photo";
import { uploadProfileGreeting } from "@/lib/profile-greeting";

type Mode = "sign-in" | "sign-up";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [state, setState] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [greetingFile, setGreetingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();

    if (mode === "sign-up") {
      if (!displayName.trim()) {
        setMessage("Name is required.");
        setLoading(false);
        return;
      }

      const parsedBirthdate = parseBirthdateInput(birthdate);
      if (!parsedBirthdate.ok) {
        setMessage(parsedBirthdate.error);
        setLoading(false);
        return;
      }

      if (!state) {
        setMessage("Please select your state.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName.trim(),
            birthdate: parsedBirthdate.iso,
            state,
          },
        },
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      if (data.session && data.user) {
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            display_name: displayName.trim(),
            birthdate: parsedBirthdate.iso,
            state,
          },
          { onConflict: "id" },
        );

        if (profileError) {
          setMessage(profileError.message);
          setLoading(false);
          return;
        }

        if (photoFile) {
          const { error: photoError } = await uploadProfilePhoto(
            supabase,
            data.user.id,
            photoFile,
          );
          if (photoError) {
            setMessage(photoError);
            setLoading(false);
            return;
          }
        }

        if (greetingFile) {
          const { error: greetingError } = await uploadProfileGreeting(
            supabase,
            data.user.id,
            greetingFile,
          );
          if (greetingError) {
            setMessage(greetingError);
            setLoading(false);
            return;
          }
        }

        router.push("/app");
        router.refresh();
        return;
      }

      setMessage("Check your email to confirm your account, then sign in.");
      setMode("sign-in");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/app");
    router.refresh();
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setMessage(null);
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-900">
          {mode === "sign-in" ? "Welcome back" : "Join Gander"}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {mode === "sign-in"
            ? "Enter your email and password to continue."
            : "Create your account and profile."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-h-[min(52vh,520px)] space-y-4 overflow-y-auto pr-1">
        {mode === "sign-up" && (
          <>
            <ProfilePhotoUpload
              deferUpload
              onFileSelected={setPhotoFile}
            />

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

            <GreetingRecorder
              deferUpload
              showSkip
              onFileSelected={setGreetingFile}
            />
          </>
        )}

        <div>
          <label htmlFor="email" className={labelClassName}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassName}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClassName}>
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
            placeholder="••••••••"
          />
        </div>

        {message && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-rose-500/25 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Please wait…" : mode === "sign-in" ? "Continue" : "Create account"}
        </button>

        {mode === "sign-up" && (
          <p className="text-xs leading-relaxed text-zinc-500">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="font-medium text-rose-600 hover:text-rose-700">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-medium text-rose-600 hover:text-rose-700"
            >
              Privacy Policy
            </Link>
            .
          </p>
        )}
      </form>

      <p className="mt-6 text-sm text-zinc-500">
        {mode === "sign-in" ? "New here?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => switchMode(mode === "sign-in" ? "sign-up" : "sign-in")}
          className="font-medium text-rose-500 hover:text-rose-600"
        >
          {mode === "sign-in" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
