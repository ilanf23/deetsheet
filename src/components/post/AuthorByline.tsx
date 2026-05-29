import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AuthorBylineProps {
  username: string;
  authorId?: string;
  avatarUrl?: string | null;
  createdAt: Date;
  isAnonymous?: boolean;
}

const formatPostedDate = (date: Date) => {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${mm}-${dd}-${yy}`;
};

const AuthorByline = ({
  username,
  authorId,
  avatarUrl,
  createdAt,
  isAnonymous,
}: AuthorBylineProps) => {
  const profileHref = authorId ? `/profile/${authorId}` : `/profile/${username}`;

  const bylineStyle = {
    fontSize: "var(--font-size-byline)",
    lineHeight: "var(--line-height-byline)",
  } as const;

  if (isAnonymous) {
    return (
      <address
        className="not-italic flex items-center gap-2 flex-wrap"
        style={bylineStyle}
      >
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-[10px] font-semibold bg-muted text-muted-foreground">
            ?
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold text-foreground">Anonymous</span>
        <time dateTime={createdAt.toISOString()} className="text-muted-foreground">
          Posted {formatPostedDate(createdAt)}
        </time>
      </address>
    );
  }

  return (
    <address
      className="not-italic flex items-center gap-2 flex-wrap"
      style={bylineStyle}
    >
      <Link to={profileHref} className="shrink-0">
        <Avatar className="h-6 w-6">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={username} />}
          <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
            {username[0]?.toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
      </Link>
      <Link
        to={profileHref}
        className="text-primary font-semibold hover:underline"
      >
        {username}
      </Link>
      <time
        dateTime={createdAt.toISOString()}
        className="text-muted-foreground"
      >
        Posted {formatPostedDate(createdAt)}
      </time>
    </address>
  );
};

export default AuthorByline;
