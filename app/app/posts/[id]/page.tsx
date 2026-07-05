import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogPostContent } from "@/components/blog-post-content";
import { PostInteractions } from "@/components/post-interactions";
import { getPostById } from "@/lib/blog-posts";
import { getCommentAuthorInfo } from "@/lib/comment-profiles";
import { getCommentAudioSignedUrl } from "@/lib/comment-audio";
import { getCommentLikeStats } from "@/lib/comments";
import { createClient } from "@/lib/supabase/server";

type PostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const post = getPostById(id);

  if (!post) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ count: likeCount }, { data: userLike }, { data: comments }] =
    await Promise.all([
      supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", id),
      user
        ? supabase
            .from("post_likes")
            .select("id")
            .eq("post_id", id)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("post_comments")
        .select("id, body, created_at, user_id, parent_id, audio_path")
        .eq("post_id", id)
        .is("parent_id", null)
        .order("created_at", { ascending: true }),
    ]);

  const commentRows = comments ?? [];
  const commentIds = commentRows.map((comment) => comment.id);

  const audioUrlEntries = await Promise.all(
    commentRows
      .filter((comment) => comment.audio_path)
      .map(async (comment) => [
        comment.id,
        await getCommentAudioSignedUrl(supabase, comment.audio_path!),
      ] as const),
  );
  const audioUrls = Object.fromEntries(audioUrlEntries) as Record<
    string,
    string | null
  >;

  const [authorInfo, likeStats] = await Promise.all([
    getCommentAuthorInfo(
      supabase,
      commentRows.map((comment) => comment.user_id),
    ),
    getCommentLikeStats(supabase, commentIds, user?.id),
  ]);

  const commentList = commentRows.map((comment) => ({
    id: comment.id,
    body: comment.body,
    created_at: comment.created_at,
    user_id: comment.user_id,
    parent_id: comment.parent_id,
    isOwn: comment.user_id === user?.id,
    displayName: authorInfo[comment.user_id]?.displayName ?? "Community member",
    photoUrl: authorInfo[comment.user_id]?.photoUrl ?? null,
    audioUrl: audioUrls[comment.id] ?? null,
    likeCount: likeStats[comment.id]?.likeCount ?? 0,
    liked: likeStats[comment.id]?.liked ?? false,
    replies: [],
  }));

  return (
    <article className="space-y-6">
      <Link
        href="/app"
        className="inline-flex text-sm font-medium text-rose-500 hover:text-rose-600"
      >
        ← Back to feed
      </Link>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative aspect-[16/9] overflow-hidden bg-rose-50">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
              <span>{post.author}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.publishedAt}>{post.publishedAt}</time>
              <span aria-hidden="true">·</span>
              <span>{post.readTime}</span>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">
              {post.title}
            </h1>
            <p className="mt-2 text-base font-medium text-rose-500">{post.excerpt}</p>
          </div>

          <BlogPostContent post={post} />

          <PostInteractions
            postId={post.id}
            initialLikeCount={likeCount ?? 0}
            initialLiked={Boolean(userLike)}
            initialComments={commentList}
          />
        </div>
      </div>
    </article>
  );
}
