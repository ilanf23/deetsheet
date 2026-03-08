import { Link } from "react-router-dom";
import { topics, Topic } from "@/data/seedData";

interface TopicRecommendationsProps {
  currentTopic: Topic;
}

const TopicRecommendations = ({ currentTopic }: TopicRecommendationsProps) => {
  // Get topics from same category first, then fill from others
  const sameCategoryTopics = topics.filter(
    (t) => t.categoryName === currentTopic.categoryName && t.id !== currentTopic.id
  );
  const otherTopics = topics.filter(
    (t) => t.categoryName !== currentTopic.categoryName && t.id !== currentTopic.id
  );
  const recommended = [...sameCategoryTopics, ...otherTopics].slice(0, 6);

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-4">
        Related Topics
      </h2>
      <div className="space-y-3">
        {recommended.map((topic) => (
          <Link
            key={topic.id}
            to={`/topic/${encodeURIComponent(topic.name)}`}
            className="block rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all duration-200"
          >
            {topic.imageUrl && (
              <img
                src={topic.imageUrl}
                alt={topic.name}
                className="w-full h-24 object-cover"
              />
            )}
            <div className="p-3">
              <h3 className="text-sm font-bold text-card-foreground">{topic.name}</h3>
              <p className="text-xs text-muted-foreground">{topic.categoryName} · {topic.postCount} posts</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TopicRecommendations;
