import { useNavigate } from "react-router-dom";
import { Star, ThumbsUp } from "lucide-react";
import { Topic, getPostsByTopic, getSubtitle, getAverageRating } from "@/data/seedData";

interface PopularTopicSectionProps {
  topic: Topic;
}

const PopularTopicSection = ({ topic }: PopularTopicSectionProps) => {
  const navigate = useNavigate();
  const topPosts = getPostsByTopic(topic.name).slice(0, 5);

  return (
    <div
      className="border rounded-xl bg-card p-4 space-y-3 cursor-pointer hover:shadow-md transition-all duration-200"
      onClick={() => navigate(`/topic/${encodeURIComponent(topic.name)}`)}
    >
      <div>
        <h3 className="text-lg font-bold text-card-foreground font-heading">{topic.name}</h3>
        <p className="text-xs text-muted-foreground">{getSubtitle(topic.name)}</p>
      </div>

      <div className="flex gap-4">
        {topic.imageUrl && (
          <img
            src={topic.imageUrl}
            alt={topic.name}
            className="w-20 h-20 rounded-lg object-cover shrink-0 hidden sm:block"
          />
        )}
        <ol className="flex-1 space-y-1.5 min-w-0">
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
                <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <ThumbsUp className="h-3 w-3" />
                  {post.ratingCount}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};

export default PopularTopicSection;
