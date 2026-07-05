"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { labelClassName } from "@/lib/profile";
import { GreetingPlayButton } from "@/components/greeting-play-button";
import {
  MAX_GREETING_SECONDS,
  uploadProfileGreeting,
  validateProfileGreeting,
} from "@/lib/profile-greeting";

type GreetingRecorderProps = {
  userId?: string;
  initialUrl?: string | null;
  deferUpload?: boolean;
  showSkip?: boolean;
  onFileSelected?: (file: File | null) => void;
  onUploaded?: () => void;
  onSkip?: () => void;
};

export function GreetingRecorder({
  userId,
  initialUrl = null,
  deferUpload = false,
  showSkip = false,
  onFileSelected,
  onUploaded,
  onSkip,
}: GreetingRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function persistGreeting(file: File) {
    if (deferUpload || !userId) {
      onFileSelected?.(file);
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const { error, path } = await uploadProfileGreeting(supabase, userId, file);
    setUploading(false);

    if (error) {
      setMessage(error);
      return;
    }

    if (path) {
      const { data } = await supabase.storage
        .from("profile-greetings")
        .createSignedUrl(path, 3600);

      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
      }
    }

    onUploaded?.();
  }

  async function startRecording() {
    setMessage(null);
    setSkipped(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stopStream();
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });
        const file = new File([blob], "greeting.webm", {
          type: blob.type || "audio/webm",
        });

        const validationError = validateProfileGreeting(file);
        if (validationError) {
          setMessage(validationError);
          return;
        }

        const objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
        await persistGreeting(file);
      };

      mediaRecorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        setSeconds((current) => {
          if (current + 1 >= MAX_GREETING_SECONDS) {
            stopRecording();
            return MAX_GREETING_SECONDS;
          }
          return current + 1;
        });
      }, 1000);
    } catch {
      setMessage("Microphone access is required to record a greeting.");
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    setRecording(false);
  }

  function handleSkip() {
    setSkipped(true);
    setPreviewUrl(null);
    onFileSelected?.(null);
    onSkip?.();
  }

  const hasGreeting = Boolean(previewUrl);

  return (
    <div>
      <p className={labelClassName}>Greeting</p>

      <div className="flex flex-wrap gap-2">
        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
          >
            Stop recording ({MAX_GREETING_SECONDS - seconds}s left)
          </button>
        ) : hasGreeting ? (
          <>
            <GreetingPlayButton greetingUrl={previewUrl!} />
            <button
              type="button"
              onClick={startRecording}
              disabled={uploading}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
            >
              Re-record
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={uploading || skipped}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
          >
            {uploading ? "Saving…" : "Record greeting"}
          </button>
        )}
      </div>

      {showSkip && !hasGreeting && !recording && (
        <button
          type="button"
          onClick={handleSkip}
          className="mt-2 text-sm font-medium text-zinc-500 transition hover:text-rose-500"
        >
          Skip for now
        </button>
      )}

      {!showSkip && !hasGreeting && !recording && !skipped && (
        <p className="mt-1 text-xs text-zinc-500">
          Record a short intro. Up to {MAX_GREETING_SECONDS} seconds.
        </p>
      )}

      {skipped && (
        <p className="mt-1 text-xs text-zinc-500">
          Skipped — you can record a greeting later in Settings.
        </p>
      )}

      {message && (
        <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {message}
        </p>
      )}
    </div>
  );
}
