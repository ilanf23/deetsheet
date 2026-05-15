import { useState } from "react";
import { MessageSquare, Share2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import PostActionMenu from "@/components/PostActionMenu";
import EditPostDialog from "@/components/EditPostDialog";

interface PostMetaBarProps {
  commentCount: number;
  postTitle: string;
  postId?: string;
  topicName?: string;
  authorId?: string | null;
  onPostUpdated?: () => void;
}

const PostMetaBar = ({
  commentCount,
  postTitle,
  postId,
  topicName,
  authorId,
  onPostUpdated,
}: PostMetaBarProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const isAuthor = !!user && !!authorId && user.id === authorId;

  const scrollToDiscussion = () => {
    const el = document.getElementById("discussion");
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: postTitle, url });
        return;
      } catch {
        // user dismissed share sheet — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  return (
    <div className="flex items-center gap-5 text-sm text-muted-foreground">
      <button
        type="button"
        onClick={scrollToDiscussion}
        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
        aria-label={`Jump to discussion (${commentCount} comments)`}
      >
        <MessageSquare className="h-4 w-4" />
        <span>{commentCount} comments</span>
      </button>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
        aria-label="Share this answer"
      >
        <Share2 className="h-4 w-4" />
        <span>Share</span>
      </button>
      {isAuthor && postId && (
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-1.5 text-primary hover:underline transition-colors"
          aria-label="Edit this post"
        >
          <Pencil className="h-4 w-4" />
          <span>Edit</span>
        </button>
      )}
      <PostActionMenu
        postId={postId}
        topicName={topicName}
        onPostUpdated={onPostUpdated}
      />
      <EditPostDialog
        postId={postId ?? null}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={onPostUpdated}
      />
    </div>
  );
};

export default PostMetaBar;
