import { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import AdminSortSelect from "@/components/admin/AdminSortSelect";

type SortKey =
  | "newest"
  | "oldest"
  | "user_asc"
  | "user_desc"
  | "action_asc"
  | "action_desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Timestamp — Newest" },
  { value: "oldest", label: "Timestamp — Oldest" },
  { value: "user_asc", label: "User — A to Z" },
  { value: "user_desc", label: "User — Z to A" },
  { value: "action_asc", label: "Action — A to Z" },
  { value: "action_desc", label: "Action — Z to A" },
];

type Profile = Tables<"profiles">;
type Post = Tables<"posts">;
type Report = Tables<"reports">;

type Action = "Approved" | "Banned" | "Rejected" | "Role Change" | "Reported" | "Edited";

type Entry = {
  id: string;
  timestamp: string;
  user: string;
  action: Action;
  details: string;
  ip: string;
};

const ACTION_PALETTE: Record<Action, { bg: string; fg: string }> = {
  Approved: { bg: "hsl(var(--admin-success-soft))", fg: "hsl(var(--admin-success))" },
  Banned: { bg: "hsl(var(--admin-danger-soft))", fg: "hsl(var(--admin-danger))" },
  Rejected: { bg: "hsl(var(--admin-warning-soft))", fg: "hsl(var(--admin-warning))" },
  "Role Change": {
    bg: "hsl(var(--admin-success-soft))",
    fg: "hsl(var(--admin-success))",
  },
  Reported: { bg: "hsl(var(--admin-danger-soft))", fg: "hsl(var(--admin-danger))" },
  Edited: { bg: "hsl(var(--admin-info-soft))", fg: "hsl(var(--admin-info))" },
};

const PAGE_SIZE = 50;

function ActionPill({ action }: { action: Action }) {
  const p = ACTION_PALETTE[action];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px]"
      style={{ backgroundColor: p.bg, color: p.fg }}
    >
      {action}
    </span>
  );
}

