"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/app",
    label: "Home Feed",
    icon: (active: boolean) => (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.75}
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 10.5 12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H15v-6h-6v6H4.5A1.5 1.5 0 0 1 3 20v-9.5Z"
        />
      </svg>
    ),
  },
  {
    href: "/app/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.75}
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 20a8 8 0 0 1 16 0"
        />
      </svg>
    ),
  },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-3xl items-stretch px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive =
            item.href === "/app"
              ? pathname === "/app" || pathname.startsWith("/app/posts")
              : pathname.startsWith(item.href) ||
                pathname.startsWith("/app/settings");

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`flex flex-1 items-center justify-center transition ${
                isActive ? "text-rose-500" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {item.icon(isActive)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
