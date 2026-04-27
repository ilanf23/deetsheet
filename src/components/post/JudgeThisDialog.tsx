import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  JUDGEMENT_ICONS,
  JUDGEMENT_ORDER,
  MAX_JUDGEMENT_SELECTIONS,
  type Judgement,
} from "@/components/post/judgements";

interface JudgeThisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: Set<Judgement>;
  onChange: (next: Set<Judgement>) => void;
}

const JudgeThisDialog = ({ open, onOpenChange, value, onChange }: JudgeThisDialogProps) => {
  const toggle = (j: Judgement) => {
    const next = new Set(value);
    if (next.has(j)) {
      next.delete(j);
    } else {
      if (next.size >= MAX_JUDGEMENT_SELECTIONS) return;
      next.add(j);
    }
    onChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>How would you judge this?</DialogTitle>
          <DialogDescription>Pick up to {MAX_JUDGEMENT_SELECTIONS}.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 py-2">
          {JUDGEMENT_ORDER.map((j) => {
            const Icon = JUDGEMENT_ICONS[j];
            const checked = value.has(j);
            const disabled = !checked && value.size >= MAX_JUDGEMENT_SELECTIONS;
            return (
              <label
                key={j}
                className={`flex items-center gap-2 rounded-md px-1 py-1.5 text-sm cursor-pointer select-none ${
                  disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-accent/40"
                }`}
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={() => toggle(j)}
                  aria-label={j}
                />
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{j}</span>
              </label>
            );
          })}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JudgeThisDialog;
