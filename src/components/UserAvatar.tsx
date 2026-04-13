import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  username: string;
  avatarUrl?: string;
  size?: "sm" | "md";
  showName?: boolean;
  linkToProfile?: boolean;
}

const UserAvatar = ({
  username,
  avatarUrl,
  size = "sm",
  showName = true,
  linkToProfile = true,
}: UserAvatarProps) => {
  const sizeClass = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  const content = (
    <span className="inline-flex items-center gap-1.5">
      <Avatar className={sizeClass}>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={username} />}
        <AvatarFallback className={`${textSize} font-semibold bg-primary/10 text-primary`}>
          {username[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {showName && (
        <span
          className={`font-semibold ${linkToProfile ? "text-primary group-hover:underline" : "text-card-foreground"}`}
        >
          @{username}
        </span>
      )}
    </span>
  );

  if (!linkToProfile) return content;

  return (
    <Link to={`/profile/${username}`} className="group inline-flex items-center hover:underline" onClick={(e) => e.stopPropagation()}>
      {content}
    </Link>
  );
};

export default UserAvatar;
