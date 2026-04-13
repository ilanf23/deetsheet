import { MessageSquare } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { getTimeAgo } from "@/data/seedData";
import { useRecentPostsByTopic } from "@/hooks/useSupabaseTopics";

interface TopicRecentlyAddedProps {
  topicId: string;
  topicName: string;
}

const TopicRecentlyAdded = ({ topicId, topicName }: TopicRecentlyAddedProps) => {
  const { data: posts, isLoading } = useRecentPostsByTopic(topicId, 5);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 px-1">
          Recently Added
        </h2>
        <p className="text-xs text-muted-foreground px-1">Loading…</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 px-1">
          Recently Added
        </h2>
        <p className="text-xs text-muted-foreground px-1">
          No posts in {topicName} yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 px-1">
        Recently Added
      </h2>
      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post.id}
            className="rounded-xl border bg-card p-3 hover:shadow-md transition-all duration-200"
          >
            {post.title && (
              <h3 className="font-semibold text-sm text-card-foreground mb-1 line-clamp-2">
                {post.title}
              </h3>
            )}
            <p className="text-xs text-card-foreground leading-relaxed line-clamp-3 mb-2">
              {post.content}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <UserAvatar username={post.username} size="sm" />
                <span>· {getTimeAgo(post.createdAt)}</span>
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {post.commentCount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopicRecentlyAdded;
