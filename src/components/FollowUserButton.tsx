import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserFollow } from "@/hooks/useUserFollow";
import { useAuth } from "@/contexts/AuthContext";

interface FollowUserButtonProps {
  targetUserId: string;
  size?: "sm" | "default";
}

const FollowUserButton = ({ targetUserId, size = "sm" }: FollowUserButtonProps) => {
  const { user, loading } = useAuth();
  const { isFollowing, isLoading, isSelf, toggle, isToggling } = useUserFollow(targetUserId);

  // Don't render for logged-out users or on your own profile
  if (loading || !user || isSelf) return null;

  return (
    <Button
      variant={isFollowing ? "default" : "outline"}
      size={size}
      onClick={() => toggle()}
      disabled={isLoading || isToggling}
      className="gap-1.5"
      aria-pressed={isFollowing}
    >
      {isFollowing ? (
        <UserCheck className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
};

export default FollowUserButton;
