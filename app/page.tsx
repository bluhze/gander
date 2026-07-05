import { LoginForm } from "@/components/login-form";
import { LoginHeroVideo } from "@/components/login-hero-video";
import { SiteFooter } from "@/components/site-footer";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-gradient-to-br from-amber-50 via-rose-50 to-orange-100">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 lg:px-10 lg:py-12">
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
          <section className="flex flex-col justify-center lg:py-8">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-rose-500">
              Gander
            </p>
            <h1 className="mt-3 max-w-md text-4xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-5xl">
              Meet someone worth the hello.
            </h1>
            <p className="mt-4 max-w-md text-base text-zinc-600">
              Sign in to explore your feed, update your profile, and connect with
              people nearby.
            </p>

            <div className="mt-8 max-w-md">
              <LoginForm />
            </div>
          </section>

          <aside className="flex items-center lg:h-[min(78vh,720px)]">
            <LoginHeroVideo />
          </aside>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
