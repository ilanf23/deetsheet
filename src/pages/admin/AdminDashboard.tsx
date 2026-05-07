import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Clock, Flag, UserPlus, FileEdit, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  format,
  parseISO,
  startOfDay,
  startOfWeek,
  startOfMonth,
  subDays,
  subMonths,
  isAfter,
  isBefore,
  addDays,
  addWeeks,
  addMonths,
} from "date-fns";

type ActivityRow = {
  type: "post" | "comment" | "report";
  label: string;
  created_at: string;
};

type MetricKey = "signups" | "posts" | "comments" | "reports";
type RangeKey = "7d" | "30d" | "3m" | "6m" | "12m" | "all";
type GroupKey = "day" | "week" | "month";

const METRICS: {
  key: MetricKey;
  label: string;
  color: string;
  light: string;
}[] = [
  { key: "signups", label: "Signups", color: "hsl(var(--admin-primary))", light: "hsl(var(--admin-primary) / 0.18)" },
  { key: "posts", label: "Posts", color: "hsl(var(--admin-success))", light: "hsl(var(--admin-success) / 0.22)" },
  { key: "comments", label: "Comments", color: "hsl(var(--admin-info))", light: "hsl(var(--admin-info) / 0.24)" },
  { key: "reports", label: "Reports", color: "hsl(var(--admin-danger))", light: "hsl(var(--admin-danger) / 0.22)" },
];

const RANGES: { key: RangeKey; label: string; days: number | "all" }[] = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "3m", label: "3 months", days: 90 },
  { key: "6m", label: "6 months", days: 180 },
  { key: "12m", label: "12 months", days: 365 },
  { key: "all", label: "All", days: "all" },
];

