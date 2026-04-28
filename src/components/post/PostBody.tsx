import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, ChevronUp } from "lucide-react";

interface PostBodyProps {
  content: string;
}

const COLLAPSED_LINES = 8;

const PostBody = ({ content }: PostBodyProps) => {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (expanded) return;
    // After layout, scrollHeight reflects full content; clientHeight is clamped.
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [content, expanded]);

  // The toggle is shown if (a) we're collapsed and the content overflows, or
  // (b) we're currently expanded (so the user can collapse back).
  const showToggle = expanded || overflows;

  return (
    <div style={{ maxWidth: "var(--reading-max-width)" }}>
      <div
        ref={bodyRef}
        className="text-card-foreground whitespace-pre-line"
        style={{
          fontSize: "var(--font-size-prose-body)",
          lineHeight: "var(--line-height-prose-body)",
          ...(!expanded && {
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: COLLAPSED_LINES,
            overflow: "hidden",
          }),
        }}
      >
        {content}
      </div>
      {showToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse post" : "Show full post"}
          className="mt-3 inline-flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-primary hover:bg-accent/40 transition-colors"
        >
          {expanded ? <ChevronUp className="h-5 w-5" /> : <MoreHorizontal className="h-5 w-5" />}
        </button>
      )}
    </div>
  );
};

export default PostBody;
