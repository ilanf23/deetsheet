import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import TopicPostListItem from "@/components/TopicPostListItem";
import TopicRecommendations from "@/components/TopicRecommendations";
import TopicRecentlyAdded from "@/components/TopicRecentlyAdded";
import AddPostBar from "@/components/AddPostBar";
import FollowTopicButton from "@/components/FollowTopicButton";
import EmailCaptureForm from "@/components/EmailCaptureForm";
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
              <div className="mb-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-card-foreground font-heading">{topic.name}</h1>
                    <p className="text-sm text-muted-foreground">/{topic.categoryName}</p>
                    <p className="text-sm text-muted-foreground mt-1">{getTopicSubtitle(topic.name, topic.categoryName)}</p>
                  </div>
                  <FollowTopicButton topicId={topic.id} />
                </div>
              </div>
              <div className="space-y-2">
                {posts.map((post, i) => (
                  <TopicPostListItem
                    key={post.id}
                    post={post}
                    rank={i + 1}
                    topicName={topic.name}
                  />
                ))}
              </div>
              {!loading && !!user && topic && (
                <AddPostBar
                  topicId={topic.id}
                  topicName={topic.name}
                  categoryName={topic.categoryName}
                  onPostAdded={refreshPosts}
                />
              )}
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
