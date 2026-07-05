import type { BlogPost } from "@/lib/blog-posts";
import { renderParagraph } from "@/lib/blog-format";

export function BlogPostContent({ post }: { post: BlogPost }) {
  return (
    <div className="space-y-4 text-[15px] leading-7 text-zinc-700">
      {post.content.map((paragraph, index) => (
        <p key={index}>{renderParagraph(paragraph)}</p>
      ))}
    </div>
  );
}
