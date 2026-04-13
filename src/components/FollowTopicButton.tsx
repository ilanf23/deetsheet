import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTopicFollow } from "@/hooks/useTopicFollow";
import { useAuth } from "@/contexts/AuthContext";

interface FollowTopicButtonProps {
  topicId: string;
}

const FollowTopicButton = ({ topicId }: FollowTopicButtonProps) => {
  const { user, loading } = useAuth();
  const { isFollowing, isLoading, toggle, isToggling } = useTopicFollow(topicId);

  // Don't render for logged-out users
  if (loading || !user) return null;

  return (
    <Button
      variant={isFollowing ? "default" : "outline"}
      size="sm"
      onClick={() => toggle()}
      disabled={isLoading || isToggling}
      className="gap-1.5"
    >
      <Heart
        className={`w-4 h-4 ${isFollowing ? "fill-current" : ""}`}
      />
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
};

export default FollowTopicButton;
