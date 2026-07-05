import Link from "next/link";

const footerLinks = [
  { href: "/faqs", label: "FAQs" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-rose-100/80 bg-white/60 px-6 py-4 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-zinc-500">
        {footerLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="transition hover:text-rose-600"
          >
            {label}
          </Link>
        ))}
        <span className="text-zinc-400">© {new Date().getFullYear()} Gander</span>
      </nav>
    </footer>
  );
}
