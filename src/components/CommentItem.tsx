import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { Comment, comments, getReplies, getTimeAgo } from "@/data/seedData";
import UserAvatar from "@/components/UserAvatar";
import RichTextEditor from "@/components/RichTextEditor";
import type { Editor } from "@tiptap/react";

interface CommentItemProps {
  comment: Comment;
  depth?: number;
}

const CommentItem = ({ comment, depth = 0 }: CommentItemProps) => {
  const [agreed, setAgreed] = useState(false);
  const [disagreed, setDisagreed] = useState(false);
  const [showReplyEditor, setShowReplyEditor] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [localReplies, setLocalReplies] = useState<Comment[]>([]);
  const replyEditorRef = useRef<Editor | null>(null);
  const existingReplies = getReplies(comment.id);
  const allReplies = [...existingReplies, ...localReplies];
  const maxDepth = 3;

  const handleSubmitReply = () => {
    const trimmed = replyText.replace(/<[^>]*>/g, "").trim();
    if (!trimmed) return;

    const newReply: Comment = {
      id: `c-reply-${Date.now()}`,
      postId: comment.postId,
      parentCommentId: comment.id,
      username: "you",
      content: replyText,
      createdAt: new Date(),
      agreeCount: 0,
      disagreeCount: 0,
      heartCount: 0,
    };

    comments.push(newReply);
    setLocalReplies((prev) => [...prev, newReply]);
    setReplyText("");
    replyEditorRef.current?.commands.clearContent();
    setShowReplyEditor(false);
  };

  return (
    <div className={depth > 0 ? "ml-8" : ""}>
      <div className="flex gap-3 p-3 mb-3 border rounded-xl bg-background">
        <UserAvatar username={comment.username} size="md" showName={false} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <Link to={`/profile/${comment.username}`} className="font-semibold text-card-foreground hover:underline">
              @{comment.username}
            </Link>
            <span className="text-xs text-muted-foreground">{getTimeAgo(comment.createdAt)}</span>
          </div>
          <div
            className="prose prose-sm max-w-none text-card-foreground mt-1"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => setAgreed(!agreed)}
              className={`flex items-center gap-1 text-xs transition-colors ${agreed ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {comment.agreeCount + (agreed ? 1 : 0)}
            </button>
            <button
              onClick={() => setDisagreed(!disagreed)}
              className={`flex items-center gap-1 text-xs transition-colors ${disagreed ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              {comment.disagreeCount + (disagreed ? 1 : 0)}
            </button>
            {depth < maxDepth && (
              <button
                onClick={() => setShowReplyEditor(!showReplyEditor)}
                className={`text-xs transition-colors ${showReplyEditor ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                reply
              </button>
            )}
          </div>

          {/* Inline reply editor */}
          {showReplyEditor && (
            <div className="mt-2 flex gap-2">
              <RichTextEditor
                placeholder={`Reply to @${comment.username}...`}
                onUpdate={(html) => setReplyText(html)}
                editorRef={(editor) => { replyEditorRef.current = editor; }}
              />
              <button
                className="self-end p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                onClick={handleSubmitReply}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      {depth < maxDepth && allReplies.map((reply) => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </div>
  );
};

export default CommentItem;
