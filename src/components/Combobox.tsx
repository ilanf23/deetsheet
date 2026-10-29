import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { forwardRef, useMemo, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface ComboboxOption<V extends string = string> {
  value: V;
  label: string;
  /** Secondary text shown muted after the label (e.g. a topic's category). */
  description?: string;
}

interface ComboboxProps<V extends string> {
  value: V | "" | null | undefined;
  onValueChange: (value: V) => void;
  options: ComboboxOption<V>[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  /** Width of the popover; defaults to the trigger's width. */
  contentClassName?: string;
}

/** Rank label prefixes before word prefixes and option codes. */
export function comboboxFilter(value: string, search: string, keywords?: string[]): number {
  const query = search.trim().toLowerCase();
  if (!query) return 1;
  const label = (keywords?.[0] ?? value).trim().toLowerCase();
  if (label.startsWith(query)) return 1;
  if (label.split(/\s+/).some((word) => word.startsWith(query))) return 0.8;
  if (value.toLowerCase().startsWith(query)) return 0.6;
  // Preserve searchable secondary descriptions for existing callers.
  if (keywords?.slice(1).some((text) => text.toLowerCase().includes(query))) return 0.4;
  return 0;
}

/**
 * Searchable single-select built from the shadcn Popover + Command
 * primitives. Use it instead of `Select` whenever the option list is long
 * enough that typing to filter beats scrolling (topics, states, years…).
 * The trigger is a plain `Button`, so it slots into a react-hook-form
 * `FormControl` the same way `SelectTrigger` does.
 */
function ComboboxInner<V extends string>(
  {
    value,
    onValueChange,
    options,
    placeholder = "Select…",
    searchPlaceholder = "Search…",
    emptyText = "No results.",
    disabled,
    className,
    contentClassName,
  }: ComboboxProps<V>,
  ref: React.Ref<HTMLButtonElement>,
) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const changeOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setSearch("");
  };
  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          onKeyDown={(event) => {
            if (disabled || event.ctrlKey || event.metaKey || event.altKey || event.nativeEvent.isComposing) return;
            if (event.key.length === 1 && event.key !== " ") {
              event.preventDefault();
              setSearch((current) => open ? current + event.key : event.key);
              setOpen(true);
              if (open) inputRef.current?.focus();
            }
          }}
          className={cn(
            "w-full justify-between font-normal px-3",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
        className={cn("w-[--radix-popover-trigger-width] min-w-[200px] p-0", contentClassName)}
      >
        <Command filter={comboboxFilter}>
          <CommandInput ref={inputRef} placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.value}
                  keywords={o.description ? [o.label, o.description] : [o.label]}
                  onSelect={() => {
                    onValueChange(o.value);
                    changeOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      o.value === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{o.label}</span>
                  {o.description && (
                    <span className="ml-2 truncate text-xs text-muted-foreground">
                      {o.description}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const Combobox = forwardRef(ComboboxInner) as <V extends string>(
  props: ComboboxProps<V> & { ref?: React.Ref<HTMLButtonElement> },
) => ReturnType<typeof ComboboxInner>;

export default Combobox;
