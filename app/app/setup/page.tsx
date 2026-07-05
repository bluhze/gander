import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";
import { formatBirthdateDisplay } from "@/lib/profile";
import {
  getPrimaryPhotoPath,
  getProfilePhotoSignedUrl,
} from "@/lib/profile-photo";
import { getProfileGreetingSignedUrl } from "@/lib/profile-greeting";
import { redirect } from "next/navigation";

export default async function SetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, birthdate, state, greeting_path")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.display_name && profile.birthdate && profile.state) {
    redirect("/app");
  }

  const meta = user.user_metadata ?? {};
  const photoPath = await getPrimaryPhotoPath(supabase, user.id);
  const photoUrl = photoPath
    ? await getProfilePhotoSignedUrl(supabase, photoPath)
    : null;
  const greetingUrl = profile?.greeting_path
    ? await getProfileGreetingSignedUrl(supabase, profile.greeting_path)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Set up your profile
        </h1>
        <p className="mt-1 text-zinc-500">
          Add your photo, name, date of birth, and state to finish creating your
          account.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <ProfileForm
          userId={user.id}
          initialDisplayName={
            profile?.display_name ?? meta.display_name ?? ""
          }
          initialBirthdate={
            profile?.birthdate
              ? formatBirthdateDisplay(profile.birthdate)
              : typeof meta.birthdate === "string"
                ? formatBirthdateDisplay(meta.birthdate)
                : ""
          }
          initialState={profile?.state ?? meta.state ?? ""}
          initialPhotoUrl={photoUrl}
          initialGreetingUrl={greetingUrl}
          showGreeting
          showGreetingSkip
          submitLabel="Continue"
          redirectTo="/app"
        />
      </section>
    </div>
  );
}
