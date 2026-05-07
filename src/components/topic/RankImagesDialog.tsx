import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTopicImages, type TopicImageRow } from "@/hooks/useTopicImages";
import { useToast } from "@/hooks/use-toast";

const ImageTile = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (failed) {
    return (
      <div className={cn("absolute inset-0 flex items-center justify-center text-[11px] text-white/60 px-2 text-center", className)}>
        Image unavailable
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn("w-full h-full object-cover transition-transform", className)}
      onError={() => setFailed(true)}
    />
  );
};

interface RankImagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string;
  topicName: string;
  categoryName: string;
  primaryImage?: string | null;
}

const RatingChip = ({
  rank,
  you,
}: {
  rank: number;
  you: number | null;
}) => (
  <div className="absolute top-2 right-2 flex items-stretch rounded-md overflow-hidden shadow-md text-[11px] font-semibold leading-none">
    <div className="flex flex-col items-center bg-background/95 px-2 py-1">
      <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
        Rank
      </span>
      <span className="text-secondary text-base font-bold tabular-nums">
        {rank > 0 ? rank.toFixed(1) : "—"}
      </span>
    </div>
    <div className="flex flex-col items-center bg-background/95 px-2 py-1 border-l border-border/40">
      <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
        You
      </span>
      <span className="text-secondary text-base font-bold tabular-nums">
        {you ?? "—"}
      </span>
    </div>
  </div>
);

const RatingPicker = ({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) => (
  <div className="flex flex-wrap gap-1 justify-center">
    {Array.from({ length: 10 }).map((_, i) => {
      const v = i + 1;
      const active = value === v;
      return (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "w-8 h-8 rounded-md text-sm font-semibold transition-colors",
            active
              ? "bg-secondary text-secondary-foreground"
              : "bg-background/10 text-white/80 hover:bg-background/20"
          )}
        >
          {v}
        </button>
      );
    })}
  </div>
);

const RankImagesDialog = ({
  open,
  onOpenChange,
  topicId,
  topicName,
  categoryName,
  primaryImage,
}: RankImagesDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: images = [], isLoading, rate } = useTopicImages({
    topicId,
    topicName,
    categoryName,
  });

  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    if (!selectedId && images.length > 0) {
      setSelectedId(images[0].id);
    }
  }, [images, selectedId]);

  const featured: TopicImageRow | undefined =
    images.find((img) => img.id === selectedId) ?? images[0];

  const heroSrc = featured?.url || primaryImage || undefined;

  const handleRate = (value: number) => {
    if (!user) {
      onOpenChange(false);
      navigate("/login");
      return;
    }
    if (!featured) return;
    rate.mutate(
      { imageId: featured.id, value },
      {
        onError: (err) => {
          toast({
            title: "Couldn't save rating",
            description: err instanceof Error ? err.message : "Please try again",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] p-0 bg-[#1f1f1f] border-0 text-white overflow-hidden">
        <DialogTitle className="sr-only">Rank images for {topicName}</DialogTitle>

        <div className="px-8 pt-8 pb-4">
          <p className="text-sm text-white/70 font-body">
            Rank to decide which photo best represents
          </p>
          <h2 className="font-heading text-5xl font-bold mt-1">{topicName}</h2>
        </div>

        <div className="px-8 pb-8 max-h-[75vh] overflow-y-auto">
          {isLoading && (
            <p className="text-white/60 text-sm">Loading images…</p>
          )}

          {!isLoading && images.length === 0 && (
            <div className="text-white/70 text-sm py-8 text-center">
              {user
                ? "No images yet — they'll appear shortly."
                : "Sign in to load and rank candidate images for this topic."}
            </div>
          )}

          {images.length > 0 && (
            <>
              <div className="grid grid-cols-6 gap-3 auto-rows-fr">
                {/* Hero */}
                {featured && heroSrc && (
                  <div className="col-span-3 row-span-2 relative rounded-lg overflow-hidden aspect-square bg-background/5">
                    <ImageTile src={heroSrc} alt={topicName} />
                    <RatingChip rank={featured.averageRating} you={featured.yourRating} />
                  </div>
                )}

                {/* Tiles */}
                {images.slice(0, 12).map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedId(img.id)}
                    className={cn(
                      "relative rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary aspect-[2/3] bg-background/5",
                      selectedId === img.id && "ring-2 ring-primary"
                    )}
                  >
                    <ImageTile
                      src={img.url}
                      alt={`${topicName} option`}
                      className="group-hover:scale-[1.03]"
                    />
                    <RatingChip rank={img.averageRating} you={img.yourRating} />
                  </button>
                ))}
              </div>

              {featured && (
                <div className="mt-6 flex flex-col items-center gap-2">
                  <p className="text-xs uppercase tracking-wide text-white/60">
                    Rate this image (1–10)
                  </p>
                  <RatingPicker value={featured.yourRating} onChange={handleRate} />
                  <p className="text-[11px] text-white/40">
                    Highest-rated image (3+ votes) becomes the topic header.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RankImagesDialog;
