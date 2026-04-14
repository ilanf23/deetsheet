import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Topic, getPostsByTopic, getSubtitle, getAverageRating } from "@/data/seedData";
import UserRatingIndicator from "@/components/UserRatingIndicator";
import { useTopicByName, usePostsByTopic } from "@/hooks/useSupabaseTopics";

interface PopularTopicSectionProps {
  topic: Topic;
}

const PopularTopicSection = ({ topic }: PopularTopicSectionProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const subtitle = getSubtitle(topic.name);

  // Resolve this topic against the Supabase `topics` table so we can pull real
  // posts (with UUID ids + live average_rating). Falls back to seed data only
  // if the DB lookup hasn't resolved yet, so the layout never flashes empty.
  const { data: dbTopic } = useTopicByName(topic.name);
  const { data: dbPosts } = usePostsByTopic(dbTopic?.id);
  const seedPosts = getPostsByTopic(topic.name).slice(0, 5);

  const topPosts = (dbPosts && dbPosts.length > 0)
    ? dbPosts.slice(0, 5).map((p) => ({
        id: p.id,
        content: p.title || p.content,
        avg: p.ratingScore || 0,
      }))
    : seedPosts.map((p) => ({
        id: p.id,
        content: p.content,
        avg: getAverageRating(p),
      }));

  return (
    <div
      className="border rounded-xl bg-background cursor-pointer hover:shadow-lg transition-all duration-200 p-5"
      onClick={() => navigate(`/topic/${encodeURIComponent(topic.name)}`)}
    >
      {/* Header: title + subtitle on the left, Rating|You label on the right */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <h3 className="font-heading text-3xl font-normal text-primary leading-tight truncate">
            {topic.name}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0 pt-2 whitespace-nowrap">
          Rating <span className="mx-0.5">|</span> You
        </span>
      </div>

      {/* Body: image on the left, numbered list + ratings on the right */}
      <div className="flex gap-5">
        {topic.imageUrl && (
          <img
            src={topic.imageUrl}
            alt={topic.name}
            className="w-32 sm:w-36 self-start rounded object-cover shrink-0 aspect-square"
          />
        )}
        <ol className="flex-1 min-w-0 space-y-2">
          {topPosts.map((post, i) => (
            <li key={post.id} className="flex items-center gap-3 text-[15px] min-w-0">
              <span className="text-muted-foreground w-5 shrink-0 text-right">{i + 1}.</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/topic/${encodeURIComponent(topic.name)}#post-${i + 1}`);
                }}
                className="flex-1 min-w-0 text-left text-primary leading-snug truncate hover:underline"
              >
                {post.content}
              </button>
              <span className="flex items-center gap-1.5 text-secondary shrink-0 tabular-nums">
                <span className="font-medium">{post.avg}</span>
                <span className="text-muted-foreground/60">|</span>
                <UserRatingIndicator
                  postId={post.id}
                  onRatingChanged={() => {
                    if (dbTopic?.id) {
                      queryClient.invalidateQueries({ queryKey: ["posts-by-topic", dbTopic.id] });
                    }
                  }}
                />
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default PopularTopicSection;
