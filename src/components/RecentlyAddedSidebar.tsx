import PostCard from "@/components/PostCard";
import { getRecentPosts } from "@/data/seedData";
import { useInfiniteList } from "@/hooks/useInfiniteList";

const RecentlyAddedSidebar = () => {
  const recentPosts = getRecentPosts();
  const { visible, sentinelRef, hasMore } = useInfiniteList(recentPosts, 8, 8);

  return (
    <div className="bg-background rounded-xl border border-border p-4">
      <div className="flex items-center justify-between h-8 mb-3 px-1 pb-2 border-b border-border">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Posts
        </h2>
      </div>
      <div>
        {visible.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {hasMore && (
          <div ref={sentinelRef} className="h-8 flex items-center justify-center text-[11px] text-muted-foreground">
            Loading more…
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentlyAddedSidebar;
