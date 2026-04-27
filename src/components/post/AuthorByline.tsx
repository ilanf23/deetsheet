import { Link } from "react-router-dom";

interface AuthorBylineProps {
  username: string;
  authorId?: string;
  createdAt: Date;
}

const formatPostedDate = (date: Date) => {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${mm}-${dd}-${yy}`;
};

const AuthorByline = ({ username, authorId, createdAt }: AuthorBylineProps) => {
  const profileHref = authorId ? `/profile/${authorId}` : `/profile/${username}`;

  return (
    <address
      className="not-italic flex items-baseline gap-2 flex-wrap"
      style={{
        fontSize: "var(--font-size-byline)",
        lineHeight: "var(--line-height-byline)",
      }}
    >
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
