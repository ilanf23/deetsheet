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
          <DialogTitle className="text-2xl">How would you judge this?</DialogTitle>
          <DialogDescription className="text-base">Pick up to {MAX_JUDGEMENT_SELECTIONS}.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 py-2">
          {JUDGEMENT_ORDER.map((j) => {
            const Icon = JUDGEMENT_ICONS[j];
            const checked = value.has(j);
            const disabled = !checked && value.size >= MAX_JUDGEMENT_SELECTIONS;
            return (
              <label
                key={j}
                className={`flex items-center gap-3 rounded-md px-1.5 py-2 text-lg cursor-pointer select-none ${
                  disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-accent/40"
                }`}
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={() => toggle(j)}
                  aria-label={j}
                  className="h-5 w-5"
                />
                <Icon className="h-6 w-6 text-muted-foreground" />
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
