import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Send } from "lucide-react";
import type { Editor } from "@tiptap/react";
import RichTextEditor from "@/components/RichTextEditor";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InlineCommentComposerProps {
  postId: string;
  parentCommentId?: string;
  parentUsername?: string;
  onSubmitted?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

const InlineCommentComposer = ({
  postId,
  parentCommentId,
  parentUsername,
  onSubmitted,
  onCancel,
  autoFocus = false,
}: InlineCommentComposerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const editorRef = useRef<Editor | null>(null);

  const isAuthenticated = !!user;
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "you";
  const nextUrl = encodeURIComponent(`${location.pathname}${location.search}#discussion`);

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.commands.focus("end");
    }
  }, [autoFocus]);

  if (!isAuthenticated) {
    return (
      <div className="rounded-[var(--radius)] border p-4">
        <Link to={`/login?next=${nextUrl}`} className="text-primary font-medium hover:underline text-sm">
          Sign in to share a comment →
        </Link>
      </div>
    );
  }

  const trimmed = text.replace(/<[^>]*>/g, "").trim();
  const isReply = !!parentCommentId;
  const placeholder = isReply
    ? `Replying to @${parentUsername ?? "user"} —`
    : "Share a comment.";

  const handleSend = async () => {
    if (!trimmed || submitting || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      author_id: user.id,
      content: text,
      parent_comment_id: parentCommentId ?? null,
    });
    setSubmitting(false);

    if (error) {
      toast({
        title: "Couldn't post comment",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setText("");
    editorRef.current?.commands.clearContent();
    onSubmitted?.();
    if (isReply) onCancel?.();
  };

  return (
    <div className="rounded-[var(--radius)] border p-3 sm:p-4 flex gap-3">
      <div className="flex flex-col items-center w-12 shrink-0">
        <UserAvatar username={username} size="md" showName={false} />
        <span className="text-xs text-muted-foreground mt-1">You</span>
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <RichTextEditor
          placeholder={placeholder}
          onUpdate={(html) => setText(html)}
          editorRef={(editor) => { editorRef.current = editor; }}
        />
        <div className="flex justify-end gap-2">
          {isReply && onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              size="sm"
              variant="ghost"
              disabled={submitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSend}
            disabled={!trimmed || submitting}
            size="sm"
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            {submitting ? "Sending…" : isReply ? "Reply" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InlineCommentComposer;
