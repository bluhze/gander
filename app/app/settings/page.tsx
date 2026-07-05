import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";
import { SettingsGreeting } from "@/components/settings-greeting";
import { getProfileGreetingSignedUrl } from "@/lib/profile-greeting";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("greeting_path")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Account
        </h2>
        <dl className="mt-4 space-y-4">
          <div>
            <dt className="text-sm font-medium text-zinc-500">Email</dt>
            <dd className="mt-1 text-zinc-900">{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500">Member since</dt>
            <dd className="mt-1 text-zinc-900">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Greeting
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Record or update the voice greeting on your profile.
        </p>
        <div className="mt-4">
          <SettingsGreeting userId={user?.id} greetingUrl={greetingUrl} />
        </div>
      </section>

      <SignOutButton />
    </div>
  );
}
