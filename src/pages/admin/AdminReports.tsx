import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Report = Tables<"reports">;
type Post = Tables<"posts">;
type Profile = Tables<"profiles">;

type ReportTab = "open" | "resolved" | "dismissed";

type ReportGroup = {
  postId: string;
  reports: Report[];
  reasons: Record<string, number>;
  primaryReason: string;
};

const REASON_PALETTES: Record<string, { bg: string; fg: string }> = {
  spam: { bg: "hsl(var(--admin-warning-soft))", fg: "hsl(var(--admin-warning))" },
  misleading: { bg: "hsl(var(--admin-warning-soft))", fg: "hsl(var(--admin-warning))" },
  harassment: { bg: "hsl(var(--admin-danger-soft))", fg: "hsl(var(--admin-danger))" },
  "spam account": { bg: "hsl(var(--admin-danger-soft))", fg: "hsl(var(--admin-danger))" },
};

function ReasonChip({ reason }: { reason: string }) {
  const key = reason.toLowerCase();
  const palette =
    REASON_PALETTES[key] ?? {
      bg: "hsl(var(--admin-info-soft))",
      fg: "hsl(var(--admin-info))",
    };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px] capitalize"
      style={{ backgroundColor: palette.bg, color: palette.fg }}
    >
      {reason}
    </span>
  );
}

