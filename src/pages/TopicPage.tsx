import { useEffect, useMemo, useState } from "react";

type MobileTab = "posts" | "recent" | "recommended";
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
  const sizeFromStorage = (() => {
    if (typeof window === "undefined") return null;
    const stored = Number(window.localStorage.getItem("topicPostsPageSize"));
    return isValidPageSize(stored) ? stored : null;
  })();
  const size: PageSize = isValidPageSize(sizeFromUrl)
    ? sizeFromUrl
    : sizeFromStorage ?? DEFAULT_PAGE_SIZE;

  const [rendered, setRendered] = useState<number>(size);
  const [rankOpen, setRankOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("recent");

  const mobileTabs: { id: MobileTab; label: string }[] = [
    { id: "recent", label: "Recently Added" },
    { id: "posts", label: "Posts" },
    { id: "recommended", label: "Recommended" },
  ];

  useEffect(() => {
    setRendered((prev) => {
      const target = Math.min(Math.max(prev, size), posts.length || size);
      return target;
    });
  }, [posts.length, size]);

  const visiblePosts = useMemo(
    () => posts.slice(0, rendered),
    [posts, rendered]
  );

  const handleSizeChange = (next: PageSize) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("topicPostsPageSize", String(next));
    }
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("size", String(next));
    setSearchParams(nextParams, { replace: true });
    // Reset the visible slice to exactly the chosen page size so picking a
    // smaller value (e.g. 100 -> 25) actually shrinks the list.
    setRendered(next);
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
          {/* Mobile tab switcher */}
          <div className="lg:hidden mb-4 flex gap-1 rounded-lg bg-muted p-1">
            {mobileTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setMobileTab(t.id)}
                className={`flex-1 px-2 py-2 text-xs font-semibold rounded-md transition-colors ${
                  mobileTab === t.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 lg:gap-x-3 lg:h-full">
            {/* Left - Recently Added */}
            <div className={`${mobileTab === "recent" ? "block" : "hidden"} lg:block pt-4 lg:h-full lg:overflow-y-auto lg:pr-2`}>
              <TopicRecentlyAdded topicId={topic.id} topicName={topic.name} />
            </div>
            {/* Middle + Right share a single scroll container */}
            <div className="lg:h-full lg:overflow-y-auto lg:pr-2">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5">
                <div className={`${mobileTab === "posts" ? "block" : "hidden"} lg:block min-w-0 pt-4`}>
              <div className="min-w-0 bg-card rounded-md border border-border p-4">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="min-w-0 pl-1.5">
                  <div className="flex items-baseline gap-3">
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary">
                      {topic.name}
                    </h1>
                    <Link
                      to={`/topics#${encodeURIComponent(topic.categoryName)}`}
                      className="text-sm text-primary hover:underline"
                    >
                      /{topic.categoryName}
                    </Link>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {getTopicSubtitle(topic.name, topic.categoryName, topic.subtitleOverride)}
                  </p>
                </div>
                <div className="hidden md:flex items-start gap-4">
                  <FollowTopicButton topicId={topic.id} />
                  {/* Image is dropped between md and xl where the layout is too
                      narrow to fit it without overlapping the Related Topics rail */}
                  <div className="hidden xl:block">
                    <TopicHeaderImage
                      src={topic.imageUrl}
                      alt={topic.name}
                      onClick={() => setRankOpen(true)}
                    />
                  </div>
                </div>
              </div>
              {/* Mobile: image + follow under the topic title */}
              <div className="md:hidden mb-4 flex flex-col gap-2">
                <TopicHeaderImage
                  src={topic.imageUrl}
                  alt={topic.name}
                  onClick={() => setRankOpen(true)}
                  fullWidth
                />
                <div className="flex justify-end">
                  <FollowTopicButton topicId={topic.id} />
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
              <div>
                <div
                  aria-hidden
                  className="flex items-baseline gap-3 px-3 -mx-3 pb-2 text-sm text-muted-foreground"
                >
                  <span className="w-6 shrink-0" />
                  <span className="flex-1 min-w-0" />
                  <span className="shrink-0 w-[72px] ml-4 text-center">Rating</span>
                  <span className="shrink-0 -ml-4 text-muted-foreground/60" aria-hidden>|</span>
                  <span className="shrink-0 w-6 text-left">You</span>
                </div>
                <div className="divide-y divide-border border-y border-border rounded-t-md">
                  {visiblePosts.map((post, i) => (
                    <TopicPostListItem
                      key={post.id}
                      post={post}
                      rank={i + 1}
                      topicName={topic.name}
                      topicId={topic.id}
                      showRanking
                    />
                  ))}
                </div>
                {!loading && !!user && topic && (
                  <div className="mt-6">
                    <AddPostBar
                      topicId={topic.id}
                      topicName={topic.name}
                      categoryName={topic.categoryName}
                      existingPosts={posts}
                      onPostAdded={refreshPosts}
                    />
                  </div>
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

                </div>
                {/* Right rail — Recommendations (shares scroll with middle) */}
                <aside className={`${mobileTab === "recommended" ? "block" : "hidden"} lg:block lg:border-l lg:border-border lg:pl-5 pt-4 space-y-6`}>
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
  fullWidth = false,
}: {
  src: string | null;
  alt: string;
  onClick?: () => void;
  fullWidth?: boolean;
}) => {
  const [error, setError] = useState(false);
  const showImage = !!src && !error;
  const sizeCls = fullWidth
    ? "h-40 w-full"
    : "h-[7.7rem] w-[17.6rem]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary group bg-muted ${fullWidth ? "w-full" : ""}`}
      aria-label={`Rank images for ${alt}`}
    >
      {showImage ? (
        <img
          src={src!}
          alt={alt}
          className={`${sizeCls} object-cover transition-transform group-hover:scale-[1.02]`}
          loading="lazy"
          onError={() => setError(true)}
        />
      ) : (
        <div className={`${sizeCls} flex items-center justify-center text-xs text-muted-foreground font-medium`}>
          Rank an image →
        </div>
      )}
    </button>
  );
};

export default TopicPage;
