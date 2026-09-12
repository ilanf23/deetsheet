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
import { forwardRef, useMemo, useState } from "react";
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
  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
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
        className={cn("w-[--radix-popover-trigger-width] min-w-[200px] p-0", contentClassName)}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  // cmdk filters on this string, so include the description
                  // (e.g. category name) to make it searchable too.
                  value={o.description ? `${o.label} ${o.description}` : o.label}
                  onSelect={() => {
                    onValueChange(o.value);
                    setOpen(false);
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
