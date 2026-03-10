import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { Topic, getPostsByTopic, getSubtitle, getAverageRating } from "@/data/seedData";

interface PopularTopicSectionProps {
  topic: Topic;
}

const PopularTopicSection = ({ topic }: PopularTopicSectionProps) => {
  const navigate = useNavigate();
  const topPosts = getPostsByTopic(topic.name).slice(0, 5);
  const subtitle = getSubtitle(topic.name);

  return (
    <div
      className="border rounded-xl bg-card cursor-pointer hover:shadow-lg transition-all duration-200 group"
      onClick={() => navigate(`/topic/${encodeURIComponent(topic.name)}`)}
    >
      {/* Header: image badge + title */}
      <div className="flex items-center gap-3 p-4 pb-3">
        {topic.imageUrl && (
          <img
            src={topic.imageUrl}
            alt={topic.name}
            className="w-16 h-16 rounded-full object-cover shrink-0"
          />
        )}
        <div className="min-w-0">
          <h3 className="text-base font-bold text-card-foreground font-heading leading-tight truncate">
            {topic.name}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Post list */}
      <div className="px-4 pb-4 space-y-3">
        <ol className="space-y-1.5">
          {topPosts.map((post, i) => {
            const avg = getAverageRating(post);
            return (
              <li key={post.id} className="flex items-start gap-2 text-sm min-w-0">
                <span className="font-bold text-primary w-5 shrink-0 text-right">{i + 1}.</span>
                <span className="flex-1 text-card-foreground leading-snug truncate">{post.content}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Star className="h-3 w-3 text-secondary fill-secondary" />
                  {avg}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Footer: category pill + post count */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {topic.categoryName}
          </span>
          <span className="text-xs text-muted-foreground">
            {topic.postCount} posts
          </span>
        </div>
      </div>
    </div>
  );
};

export default PopularTopicSection;
