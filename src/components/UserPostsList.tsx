import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface UserPost {
  id: string;
  title: string;
  content: string;
  score: number;
  comment_count: number;
  created_at: string;
  topic: { name: string; slug: string } | null;
}

const UserPostsList = ({ userId }: { userId: string }) => {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, content, score, comment_count, created_at, topics(name, slug)")
        .eq("author_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPosts(
          data.map((p: any) => ({
            ...p,
            topic: p.topics ?? null,
          }))
        );
      }
      setLoading(false);
    };

    fetchPosts();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        You haven't created any posts yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const timeAgo = getTimeAgo(post.created_at);
        return (
          <Link
            key={post.id}
            to={post.topic ? `/topic/${post.topic.slug}` : "#"}
            className="block"
          >
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-card-foreground truncate">
                      {post.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {post.topic && (
                        <span className="text-primary font-medium">{post.topic.name}</span>
                      )}
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-secondary fill-secondary" />
                      {post.score}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {post.comment_count}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default UserPostsList;
