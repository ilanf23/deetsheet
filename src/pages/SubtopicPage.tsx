import { useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import TopicRecentlyAdded from "@/components/TopicRecentlyAdded";
import TopicRecommendations from "@/components/TopicRecommendations";
import PostHeader from "@/components/post/PostHeader";
import AuthorByline from "@/components/post/AuthorByline";
import PostBody from "@/components/post/PostBody";
import RatePostBlock from "@/components/post/RatePostBlock";
import PrevNextRankPager from "@/components/post/PrevNextRankPager";
import CommentsSection from "@/components/post/CommentsSection";
import { useAuth } from "@/contexts/AuthContext";
import {
  useTopicByName,
  usePostsByTopic,
} from "@/hooks/useSupabaseTopics";
import type { Post, Topic } from "@/data/seedData";

const SubtopicPage = () => {
  const { topicName, rank } = useParams<{ topicName: string; rank: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();

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
  const total = posts.length;
  const prevPost = rankNum > 1 ? posts[rankNum - 2] : undefined;
  const nextPost = rankNum < total ? posts[rankNum] : undefined;

  const isAuthenticated = !loading && !!user;

  const seedAvg = post && post.ratingCount > 0
    ? Math.round((post.ratingScore / post.ratingCount) * 10) / 10
    : 0;

  const refreshRatings = () => {
    if (topic?.id) {
      queryClient.invalidateQueries({ queryKey: ["posts-by-topic", topic.id] });
    }
  };

  useEffect(() => {
    if (!post) return;
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
  }, [post, location.hash]);

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
            className="text-primary hover:underline mt-4 inline-flex items-center gap-1 bg-transparent border-0 p-0 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" /> Back to {topic.name}
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
        <div className="mx-auto px-4 sm:px-6 lg:px-10 mt-[var(--space-rhythm-section)] mb-[var(--space-rhythm-major)] max-w-[1400px]">
          <div className="grid grid-cols-1 lg:grid-cols-[var(--rail-width-left)_minmax(0,var(--middle-col-max-width))_var(--rail-width-right)] gap-[var(--rail-gap)] justify-center">
            {/* Left rail — site-wide activity */}
            <aside className="hidden lg:block pt-2">
              <div className="sticky top-24">
                <TopicRecentlyAdded topicId={topic.id} topicName={topic.name} />
              </div>
            </aside>

            {/* Middle column — the read */}
            <article className="min-w-0 pt-2 space-y-[var(--space-rhythm-section)]">
              {post ? (
                <>
                  <div className="space-y-[var(--space-rhythm-block)]">
                    <PostHeader
                      title={post.title || post.content}
                      rank={rankNum}
                      total={total}
                      topicName={topic.name}
                      averageRating={seedAvg}
                      ratingCount={post.ratingCount}
                    />
                    <AuthorByline
                      username={post.username}
                      authorId={post.authorId}
                      createdAt={post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt)}
                    />
                  </div>
                  <PostBody content={post.content} />
                  <RatePostBlock
                    postId={post.id}
                    isAuthenticated={isAuthenticated}
                    onRatingChanged={refreshRatings}
                  />
                  <PrevNextRankPager
                    topicName={topic.name}
                    rank={rankNum}
                    prev={prevPost}
                    next={nextPost}
                  />
                  <CommentsSection
                    postId={post.id}
                    isAuthenticated={isAuthenticated}
                  />
                </>
              ) : (
                <p className="text-muted-foreground">No posts in this topic yet.</p>
              )}
            </article>

            {/* Right rail — topic discovery */}
            <aside className="hidden lg:block pt-2">
              <div className="sticky top-24">
                <TopicRecommendations currentTopic={topic as unknown as Topic} />
              </div>
            </aside>

            {/* Mobile-only stacked rails (below the body) */}
            <div className="lg:hidden space-y-[var(--space-rhythm-block)]">
              <TopicRecentlyAdded topicId={topic.id} topicName={topic.name} />
              <TopicRecommendations currentTopic={topic as unknown as Topic} />
            </div>
          </div>
        </div>
      </main>
      <DeetFooter />
    </div>
  );
};

export default SubtopicPage;
