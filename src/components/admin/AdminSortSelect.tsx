import { ChevronDown, ArrowUpDown } from "lucide-react";

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

export default function AdminSortSelect<V extends string>({
  value,
  onChange,
  options,
  label = "Sort",
  variant = "admin",
}: Props<V>) {
  if (variant === "plain") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{label}:</span>
        <span className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value as V)}
            className="appearance-none rounded-md border border-input bg-background pl-2.5 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-muted-foreground" />
        </span>
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-1.5 min-w-[200px]">
      <span className="text-[13px]" style={{ color: "hsl(var(--admin-fg))" }}>
        {label}
      </span>
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as V)}
          className="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-lg text-[14px] focus:outline-none"
          style={{
            backgroundColor: "hsl(var(--admin-surface))",
            border: "1px solid hsl(var(--admin-border))",
            color: "hsl(var(--admin-fg))",
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
          style={{ color: "hsl(var(--admin-fg-muted))" }}
        />
      </span>
    </label>
  );
}
