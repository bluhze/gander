import type { SupabaseClient } from "@supabase/supabase-js";

export const PROFILE_PHOTOS_BUCKET = "profile-photos";
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedPhotoType = (typeof ALLOWED_PHOTO_TYPES)[number];

export function photoExtension(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export function profilePhotoPath(userId: string, ext: string): string {
  return `${userId}/primary.${ext}`;
}

export function validateProfilePhoto(file: File): string | null {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type as AllowedPhotoType)) {
    return "Photo must be JPEG, PNG, or WebP.";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "Photo must be 5 MB or smaller.";
  }
  return null;
}

export async function uploadProfilePhoto(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<{ error: string | null; path: string | null }> {
  const validationError = validateProfilePhoto(file);
  if (validationError) {
    return { error: validationError, path: null };
  }

  const ext = photoExtension(file.type);
  const path = profilePhotoPath(userId, ext);

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { error: uploadError.message, path: null };
  }

  const { data: existing } = await supabase
    .from("profile_photos")
    .select("id")
    .eq("profile_id", userId)
    .eq("is_primary", true)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("profile_photos")
      .update({ storage_path: path })
      .eq("id", existing.id);

    if (error) {
      return { error: error.message, path: null };
    }
  } else {
    const { error } = await supabase.from("profile_photos").insert({
      profile_id: userId,
      storage_path: path,
      is_primary: true,
      position: 0,
    });

    if (error) {
      return { error: error.message, path: null };
    }
  }

  return { error: null, path };
}

export async function getPrimaryPhotoPath(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("profile_photos")
    .select("storage_path")
    .eq("profile_id", userId)
    .eq("is_primary", true)
    .maybeSingle();

  return data?.storage_path ?? null;
}

export async function getProfilePhotoSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresIn = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
