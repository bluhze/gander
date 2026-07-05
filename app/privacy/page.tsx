import type { Metadata } from "next";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy — Gander",
  description: "How Gander collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <PublicPageShell title="Privacy Policy">
      <p className="text-sm text-zinc-500">Last updated: July 5, 2026</p>
      <p className="mt-6 text-zinc-700">
        Privacy policy content is coming soon. This page will describe what data
        Gander collects, how profile and location information is used, and your
        choices around retention and deletion.
      </p>
    </PublicPageShell>
  );
}
