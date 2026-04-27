import { Link, useLocation } from "react-router-dom";
import UserRatingIndicator from "@/components/UserRatingIndicator";

interface RatePostBlockProps {
  postId: string;
  isAuthenticated: boolean;
  onRatingChanged?: () => void;
}

const RatePostBlock = ({ postId, isAuthenticated, onRatingChanged }: RatePostBlockProps) => {
  const location = useLocation();
  const nextUrl = encodeURIComponent(`${location.pathname}${location.search}#rate`);

  return (
    <section
      id="rate"
      className="rounded-[var(--radius)] border p-6"
      style={{
        backgroundColor: "hsl(var(--surface-rate-block))",
        borderColor: "hsl(var(--surface-rate-block-border))",
        maxWidth: "var(--reading-max-width)",
      }}
      aria-labelledby="rate-heading"
    >
      <h2
        id="rate-heading"
        className="font-heading font-bold text-card-foreground"
        style={{
          fontSize: "var(--font-size-section-heading)",
          lineHeight: "var(--line-height-section-heading)",
        }}
      >
        Was this helpful?
      </h2>
      <p className="text-muted-foreground mt-1" style={{ fontSize: "var(--font-size-byline)" }}>
        Rate this answer to help others find the best response.
      </p>

      <div className="mt-4 flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <span className="text-sm text-foreground font-medium">Your rating:</span>
            <UserRatingIndicator postId={postId} onRatingChanged={onRatingChanged} />
          </>
        ) : (
          <Link
            to={`/login?next=${nextUrl}`}
            className="text-primary font-medium hover:underline text-sm"
          >
            Sign in to rate this answer →
          </Link>
        )}
      </div>
    </section>
  );
};

export default RatePostBlock;
