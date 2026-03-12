import { useState } from "react";
import { useParams } from "react-router-dom";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import TopicPostExpanded from "@/components/TopicPostExpanded";
import TopicRecommendations from "@/components/TopicRecommendations";
import AddPostBar from "@/components/AddPostBar";
import { useAuth } from "@/contexts/AuthContext";
import { getTopicByName, getPostsByTopic, getSubtitle } from "@/data/seedData";

const TopicPage = () => {
  const { topicName } = useParams<{ topicName: string }>();
  const { user, loading } = useAuth();
  const topic = topicName ? getTopicByName(topicName) : undefined;
  const [posts, setPosts] = useState(() => topicName ? getPostsByTopic(topicName) : []);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(posts[0] ? [posts[0].id] : []));

  const refreshPosts = () => {
    if (topicName) setPosts(getPostsByTopic(topicName));
  };

  if (!topic) {
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
                <p className="text-sm text-muted-foreground mt-1">{getSubtitle(topic.name)}</p>
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

            {/* Right — Recommendations */}
            <div className="hidden lg:block">
              <div className="lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto scrollbar-thin lg:pr-2">
                <TopicRecommendations currentTopic={topic} />
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
