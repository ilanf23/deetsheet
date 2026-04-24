import { useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Star } from "lucide-react";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import TopicPostExpanded from "@/components/TopicPostExpanded";
import { useAuth } from "@/contexts/AuthContext";
import {
  useTopicByName,
  usePostsByTopic,
} from "@/hooks/useSupabaseTopics";
import type { Post } from "@/data/seedData";

/**
 * Dedicated page for a single ranked subtopic within a topic.
 * Route: /topic/:topicName/post/:rank
 *
 * Shows the full post (content, ratings, comments) plus a sidebar listing
 * the other ranked subtopics in the same topic for quick navigation.
 */
const SubtopicPage = () => {
  const { topicName, rank } = useParams<{ topicName: string; rank: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Back link href — derived from the URL param React Router already matched,
  // so it's valid on first render and faithfully mirrors the URL the user
  // landed on (slug or display-name form both work).
  const backToTopicHref = `/topic/${encodeURIComponent(topicName ?? "")}`;

  const { data: topic, isLoading: topicLoading, isError: topicError } =
    useTopicByName(topicName);
  const { data: postsData } = usePostsByTopic(topic?.id);
  const posts = useMemo<Post[]>(
    () => ((postsData ?? []) as unknown) as Post[],
    [postsData]
  );

  const rankNum = Math.max(1, parseInt(rank ?? "1", 10) || 1);
  const post = posts[rankNum - 1];

  if (topicLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <DeetHeader />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading…</p>
        </main>
        <DeetFooter />
      </div>
    );
  }

  if (topicError || !topic) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <DeetHeader />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">Topic not found</h1>
          <p className="text-muted-foreground">The topic "{topicName}" doesn't exist.</p>
        </main>
        <DeetFooter />
      </div>
    );
  }

  if (posts.length > 0 && !post) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <DeetHeader />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">Subtopic not found</h1>
          <p className="text-muted-foreground">
            #{rankNum} doesn't exist in {topic.name}.
          </p>
          <button
            type="button"
            onClick={() => navigate(backToTopicHref)}
            className="text-primary hover:underline mt-4 inline-block bg-transparent border-0 p-0 cursor-pointer"
          >
            ← Back to {topic.name}
          </button>
        </main>
        <DeetFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <DeetHeader />
      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16 mt-10 mb-20">
          {/* Back link — always returns to the topic page, never home */}
          <nav className="mb-6 flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => navigate(backToTopicHref)}
              className="text-primary hover:underline inline-flex items-center gap-1 font-medium bg-transparent border-0 p-0 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to {topic.name}
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">#{rankNum}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
            {/* Main — single post, force expanded */}
            <div className="min-w-0">
              {post ? (
                <TopicPostExpanded
                  post={post}
                  rank={rankNum}
                  isExpanded={true}
                  onToggleExpand={() => navigate(backToTopicHref)}
                  isAuthenticated={!loading && !!user}
                />
              ) : (
                <p className="text-muted-foreground">No posts in this topic yet.</p>
              )}
            </div>

            {/* Right — other ranked subtopics */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <h2 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                  Other subtopics in {topic.name}
                </h2>
                <ul className="space-y-3">
                  {posts.map((p, i) => {
                    const r = i + 1;
                    const isCurrent = r === rankNum;
                    const seedAvg =
                      p.ratingCount > 0
                        ? Math.round((p.ratingScore / p.ratingCount) * 10) / 10
                        : 0;
                    const title = p.title || p.content;
                    return (
                      <li key={p.id}>
                        <Link
                          to={`/topic/${encodeURIComponent(topic.name)}/post/${r}`}
                          className={`flex items-start gap-2 p-3 border rounded-xl bg-background hover:shadow-md transition-all duration-200 text-sm ${
                            isCurrent
                              ? "ring-1 ring-primary text-card-foreground font-semibold"
                              : "text-primary"
                          }`}
                        >
                          <span className="w-5 shrink-0 text-right">{r}.</span>
                          <span className="flex-1 line-clamp-2">{title}</span>
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0 mt-0.5">
                            <Star className="h-3 w-3 text-secondary fill-secondary" />
                            {seedAvg}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <DeetFooter />
    </div>
  );
};

export default SubtopicPage;
