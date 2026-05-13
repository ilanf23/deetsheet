import PostCard from "@/components/PostCard";
import type { Post } from "@/data/seedData";
import { useRecentPosts } from "@/hooks/useSupabaseTopics";

const RecentlyAddedSidebar = () => {
  const { data: posts, isLoading } = useRecentPosts(50);

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between h-8 mb-3 px-1 pb-2 border-b border-border">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
          Recent Posts
        </h2>
      </div>
      <div>
        {isLoading && (
          <p className="text-[11px] text-muted-foreground px-1 py-2">Loading…</p>
        )}
        {!isLoading && (!posts || posts.length === 0) && (
          <p className="text-[11px] text-muted-foreground px-1 py-2">
            No recent posts yet.
          </p>
        )}
        {!isLoading &&
          posts?.map((post) => (
            <PostCard key={post.id} post={post as unknown as Post} />
          ))}
      </div>
    </div>
  );
};

export default RecentlyAddedSidebar;
