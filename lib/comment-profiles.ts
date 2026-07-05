import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfilePhotoSignedUrl } from "@/lib/profile-photo";

export type CommentAuthorInfo = {
  displayName: string;
  photoUrl: string | null;
};

export async function getCommentAuthorInfo(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<Record<string, CommentAuthorInfo>> {
  const uniqueIds = [...new Set(userIds)];
  const info = Object.fromEntries(
    uniqueIds.map((id) => [id, { displayName: "Community member", photoUrl: null }]),
  ) as Record<string, CommentAuthorInfo>;

  if (uniqueIds.length === 0) {
    return info;
  }

  const [{ data: photos }, { data: profiles }] = await Promise.all([
    supabase
      .from("profile_photos")
      .select("profile_id, storage_path")
      .in("profile_id", uniqueIds)
      .eq("is_primary", true),
    supabase.from("profiles").select("id, display_name").in("id", uniqueIds),
  ]);

  for (const profile of profiles ?? []) {
    info[profile.id].displayName = profile.display_name;
  }

  await Promise.all(
    (photos ?? []).map(async (photo) => {
      info[photo.profile_id].photoUrl = await getProfilePhotoSignedUrl(
        supabase,
        photo.storage_path,
      );
    }),
  );

  return info;
}
