import { useState, useCallback, useEffect } from "react";
import { Star, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserRatingIndicatorProps {
  postId: string;
  /** Called after a rating is saved/cleared so the parent can refresh averages */
  onRatingChanged?: () => void;
}

const UserRatingIndicator = ({ postId, onRatingChanged }: UserRatingIndicatorProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRating, setUserRating] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDbPost = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId);

  // Fetch user's existing rating
  useEffect(() => {
    if (!user || !isDbPost) return;
    supabase
      .from("ratings")
      .select("value")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setUserRating(Number(data.value));
      });
  }, [postId, user, isDbPost]);

  const saveRating = useCallback(
    async (value: number) => {
      if (!user || !isDbPost) return;
      setLoading(true);
      setUserRating(value);
      const { error } = await supabase
        .from("ratings")
        .upsert({ user_id: user.id, post_id: postId, value }, { onConflict: "user_id,post_id" });
      if (error) {
        toast({ title: "Rating failed", description: error.message, variant: "destructive" });
      }
      setLoading(false);
      setOpen(false);
      onRatingChanged?.();
    },
    [user, postId, isDbPost, toast, onRatingChanged],
  );

  const clearRating = useCallback(async () => {
    if (!user || !isDbPost) return;
    setLoading(true);
    setUserRating(null);
    const { error } = await supabase
      .from("ratings")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
    if (error) {
      toast({ title: "Could not clear rating", description: error.message, variant: "destructive" });
    }
    setLoading(false);
    setOpen(false);
    onRatingChanged?.();
  }, [user, postId, isDbPost, toast, onRatingChanged]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      toast({ title: "Sign in to rate", description: "You need an account to rate posts." });
      navigate("/login");
      return;
    }
    setOpen((v) => !v);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={handleTriggerClick}
          className="flex items-center gap-0.5 shrink-0 cursor-pointer"
          aria-label={userRating ? `Your rating: ${userRating}` : "Rate this post"}
        >
          {userRating !== null ? (
            <span className="text-secondary font-medium tabular-nums text-sm">{userRating}</span>
          ) : (
            <Star className="h-4 w-4 fill-secondary text-secondary" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2"
        align="end"
        sideOffset={4}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1">
          {Array.from({ length: 10 }, (_, i) => {
            const val = i + 1;
            const isSelected = userRating === val;
            return (
              <button
                key={val}
                type="button"
                disabled={loading}
                onClick={() => saveRating(val)}
                className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                  isSelected
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                {val}
              </button>
            );
          })}
          {userRating !== null && (
            <button
              type="button"
              disabled={loading}
              onClick={clearRating}
              className="ml-1 w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              aria-label="Clear rating"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserRatingIndicator;
