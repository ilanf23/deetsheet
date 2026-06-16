import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, ChevronUp } from "lucide-react";

interface PostBodyProps {
  content: string;
  imageSrc?: string | null;
  imageAlt?: string;
}

const COLLAPSED_LINES = 10;

const PostBody = ({ content, imageSrc, imageAlt }: PostBodyProps) => {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (expanded) return;
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [content, expanded, imageSrc, imageFailed]);

  const showImage = !!imageSrc && !imageFailed;
  // Don't clip when an image is present — tall photos should display in full
  // without forcing the user to click the "…" expander.
  const canCollapse = !showImage;
  const showToggle = canCollapse && (expanded || overflows);

  return (
    <div>
      <div
        ref={bodyRef}
        className="text-card-foreground whitespace-pre-line break-words"
        style={{
          fontSize: "var(--font-size-prose-body)",
          lineHeight: "var(--line-height-prose-body)",
          ...(canCollapse && !expanded && {
            maxHeight: `calc(var(--line-height-prose-body) * ${COLLAPSED_LINES} * 1em)`,
            overflow: "hidden",
          }),
        }}
      >
        {content}
      </div>
      {showImage && (
        <img
          src={imageSrc!}
          alt={imageAlt || ""}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="mt-3 w-full max-w-[480px] rounded-lg border border-border object-contain bg-muted"
        />
      )}
      {showToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse post" : "Show full post"}
          className="mt-3 inline-flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-primary hover:bg-accent/40 transition-colors clear-both"
        >
          {expanded ? <ChevronUp className="h-5 w-5" /> : <MoreHorizontal className="h-5 w-5" />}
        </button>
      )}
    </div>
  );
};


export default PostBody;
