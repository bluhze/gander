export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  imageUrl2?: string;
  author: string;
  publishedAt: string;
  readTime: string;
  content: string[];
};

export const blogPosts: BlogPost[] = [
  {
    id: "5-first-date-ideas",
    title: "5 First Date Ideas",
    excerpt:
      "Low-pressure ways to meet someone new — from coffee chats to sunset walks.",
    imageUrl: "/blog/5-first-date-ideas.svg",
    author: "Gander Team",
    publishedAt: "July 5, 2026",
    readTime: "4 min read",
    content: [
      "First dates should feel easy, not like a job interview. The best plans give you room to talk, laugh, and see if the chemistry is there — without the pressure of a three-course dinner staring contest.",
      "**1. Coffee and a neighborhood stroll.** Pick a cozy café, grab drinks to go, and wander a few blocks. You can always extend the date or wrap up naturally after one cup.",
      "**2. A gallery or museum visit.** Walking side-by-side through art gives you built-in conversation starters. Plus, you'll learn what kinds of things catch each other's eye.",
      "**3. Sunset picnic in the park.** Pack simple snacks, a blanket, and something to drink. Golden hour lighting is flattering, and the relaxed vibe keeps things light.",
      "**4. A beginner-friendly cooking class.** Making something together is playful and collaborative — and you get to eat what you make. Look for classes that welcome pairs and first-timers.",
      "**5. Trivia or game night at a local bar.** A little friendly competition breaks the ice fast. Choose a spot with a welcoming crowd so you can focus on each other, not the noise.",
      "Whatever you pick, prioritize comfort and conversation over impressiveness. The goal isn't a perfect evening — it's finding out whether you want a second one.",
    ],
  },
];

export function getPostById(id: string): BlogPost | undefined {
  return blogPosts.find((post) => post.id === id);
}

export function getPreviewText(post: BlogPost): string {
  const firstParagraph = post.content[0] ?? "";
  const plainText = firstParagraph.replace(/\*\*(.*?)\*\*/g, "$1");

  if (plainText.length <= 180) {
    return plainText;
  }

  return `${plainText.slice(0, 177).trimEnd()}…`;
}
