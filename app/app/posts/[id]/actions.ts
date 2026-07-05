"use server";

import { uploadCommentAudio } from "@/lib/comment-audio";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function revalidatePost(postId: string) {
  revalidatePath(`/app/posts/${postId}`);
  revalidatePath("/app");
}

export async function toggleLike(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to like a post." };
  }

  const { data: existingLike } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingLike) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("id", existingLike.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.from("post_likes").insert({
      post_id: postId,
      user_id: user.id,
    });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePost(postId);
  return { error: null };
}

export async function toggleCommentLike(commentId: string, postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to like a comment." };
  }

  const { data: existingLike } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingLike) {
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("id", existingLike.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.from("comment_likes").insert({
      comment_id: commentId,
      user_id: user.id,
    });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePost(postId);
  return { error: null };
}

export async function addVoiceComment(formData: FormData) {
  const postId = formData.get("postId");
  const audio = formData.get("audio");

  if (typeof postId !== "string" || !postId) {
    return { error: "Invalid post." };
  }

  if (!(audio instanceof File) || audio.size === 0) {
    return { error: "Record a voice message." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to comment." };
  }

  const commentId = crypto.randomUUID();
  const { error: uploadError, path } = await uploadCommentAudio(
    supabase,
    user.id,
    commentId,
    audio,
  );

  if (uploadError || !path) {
    return { error: uploadError ?? "Could not upload voice message." };
  }

  const { error } = await supabase.from("post_comments").insert({
    id: commentId,
    post_id: postId,
    user_id: user.id,
    body: null,
    parent_id: null,
    audio_path: path,
  });

  if (error) {
    await supabase.storage.from("comment-audio").remove([path]);
    return { error: "Could not post voice comment." };
  }

  revalidatePost(postId);
  return { error: null };
}
