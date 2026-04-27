import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Send } from "lucide-react";
import type { Editor } from "@tiptap/react";
import RichTextEditor from "@/components/RichTextEditor";
import CommentItem from "@/components/CommentItem";
import { getCommentsByPost } from "@/data/seedData";

interface CommentsSectionProps {
  postId: string;
  isAuthenticated: boolean;
}

const CommentsSection = ({ postId, isAuthenticated }: CommentsSectionProps) => {
  const location = useLocation();
  const nextUrl = encodeURIComponent(`${location.pathname}${location.search}#discussion`);
  const topLevelComments = getCommentsByPost(postId);
  const [commentText, setCommentText] = useState("");
  const editorInstanceRef = useRef<Editor | null>(null);

  const handleSubmit = () => {
    setCommentText("");
    editorInstanceRef.current?.commands.clearContent();
  };

  return (
    <section
      id="discussion"
      className="space-y-[var(--space-rhythm-block)]"
      style={{ maxWidth: "var(--reading-max-width)" }}
      aria-labelledby="discussion-heading"
    >
      <h2
        id="discussion-heading"
        className="font-heading font-bold text-card-foreground"
        style={{
          fontSize: "var(--font-size-section-heading)",
          lineHeight: "var(--line-height-section-heading)",
        }}
      >
        Discussion ({topLevelComments.length})
      </h2>

      {isAuthenticated ? (
        <div className="flex gap-2 border-b pb-[var(--space-rhythm-block)]" style={{ borderColor: "hsl(var(--border-prose-divider))" }}>
          <RichTextEditor
            placeholder="Share your thoughts on this answer…"
            onUpdate={(html) => setCommentText(html)}
            editorRef={(editor) => { editorInstanceRef.current = editor; }}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!commentText.replace(/<[^>]*>/g, "").trim()}
            className="self-end p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            aria-label="Post comment"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="border-b pb-[var(--space-rhythm-block)]" style={{ borderColor: "hsl(var(--border-prose-divider))" }}>
          <Link to={`/login?next=${nextUrl}`} className="text-primary font-medium hover:underline text-sm">
            Sign in to join the discussion →
          </Link>
        </div>
      )}

      {topLevelComments.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">No comments yet. Be the first to discuss this answer.</p>
      ) : (
        <div className="space-y-[var(--space-rhythm-tight)]">
          {topLevelComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </section>
  );
};

export default CommentsSection;
