import type { SupabaseClient } from "@supabase/supabase-js";

export type CommentLikeStats = {
  likeCount: number;
  liked: boolean;
};

export async function getCommentLikeStats(
  supabase: SupabaseClient,
  commentIds: string[],
  userId?: string,
): Promise<Record<string, CommentLikeStats>> {
  const stats = Object.fromEntries(
    commentIds.map((id) => [id, { likeCount: 0, liked: false }]),
  ) as Record<string, CommentLikeStats>;

  if (commentIds.length === 0) {
    return stats;
  }

  const { data: likes } = await supabase
    .from("comment_likes")
    .select("comment_id, user_id")
    .in("comment_id", commentIds);

  for (const like of likes ?? []) {
    stats[like.comment_id].likeCount += 1;
    if (userId && like.user_id === userId) {
      stats[like.comment_id].liked = true;
    }
  }

  return stats;
}

export type FlatComment = {
  id: string;
  body: string | null;
  created_at: string;
  user_id: string;
  parent_id: string | null;
};

export type CommentNode = FlatComment & {
  isOwn: boolean;
  displayName: string;
  photoUrl: string | null;
  audioUrl: string | null;
  likeCount: number;
  liked: boolean;
  replies: CommentNode[];
};

export function buildCommentTree(comments: CommentNode[]): CommentNode[] {
  const byId = new Map(comments.map((comment) => [comment.id, comment]));

  for (const comment of comments) {
    comment.replies = [];
  }

  const roots: CommentNode[] = [];

  for (const comment of comments) {
    if (comment.parent_id && byId.has(comment.parent_id)) {
      byId.get(comment.parent_id)!.replies.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return roots;
}

export function countCommentNodes(comments: CommentNode[]): number {
  return comments.reduce(
    (total, comment) => total + 1 + countCommentNodes(comment.replies),
    0,
  );
}

export type ReplyActivity = "high" | "moderate" | "low";

export function countCommentReplies(comment: CommentNode): number {
  return comment.replies.reduce(
    (total, reply) => total + 1 + countCommentReplies(reply),
    0,
  );
}

export function getReplyActivity(replyCount: number): ReplyActivity {
  if (replyCount >= 3) {
    return "high";
  }
  if (replyCount >= 1) {
    return "moderate";
  }
  return "low";
}
