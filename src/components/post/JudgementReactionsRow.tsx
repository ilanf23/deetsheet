import { useState } from "react";
import { Scale } from "lucide-react";
import JudgeThisDialog from "@/components/post/JudgeThisDialog";
import { JUDGEMENT_ICONS, type Judgement } from "@/components/post/judgements";

const FEATURED: Judgement[] = ["Helpful", "Agree", "Insightful", "Heartfelt"];

const JudgementReactionsRow = () => {
  const [selected, setSelected] = useState<Set<Judgement>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggleFeatured = (j: Judgement) => {
    const next = new Set(selected);
    if (next.has(j)) {
      next.delete(j);
    } else {
      if (next.size >= 3) return;
      next.add(j);
    }
    setSelected(next);
  };

  return (
    <>
      <div className="flex items-center gap-4 flex-wrap text-sm">
        {FEATURED.map((j) => {
          const Icon = JUDGEMENT_ICONS[j];
          const isOn = selected.has(j);
          const count = isOn ? 1 : 0;
          return (
            <button
              key={j}
              type="button"
              onClick={() => toggleFeatured(j)}
              aria-pressed={isOn}
              aria-label={`${j}${isOn ? " (selected)" : ""}`}
              className={`inline-flex items-center gap-1 transition-colors ${
                isOn
                  ? "text-secondary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {count > 0 && <span className="tabular-nums">{count}</span>}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Judge this answer"
        >
          <Scale className="h-4 w-4" />
        </button>
      </div>
      <JudgeThisDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        value={selected}
        onChange={setSelected}
      />
    </>
  );
};

export default JudgementReactionsRow;
