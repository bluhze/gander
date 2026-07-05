import type { SupabaseClient } from "@supabase/supabase-js";

export const PROFILE_GREETINGS_BUCKET = "profile-greetings";
export const MAX_GREETING_BYTES = 2 * 1024 * 1024;
export const MAX_GREETING_SECONDS = 30;

export function profileGreetingPath(userId: string, ext = "webm"): string {
  return `${userId}/greeting.${ext}`;
}

export function greetingExtension(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

export function validateProfileGreeting(file: File): string | null {
  if (!file.type.startsWith("audio/")) {
    return "Greeting must be an audio recording.";
  }
  if (file.size > MAX_GREETING_BYTES) {
    return "Greeting must be 2 MB or smaller.";
  }
  return null;
}

export async function uploadProfileGreeting(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<{ error: string | null; path: string | null }> {
  const validationError = validateProfileGreeting(file);
  if (validationError) {
    return { error: validationError, path: null };
  }

  const ext = greetingExtension(file.type);
  const path = profileGreetingPath(userId, ext);

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_GREETINGS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { error: uploadError.message, path: null };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ greeting_path: path })
    .eq("id", userId);

  if (error) {
    return { error: error.message, path: null };
  }

  return { error: null, path };
}

export async function getProfileGreetingSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresIn = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(PROFILE_GREETINGS_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
