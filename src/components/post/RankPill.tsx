interface RankPillProps {
  rank: number;
  total: number;
}

const RankPill = ({ rank, total }: RankPillProps) => (
  <span
    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[var(--font-size-meta)] font-medium uppercase"
    style={{
      backgroundColor: "hsl(var(--surface-rank-pill))",
      color: "hsl(var(--surface-rank-pill-text))",
      letterSpacing: "var(--letter-spacing-rank-pill)",
      lineHeight: "var(--line-height-meta)",
    }}
    aria-label={`Rank ${rank} of ${total}`}
  >
    #{rank} of {total}
  </span>
);

export default RankPill;
