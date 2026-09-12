import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

export interface SortOption<V extends string = string> {
  value: V;
  label: string;
}

interface Props<V extends string> {
  value: V;
  onChange: (v: V) => void;
  options: SortOption<V>[];
  label?: string;
  variant?: "admin" | "plain";
}

/**
 * Labeled single-value picker used across the admin surface for sort and
 * filter controls. Both variants render the shadcn `Select` so the popover,
 * keyboard navigation and focus ring match the rest of the app; the "admin"
 * variant picks up the admin theme tokens on the trigger.
 */
export default function AdminSortSelect<V extends string>({
  value,
  onChange,
  options,
  label = "Sort",
  variant = "admin",
}: Props<V>) {
  const items = options.map((o) => (
    <SelectItem key={o.value} value={o.value}>
      {o.label}
    </SelectItem>
  ));

  if (variant === "plain") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{label}:</span>
        <Select value={value} onValueChange={(v) => onChange(v as V)}>
          <SelectTrigger className="h-9 w-auto min-w-[140px] gap-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{items}</SelectContent>
        </Select>
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-1.5 min-w-[200px]">
      <span className="text-[13px]" style={{ color: "hsl(var(--admin-fg))" }}>
        {label}
      </span>
      <Select value={value} onValueChange={(v) => onChange(v as V)}>
        <SelectTrigger
          className="h-auto w-full rounded-lg pl-3.5 pr-3.5 py-2.5 text-[14px] focus:ring-0 focus:ring-offset-0"
          style={{
            backgroundColor: "hsl(var(--admin-surface))",
            borderColor: "hsl(var(--admin-border))",
            color: "hsl(var(--admin-fg))",
          }}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{items}</SelectContent>
      </Select>
    </label>
  );
}
