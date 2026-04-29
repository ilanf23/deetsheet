import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface RankImagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicName: string;
  topicSlug: string;
  primaryImage?: string | null;
}

interface MockImage {
  id: string;
  url: string;
  rank: number; // average 1-10
  you: number | null; // user rating
}

// Build a deterministic-ish set of stock candidate images per topic.
// Picsum is a reliable, no-key image CDN. We seed each slot with a hash of
// the topic slug + index so every topic has a stable but unique gallery.
const hashString = (str: string): number => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

const buildMockImages = (slug: string): MockImage[] => {
  const base = hashString(slug);
  return Array.from({ length: 13 }).map((_, i) => {
    const seed = (base + i * 97) % 1000; // 0-999, stable per topic+slot
    return {
      id: `${slug}-${i}`,
      url: `https://picsum.photos/seed/${slug}-${seed}/600/600`,
      rank: 9.3,
      you: 9,
    };
  });
};


const RatingChip = ({ rank, you }: { rank: number; you: number | null }) => (
  <div className="absolute top-2 right-2 flex items-stretch rounded-md overflow-hidden shadow-md text-[11px] font-semibold leading-none">
    <div className="flex flex-col items-center bg-white/95 px-2 py-1">
      <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
        Rank
      </span>
      <span className="text-secondary text-base font-bold tabular-nums">
        {rank.toFixed(1)}
      </span>
    </div>
    <div className="flex flex-col items-center bg-white/95 px-2 py-1 border-l border-border/40">
      <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
        You
      </span>
      <span className="text-secondary text-base font-bold tabular-nums">
        {you ?? "—"}
      </span>
    </div>
  </div>
);

const RankImagesDialog = ({
  open,
  onOpenChange,
  topicName,
  topicSlug,
  primaryImage,
}: RankImagesDialogProps) => {
  const images = useMemo(() => buildMockImages(topicSlug), [topicSlug]);
  const [selectedId, setSelectedId] = useState<string>(images[0]?.id ?? "");

  const featured =
    images.find((img) => img.id === selectedId) ?? images[0];

  // Use the topic's current main image as the hero if available, otherwise
  // fall back to the first stock image.
  const heroSrc = primaryImage || featured?.url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl w-[95vw] p-0 bg-[#1f1f1f] border-0 text-white overflow-hidden"
      >
        <DialogTitle className="sr-only">
          Rank images for {topicName}
        </DialogTitle>

        <div className="px-8 pt-8 pb-4">
          <p className="text-sm text-white/70 font-body">
            Rank to decide which photo best represents
          </p>
          <h2 className="font-heading text-5xl font-bold mt-1">
            {topicName}
          </h2>
        </div>

        <div className="px-8 pb-8 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-6 grid-flow-row-dense gap-3">
            {/* Hero / featured image — spans 3 cols x 2 rows */}
            {heroSrc && (
              <button
                type="button"
                className="relative col-span-3 row-span-2 rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => featured && setSelectedId(featured.id)}
              >
                <img
                  src={heroSrc}
                  alt={topicName}
                  className="w-full h-full object-cover aspect-square"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.visibility =
                      "hidden";
                  }}
                />
                {featured && <RatingChip rank={featured.rank} you={featured.you} />}
              </button>
            )}

            {/* Smaller candidate tiles */}
            {images.slice(0, 12).map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelectedId(img.id)}
                className={cn(
                  "relative col-span-1 rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary aspect-square",
                  selectedId === img.id && "ring-2 ring-primary"
                )}
              >
                <img
                  src={img.url}
                  alt={`${topicName} option`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.visibility =
                      "hidden";
                  }}
                />
                <RatingChip rank={img.rank} you={img.you} />
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RankImagesDialog;
