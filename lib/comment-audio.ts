import type { SupabaseClient } from "@supabase/supabase-js";
import { greetingExtension } from "@/lib/profile-greeting";

export const COMMENT_AUDIO_BUCKET = "comment-audio";
export const MAX_COMMENT_AUDIO_BYTES = 2 * 1024 * 1024;
export const MAX_COMMENT_AUDIO_SECONDS = 30;

export function commentAudioPath(
  userId: string,
  commentId: string,
  ext = "webm",
): string {
  return `${userId}/${commentId}.${ext}`;
}

export function validateCommentAudio(file: File): string | null {
  if (!file.type.startsWith("audio/")) {
    return "Voice message must be an audio recording.";
  }
  if (file.size > MAX_COMMENT_AUDIO_BYTES) {
    return "Voice message must be 2 MB or smaller.";
  }
  return null;
}

export async function uploadCommentAudio(
  supabase: SupabaseClient,
  userId: string,
  commentId: string,
  file: File,
): Promise<{ error: string | null; path: string | null }> {
  const validationError = validateCommentAudio(file);
  if (validationError) {
    return { error: validationError, path: null };
  }

  const ext = greetingExtension(file.type);
  const path = commentAudioPath(userId, commentId, ext);

  const { error } = await supabase.storage
    .from(COMMENT_AUDIO_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    return { error: error.message, path: null };
  }

  return { error: null, path };
}

export async function getCommentAudioSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresIn = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(COMMENT_AUDIO_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
