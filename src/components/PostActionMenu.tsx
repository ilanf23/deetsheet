import { useState, useEffect } from "react";
import { MoreHorizontal, Share2, Facebook, Twitter, Instagram, Mail, Heart, Link2 } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const REPORT_OPTIONS = [
  "Junk",
  "Spelling",
  "Grammar",
  "Request Edit",
  "Vulgar",
  "Wrong Section",
  "Similar Post",
  "False Info",
] as const;

interface PostActionMenuProps {
  postId?: string;
  topicName?: string;
}

const PostActionMenu = ({ postId, topicName }: PostActionMenuProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);
  const [reportChecks, setReportChecks] = useState<Record<string, boolean>>({});

  // Check if already favorited when menu opens
  useEffect(() => {
    if (!open || !user || !postId) return;
    supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .maybeSingle()
      .then(({ data }) => setFavorited(!!data));
  }, [open, user, postId]);

  const toggleReport = (option: string) => {
    setReportChecks((prev) => ({ ...prev, [option]: !prev[option] }));
  };

  const handleCopyLink = () => {
    const url = topicName
      ? `${window.location.origin}/topic/${encodeURIComponent(topicName)}`
      : window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const getShareUrl = () => {
    return topicName
      ? `${window.location.origin}/topic/${encodeURIComponent(topicName)}`
      : window.location.href;
  };

  const handleShareSocial = (platform: string) => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(topicName ? `Check out "${topicName}" on DeetSheet` : "Check this out on DeetSheet");
    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case "instagram":
        navigator.clipboard.writeText(getShareUrl());
        toast.success("Link copied! Paste it in your Instagram story or post.");
        return;
      case "email":
        shareUrl = `mailto:?subject=${text}&body=${url}`;
        break;
    }
    if (shareUrl) window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Please sign in to save favorites");
      return;
    }
    if (!postId) return;

    setLoadingFav(true);
    if (favorited) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);
      setFavorited(false);
      toast.success("Removed from favorites");
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, post_id: postId });
      if (error?.code === "23505") {
        setFavorited(true);
      } else if (error) {
        toast.error("Could not save favorite");
      } else {
        setFavorited(true);
        toast.success("Added to favorites");
      }
    }
    setLoadingFav(false);
  };

  const handleSend = async () => {
    const selected = Object.entries(reportChecks)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (selected.length === 0) {
      toast.error("Please select at least one reason");
      return;
    }
    if (!user) {
      toast.error("Please sign in to submit reports");
      return;
    }
    if (!postId) {
      toast.success("Report submitted");
      setReportChecks({});
      setOpen(false);
      return;
    }

    const { error } = await supabase
      .from("reports")
      .upsert(
        { user_id: user.id, post_id: postId, reasons: selected },
        { onConflict: "user_id,post_id" }
      );
    if (error) {
      toast.error("Could not submit report");
    } else {
      toast.success("Report submitted — thank you");
    }
    setReportChecks({});
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-56 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Share row */}
        <div className="flex items-center gap-3 pb-2">
          <span className="text-xs font-medium text-muted-foreground">Share</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleCopyLink}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Copy link"
            >
              <Link2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleShareSocial("facebook")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Facebook className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleShareSocial("twitter")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Twitter className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleShareSocial("instagram")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Instagram className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleShareSocial("email")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Separator />

        {/* Add to Favorites */}
        <button
          onClick={handleToggleFavorite}
          disabled={loadingFav}
          className="flex items-center gap-2 w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <Heart className={`h-4 w-4 ${favorited ? "fill-red-500 text-red-500" : ""}`} />
          {favorited ? "Remove from Favorites" : "Add to Favorites"}
        </button>

        <Separator />

        {/* Report it */}
        <div className="pt-2 space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Report it</span>
          <div className="space-y-1.5">
            {REPORT_OPTIONS.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
              >
                <Checkbox
                  checked={!!reportChecks[option]}
                  onCheckedChange={() => toggleReport(option)}
                />
                {option}
              </label>
            ))}
          </div>
          <button
            onClick={handleSend}
            className="w-full mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Send
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PostActionMenu;
