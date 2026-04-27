import { Link } from "react-router-dom";
import UserAvatar from "@/components/UserAvatar";
import { getTimeAgo } from "@/data/seedData";

interface AuthorBylineProps {
  username: string;
  authorId?: string;
  createdAt: Date;
  bio?: string;
}

const AuthorByline = ({ username, authorId, createdAt, bio }: AuthorBylineProps) => {
  const profileHref = authorId ? `/profile/${authorId}` : `/profile/${username}`;

  return (
    <address
      className="not-italic flex items-start gap-3"
      style={{
        fontSize: "var(--font-size-byline)",
        lineHeight: "var(--line-height-byline)",
      }}
    >
      <UserAvatar username={username} size="sm" showName={false} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap text-muted-foreground">
          <span>Posted by</span>
          <Link
            to={profileHref}
            className="text-primary font-medium hover:underline"
          >
            {username}
          </Link>
          <span aria-hidden>·</span>
          <time dateTime={createdAt.toISOString()}>{getTimeAgo(createdAt)}</time>
        </div>
        {bio && (
          <p className="text-muted-foreground italic line-clamp-1 mt-0.5">
            {bio}
          </p>
        )}
      </div>
    </address>
  );
};

export default AuthorByline;
