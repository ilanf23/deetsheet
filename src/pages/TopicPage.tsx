import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import TopicPostListItem from "@/components/TopicPostListItem";
import TopicRecommendations from "@/components/TopicRecommendations";
import TopicRecentlyAdded from "@/components/TopicRecentlyAdded";
import AddPostBar from "@/components/AddPostBar";
import FollowTopicButton from "@/components/FollowTopicButton";
import EmailCaptureForm from "@/components/EmailCaptureForm";
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
        <div className="max-w-[1600px] mx-auto px-8 lg:px-16 mt-10 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-10">
            {/* Left — Recently Added */}
            <div className="hidden lg:block">
              <TopicRecentlyAdded topicId={topic.id} topicName={topic.name} />
            </div>
            {/* Main â Topic posts */}
            <div className="min-w-0">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-3">
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-card-foreground">
                      {topic.name}
                    </h1>
                    <span className="text-sm text-muted-foreground">
                      /{topic.categoryName}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {getTopicSubtitle(topic.name, topic.categoryName)}
                  </p>
                </div>
                <FollowTopicButton topicId={topic.id} />
              </div>
              <div>
                {visiblePosts.map((post, i) => (
                  <TopicPostListItem
                    key={post.id}
                    post={post}
                    rank={i + 1}
                    topicName={topic.name}
                  />
                ))}
                {!loading && !!user && topic && (
                  <AddPostBar
                    topicId={topic.id}
                    topicName={topic.name}
                    categoryName={topic.categoryName}
                    onPostAdded={refreshPosts}
                  />
                )}
              </div>
              <TopicPaginationFooter
                size={size}
                total={posts.length}
                rendered={rendered}
                onSizeChange={handleSizeChange}
                onShowMore={handleShowMore}
              />
            </div>

            {/* Right â Recommendations + Email Capture */}
            <div className="hidden lg:block space-y-6">
              <EmailCaptureForm />
              {/* TopicRecommendations still reads from seedData for now â
                  refactor when the homepage flow moves off seed. */}
              <TopicRecommendations currentTopic={topic as unknown as import("@/data/seedData").Topic} />
            </div>
          </div>
        </div>
      </main>
      <DeetFooter />
    </div>
  );
};

export default TopicPage;
