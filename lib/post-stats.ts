import type { SupabaseClient } from "@supabase/supabase-js";
import { getCommentAuthorInfo } from "@/lib/comment-profiles";
import { getCommentLikeStats } from "@/lib/comments";

export type PostStats = {
  likeCount: number;
  commentCount: number;
};

export type PreviewComment = {
  id: string;
  displayName: string;
  photoUrl: string | null;
  likeCount: number;
};

export async function getPostStatsForPosts(
  supabase: SupabaseClient,
  postIds: string[],
): Promise<Record<string, PostStats>> {
  const stats = Object.fromEntries(
    postIds.map((id) => [id, { likeCount: 0, commentCount: 0 }]),
  ) as Record<string, PostStats>;

  if (postIds.length === 0) {
    return stats;
  }

  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabase.from("post_likes").select("post_id").in("post_id", postIds),
    supabase
      .from("post_comments")
      .select("post_id")
      .in("post_id", postIds)
      .is("parent_id", null),
  ]);

  for (const row of likes ?? []) {
    stats[row.post_id].likeCount += 1;
  }

  for (const row of comments ?? []) {
    stats[row.post_id].commentCount += 1;
  }

  return stats;
}

export async function getPreviewCommentsForPosts(
  supabase: SupabaseClient,
  postIds: string[],
  limitPerPost = 4,
): Promise<Record<string, PreviewComment[]>> {
  const previewComments = Object.fromEntries(
    postIds.map((id) => [id, []]),
  ) as Record<string, PreviewComment[]>;

  if (postIds.length === 0) {
    return previewComments;
  }

  const { data: comments } = await supabase
    .from("post_comments")
    .select("id, user_id, post_id")
    .in("post_id", postIds)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  const commentsByPost: Record<string, NonNullable<typeof comments>> = {};

  for (const row of comments ?? []) {
    if (!commentsByPost[row.post_id]) {
      commentsByPost[row.post_id] = [];
    }

    if (commentsByPost[row.post_id].length < limitPerPost) {
      commentsByPost[row.post_id].push(row);
    }
  }

  const previewRows = Object.values(commentsByPost).flat();
  const commentIds = previewRows.map((row) => row.id);
  const userIds = previewRows.map((row) => row.user_id);

  const [authorInfo, likeStats] = await Promise.all([
    getCommentAuthorInfo(supabase, userIds),
    getCommentLikeStats(supabase, commentIds),
  ]);

  for (const [postId, rows] of Object.entries(commentsByPost)) {
    previewComments[postId] = rows.map((row) => ({
      id: row.id,
      displayName: authorInfo[row.user_id]?.displayName ?? "Community member",
      photoUrl: authorInfo[row.user_id]?.photoUrl ?? null,
      likeCount: likeStats[row.id]?.likeCount ?? 0,
    }));
  }

  return previewComments;
}
