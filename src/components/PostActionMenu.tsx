import { useState } from "react";
import { MoreHorizontal, Share2, Facebook, Twitter, Instagram, Mail, Heart } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

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

const PostActionMenu = () => {
  const [open, setOpen] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [reportChecks, setReportChecks] = useState<Record<string, boolean>>({});

  const toggleReport = (option: string) => {
    setReportChecks((prev) => ({ ...prev, [option]: !prev[option] }));
  };

  const handleSend = () => {
    const selected = Object.entries(reportChecks)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (selected.length > 0) {
      toast.success("Report submitted");
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
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Facebook className="h-4 w-4" />
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter className="h-4 w-4" />
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Instagram className="h-4 w-4" />
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Separator />

        {/* Add to Favorites */}
        <button
          onClick={() => {
            setFavorited(!favorited);
            toast.success(favorited ? "Removed from favorites" : "Added to favorites");
          }}
          className="flex items-center gap-2 w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
