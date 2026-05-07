import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { topics, Topic } from "@/data/seedData";
import { useTopics } from "@/hooks/useSupabaseTopics";

interface TopicRecommendationsProps {
  currentTopic: Topic;
}

const TopicRecommendations = ({ currentTopic }: TopicRecommendationsProps) => {
  const { data: dbTopics } = useTopics();
  const dbImageByName = useMemo(() => {
    const map = new Map<string, string | null>();
    (dbTopics ?? []).forEach((t) => map.set(t.name, t.imageUrl));
    return map;
  }, [dbTopics]);

  const sameCategoryTopics = topics.filter(
    (t) => t.categoryName === currentTopic.categoryName && t.name !== currentTopic.name
  );
  const otherTopics = topics.filter(
    (t) => t.categoryName !== currentTopic.categoryName && t.name !== currentTopic.name
  );
  const recommended = [...sameCategoryTopics, ...otherTopics]
    .slice(0, 12)
    .map((t) => ({ ...t, imageUrl: dbImageByName.get(t.name) ?? t.imageUrl }));

  return (
    <div>
      <h2
        className="text-[var(--font-size-meta)] font-semibold uppercase text-muted-foreground px-1 mb-4"
        style={{ letterSpacing: "var(--letter-spacing-rank-pill)" }}
      >
        Related Topics
      </h2>
      <div className="space-y-2">
        {recommended.map((topic) => (
          <Link
            key={topic.id}
            to={`/topic/${encodeURIComponent(topic.name)}`}
            className="block rounded-[var(--radius)] border bg-background overflow-hidden hover:bg-accent/40 transition-colors duration-150"
          >
            {topic.imageUrl && (
              <TopicImage src={topic.imageUrl} alt={topic.name} />
            )}
            <div className="p-3">
              <h3 className="text-sm font-semibold text-primary group-hover:underline">{topic.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{topic.categoryName} · {topic.postCount} posts</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const TopicImage = ({ src, alt }: { src: string; alt: string }) => {
  const [error, setError] = useState(false);

  if (error) return null;

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-28 object-cover"
      loading="lazy"
      onError={() => setError(true)}
    />
  );
};

export default TopicRecommendations;
