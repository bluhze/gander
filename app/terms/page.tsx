import type { Metadata } from "next";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata: Metadata = {
  title: "Terms of Service — Gander",
  description: "Rules and guidelines for using Gander.",
};

export default function TermsPage() {
  return (
    <PublicPageShell title="Terms of Service">
      <p className="text-sm text-zinc-500">Last updated: July 5, 2026</p>
      <p className="mt-6 text-zinc-700">
        Terms of service content is coming soon. This page will cover eligibility
        (18+), acceptable use, account termination, and other legal terms for
        using Gander.
      </p>
    </PublicPageShell>
  );
}
