"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleLike } from "@/app/app/posts/[id]/actions";
import { CommentThread } from "@/components/comment-thread";
import { RecordVoiceComment } from "@/components/record-voice-comment";
import type { CommentNode } from "@/lib/comments";

type PostInteractionsProps = {
  postId: string;
  initialLikeCount: number;
  initialLiked: boolean;
  initialComments: CommentNode[];
};

function ActionCircle({
  label,
  count,
  onClick,
  disabled,
  active,
  variant = "default",
  children,
}: {
  label: string;
  count?: number;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: "default" | "like" | "record";
  children: React.ReactNode;
}) {
  const circleClass =
    variant === "like"
      ? active
        ? "border-rose-500 bg-rose-500 text-white"
        : "border-zinc-200 bg-white text-rose-500 hover:border-rose-300"
      : variant === "record"
        ? "border-red-500 bg-white hover:bg-red-50"
        : "border-zinc-200 bg-white text-zinc-600";

  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      disabled={disabled}
      aria-label={count !== undefined ? `${label}: ${count}` : label}
      className="flex flex-col items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition ${circleClass}`}
      >
        {children}
      </span>
      {count !== undefined ? (
        <span className="text-sm font-semibold tabular-nums text-zinc-900">{count}</span>
      ) : null}
      <span className="text-xs text-zinc-500">{label}</span>
    </Tag>
  );
}

export function PostInteractions({
  postId,
  initialLikeCount,
  initialLiked,
  initialComments,
}: PostInteractionsProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(initialLiked);
  const [comments, setComments] = useState(initialComments);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const commentsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setComments(initialComments);
    setLikeCount(initialLikeCount);
    setLiked(initialLiked);
  }, [initialComments, initialLikeCount, initialLiked]);

  function handleToggleLike() {
    setError(null);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((count) => count + (nextLiked ? 1 : -1));

    startTransition(async () => {
      const result = await toggleLike(postId);
      if (result.error) {
        setLiked(!nextLiked);
        setLikeCount((count) => count + (nextLiked ? -1 : 1));
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  function handleRecordClick() {
    setError(null);
    setRecording(true);
    commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function scrollToComments() {
    commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const commentCount = comments.length;

  return (
    <section className="space-y-6 border-t border-zinc-200 pt-6">
      <div className="flex items-center justify-center gap-10 sm:gap-14">
        <ActionCircle
          label="Likes"
          count={likeCount}
          onClick={handleToggleLike}
          disabled={isPending}
          active={liked}
          variant="like"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.75}
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21s-7-4.35-9.5-8.5C.5 9.5 2.5 6 6 6c2 0 3.5 1.5 4.5 3C11.5 7.5 13 6 15 6c3.5 0 5.5 3.5 3.5 6.5C19 16.65 12 21 12 21Z"
            />
          </svg>
        </ActionCircle>

        <ActionCircle
          label="Comments"
          count={commentCount}
          onClick={scrollToComments}
          variant="default"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 2.25c-2.305 0-4.47.196-6.433.572-1.584.233-2.707 1.626-2.707 3.228v3.521Z"
            />
          </svg>
        </ActionCircle>

        {!recording ? (
          <ActionCircle
            label="Record"
            onClick={handleRecordClick}
            variant="record"
          >
            <span className="h-5 w-5 rounded-full bg-red-500" aria-hidden="true" />
          </ActionCircle>
        ) : (
          <ActionCircle label="Recording…" variant="record">
            <span className="h-5 w-5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
          </ActionCircle>
        )}
      </div>

      {recording ? (
        <RecordVoiceComment
          postId={postId}
          label="Recording your opinion…"
          autoStart
          onCancel={() => setRecording(false)}
          onPosted={() => {
            setRecording(false);
            router.refresh();
          }}
          onError={setError}
        />
      ) : null}

      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      <div ref={commentsRef} className="space-y-3">
        <p className="text-sm text-zinc-500">Tap a photo below to listen.</p>
        <div className="overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
          <CommentThread postId={postId} comments={comments} onError={setError} />
        </div>
      </div>
    </section>
  );
}
