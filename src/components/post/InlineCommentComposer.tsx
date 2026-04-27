import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Send } from "lucide-react";
import type { Editor } from "@tiptap/react";
import RichTextEditor from "@/components/RichTextEditor";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const InlineCommentComposer = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [text, setText] = useState("");
  const editorRef = useRef<Editor | null>(null);

  const isAuthenticated = !!user;
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "you";
  const nextUrl = encodeURIComponent(`${location.pathname}${location.search}#discussion`);

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

  const handleSend = () => {
    if (!trimmed) return;
    setText("");
    editorRef.current?.commands.clearContent();
  };

  return (
    <div className="rounded-[var(--radius)] border p-3 sm:p-4 flex gap-3">
      <div className="flex flex-col items-center w-12 shrink-0">
        <UserAvatar username={username} size="md" showName={false} />
        <span className="text-xs text-muted-foreground mt-1">You</span>
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <RichTextEditor
          placeholder="Share a comment."
          onUpdate={(html) => setText(html)}
          editorRef={(editor) => { editorRef.current = editor; }}
        />
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSend}
            disabled={!trimmed}
            size="sm"
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InlineCommentComposer;
