import Image from "next/image";
import Link from "next/link";
import { CommentAvatar } from "@/components/comment-avatar";
import type { BlogPost } from "@/lib/blog-posts";
import { getPreviewText } from "@/lib/blog-posts";
import { getReplyActivity } from "@/lib/comments";
import type { PreviewComment } from "@/lib/post-stats";

function CommentsPreview({ comments }: { comments: PreviewComment[] }) {
  if (comments.length === 0) {
    return (
      <div className="flex h-full items-center justify-center border-t border-zinc-100 bg-white p-2">
        <p className="text-center text-[10px] leading-tight text-zinc-500">
          No comments yet
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 items-center justify-center border-t border-zinc-100 bg-white p-2"
      aria-label={`${comments.length} voice comments`}
    >
      <div className="grid w-full grid-cols-2 gap-2">
        {comments.map((comment) => (
          <div key={comment.id} className="flex justify-center">
            <CommentAvatar
              photoUrl={comment.photoUrl}
              name={comment.displayName}
              replyActivity={getReplyActivity(comment.likeCount)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BlogPostPreview({
  post,
  likeCount,
  commentCount,
  comments,
}: {
  post: BlogPost;
  likeCount: number;
  commentCount: number;
  comments: PreviewComment[];
}) {
  const secondaryImage = post.imageUrl2 ?? post.imageUrl;

  return (
    <div className="group mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-rose-200 hover:shadow-md">
      <Link href={`/app/posts/${post.id}`} className="block aspect-square">
        <div className="grid h-full grid-cols-2 grid-rows-2">
          <div className="relative overflow-hidden bg-rose-50">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 50vw, 256px"
            />
          </div>

          <aside
            className="flex flex-col items-center justify-center border-l border-zinc-100 bg-white p-3"
            aria-label={`${likeCount} likes, ${commentCount} comments`}
          >
            <span
              className="inline-flex flex-col items-center gap-1 text-zinc-600"
              aria-label={`${likeCount} ${likeCount === 1 ? "like" : "likes"}`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                className="h-6 w-6 text-rose-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21s-7-4.35-9.5-8.5C.5 9.5 2.5 6 6 6c2 0 3.5 1.5 4.5 3C11.5 7.5 13 6 15 6c3.5 0 5.5 3.5 3.5 6.5C19 16.65 12 21 12 21Z"
                />
              </svg>
              <span className="text-sm font-semibold tabular-nums">{likeCount}</span>
              <span className="text-[10px] text-zinc-500">Likes</span>
            </span>
          </aside>

          <CommentsPreview comments={comments} />

          <div className="relative overflow-hidden border-l border-t border-zinc-100 bg-rose-50">
            <Image
              src={secondaryImage}
              alt=""
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 50vw, 256px"
              aria-hidden="true"
            />
          </div>
        </div>
      </Link>

      <Link
        href={`/app/posts/${post.id}`}
        className="block border-t border-zinc-100 p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">
          <span>{post.author}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={post.publishedAt}>{post.publishedAt}</time>
        </div>

        <h2 className="mt-2 text-lg font-semibold tracking-tight text-zinc-900 group-hover:text-rose-600">
          {post.title}
        </h2>
        <p className="mt-1 text-sm font-medium text-rose-500">{post.excerpt}</p>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{getPreviewText(post)}</p>
        <p className="mt-3 text-sm font-medium text-rose-500">Read more →</p>
      </Link>
    </div>
  );
}
