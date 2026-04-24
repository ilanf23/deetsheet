import PostCard from "@/components/PostCard";
import { Post } from "@/data/seedData";
import { useRecentPostsByTopic } from "@/hooks/useSupabaseTopics";

interface TopicRecentlyAddedProps {
  topicId: string;
  topicName: string;
}

const TopicRecentlyAdded = ({ topicId, topicName }: TopicRecentlyAddedProps) => {
  const { data: posts, isLoading } = useRecentPostsByTopic(topicId, 5);

  return (
    <div className="bg-background rounded-xl border border-border p-4">
      <div className="flex items-center justify-between h-8 mb-3 px-1 pb-2 border-b border-border">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recently Added
        </h2>
      </div>
      <div>
        {isLoading && (
          <p className="text-[11px] text-muted-foreground px-1 py-2">Loading…</p>
        )}
        {!isLoading && (!posts || posts.length === 0) && (
          <p className="text-[11px] text-muted-foreground px-1 py-2">
            No posts in {topicName} yet.
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

export default TopicRecentlyAdded;
