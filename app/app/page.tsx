import { BlogPostPreview } from "@/components/blog-post-preview";
import { blogPosts } from "@/lib/blog-posts";
import {
  getPostStatsForPosts,
  getPreviewCommentsForPosts,
} from "@/lib/post-stats";
import { createClient } from "@/lib/supabase/server";

export default async function HomeFeedPage() {
  const supabase = await createClient();
  const postIds = blogPosts.map((post) => post.id);
  const [stats, previewComments] = await Promise.all([
    getPostStatsForPosts(supabase, postIds),
    getPreviewCommentsForPosts(supabase, postIds),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-center py-4">
        <div
          className="flex h-16 w-40 items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-sm font-medium text-zinc-400"
          aria-label="Logo placeholder"
        >
          Logo
        </div>
      </div>

      <div className="space-y-6">
        {blogPosts.map((post) => (
          <BlogPostPreview
            key={post.id}
            post={post}
            likeCount={stats[post.id]?.likeCount ?? 0}
            commentCount={stats[post.id]?.commentCount ?? 0}
            comments={previewComments[post.id] ?? []}
          />
        ))}
      </div>
    </div>
  );
}
