import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import TopicPostExpanded from "@/components/TopicPostExpanded";
import TopicRecommendations from "@/components/TopicRecommendations";
import AddPostBar from "@/components/AddPostBar";
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

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Auto-expand the first post once posts land, matching the legacy UX
  // where the top-ranked post starts open on page load.
  useEffect(() => {
    if (posts.length > 0 && expandedIds.size === 0) {
      setExpandedIds(new Set([posts[0].id]));
    }
  }, [posts, expandedIds.size]);

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
          <p className="text-muted-foreground">Loading topic…</p>
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
        <div className="container mx-auto px-4 mt-10 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
            {/* Main — Topic posts */}
            <div className="min-w-0">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-card-foreground font-heading">{topic.name}</h1>
                <p className="text-sm text-muted-foreground">/{topic.categoryName}</p>
                <p className="text-sm text-muted-foreground mt-1">{getTopicSubtitle(topic.name)}</p>
              </div>
              <div className="space-y-3">
                {posts.map((post, i) => (
                  <TopicPostExpanded
                    key={post.id}
                    post={post}
                    rank={i + 1}
                    isExpanded={expandedIds.has(post.id)}
                    onToggleExpand={() => setExpandedIds(prev => {
                      const next = new Set(prev);
                      if (next.has(post.id)) next.delete(post.id);
                      else next.add(post.id);
                      return next;
                    })}
                    isAuthenticated={!loading && !!user}
                  />
                ))}
              </div>
              {!loading && !!user && topic && (
                <AddPostBar
                  topicName={topic.name}
                  categoryName={topic.categoryName}
                  onPostAdded={refreshPosts}
                />
              )}
            </div>

            {/* Right — Recommendations (clips to left column height) */}
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 overflow-hidden">
                {/* TopicRecommendations still reads from seedData for now —
                    refactor in Sprint 1 when the homepage flow moves off seed. */}
                <TopicRecommendations currentTopic={topic as unknown as import("@/data/seedData").Topic} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <DeetFooter />
    </div>
  );
};

export default TopicPage;
