import type { ReplyActivity } from "@/lib/comments";

type CommentAvatarProps = {
  photoUrl?: string | null;
  name: string;
  size?: "sm" | "md";
  replyActivity?: ReplyActivity;
};

const activityRingClasses: Record<Exclude<ReplyActivity, "high">, string> = {
  moderate: "border-[3px] border-yellow-400 shadow-[0_0_0_2px_rgba(250,204,21,0.2)]",
  low: "border-[3px] border-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.2)]",
};

function HighActivityAvatar({
  photoUrl,
  name,
  dimension,
  iconSize,
}: {
  photoUrl?: string | null;
  name: string;
  dimension: string;
  iconSize: string;
}) {
  return (
    <div
      className={`relative flex ${dimension} items-center justify-center`}
      title="Lots of replies"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-spin rounded-full bg-[conic-gradient(from_0deg,#16a34a,#4ade80,#bbf7d0,#16a34a)]"
      />
      <div
        className={`relative ${dimension} overflow-hidden rounded-full ring-2 ring-white bg-zinc-100`}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className={iconSize}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 20a8 8 0 0 1 16 0"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentAvatar({
  photoUrl,
  name,
  size: _size = "md",
  replyActivity,
}: CommentAvatarProps) {
  const dimension = "h-[50px] w-[50px]";
  const iconSize = "h-6 w-6";

  if (replyActivity === "high") {
    return (
      <HighActivityAvatar
        photoUrl={photoUrl}
        name={name}
        dimension={dimension}
        iconSize={iconSize}
      />
    );
  }

  const ringClass = replyActivity
    ? activityRingClasses[replyActivity]
    : "border border-zinc-200";

  return (
    <div
      className={`${dimension} shrink-0 overflow-hidden rounded-full bg-zinc-100 ${ringClass}`}
      title={
        replyActivity === "moderate"
          ? "Moderate replies"
          : replyActivity === "low"
            ? "Few replies"
            : undefined
      }
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-zinc-400">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className={iconSize}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 20a8 8 0 0 1 16 0"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
