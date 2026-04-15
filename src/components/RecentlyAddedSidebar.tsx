import PostCard from "@/components/PostCard";
import { getRecentPosts } from "@/data/seedData";

const RecentlyAddedSidebar = () => {
  const recentPosts = getRecentPosts();

  return (
    <div className="bg-background rounded-xl border border-border p-4">
      <div className="flex items-center justify-between h-8 mb-3 px-1 pb-2 border-b border-border">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Posts
        </h2>
      </div>
      <div>
        {recentPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

export default RecentlyAddedSidebar;
