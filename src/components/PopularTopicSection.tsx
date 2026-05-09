import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Topic, getPostsByTopic, getAverageRating } from "@/data/seedData";
import UserRatingIndicator from "@/components/UserRatingIndicator";
import { useTopicByName, usePostsByTopic, getTopicSubtitle } from "@/hooks/useSupabaseTopics";
import { slugifyPostTitle } from "@/lib/postSlug";

interface PopularTopicSectionProps {
  topic: Topic;
}

const PopularTopicSection = ({ topic }: PopularTopicSectionProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const subtitle = getTopicSubtitle(topic.name, topic.categoryName);

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
      className="border rounded-xl bg-card cursor-pointer hover:shadow-lg transition-all duration-200 px-5 py-4"
      onClick={() => navigate(`/topic/${encodeURIComponent(topic.name)}`)}
    >
      {/* Header: title + subtitle */}
      <div className="mb-2 min-w-0">
        <h3 className="font-heading text-3xl font-normal text-primary leading-tight truncate">
          {topic.name}
        </h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Body: image on the left, numbered list + ratings on the right */}
      <div className="flex gap-5 items-stretch">
        <div className="w-32 sm:w-36 shrink-0 flex flex-col">
          {/* Spacer matching the "Rating | You" header row so the image aligns with row 1 */}
          <div className="text-[11px] leading-none invisible mb-2" aria-hidden>
            Rating
          </div>
          <img
            src={dbTopic?.imageUrl || topic.imageUrl || "/placeholder.svg"}
            alt={topic.name}
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src.endsWith("/placeholder.svg")) return;
              img.src = "/placeholder.svg";
            }}
            className="flex-1 w-full rounded object-cover bg-muted"
          />
        </div>
        <ol className="flex-1 min-w-0 space-y-2">
          <li className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="w-5 shrink-0" aria-hidden />
            <span className="flex-1 min-w-0" aria-hidden />
            <span className="flex items-center shrink-0">
              <span className="w-8 text-right whitespace-nowrap">Rating</span>
              <span className="w-4 text-center">|</span>
              <span className="w-8 text-left">You</span>
            </span>
          </li>
          {topPosts.map((post, i) => (
            <li key={post.id} className="flex items-center gap-3 text-[15px] min-w-0">
              <span className="text-muted-foreground w-5 shrink-0 text-right">{i + 1}.</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const slug = slugifyPostTitle(post.content) || String(i + 1);
                  navigate(`/topic/${encodeURIComponent(topic.name)}/post/${slug}`);
                }}
                className="flex-1 min-w-0 text-left text-primary leading-snug truncate hover:underline"
              >
                {post.content}
              </button>
              <span className="flex items-center text-secondary shrink-0 tabular-nums text-sm">
                <span className="font-medium w-8 text-right">{post.avg}</span>
                <span className="text-muted-foreground/60 w-4 text-center">|</span>
                <span className="w-8 flex justify-start">
                  <UserRatingIndicator
                    postId={post.id}
                    onRatingChanged={() => {
                      if (dbTopic?.id) {
                        queryClient.invalidateQueries({ queryKey: ["posts-by-topic", dbTopic.id] });
                      }
                    }}
                  />
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default PopularTopicSection;