function PrimaryActionBtn({
  label,
  onClick,
  variant = "danger",
}: {
  label: string;
  onClick: () => void;
  variant?: "danger" | "muted" | "warn";
}) {
  if (variant === "danger") {
    return (
      <button
        onClick={onClick}
        className="px-4 py-2 rounded-md text-[13px] font-medium"
        style={{ backgroundColor: "hsl(var(--admin-danger))", color: "#fff" }}
      >
        {label}
      </button>
    );
  }
  if (variant === "warn") {
    return (
      <button
        onClick={onClick}
        className="px-4 py-2 rounded-md text-[13px] font-medium"
        style={{
          backgroundColor: "hsl(var(--admin-surface))",
          border: "1px solid hsl(var(--admin-warning))",
          color: "hsl(var(--admin-warning))",
        }}
      >
        {label}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-md text-[13px] font-medium"
      style={{
        backgroundColor: "hsl(var(--admin-surface))",
        border: "1px solid hsl(var(--admin-border-strong))",
        color: "hsl(var(--admin-fg))",
      }}
    >
      {label}
    </button>
  );
}

export default function AdminReports() {
  const [tab, setTab] = useState<ReportTab>("open");
  const [reports, setReports] = useState<Report[]>([]);
  const [posts, setPosts] = useState<Map<string, Post>>(new Map());
  const [authors, setAuthors] = useState<Map<string, Profile>>(new Map());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [reportsRes, postsRes, profilesRes] = await Promise.all([
        supabase
          .from("reports")
          .select("id, post_id, user_id, reasons, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("posts").select("id, title, author_id"),
        supabase.from("profiles").select("id, name, username"),
      ]);
      setReports((reportsRes.data ?? []) as Report[]);
      const postMap = new Map<string, Post>();
      (postsRes.data ?? []).forEach((p) => postMap.set(p.id, p as Post));
      setPosts(postMap);
      const profMap = new Map<string, Profile>();
      (profilesRes.data ?? []).forEach((p) => profMap.set(p.id, p as Profile));
      setAuthors(profMap);
      setLoading(false);
    };
    load();
  }, []);

  const groups: ReportGroup[] = useMemo(() => {
    if (tab !== "open") return [];
    const byPost = new Map<string, Report[]>();
    reports.forEach((r) => {
      const list = byPost.get(r.post_id) ?? [];
      list.push(r);
      byPost.set(r.post_id, list);
    });
    return Array.from(byPost.entries()).map(([postId, list]) => {
      const reasons: Record<string, number> = {};
      list.forEach((r) => {
        (r.reasons ?? []).forEach((reason) => {
          reasons[reason] = (reasons[reason] ?? 0) + 1;
        });
      });
      const primaryReason =
        Object.entries(reasons).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Other";
      return { postId, reports: list, reasons, primaryReason };
    });
  }, [reports, tab]);

  const openCount = groups.length;

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
      <div className="flex items-start justify-between">
        <h1
          className="text-[40px] font-bold leading-none tracking-tight"
          style={{ color: "hsl(var(--admin-fg))" }}
        >
          Reports
        </h1>
        <span className="text-[13px] mt-3" style={{ color: "hsl(var(--admin-fg-muted))" }}>
          {openCount} open report{openCount === 1 ? "" : "s"}
        </span>
      </div>

      <div
        className="inline-flex items-center gap-1 p-1 rounded-full"
        style={{ backgroundColor: "hsl(var(--admin-primary-soft))" }}
      >
        {(["open", "resolved", "dismissed"] as ReportTab[]).map((t) => {
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-full text-[13px] capitalize"
              style={{
                backgroundColor: isActive ? "hsl(var(--admin-surface))" : "transparent",
                color: isActive ? "hsl(var(--admin-fg))" : "hsl(var(--admin-fg-muted))",
                fontWeight: isActive ? 600 : 400,
                boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
              }}
            >
              {t === "open" ? `Open (${openCount})` : t}
            </button>
          );
        })}
      </div>

      {tab !== "open" ? (
        <div
          className="rounded-xl p-12 text-center text-[14px]"
          style={{
            backgroundColor: "hsl(var(--admin-surface))",
            border: "1px solid hsl(var(--admin-border))",
            color: "hsl(var(--admin-fg-muted))",
          }}
        >
          {tab === "resolved" ? "No resolved reports yet." : "No dismissed reports yet."}
          <p className="mt-2 text-[12px]">
            Resolution status lands when the reports schema gets `status` and `resolution_action` columns.
          </p>
        </div>
      ) : groups.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center text-[14px]"
          style={{
            backgroundColor: "hsl(var(--admin-surface))",
            border: "1px solid hsl(var(--admin-border))",
            color: "hsl(var(--admin-fg-muted))",
          }}
        >
          No open reports right now. The queue is empty — nice work.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const post = posts.get(g.postId);
            const author = post ? authors.get(post.author_id) : null;
            const reportCount = g.reports.length;
            return (
              <article
                key={g.postId}
                className="rounded-xl px-6 py-5"
                style={{
                  backgroundColor: "hsl(var(--admin-surface))",
                  border: "1px solid hsl(var(--admin-border))",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <p className="text-[13px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
                      Reported Post
                    </p>
                    <h3
                      className="text-[17px] font-semibold leading-snug"
                      style={{ color: "hsl(var(--admin-fg))" }}
                    >
                      {`"${post?.title ?? "Unknown post"}"`} by{" "}
                      {author?.name ?? author?.username ?? "Unknown"}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {Object.entries(g.reasons).map(([reason, count]) => (
                        <ReasonChip key={reason} reason={reason} />
                      ))}
                      <span className="text-[12px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
                        · {reportCount} report{reportCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                  <ReasonChip reason={g.primaryReason} />
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <PrimaryActionBtn
                    label="Remove Post"
                    onClick={() =>
                      toast({
                        title: "Post removed",
                        description: `Removed "${post?.title?.slice(0, 40) ?? ""}".`,
                        variant: "destructive",
                      })
                    }
                  />
                  <PrimaryActionBtn
                    variant="muted"
                    label="Dismiss"
                    onClick={() =>
                      toast({
                        title: "Report dismissed",
                        description: `${reportCount} reports dismissed.`,
                      })
                    }
                  />
                  <PrimaryActionBtn
                    variant="warn"
                    label="Warn Author"
                    onClick={() =>
                      toast({
                        title: "Author warned",
                        description: `${author?.name ?? "Author"} will receive a warning.`,
                      })
                    }
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
