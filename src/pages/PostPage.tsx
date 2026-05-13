import { useEffect, useMemo, useState } from "react";

type MobileTab = "post" | "recent" | "recommended";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import TopicRecentlyAdded from "@/components/TopicRecentlyAdded";
import TopicRecommendations from "@/components/TopicRecommendations";
import PostHeader from "@/components/post/PostHeader";
import AuthorByline from "@/components/post/AuthorByline";
import PostMetaBar from "@/components/post/PostMetaBar";
import PostBody from "@/components/post/PostBody";
import JudgementReactionsRow from "@/components/post/JudgementReactionsRow";
import InlineCommentComposer from "@/components/post/InlineCommentComposer";
import CommentsSection from "@/components/post/CommentsSection";
import {
  useTopicByName,
  usePostsByTopic,
  type PostRow,
} from "@/hooks/useSupabaseTopics";
import { buildPostImageUrl } from "@/lib/topicImageQueries";
import { slugifyPostTitle } from "@/lib/postSlug";
import type { Topic } from "@/data/seedData";

const PostPage = () => {
  const { topicName, slug } = useParams<{ topicName: string; slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const backToTopicHref = `/topic/${encodeURIComponent(topicName ?? "")}`;

  const { data: topic, isLoading: topicLoading, isError: topicError } =
    useTopicByName(topicName);
  const { data: postsData } = usePostsByTopic(topic?.id);
  const posts = useMemo<PostRow[]>(
    () => postsData ?? [],
    [postsData]
  );

  // `:slug` is normally the slugified post title, but legacy links may pass
  // a UUID (sidebars) or a 1-based topic rank — handle all three.
  const decodedSlug = slug ? decodeURIComponent(slug) : "";
  const isUuid =
    !!decodedSlug &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedSlug);
  const isNumeric = !!decodedSlug && /^\d+$/.test(decodedSlug);

  let indexInTopic = -1;
  if (isUuid) {
    indexInTopic = posts.findIndex((p) => p.id === decodedSlug);
  } else if (isNumeric) {
    indexInTopic = Math.max(0, parseInt(decodedSlug, 10) - 1);
  } else if (decodedSlug) {
    const target = decodedSlug.toLowerCase();
    indexInTopic = posts.findIndex(
      (p) => slugifyPostTitle(p.title || p.content) === target,
    );
  }

  const rankNum = indexInTopic >= 0 ? indexInTopic + 1 : 0;
  const post = indexInTopic >= 0 ? posts[indexInTopic] : undefined;

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

  const [mobileTab, setMobileTab] = useState<MobileTab>("recent");
  const mobileTabs: { id: MobileTab; label: string }[] = [
    { id: "recent", label: "Recently Added" },
    { id: "post", label: "Post" },
    { id: "recommended", label: "Recommended" },
  ];

  if (topicLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
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

  if (posts.length > 0 && !post) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DeetHeader />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">Post not found</h1>
          <p className="text-muted-foreground">
            {isNumeric ? `#${decodedSlug}` : "That post"} doesn't exist in {topic.name}.
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
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 lg:h-full">
            {/* Left rail - Recently Added */}
            <aside className={`${mobileTab === "recent" ? "block" : "hidden"} lg:block pt-4 lg:h-full lg:overflow-y-auto lg:pr-2`}>
              <TopicRecentlyAdded topicId={topic.id} topicName={topic.name} />
            </aside>

            {/* Middle + Right share a single scroll container */}
            <div className="lg:h-full lg:overflow-y-auto lg:pr-2">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5">
                {/* Middle column - the read */}
                <article className={`${mobileTab === "post" ? "block" : "hidden"} lg:block min-w-0 pt-4 space-y-[var(--space-rhythm-block)]`}>
              {post ? (
                <>
                  <div className="space-y-[var(--space-rhythm-tight)]">
                    <div className="space-y-[var(--space-rhythm-tight)] border-b border-border pb-[var(--space-rhythm-tight)]">
                      <div className="flex items-baseline gap-3">
                        <button
                          type="button"
                          onClick={() => navigate(backToTopicHref)}
                          className="text-3xl md:text-4xl font-heading font-bold text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer"
                        >
                          {topic.name}
                        </button>
                        <span className="text-sm text-muted-foreground">
                          /{topic.categoryName}
                        </span>
                      </div>
                    </div>
                    <PostHeader
                      title={post.title || post.content}
                      rank={rankNum}
                      topicName={topic.name}
                      postId={post.id}
                      averageRating={seedAvg}
                      ratingCount={post.ratingCount}
                      onRatingChanged={refreshRatings}
                    />
                    <AuthorByline
                      username={post.username}
                      authorId={post.authorId}
                      createdAt={post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt)}
                    />
                    <PostMetaBar
                      commentCount={post.commentCount}
                      postTitle={post.title || post.content}
                      postId={post.id}
                      topicName={topic.name}
                    />
                    <JudgementReactionsRow />
                  </div>
                  <PostBody
                    content={post.content}
                    imageSrc={buildPostImageUrl(post.id, topic.name, topic.categoryName)}
                    imageAlt={post.title || topic.name}
                  />
                  <div id="comments" className="border-t border-border pt-[var(--space-rhythm-block)] scroll-mt-24">
                    <InlineCommentComposer
                      postId={post.id}
                      onSubmitted={() =>
                        queryClient.invalidateQueries({
                          queryKey: ["comments", post.id],
                        })
                      }
                    />
                  </div>
                  <CommentsSection postId={post.id} />
                </>
              ) : (
                <p className="text-muted-foreground">No posts in this topic yet.</p>
              )}
                </article>

                {/* Right rail - topic discovery */}
                <aside className={`${mobileTab === "recommended" ? "block" : "hidden"} lg:block lg:border-l lg:border-border lg:pl-5 pt-4`}>
                  <TopicRecommendations currentTopic={topic as unknown as Topic} />
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

export default PostPage;
