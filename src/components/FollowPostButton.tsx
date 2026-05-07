import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePostFollow, usePostFollowerCount } from "@/hooks/usePostFollow";
import { useAuth } from "@/contexts/AuthContext";

interface FollowPostButtonProps {
  postId: string;
  /** When true (default) the follower count renders alongside the button. */
  showCount?: boolean;
  /** Optional initial value used as a placeholder until the live count loads. */
  initialCount?: number;
}

const FollowPostButton = ({
  postId,
  showCount = true,
  initialCount,
}: FollowPostButtonProps) => {
  const { user, loading } = useAuth();
  const { isFollowing, isLoading, toggle, isToggling } = usePostFollow(postId);
  const { data: liveCount } = usePostFollowerCount(postId);

  if (loading || !user) return null;

  const count = liveCount ?? initialCount ?? 0;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isFollowing ? "default" : "outline"}
        size="sm"
        onClick={() => toggle()}
        disabled={isLoading || isToggling}
        className="gap-1.5"
        aria-pressed={isFollowing}
      >
        <Bookmark
          className={`w-4 h-4 ${isFollowing ? "fill-current" : ""}`}
        />
        {isFollowing ? "Following" : "Follow"}
      </Button>
      {showCount && count > 0 && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {count} {count === 1 ? "follower" : "followers"}
        </span>
      )}
    </div>
  );
};

export default FollowPostButton;
