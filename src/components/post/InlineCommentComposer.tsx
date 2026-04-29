import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { Editor } from "@tiptap/react";
import RichTextEditor from "@/components/RichTextEditor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [focused, setFocused] = useState(false);
  const editorRef = useRef<Editor | null>(null);

  const isAuthenticated = !!user;
  const isReply = !!parentCommentId;
  const trimmed = text.replace(/<[^>]*>/g, "").trim();
  // Active = there is content OR the editor is focused OR this is a reply (always shows actions).
  const active = focused || trimmed.length > 0 || isReply;
  const nextUrl = encodeURIComponent(`${location.pathname}${location.search}#discussion`);
  const placeholder = isReply
    ? `Replying to @${parentUsername ?? "user"} —`
    : "Share a comment.";

  const userMeta = (user?.user_metadata ?? {}) as {
    avatar_url?: string;
    username?: string;
  };
  const avatarUrl = userMeta.avatar_url;
  const identityForInitial = userMeta.username || user?.email || "Y";
  const initial = identityForInitial[0]?.toUpperCase() ?? "Y";

  // Wire focus listeners onto the TipTap editor instance once it's available.
  const attachFocusListeners = (editor: Editor | null) => {
    editorRef.current = editor;
    if (!editor) return;
    editor.on("focus", () => setFocused(true));
    editor.on("blur", () => setFocused(false));
  };

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.commands.focus("end");
    }
  }, [autoFocus]);

  if (!isAuthenticated) {
    return (
      <div className="flex gap-3 items-start">
        <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
              ?
            </AvatarFallback>
          </Avatar>
          <span className="text-[0.7rem] text-muted-foreground leading-none">You</span>
        </div>
        <div className="flex-1 rounded-[var(--radius)] border bg-background px-4 py-3">
          <Link
            to={`/login?next=${nextUrl}`}
            className="text-primary font-medium hover:underline text-sm"
          >
            Sign in to share a comment →
          </Link>
        </div>
      </div>
    );
  }

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
    editorRef.current?.commands.blur();
    setFocused(false);
    onSubmitted?.();
    if (isReply) onCancel?.();
  };

  const handleCancel = () => {
    setText("");
    editorRef.current?.commands.clearContent();
    editorRef.current?.commands.blur();
    setFocused(false);
    onCancel?.();
  };

  return (
    <div className="flex gap-3 items-start">
      <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
        <Avatar className="h-8 w-8">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="Your avatar" />}
          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
            {initial}
          </AvatarFallback>
        </Avatar>
        <span className="text-[0.7rem] text-muted-foreground leading-none">You</span>
      </div>
      <div
        className={`flex-1 rounded-[var(--radius)] border bg-background transition-colors ${
          active ? "ring-1 ring-border" : ""
        }`}
      >
        <RichTextEditor
          placeholder={placeholder}
          bordered={false}
          showToolbar={focused || trimmed.length > 0}
          minHeight="120px"
          onUpdate={(html) => setText(html)}
          editorRef={attachFocusListeners}
        />
        {active && (
          <div className="flex justify-end items-center gap-2 px-2 pb-2">
            {isReply && (
              <Button
                type="button"
                onClick={handleCancel}
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
            >
              {submitting ? "Sending…" : isReply ? "Reply" : "Send"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineCommentComposer;
