import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 25;

export const isValidPageSize = (value: number): value is PageSize =>
  (PAGE_SIZE_OPTIONS as readonly number[]).includes(value);

interface TopicPaginationFooterProps {
  size: PageSize;
  total: number;
  rendered: number;
  onSizeChange: (size: PageSize) => void;
  onShowMore: () => void;
}

const TopicPaginationFooter = ({
  size,
  total,
  rendered,
  onSizeChange,
  onShowMore,
}: TopicPaginationFooterProps) => {
  const remaining = Math.max(0, total - rendered);

  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Posts View</span>
        <Select
          value={String(size)}
          onValueChange={(value) => {
            const next = Number(value);
            if (isValidPageSize(next)) onSizeChange(next);
          }}
        >
          <SelectTrigger className="h-8 w-[72px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {remaining > 0 && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{remaining} more</span>
          <button
            type="button"
            onClick={onShowMore}
            className="text-primary hover:underline font-semibold"
          >
            Show more
          </button>
        </div>
      )}
    </div>
  );
};

export default TopicPaginationFooter;
