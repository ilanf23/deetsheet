import { useState } from "react";
import { Facebook, Link, MessageSquare, Share2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const XLogo = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className="h-4 w-4 shrink-0"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

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
  const isMobile = useIsMobile();
  const [editOpen, setEditOpen] = useState(false);
  const isAuthor = !!user && !!authorId && user.id === authorId;

  const scrollToDiscussion = () => {
    const el = document.getElementById("discussion");
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  const copyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
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
    await copyLink();
  };

  const openExternal = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareToFacebook = () => {
    openExternal(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
    );
  };

  const shareToX = () => {
    openExternal(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(postTitle)}`,
    );
  };

  const shareTrigger = (onClick?: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
      aria-label="Share this answer"
    >
      <Share2 className="h-4 w-4" />
      <span>Share</span>
    </button>
  );

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
      {isMobile ? (
        shareTrigger(handleShare)
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{shareTrigger()}</DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem onClick={shareToFacebook}>
              <Facebook className="mr-2 h-4 w-4" />
              <span>Facebook</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareToX}>
              <span className="mr-2 flex h-4 w-4 items-center justify-center">
                <XLogo />
              </span>
              <span>X</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyLink}>
              <Link className="mr-2 h-4 w-4" />
              <span>Copy link</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
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
