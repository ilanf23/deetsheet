import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, X } from "lucide-react";
import { motion } from "motion/react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  onRate,
  onClear,
  signedIn,
  onRequireAuth,
}: {
  rank: number;
  you: number | null;
  onRate: (value: number) => void;
  onClear: () => void;
  signedIn: boolean;
  onRequireAuth: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [previewValue, setPreviewValue] = useState<number | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const starsRef = useRef<HTMLDivElement | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => setOpen(false), 150);
  }, [cancelClose]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  const valueFromPointer = (clientX: number): number | null => {
    const el = starsRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = 1 + ratio * 9;
    return Math.max(1, Math.min(10, Math.round(raw)));
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!signedIn) {
      onRequireAuth();
      return;
    }
    setOpen((v) => !v);
  };

  const handleTriggerHover = () => {
    if (!signedIn) return;
    cancelClose();
    setOpen(true);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={handleTriggerClick}
          onMouseEnter={handleTriggerHover}
          onMouseLeave={scheduleClose}
          onFocus={handleTriggerHover}
          onBlur={scheduleClose}
          aria-label={you !== null ? `Your rating: ${you} of 10` : "Rate this image"}
          className="absolute top-2 right-2 flex items-stretch rounded-md overflow-hidden shadow-md text-[11px] font-semibold leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="flex flex-col items-center justify-center bg-background/95 px-2 py-1 min-w-[44px]">
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
              Rank
            </span>
            <span className="text-secondary text-base font-bold tabular-nums">
              {rank > 0 ? rank.toFixed(1) : "—"}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center bg-background/95 px-2 py-1 border-l border-border/40 min-w-[44px]">
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
              You
            </span>
            <span className="text-secondary text-base font-bold tabular-nums">
              {you ?? "—"}
            </span>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2"
        side="top"
        align="end"
        sideOffset={8}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-2">
          <div
            ref={starsRef}
            className="flex cursor-pointer select-none"
            onMouseMove={(e) => setPreviewValue(valueFromPointer(e.clientX))}
            onMouseLeave={() => setPreviewValue(null)}
            onClick={(e) => {
              e.stopPropagation();
              const v = valueFromPointer(e.clientX);
              if (v !== null) {
                onRate(v);
                setOpen(false);
              }
            }}
            role="slider"
            aria-label="Rate this image"
            aria-valuemin={1}
            aria-valuemax={10}
            aria-valuenow={previewValue ?? you ?? 0}
          >
            {Array.from({ length: 10 }, (_, i) => {
              const current = previewValue ?? you ?? 0;
              const fill = Math.max(0, Math.min(1, current - i));
              return (
                <motion.div
                  key={i}
                  className="relative leading-none"
                  initial={{ y: 0, scale: 1 }}
                  animate={{ y: [0, -6, 0], scale: [1, 1.18, 1] }}
                  transition={{
                    duration: 0.42,
                    delay: i * 0.055,
                    ease: "easeOut",
                    times: [0, 0.5, 1],
                  }}
                >
                  <Star className="h-6 w-6 text-muted-foreground/40" />
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ width: `${fill * 100}%` }}
                  >
                    <Star className="h-6 w-6 fill-secondary text-secondary" />
                  </div>
                </motion.div>
              );
            })}
          </div>
          <span className="text-secondary font-semibold tabular-nums text-sm w-8 text-right">
            {(previewValue ?? you) !== null ? (previewValue ?? you!) : "—"}
          </span>
          {you !== null && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
                setOpen(false);
              }}
              className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
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

  const { data: images = [], isLoading, rate, clearRate } = useTopicImages({
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

  const handleRequireAuth = () => {
    onOpenChange(false);
    navigate("/login");
  };

  const handleRate = (imageId: string, value: number) => {
    if (!user) {
      handleRequireAuth();
      return;
    }
    rate.mutate(
      { imageId, value },
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

  const handleClear = (imageId: string) => {
    if (!user) {
      handleRequireAuth();
      return;
    }
    clearRate.mutate(
      { imageId },
      {
        onError: (err) => {
          toast({
            title: "Couldn't clear rating",
            description: err instanceof Error ? err.message : "Please try again",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl w-[95vw] p-0 bg-[#1f1f1f] border-0 text-white overflow-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
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
                    <RatingChip
                      rank={featured.averageRating}
                      you={featured.yourRating}
                      onRate={(v) => handleRate(featured.id, v)}
                      onClear={() => handleClear(featured.id)}
                      signedIn={!!user}
                      onRequireAuth={handleRequireAuth}
                    />
                  </div>
                )}

                {/* Tiles */}
                {images.slice(0, 12).map((img) => (
                  <div
                    key={img.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(img.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedId(img.id);
                      }
                    }}
                    className={cn(
                      "relative rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary aspect-[2/3] bg-background/5 cursor-pointer",
                      selectedId === img.id && "ring-2 ring-primary"
                    )}
                  >
                    <ImageTile
                      src={img.url}
                      alt={`${topicName} option`}
                      className="group-hover:scale-[1.03]"
                    />
                    <RatingChip
                      rank={img.averageRating}
                      you={img.yourRating}
                      onRate={(v) => handleRate(img.id, v)}
                      onClear={() => handleClear(img.id)}
                      signedIn={!!user}
                      onRequireAuth={handleRequireAuth}
                    />
                  </div>
                ))}
              </div>

              <p className="mt-6 text-center text-[11px] text-white/40">
                Hover an image's rank to rate it. Highest-rated image (3+ votes)
                becomes the topic header.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RankImagesDialog;