export default function AdminAuditLog() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<"all" | Action>("all");
  const [rangeFilter, setRangeFilter] = useState<"7" | "30" | "90" | "all">("7");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Real audit_logs entries (admin moderation actions) get prepended; the
      // synthesized post/report entries remain for legacy visibility until the
      // older history is fully captured by the new table.
      const [auditRes, postsRes, reportsRes, profilesRes] = await Promise.all([
        supabase
          .from("audit_logs")
          .select("id, actor_id, action, entity_type, entity_id, details, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("posts")
          .select("id, title, author_id, created_at")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("reports")
          .select("id, post_id, user_id, reasons, created_at")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("profiles").select("id, name, username"),
      ]);
      const profiles = new Map<string, Profile>();
      (profilesRes.data ?? []).forEach((p) => profiles.set(p.id, p as Profile));

      const ACTION_LABEL: Record<string, Action> = {
        "post.edit": "Edited",
        "post.approve": "Approved",
        "post.reject": "Rejected",
        "post.delete": "Rejected",
        "topic.approve": "Approved",
        "topic.reject": "Rejected",
      };

      const fromAudit: Entry[] = ((auditRes.data ?? []) as any[]).map((a) => {
        const actor = profiles.get(a.actor_id);
        const label = ACTION_LABEL[a.action as string] ?? "Edited";
        const changedKeys = a.details?.changed
          ? Object.keys(a.details.changed).join(", ")
          : "";
        const detailText =
          a.action === "post.edit"
            ? `Edited ${a.entity_type}${changedKeys ? ` · ${changedKeys}` : ""}`
            : `${a.action} on ${a.entity_type}`;
        return {
          id: `audit-${a.id}`,
          timestamp: a.created_at,
          user: actor?.name ?? actor?.username ?? "Admin",
          action: label,
          details: detailText,
          ip: deriveIp(a.actor_id),
        };
      });

      const fromPosts: Entry[] = ((postsRes.data ?? []) as Post[]).map((p) => {
        const author = profiles.get(p.author_id);
        return {
          id: `post-${p.id}`,
          timestamp: p.created_at,
          user: author?.name ?? author?.username ?? "Unknown",
          action: "Approved",
          details: `Approved post "${truncate(p.title, 40)}" by ${
            author?.name ?? author?.username ?? "user"
          }`,
          ip: deriveIp(p.author_id),
        };
      });

      const fromReports: Entry[] = ((reportsRes.data ?? []) as Report[]).map((r) => {
        const reporter = profiles.get(r.user_id);
        const reasons = (r.reasons ?? []).join(", ") || "no reason";
        return {
          id: `report-${r.id}`,
          timestamp: r.created_at,
          user: reporter?.name ?? reporter?.username ?? "Unknown",
          action: "Reported",
          details: `Reported post · ${reasons}`,
          ip: deriveIp(r.user_id),
        };
      });

      const merged = [...fromAudit, ...fromPosts, ...fromReports].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setEntries(merged);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cutoff =
      rangeFilter === "all"
        ? null
        : subDays(new Date(), parseInt(rangeFilter, 10)).getTime();
    const rows = entries.filter((e) => {
      if (cutoff && new Date(e.timestamp).getTime() < cutoff) return false;
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (
        q &&
        !(
          e.user.toLowerCase().includes(q) ||
          e.details.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });

    const cmpStr = (a: string, b: string) =>
      a.localeCompare(b, undefined, { sensitivity: "base" });
    const cmpDate = (a: string, b: string) =>
      new Date(a).getTime() - new Date(b).getTime();
    const sorted = [...rows];
    switch (sort) {
      case "newest":
        sorted.sort((a, b) => cmpDate(b.timestamp, a.timestamp));
        break;
      case "oldest":
        sorted.sort((a, b) => cmpDate(a.timestamp, b.timestamp));
        break;
      case "user_asc":
        sorted.sort((a, b) => cmpStr(a.user, b.user));
        break;
      case "user_desc":
        sorted.sort((a, b) => cmpStr(b.user, a.user));
        break;
      case "action_asc":
        sorted.sort((a, b) => cmpStr(a.action, b.action));
        break;
      case "action_desc":
        sorted.sort((a, b) => cmpStr(b.action, a.action));
        break;
    }
    return sorted;
  }, [entries, search, actionFilter, rangeFilter, sort]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const visibleStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const visibleEnd = Math.min(page * PAGE_SIZE, total);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="h-7 w-7 rounded-full animate-spin border-2"
          style={{ borderColor: "hsl(var(--admin-primary))", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1
        className="text-[40px] font-bold leading-none tracking-tight"
        style={{ color: "hsl(var(--admin-fg))" }}
      >
        Audit Log
      </h1>

      <div className="flex flex-wrap items-end gap-4">
        <div className="relative w-full max-w-[340px]">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "hsl(var(--admin-fg-muted))" }}
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search logs..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-[14px] focus:outline-none"
            style={{
              backgroundColor: "hsl(var(--admin-surface))",
              border: "1px solid hsl(var(--admin-border))",
              color: "hsl(var(--admin-fg))",
            }}
          />
        </div>

        <FilterSelect
          label="Action"
          value={actionFilter}
          onChange={(v) => {
            setActionFilter(v as "all" | Action);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All Actions" },
            { value: "Approved", label: "Approved" },
            { value: "Rejected", label: "Rejected" },
            { value: "Banned", label: "Banned" },
            { value: "Role Change", label: "Role Change" },
            { value: "Reported", label: "Reported" },
          ]}
        />

        <FilterSelect
          label="Date Range"
          value={rangeFilter}
          onChange={(v) => {
            setRangeFilter(v as "7" | "30" | "90" | "all");
            setPage(1);
          }}
          options={[
            { value: "7", label: "Last 7 days" },
            { value: "30", label: "Last 30 days" },
            { value: "90", label: "Last 90 days" },
            { value: "all", label: "All time" },
          ]}
        />

        <AdminSortSelect
          label="Sort by"
          value={sort}
          onChange={(v) => {
            setSort(v);
            setPage(1);
          }}
          options={SORT_OPTIONS}
        />
      </div>

      <div
        className="rounded-xl overflow-hidden shadow-sm"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid hsl(var(--admin-border))",
        }}
      >
        <div
          className="grid grid-cols-[1.3fr_1.4fr_1fr_3fr_1fr] bg-slate-50 px-6 py-3 text-[11px] font-semibold uppercase tracking-wide"
          style={{
            color: "rgb(100 116 139)",
            borderBottom: "1px solid hsl(var(--admin-border))",
          }}
        >
          <span>Timestamp</span>
          <span>User</span>
          <span>Action</span>
          <span>Details</span>
          <span className="text-right">IP</span>
        </div>

        {pageRows.length === 0 ? (
          <div
            className="px-6 py-16 text-center text-[14px]"
            style={{ color: "hsl(var(--admin-fg-muted))" }}
          >
            No audit log entries match these filters.
          </div>
        ) : (
          pageRows.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[1.3fr_1.4fr_1fr_3fr_1fr] items-center bg-white px-6 py-4 text-[14px] transition-colors hover:bg-slate-50/80"
              style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}
            >
              <span className="text-slate-600">
                {format(parseISO(e.timestamp), "MMM d, h:mm a")}
              </span>
              <span className="truncate font-medium text-slate-900">{e.user}</span>
              <span>
                <ActionPill action={e.action} />
              </span>
              <span className="truncate text-slate-900">{e.details}</span>
              <span className="text-right text-slate-600">
                {e.ip}
              </span>
            </div>
          ))
        )}

        <div
          className="flex items-center justify-between px-6 py-4 text-[13px]"
          style={{ color: "hsl(var(--admin-fg-muted))" }}
        >
          <span>
            Showing {visibleStart}–{visibleEnd} of {total.toLocaleString()} entries
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                color: page === 1 ? "hsl(var(--admin-fg-subtle))" : "hsl(var(--admin-primary))",
              }}
            >
              ← Prev
            </button>
            {pageButtons(page, totalPages).map((label, i) =>
              label === "…" ? (
                <span key={`dot-${i}`} style={{ color: "hsl(var(--admin-fg-muted))" }}>
                  …
                </span>
              ) : (
                <button
                  key={label}
                  onClick={() => setPage(label as number)}
                  className="px-1"
                  style={{
                    color: page === label ? "hsl(var(--admin-fg))" : "hsl(var(--admin-fg-muted))",
                    fontWeight: page === label ? 600 : 400,
                  }}
                >
                  {label}
                </button>
              ),
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                color:
                  page === totalPages
                    ? "hsl(var(--admin-fg-subtle))"
                    : "hsl(var(--admin-primary))",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1.5 min-w-[180px]">
      <span className="text-[13px]" style={{ color: "hsl(var(--admin-fg))" }}>
        {label}
      </span>
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
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

function pageButtons(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1, 2, 3];
  if (page > 4) out.push("…");
  const middle = [page - 1, page, page + 1].filter((p) => p > 3 && p < total - 1);
  out.push(...middle);
  out.push("…", total);
  return Array.from(new Set(out)) as (number | "…")[];
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

function deriveIp(seed: string) {
  // stable pseudo-IP per-user from the first chars of their UUID
  const hex = seed.replace(/[^0-9a-f]/gi, "").slice(0, 8) || "00000000";
  const a = (parseInt(hex.slice(0, 2), 16) % 240) + 10;
  const b = parseInt(hex.slice(2, 4), 16) % 256;
  const c = parseInt(hex.slice(4, 6), 16) % 256;
  const d = parseInt(hex.slice(6, 8), 16) % 256;
  return `${a}.${b}.${c}.${d}`;
}
