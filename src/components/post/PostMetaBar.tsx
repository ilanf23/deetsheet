import { MessageSquare, Share2 } from "lucide-react";
import PostActionMenu from "@/components/PostActionMenu";
import { useToast } from "@/hooks/use-toast";

interface PostMetaBarProps {
  postId: string;
  topicName: string;
  commentCount: number;
  postTitle: string;
}

const PostMetaBar = ({ postId, topicName, commentCount, postTitle }: PostMetaBarProps) => {
  const { toast } = useToast();

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
      <PostActionMenu postId={postId} topicName={topicName} />
    </div>
  );
};

export default PostMetaBar;
