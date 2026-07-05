import { AppNav } from "@/components/app-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-8">{children}</main>
      <AppNav />
    </div>
  );
}
