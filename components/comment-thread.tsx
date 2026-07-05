"use client";

import { useEffect, useRef, useState } from "react";
import { CommentAvatar } from "@/components/comment-avatar";
import type { CommentNode } from "@/lib/comments";
import { getReplyActivity } from "@/lib/comments";

type CommentThreadProps = {
  postId: string;
  comments: CommentNode[];
  onError: (message: string) => void;
};

function VoiceCommentCell({
  comment,
  playing,
  onTogglePlay,
}: {
  comment: CommentNode;
  playing: boolean;
  onTogglePlay: () => void;
}) {
  const displayName = comment.displayName;
  const hasAudio = Boolean(comment.audioUrl);

  return (
    <button
      type="button"
      onClick={hasAudio ? onTogglePlay : undefined}
      disabled={!hasAudio}
      aria-pressed={playing}
      aria-label={
        playing
          ? `Stop ${displayName}'s voice comment`
          : hasAudio
            ? `Play ${displayName}'s voice comment`
            : `${displayName} — no audio`
      }
      className={`relative mx-auto block rounded-full transition disabled:cursor-default disabled:opacity-70 ${
        playing ? "ring-2 ring-rose-400 ring-offset-2" : "hover:opacity-90"
      }`}
    >
      <CommentAvatar
        photoUrl={comment.photoUrl}
        name={displayName}
        size="sm"
        replyActivity={getReplyActivity(comment.likeCount)}
      />
      {playing ? (
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/35">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5 text-white"
          >
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        </span>
      ) : null}
    </button>
  );
}

export function CommentThread({ postId: _postId, comments, onError }: CommentThreadProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.addEventListener("ended", () => setPlayingId(null));
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  function stopAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setPlayingId(null);
  }

  function handleTogglePlay(comment: CommentNode) {
    onError("");

    if (!comment.audioUrl) {
      return;
    }

    if (playingId === comment.id) {
      stopAudio();
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.src = comment.audioUrl;
    void audio
      .play()
      .then(() => setPlayingId(comment.id))
      .catch(() => {
        setPlayingId(null);
        onError("Could not play this voice comment.");
      });
  }

  if (comments.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No voice comments yet. Tap the record button to share your opinion.
      </p>
    );
  }

  return (
    <div
      className="grid grid-cols-4 gap-4"
      role="list"
      aria-label="Voice comments"
    >
      {comments.map((comment) => (
        <div key={comment.id} role="listitem" className="flex justify-center">
          <VoiceCommentCell
            comment={comment}
            playing={playingId === comment.id}
            onTogglePlay={() => handleTogglePlay(comment)}
          />
        </div>
      ))}
    </div>
  );
}