function StatCard({
  label,
  value,
  hint,
  hintTone = "muted",
  icon: Icon,
}: {
  label: string;
  value: number | string;
  hint: string;
  hintTone?: "muted" | "warning";
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  return (
    <div
      className="rounded-xl px-6 py-5"
      style={{
        backgroundColor: "hsl(var(--admin-surface))",
        border: "1px solid hsl(var(--admin-border))",
      }}
    >
      <div className="flex items-start justify-between">
        <p className="text-[13px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
          {label}
        </p>
        <Icon className="h-4 w-4" style={{ color: "hsl(var(--admin-fg-muted))" }} />
      </div>
      <p
        className="mt-3 text-[34px] font-bold leading-none tracking-tight"
        style={{ color: "hsl(var(--admin-fg))" }}
      >
        {value}
      </p>
      <p
        className="mt-3 text-[13px]"
        style={{
          color:
            hintTone === "warning"
              ? "hsl(var(--admin-warning))"
              : "hsl(var(--admin-fg-muted))",
        }}
      >
        {hint}
      </p>
    </div>
  );
}

function QuickAction({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center px-5 py-2.5 rounded-lg text-[14px] font-medium"
      style={{
        backgroundColor: "hsl(var(--admin-surface))",
        border: "1px solid hsl(var(--admin-border))",
        color: "hsl(var(--admin-fg))",
      }}
    >
      {label}
    </Link>
  );
}

function ActivityTag({ type }: { type: ActivityRow["type"] }) {
  const styles =
    type === "post"
      ? { backgroundColor: "hsl(var(--admin-primary))", color: "#fff" }
      : type === "comment"
      ? { backgroundColor: "hsl(var(--admin-info))", color: "#fff" }
      : { backgroundColor: "hsl(var(--admin-danger))", color: "#fff" };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold"
      style={styles}
    >
      {type}
    </span>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-[12px] shadow-sm"
      style={{
        backgroundColor: "hsl(var(--admin-surface))",
        border: "1px solid hsl(var(--admin-border-strong))",
        color: "hsl(var(--admin-fg))",
      }}
    >
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-sm"
            style={{ backgroundColor: p.color }}
          />
          <span style={{ color: "hsl(var(--admin-fg-muted))" }}>{p.name}</span>
          <span className="ml-auto font-semibold tabular-nums">{p.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  // KPIs
  const [pendingApprovals] = useState(0);
  const [openReports, setOpenReports] = useState(0);
  const [reportBreakdown, setReportBreakdown] = useState("");
  const [newUsers24h, setNewUsers24h] = useState(0);
  const [usersDelta, setUsersDelta] = useState("—");
  const [posts24h, setPosts24h] = useState(0);
  const [postsDelta, setPostsDelta] = useState("—");

  // Time-series source data
  const [signupTs, setSignupTs] = useState<string[]>([]);
  const [postTs, setPostTs] = useState<string[]>([]);
  const [commentTs, setCommentTs] = useState<string[]>([]);
  const [reportTs, setReportTs] = useState<string[]>([]);

  // Activity feed. We don't gate the page on this — KPI cards and chart shell
  // render with placeholders so the user sees structure on first paint.
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Filters
  const [range, setRange] = useState<RangeKey>("6m");
  const [group, setGroup] = useState<GroupKey>("month");
  const [activeMetrics, setActiveMetrics] = useState<MetricKey[]>(["signups", "posts"]);
  const [hovered, setHovered] = useState<string | null>(null);

  // KPIs + activity feed: independent of the (heavier) time-series fetch
  // so the page paints as soon as these resolve.
  useEffect(() => {
    const fetchKpisAndActivity = async () => {
      const last24 = subDays(new Date(), 1).toISOString();
      const prev48 = subDays(new Date(), 2).toISOString();

      const [
        u24,
        uPrev,
        p24,
        pPrev,
        reportsCount,
        reasonsSample,
        recentPosts,
        recentComments,
        recentReports,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", last24),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", prev48)
          .lt("created_at", last24),
        supabase.from("posts").select("id", { count: "exact", head: true }).gte("created_at", last24),
        supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .gte("created_at", prev48)
          .lt("created_at", last24),
        supabase.from("reports").select("id", { count: "exact", head: true }),
        supabase.from("reports").select("reasons").order("created_at", { ascending: false }).limit(200),
        supabase.from("posts").select("title, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("comments").select("content, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("reports").select("reasons, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      setNewUsers24h(u24.count ?? 0);
      setUsersDelta(formatDelta(u24.count ?? 0, uPrev.count ?? 0));
      setPosts24h(p24.count ?? 0);
      setPostsDelta(formatDelta(p24.count ?? 0, pPrev.count ?? 0));

      setOpenReports(reportsCount.count ?? 0);
      if (reasonsSample.data && reasonsSample.data.length) {
        const tally: Record<string, number> = {};
        reasonsSample.data.forEach((r) => {
          (r.reasons as string[] | null)?.forEach((reason) => {
            tally[reason] = (tally[reason] ?? 0) + 1;
          });
        });
        const top = Object.entries(tally)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([reason, n]) => `${n} ${reason}`)
          .join(", ");
        setReportBreakdown(top || "No reasons recorded");
      } else {
        setReportBreakdown("No open reports");
      }

      const merged: ActivityRow[] = [
        ...(recentPosts.data ?? []).map((p) => ({
          type: "post" as const,
          label: p.title,
          created_at: p.created_at,
        })),
        ...(recentComments.data ?? []).map((c) => ({
          type: "comment" as const,
          label: `New comment on a post`,
          created_at: c.created_at,
        })),
        ...(recentReports.data ?? []).map((r) => ({
          type: "report" as const,
          label: `Reported · ${(r.reasons as string[] | null)?.join(", ") ?? "no reason"}`,
          created_at: r.created_at,
        })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6);
      setActivity(merged);
      setActivityLoading(false);
    };

    fetchKpisAndActivity();
  }, []);

  // Time-series: scoped to the current range so we never fetch more rows than
  // the chart actually needs, and refetched when the range changes.
  useEffect(() => {
    const fetchSeries = async () => {
      const rangeDef = RANGES.find((r) => r.key === range)!;
      const baseStart =
        rangeDef.days === "all"
          ? null
          : subDays(new Date(), (rangeDef.days as number) * 2).toISOString(); // *2 to also cover the prev-period delta

      const profilesQ = supabase.from("profiles").select("created_at");
      const postsQ = supabase.from("posts").select("created_at");
      const commentsQ = supabase.from("comments").select("created_at");
      const reportsQ = supabase.from("reports").select("created_at");

      if (baseStart) {
        profilesQ.gte("created_at", baseStart);
        postsQ.gte("created_at", baseStart);
        commentsQ.gte("created_at", baseStart);
        reportsQ.gte("created_at", baseStart);
      }

      const [profilesAll, postsAll, commentsAll, reportsAll] = await Promise.all([
        profilesQ,
        postsQ,
        commentsQ,
        reportsQ,
      ]);

      setSignupTs((profilesAll.data ?? []).map((r) => r.created_at));
      setPostTs((postsAll.data ?? []).map((r) => r.created_at));
      setCommentTs((commentsAll.data ?? []).map((r) => r.created_at));
      setReportTs((reportsAll.data ?? []).map((r) => r.created_at));
    };

    fetchSeries();
  }, [range]);

  // Derived chart data
  const chartData = useMemo(() => {
    const sourceByMetric: Record<MetricKey, string[]> = {
      signups: signupTs,
      posts: postTs,
      comments: commentTs,
      reports: reportTs,
    };

    const now = new Date();
    const rangeDef = RANGES.find((r) => r.key === range)!;
    const allTimestamps = ([] as string[]).concat(...Object.values(sourceByMetric));
    const earliest =
      allTimestamps.length === 0
        ? subDays(now, 30)
        : new Date(Math.min(...allTimestamps.map((t) => new Date(t).getTime())));
    const start =
      rangeDef.days === "all" ? earliest : subDays(now, rangeDef.days as number);
    const periodLength = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const prevStart = new Date(start.getTime() - periodLength * 24 * 60 * 60 * 1000);

    const buckets = generateBuckets(start, now, group);

    const data = buckets.map((bucketStart, i) => {
      const next = buckets[i + 1] ?? now;
      const row: Record<string, number | string> = { label: bucketLabel(bucketStart, group) };
      activeMetrics.forEach((m) => {
        row[m] = sourceByMetric[m].filter((ts) => {
          const d = parseISO(ts);
          return !isBefore(d, bucketStart) && isBefore(d, next);
        }).length;
      });
      return row;
    });

    // Totals for current and previous period
    const totals: Record<MetricKey, number> = {
      signups: 0,
      posts: 0,
      comments: 0,
      reports: 0,
    };
    const prevTotals: Record<MetricKey, number> = {
      signups: 0,
      posts: 0,
      comments: 0,
      reports: 0,
    };
    (Object.keys(sourceByMetric) as MetricKey[]).forEach((m) => {
      sourceByMetric[m].forEach((ts) => {
        const d = parseISO(ts);
        if (!isBefore(d, start) && !isAfter(d, now)) totals[m]++;
        if (!isBefore(d, prevStart) && isBefore(d, start)) prevTotals[m]++;
      });
    });

    return { data, totals, prevTotals, start, now };
  }, [signupTs, postTs, commentTs, reportTs, range, group, activeMetrics]);

  const totalCurrent = activeMetrics.reduce((sum, m) => sum + chartData.totals[m], 0);
  const totalPrev = activeMetrics.reduce((sum, m) => sum + chartData.prevTotals[m], 0);
  const periodDelta =
    totalPrev === 0
      ? totalCurrent === 0
        ? 0
        : 100
      : Math.round(((totalCurrent - totalPrev) / totalPrev) * 100);

  return (
    <div className="space-y-7">
      <h1 className="text-[40px] font-bold leading-none tracking-tight" style={{ color: "hsl(var(--admin-fg))" }}>
        Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Pending Approvals"
          value={pendingApprovals}
          hint={pendingApprovals === 0 ? "No pending posts" : "—"}
          icon={Clock}
        />
        <StatCard
          label="Open Reports"
          value={openReports}
          hint={reportBreakdown}
          hintTone="warning"
          icon={Flag}
        />
        <StatCard label="New Users (24h)" value={newUsers24h} hint={usersDelta} icon={UserPlus} />
        <StatCard label="Posts (24h)" value={posts24h} hint={postsDelta} icon={FileEdit} />
      </div>

      <div className="flex flex-wrap gap-3">
        <QuickAction to="/admin/posts" label="Review Pending Posts" />
        <QuickAction to="/admin/reports" label="View Report Queue" />
        <QuickAction to="/admin/users" label="Manage Users" />
      </div>

      {/* Activity chart with filters */}
      <section
        className="rounded-2xl p-7"
        style={{
          backgroundColor: "hsl(var(--admin-surface))",
          border: "1px solid hsl(var(--admin-border))",
        }}
      >
        <header className="flex flex-wrap items-end justify-between gap-6 mb-6">
          <div>
            <p className="text-[13px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
              Activity · {summarizeRange(range)} · grouped by {group}
            </p>
            <div className="flex items-end gap-3 mt-1.5">
              <h2
                className="text-[34px] font-bold leading-none tracking-tight tabular-nums"
                style={{ color: "hsl(var(--admin-fg))" }}
              >
                {totalCurrent.toLocaleString()}
              </h2>
              <span
                className="inline-flex items-center gap-1 text-[13px] font-medium pb-1"
                style={{
                  color:
                    periodDelta >= 0
                      ? "hsl(var(--admin-success))"
                      : "hsl(var(--admin-danger))",
                }}
              >
                {periodDelta >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {periodDelta >= 0 ? "+" : ""}
                {periodDelta}% vs prev period
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {METRICS.map((m) => {
              const isOn = activeMetrics.includes(m.key);
              return (
                <button
                  key={m.key}
                  onClick={() =>
                    setActiveMetrics((cur) =>
                      isOn ? cur.filter((k) => k !== m.key) : [...cur, m.key],
                    )
                  }
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] transition-colors"
                  style={{
                    backgroundColor: isOn ? m.light : "transparent",
                    color: isOn ? m.color : "hsl(var(--admin-fg-muted))",
                    border: `1px solid ${
                      isOn ? "transparent" : "hsl(var(--admin-border))"
                    }`,
                    fontWeight: isOn ? 600 : 500,
                  }}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-sm"
                    style={{ backgroundColor: isOn ? m.color : "hsl(var(--admin-fg-subtle))" }}
                  />
                  {m.label}
                  <span className="tabular-nums" style={{ opacity: isOn ? 1 : 0.7 }}>
                    {chartData.totals[m.key].toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div
            className="inline-flex items-center gap-1 p-0.5 rounded-full"
            style={{ backgroundColor: "hsl(var(--admin-bg))" }}
          >
            {RANGES.map((r) => {
              const isActive = range === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => {
                    setRange(r.key);
                    if (r.days === "all" || (typeof r.days === "number" && r.days > 90)) setGroup("month");
                    else if (typeof r.days === "number" && r.days > 14) setGroup("week");
                    else setGroup("day");
                  }}
                  className="px-3.5 py-1.5 rounded-full text-[12px]"
                  style={{
                    backgroundColor: isActive ? "hsl(var(--admin-surface))" : "transparent",
                    color: isActive ? "hsl(var(--admin-fg))" : "hsl(var(--admin-fg-muted))",
                    fontWeight: isActive ? 600 : 500,
                    boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          <span className="mx-2 text-[12px]" style={{ color: "hsl(var(--admin-fg-subtle))" }}>
            ·
          </span>

          <div
            className="inline-flex items-center gap-1 p-0.5 rounded-full"
            style={{ backgroundColor: "hsl(var(--admin-bg))" }}
          >
            {(["day", "week", "month"] as GroupKey[]).map((g) => {
              const isActive = group === g;
              return (
                <button
                  key={g}
                  onClick={() => setGroup(g)}
                  className="px-3.5 py-1.5 rounded-full text-[12px] capitalize"
                  style={{
                    backgroundColor: isActive ? "hsl(var(--admin-surface))" : "transparent",
                    color: isActive ? "hsl(var(--admin-fg))" : "hsl(var(--admin-fg-muted))",
                    fontWeight: isActive ? 600 : 500,
                    boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-[320px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData.data}
              margin={{ top: 16, right: 16, left: 8, bottom: 0 }}
              barGap={4}
              barCategoryGap="22%"
              onMouseLeave={() => setHovered(null)}
            >
              <CartesianGrid
                vertical={false}
                stroke="hsl(var(--admin-border))"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--admin-fg-muted))" }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--admin-fg-muted))" }}
                width={28}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--admin-primary) / 0.05)" }}
                content={<ChartTooltip />}
              />
              {activeMetrics.map((m) => {
                const meta = METRICS.find((x) => x.key === m)!;
                return (
                  <Bar
                    key={m}
                    dataKey={m}
                    name={meta.label}
                    fill={meta.color}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                    animationDuration={600}
                    onMouseEnter={(_, idx) => setHovered(`${m}-${idx}`)}
                  >
                    {chartData.data.map((_, idx) => (
                      <Cell
                        key={idx}
                        opacity={
                          hovered && !hovered.endsWith(`-${idx}`) ? 0.45 : 1
                        }
                      />
                    ))}
                  </Bar>
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent activity */}
      <div
        className="rounded-xl px-6 py-5"
        style={{
          backgroundColor: "hsl(var(--admin-surface))",
          border: "1px solid hsl(var(--admin-border))",
        }}
      >
        <h3 className="text-[15px] font-semibold mb-4" style={{ color: "hsl(var(--admin-fg))" }}>
          Recent Activity
        </h3>
        {activityLoading ? (
          <p className="text-[13px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
            Loading recent activity…
          </p>
        ) : activity.length === 0 ? (
          <p className="text-[13px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
            No recent activity.
          </p>
        ) : (
          <ul className="space-y-3">
            {activity.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-[14px]">
                <ActivityTag type={item.type} />
                <span className="flex-1 truncate" style={{ color: "hsl(var(--admin-fg))" }}>
                  {item.label}
                </span>
                <span
                  className="text-[12px] whitespace-nowrap"
                  style={{ color: "hsl(var(--admin-fg-muted))" }}
                >
                  {format(parseISO(item.created_at), "MMM d, h:mm a")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function generateBuckets(start: Date, end: Date, group: GroupKey): Date[] {
  const buckets: Date[] = [];
  let cursor =
    group === "day"
      ? startOfDay(start)
      : group === "week"
      ? startOfWeek(start, { weekStartsOn: 1 })
      : startOfMonth(start);
  const step = (d: Date) =>
    group === "day" ? addDays(d, 1) : group === "week" ? addWeeks(d, 1) : addMonths(d, 1);
  while (!isAfter(cursor, end)) {
    buckets.push(cursor);
    cursor = step(cursor);
  }
  return buckets;
}

function bucketLabel(d: Date, group: GroupKey) {
  if (group === "day") return format(d, "MMM d");
  if (group === "week") return format(d, "MMM d");
  return format(d, "MMM yyyy");
}

function summarizeRange(range: RangeKey) {
  const r = RANGES.find((x) => x.key === range)!;
  if (r.days === "all") return "All time";
  return `Last ${r.label}`;
}

function formatDelta(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? "No change vs last 24h" : `+${current} vs last 24h`;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct}% vs last 24h`;
}
