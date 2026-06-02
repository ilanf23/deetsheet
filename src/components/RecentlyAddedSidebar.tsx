import { type RefObject } from "react";
import PostCard from "@/components/PostCard";
import type { Post } from "@/data/seedData";
import { useRecentPosts } from "@/hooks/useSupabaseTopics";
import { useInfiniteList } from "@/hooks/useInfiniteList";

interface RecentlyAddedSidebarProps {
  scrollRootRef?: RefObject<Element | null>;
}

const RecentlyAddedSidebar = ({ scrollRootRef }: RecentlyAddedSidebarProps) => {
  const { data: posts, isLoading } = useRecentPosts(200);
  const list = (posts ?? []) as unknown as Post[];
  const { visible, sentinelRef, hasMore } = useInfiniteList(
    list,
    8,
    8,
    "300px 0px",
    scrollRootRef
  );

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
        {!isLoading && list.length === 0 && (
          <p className="text-[11px] text-muted-foreground px-1 py-2">
            No recent posts yet.
          </p>
        )}
        {!isLoading &&
          visible.map((post) => <PostCard key={post.id} post={post} />)}
        {hasMore && (
          <div
            ref={sentinelRef}
            className="h-10 flex items-center justify-center text-[11px] text-muted-foreground"
          >
            Loading more…
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentlyAddedSidebar;
