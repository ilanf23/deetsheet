interface PostBodyProps {
  content: string;
}

const PostBody = ({ content }: PostBodyProps) => (
  <div
    className="text-card-foreground whitespace-pre-line"
    style={{
      maxWidth: "var(--reading-max-width)",
      fontSize: "var(--font-size-prose-body)",
      lineHeight: "var(--line-height-prose-body)",
    }}
  >
    {content}
  </div>
);

export default PostBody;
