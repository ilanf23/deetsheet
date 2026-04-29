import { useState } from "react";
import { Scale } from "lucide-react";
import JudgeThisDialog from "@/components/post/JudgeThisDialog";
import {
  JUDGEMENT_ICONS,
  MAX_JUDGEMENT_SELECTIONS,
  type Judgement,
} from "@/components/post/judgements";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const JudgementReactionsRow = () => {
  const [counts, setCounts] = useState<Map<Judgement, number>>(new Map());
  const [dialogOpen, setDialogOpen] = useState(false);

  const selected = new Set(counts.keys());

  const handleSelectionChange = (next: Set<Judgement>) => {
    const nextCounts = new Map<Judgement, number>();
    next.forEach((j) => {
      nextCounts.set(j, counts.get(j) ?? 1);
    });
    setCounts(nextCounts);
  };

  const leaderboard = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_JUDGEMENT_SELECTIONS);

  return (
    <>
      <div className="flex items-center gap-4 flex-wrap text-sm">
        {leaderboard.map(([j, count]) => {
          const Icon = JUDGEMENT_ICONS[j];
          return (
            <Tooltip key={j}>
              <TooltipTrigger asChild>
                <span
                  className="inline-flex items-center gap-1 text-secondary"
                  aria-label={j}
                >
                  <Icon className="h-4 w-4" />
                  <span className="tabular-nums">{count}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent>{j}</TooltipContent>
            </Tooltip>
          );
        })}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Judge this answer"
            >
              <Scale className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Judge this</TooltipContent>
        </Tooltip>
      </div>
      <JudgeThisDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        value={selected}
        onChange={handleSelectionChange}
      />
    </>
  );
};

export default JudgementReactionsRow;
