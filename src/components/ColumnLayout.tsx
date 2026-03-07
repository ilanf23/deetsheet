import PostCard from "@/components/PostCard";
import TopicCard from "@/components/TopicCard";
import { getRecentPosts, getPopularPosts, topics } from "@/data/seedData";
import { Clock, TrendingUp, Hash } from "lucide-react";

const ColumnHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 mb-4 px-1">
    <Icon className="h-4 w-4 text-primary" />
    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
  </div>
);

const ColumnLayout = () => {
  const recentPosts = getRecentPosts();
  const popularPosts = getPopularPosts();

  return (
    <div className="container mx-auto px-4 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Column 1 — Recently Added */}
        <div className="space-y-3">
          <ColumnHeader icon={Clock} title="Recently Added" />
          <div className="space-y-3 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto scrollbar-thin lg:pr-2">
            {recentPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* Column 2 — Most Popular */}
        <div className="space-y-3">
          <ColumnHeader icon={TrendingUp} title="Most Popular" />
          <div className="space-y-3 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto scrollbar-thin lg:pr-2">
            {popularPosts.map((post) => (
              <PostCard key={`pop-${post.id}`} post={post} />
            ))}
          </div>
        </div>

        {/* Column 3 — Topics */}
        <div className="space-y-3">
          <ColumnHeader icon={Hash} title="Explore Topics" />
          <div className="space-y-3 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto scrollbar-thin lg:pr-2">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnLayout;
