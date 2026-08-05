import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { buildPostSlug } from "@/lib/postSlug";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userLabel: string;
}

interface RatedPost {
  id: string;
  value: number;
  createdAt: string;
  postId: string;
  postTitle: string;
  topicName: string;
}

const PAGE_SIZE = 10;
/** Cap the dossier so a heavy rater never stalls the admin table. */
const MAX_ROWS = 200;

export default function UserRatingsDialog({ open, onOpenChange, userId, userLabel }: Props) {
  const [rows, setRows] = useState<RatedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    setLoading(true);
    setPage(1);
    void (async () => {
      const { data } = await supabase
        .from("ratings")
        .select("id, value, created_at, post_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(MAX_ROWS);
      if (cancelled) return;

      const ratings = (data ?? []) as Array<{
        id: string;
        value: number;
        created_at: string;
        post_id: string;
      }>;
      const postIds = Array.from(new Set(ratings.map((r) => r.post_id)));
      const postById = new Map<string, { title: string; topicName: string }>();
      if (postIds.length > 0) {
        const { data: posts } = await supabase
          .from("posts")
          .select("id, title, topics(name)")
          .in("id", postIds);
        if (cancelled) return;
        ((posts ?? []) as Array<Record<string, unknown>>).forEach((p) => {
          const topics = p.topics as Record<string, unknown> | Record<string, unknown>[] | null;
          const topicName = Array.isArray(topics)
            ? (topics[0]?.name as string)
            : (topics?.name as string);
          postById.set(p.id as string, {
            title: (p.title as string) || "Untitled post",
            topicName: topicName || "General",
          });
        });
      }

      setRows(
        ratings.map((r) => ({
          id: r.id,
          value: Number(r.value),
          createdAt: r.created_at,
          postId: r.post_id,
          postTitle: postById.get(r.post_id)?.title ?? "Unknown post",
          topicName: postById.get(r.post_id)?.topicName ?? "General",
        })),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Posts ranked by {userLabel}</DialogTitle>
          <DialogDescription>
            {loading
              ? "Loading rankings…"
              : `${rows.length} ranked ${rows.length === 1 ? "post" : "posts"}${
                  rows.length >= MAX_ROWS ? " (most recent)" : ""
                }`}
          </DialogDescription>
        </DialogHeader>

        {!loading && rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            This member hasn't ranked any posts yet.
          </p>
        ) : (
          <div className="rounded-lg border">
            <div className="grid grid-cols-[3fr_1.5fr_0.7fr_1fr] bg-muted/50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Post</span>
              <span>Topic</span>
              <span className="text-right">Rating</span>
              <span className="text-right">When</span>
            </div>
            {pageRows.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-[3fr_1.5fr_0.7fr_1fr] items-center border-t px-4 py-3 text-sm"
              >
                <a
                  href={`/topic/${encodeURIComponent(r.topicName)}/post/${
                    buildPostSlug(r.postTitle, r.postId) || r.postId
                  }`}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-primary hover:underline"
                >
                  {r.postTitle}
                </a>
                <span className="truncate text-muted-foreground">{r.topicName}</span>
                <span className="text-right font-medium tabular-nums text-secondary">
                  {r.value}
                </span>
                <span className="text-right text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
