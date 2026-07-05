import { createClient } from "@/lib/supabase/server";
import { ProfilePanel } from "@/components/profile-panel";
import { SettingsButton } from "@/components/settings-button";
import {
  getPrimaryPhotoPath,
  getProfilePhotoSignedUrl,
} from "@/lib/profile-photo";
import { getProfileGreetingSignedUrl } from "@/lib/profile-greeting";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("display_name, birthdate, state, greeting_path")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const photoPath = user ? await getPrimaryPhotoPath(supabase, user.id) : null;
  const photoUrl = photoPath
    ? await getProfilePhotoSignedUrl(supabase, photoPath)
    : null;
  const greetingUrl = profile?.greeting_path
    ? await getProfileGreetingSignedUrl(supabase, profile.greeting_path)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-center py-4">
        <div
          className="flex h-16 w-40 items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-sm font-medium text-zinc-400"
          aria-label="Logo placeholder"
        >
          Logo
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <ProfilePanel
            userId={user?.id}
            displayName={profile?.display_name}
            birthdate={profile?.birthdate}
            state={profile?.state}
            photoUrl={photoUrl}
            greetingUrl={greetingUrl}
        />
      </section>

      <SettingsButton />
    </div>
  );
}
