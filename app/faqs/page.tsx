import type { Metadata } from "next";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata: Metadata = {
  title: "FAQs — Gander",
  description: "Answers to common questions about Gander.",
};

const faqs = [
  {
    question: "How do I create an account?",
    answer:
      "Use the sign-up form on the home page with your email and password. You will complete your profile after confirming your account.",
  },
  {
    question: "Who can use Gander?",
    answer:
      "Gander is for adults 18 and older. Age requirements are enforced during sign-up.",
  },
  {
    question: "Where can I read about privacy and terms?",
    answer:
      "See our Privacy Policy and Terms of Service pages linked in the site footer.",
  },
];

export default function FaqsPage() {
  return (
    <PublicPageShell title="FAQs">
      <div className="space-y-8">
        {faqs.map(({ question, answer }) => (
          <section key={question}>
            <h2 className="text-base font-semibold text-zinc-900">{question}</h2>
            <p className="mt-2 text-zinc-700">{answer}</p>
          </section>
        ))}
      </div>
    </PublicPageShell>
  );
}
