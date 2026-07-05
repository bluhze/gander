"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { addVoiceComment } from "@/app/app/posts/[id]/actions";
import { MAX_COMMENT_AUDIO_SECONDS, validateCommentAudio } from "@/lib/comment-audio";

type RecordVoiceCommentProps = {
  postId: string;
  parentId?: string | null;
  label?: string;
  autoStart?: boolean;
  compact?: boolean;
  onCancel: () => void;
  onPosted: () => void;
  onError: (message: string) => void;
};

export function RecordVoiceComment({
  postId,
  parentId = null,
  label = "Recording…",
  autoStart = false,
  compact = false,
  onCancel,
  onPosted,
  onError,
}: RecordVoiceCommentProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const autoStartedRef = useRef(false);

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!autoStart || autoStartedRef.current) {
      return;
    }

    autoStartedRef.current = true;
    void startRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-start once on mount
  }, [autoStart]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
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

  function postVoiceComment(file: File) {
    const formData = new FormData();
    formData.set("postId", postId);
    if (parentId) {
      formData.set("parentId", parentId);
    }
    formData.set("audio", file);

    startTransition(async () => {
      const result = await addVoiceComment(formData);
      if (result.error) {
        onError(result.error);
        return;
      }
      onPosted();
    });
  }

  async function startRecording() {
    setMessage(null);
    onError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        stopStream();
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });
        const file = new File([blob], "voice-comment.webm", {
          type: blob.type || "audio/webm",
        });

        const validationError = validateCommentAudio(file);
        if (validationError) {
          setMessage(validationError);
          return;
        }

        postVoiceComment(file);
      };

      mediaRecorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        setSeconds((current) => {
          if (current + 1 >= MAX_COMMENT_AUDIO_SECONDS) {
            stopRecording();
            return MAX_COMMENT_AUDIO_SECONDS;
          }
          return current + 1;
        });
      }, 1000);
    } catch {
      setMessage("Microphone access is required to record a voice comment.");
    }
  }

  function handleCancel() {
    if (recording) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      stopStream();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      }
      setRecording(false);
    }
    onCancel();
  }

  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white ${
        compact ? "px-3 py-2" : "px-4 py-3"
      }`}
    >
      <div
        className={`flex gap-3 ${
          compact ? "flex-col" : "flex-wrap items-center justify-between"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          {recording ? (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-red-500">
              <span className="h-4 w-4 animate-pulse rounded-full bg-red-500" />
            </span>
          ) : (
            <button
              type="button"
              onClick={() => void startRecording()}
              disabled={isPending}
              aria-label="Record voice comment"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-red-500 transition hover:bg-red-50 disabled:opacity-60"
            >
              <span className="h-4 w-4 rounded-full bg-red-500" aria-hidden="true" />
            </button>
          )}
          <div>
            <p className={`font-medium text-zinc-900 ${compact ? "text-xs" : "text-sm"}`}>
              {isPending ? "Posting…" : recording ? label : "Tap record to start"}
            </p>
            {recording ? (
              <p className="text-xs text-zinc-500">
                {MAX_COMMENT_AUDIO_SECONDS - seconds}s remaining
              </p>
            ) : null}
          </div>
        </div>
        <div className={`flex items-center gap-2 ${compact ? "justify-end" : ""}`}>
          {recording ? (
            <button
              type="button"
              onClick={stopRecording}
              disabled={isPending}
              className="rounded-lg bg-rose-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
            >
              Stop & post
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
      {message ? <p className="mt-2 text-sm text-rose-700">{message}</p> : null}
    </div>
  );
}
