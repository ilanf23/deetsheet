import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import TopicPostListItem from "@/components/TopicPostListItem";
import TopicRecommendations from "@/components/TopicRecommendations";
import TopicRecentlyAdded from "@/components/TopicRecentlyAdded";
import AddPostBar from "@/components/AddPostBar";
import FollowTopicButton from "@/components/FollowTopicButton";
import RankImagesDialog from "@/components/topic/RankImagesDialog";
import TopicPaginationFooter, {
  DEFAULT_PAGE_SIZE,
  isValidPageSize,
  type PageSize,
} from "@/components/TopicPaginationFooter";
import { useAuth } from "@/contexts/AuthContext";
import type { Post } from "@/data/seedData";
import {
  useTopicByName,
  usePostsByTopic,
  getTopicSubtitle,
} from "@/hooks/useSupabaseTopics";

const TopicPage = () => {
  const { topicName } = useParams<{ topicName: string }>();
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: topic,
    isLoading: topicLoading,
    isError: topicError,
  } = useTopicByName(topicName);
  const { data: postsData } = usePostsByTopic(topic?.id);
  const posts = useMemo<Post[]>(
    () => ((postsData ?? []) as unknown) as Post[],
    [postsData]
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const sizeFromUrl = Number(searchParams.get("size"));
  const size: PageSize = isValidPageSize(sizeFromUrl)
    ? sizeFromUrl
    : DEFAULT_PAGE_SIZE;

  const [rendered, setRendered] = useState<number>(size);
  const [rankOpen, setRankOpen] = useState(false);

  useEffect(() => {
    setRendered((prev) =>
      Math.min(Math.max(prev, size), posts.length || size)
    );
  }, [posts.length, size]);

  const visiblePosts = useMemo(
    () => posts.slice(0, rendered),
    [posts, rendered]
  );

  const handleSizeChange = (next: PageSize) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("size", String(next));
    setSearchParams(nextParams, { replace: true });
    setRendered((prev) => Math.max(prev, next));
  };

  const handleShowMore = () => {
    setRendered((prev) => Math.min(prev + size, posts.length));
  };

  const refreshPosts = () => {
    if (topic?.id) {
      queryClient.invalidateQueries({ queryKey: ["posts-by-topic", topic.id] });
    }
  };

  if (topicLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DeetHeader />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading topicâ¦</p>
        </main>
        <DeetFooter />
      </div>
    );
  }

  if (topicError || !topic) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DeetHeader />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">Topic not found</h1>
          <p className="text-muted-foreground">The topic "{topicName}" doesn't exist.</p>
        </main>
        <DeetFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1">
        <div className="mx-auto mt-5 px-6 lg:px-10 mb-20 lg:mb-0 lg:h-[calc(100vh-4rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 lg:h-full">
            {/* Left — Recently Added */}
            <div className="hidden lg:block pt-4 lg:h-full lg:overflow-y-auto lg:pr-2">
              <TopicRecentlyAdded topicId={topic.id} topicName={topic.name} />
            </div>
            {/* Main â Topic posts */}
            {/* Middle + Right share a single scroll container */}
            <div className="lg:h-full lg:overflow-y-auto lg:pr-2">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5">
                <div className="min-w-0 pt-4">
              <div className="min-w-0">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="min-w-0 pl-1.5">
                  <div className="flex items-baseline gap-3">
                    <h1 className="text-3xl md:text-4xl font-heading font-bold">
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="text-primary hover:underline bg-transparent border-0 p-0 text-left cursor-pointer"
                      >
                        {topic.name}
                      </button>
                    </h1>
                    <Link
                      to={`/topics#${encodeURIComponent(topic.categoryName)}`}
                      className="text-sm text-primary hover:underline"
                    >
                      /{topic.categoryName}
                    </Link>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {getTopicSubtitle(topic.name, topic.categoryName)}
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <FollowTopicButton topicId={topic.id} />
                  <TopicHeaderImage
                    src={topic.imageUrl}
                    alt={topic.name}
                    onClick={() => setRankOpen(true)}
                  />
                </div>
              </div>
              <RankImagesDialog
                open={rankOpen}
                onOpenChange={setRankOpen}
                topicId={topic.id}
                topicName={topic.name}
                categoryName={topic.categoryName}
                primaryImage={topic.imageUrl}
              />
              {!!user && (
                <div
                  aria-hidden
                  className="flex items-baseline gap-4 px-3 -mx-3 pb-2 text-sm md:text-base font-heading text-muted-foreground"
                >
                  <span className="w-8 shrink-0" />
                  <span className="flex-1 min-w-0" />
                  <span className="shrink-0">Rating</span>
                  <span className="shrink-0 w-8 text-center">You</span>
                </div>
              )}
              <div className="divide-y divide-border border-y border-border rounded-t-md">
                {visiblePosts.map((post, i) => (
                  <TopicPostListItem
                    key={post.id}
                    post={post}
                    rank={i + 1}
                    topicName={topic.name}
                    topicId={topic.id}
                    showRanking={!!user}
                  />
                ))}
              </div>
              {!loading && !!user && topic && (
                <div className="mt-6">
                  <AddPostBar
                    topicId={topic.id}
                    topicName={topic.name}
                    categoryName={topic.categoryName}
                    onPostAdded={refreshPosts}
                  />
                </div>
              )}
              <TopicPaginationFooter
                size={size}
                total={posts.length}
                rendered={rendered}
                onSizeChange={handleSizeChange}
                onShowMore={handleShowMore}
              />
              </div>

                </div>
                {/* Right rail — Recommendations (shares scroll with middle) */}
                <aside className="hidden lg:block lg:border-l lg:border-border lg:pl-5 pt-4 space-y-6">
                  <TopicRecommendations currentTopic={topic as unknown as import("@/data/seedData").Topic} />
                </aside>
              </div>
            </div>
          </div>
        </div>
      </main>
      <DeetFooter />
    </div>
  );
};

const TopicHeaderImage = ({
  src,
  alt,
  onClick,
}: {
  src: string | null;
  alt: string;
  onClick?: () => void;
}) => {
  const [error, setError] = useState(false);
  const showImage = !!src && !error;
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary group bg-muted"
      aria-label={`Rank images for ${alt}`}
    >
      {showImage ? (
        <img
          src={src!}
          alt={alt}
          className="h-[7.7rem] w-[17.6rem] object-cover transition-transform group-hover:scale-[1.02]"
          loading="lazy"
          onError={() => setError(true)}
        />
      ) : (
        <div className="h-[7.7rem] w-[17.6rem] flex items-center justify-center text-xs text-muted-foreground font-medium">
          Rank an image →
        </div>
      )}
    </button>
  );
};

export default TopicPage;
