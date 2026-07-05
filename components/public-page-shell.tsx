import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

type PublicPageShellProps = {
  title: string;
  children: React.ReactNode;
};

export function PublicPageShell({ title, children }: PublicPageShellProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-gradient-to-b from-rose-50 via-white to-orange-50">
      <header className="border-b border-rose-100/80 bg-white/70 px-6 py-5 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-rose-600 transition hover:text-rose-700"
          >
            ← Gander
          </Link>
          <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <article className="rounded-2xl border border-rose-100 bg-white/80 p-8 shadow-sm">
          {children}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
