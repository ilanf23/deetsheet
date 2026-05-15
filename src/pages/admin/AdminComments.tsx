import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import AdminSortSelect from "@/components/admin/AdminSortSelect";
import RichTextEditor from "@/components/RichTextEditor";
import { slugifyPostTitle } from "@/lib/postSlug";
import { logAdminAction } from "@/lib/auditLog";

interface Comment {
  id: string;
  content: string;
  author_id: string;
  post_id: string;
  created_at: string;
  parent_comment_id: string | null;
  like_count: number;
  postTitle: string;
  postTopicName: string | null;
  authorName: string;
  authorAvatarUrl: string | null;
  replyCount: number;
}

interface CommentRow {
  id: string;
  content: string;
  author_id: string;
  post_id: string;
  created_at: string;
  parent_comment_id: string | null;
  like_count: number | null;
}

interface PostContextRow {
  id: string;
  title: string | null;
  topics?: { name: string | null } | { name: string | null }[] | null;
}

interface ProfileRow {
  id: string;
  username: string | null;
  name: string | null;
  avatar_url: string | null;
}

type SortKey =
  | "newest"
  | "oldest"
  | "post_asc"
  | "post_desc"
  | "author_asc"
  | "author_desc"
  | "content_asc"
  | "content_desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Created — Newest" },
  { value: "oldest", label: "Created — Oldest" },
  { value: "post_asc", label: "Post — A to Z" },
  { value: "post_desc", label: "Post — Z to A" },
  { value: "author_asc", label: "Author — A to Z" },
  { value: "author_desc", label: "Author — Z to A" },
  { value: "content_asc", label: "Content — A to Z" },
  { value: "content_desc", label: "Content — Z to A" },
];

const COMMENT_LOAD_LIMIT = 500;
const COMMENT_SELECT = "id, content, author_id, post_id, created_at, parent_comment_id, like_count";

export default function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("newest");
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const sortedComments = useMemo(() => {
    const cmpStr = (a: string, b: string) =>
      a.localeCompare(b, undefined, { sensitivity: "base" });
    const cmpDate = (a?: string | null, b?: string | null) =>
      new Date(a ?? 0).getTime() - new Date(b ?? 0).getTime();
    const arr = [...comments];
    switch (sort) {
      case "newest":
        arr.sort((a, b) => cmpDate(b.created_at, a.created_at));
        break;
      case "oldest":
        arr.sort((a, b) => cmpDate(a.created_at, b.created_at));
        break;
      case "post_asc":
        arr.sort((a, b) => cmpStr(a.postTitle, b.postTitle));
        break;
      case "post_desc":
        arr.sort((a, b) => cmpStr(b.postTitle, a.postTitle));
        break;
      case "author_asc":
        arr.sort((a, b) => cmpStr(a.authorName, b.authorName));
        break;
      case "author_desc":
        arr.sort((a, b) => cmpStr(b.authorName, a.authorName));
        break;
      case "content_asc":
        arr.sort((a, b) => cmpStr(getPlainCommentText(a.content), getPlainCommentText(b.content)));
        break;
      case "content_desc":
        arr.sort((a, b) => cmpStr(getPlainCommentText(b.content), getPlainCommentText(a.content)));
        break;
    }
    return arr;
  }, [comments, sort]);

  const fetchComments = async () => {
    setLoading(true);
    setLoadWarning(null);
    let { data: commentRows, error: commentsError } = await supabase
      .from("comments")
      .select(COMMENT_SELECT)
      .order("created_at", { ascending: false })
      .limit(COMMENT_LOAD_LIMIT);

    if (commentsError?.message.toLowerCase().includes("timeout")) {
      const fallback = await supabase
        .from("comments")
        .select(COMMENT_SELECT)
        .limit(COMMENT_LOAD_LIMIT);
      commentRows = fallback.data;
      commentsError = fallback.error;
      if (!fallback.error) {
        setLoadWarning(
          "Loaded comments without database-side sorting because the ordered query timed out. Apply the latest comments index migration for fully reliable newest-first loading.",
        );
      }
    }

    if (commentsError) {
      toast({ title: "Error loading comments", description: commentsError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const rows = (commentRows ?? []) as CommentRow[];
    const postIds = Array.from(new Set(rows.map((row) => row.post_id).filter(Boolean)));
    const authorIds = Array.from(new Set(rows.map((row) => row.author_id).filter(Boolean)));
    const postContextById = new Map<string, PostContextRow>();
    const profileById = new Map<string, ProfileRow>();

    const [postsRes, profilesRes] = await Promise.all([
      postIds.length > 0
        ? supabase
            .from("posts")
            .select("id, title, topics!posts_topic_id_fkey(name)")
            .in("id", postIds)
        : Promise.resolve({ data: [], error: null }),
      authorIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, username, name, avatar_url")
            .in("id", authorIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (postsRes.error) {
      toast({ title: "Error loading post context", description: postsRes.error.message, variant: "destructive" });
    } else {
      ((postsRes.data ?? []) as PostContextRow[]).forEach((post) => {
        postContextById.set(post.id, post);
      });
    }

    if (profilesRes.error) {
      toast({ title: "Error loading authors", description: profilesRes.error.message, variant: "destructive" });
    } else {
      ((profilesRes.data ?? []) as ProfileRow[]).forEach((profile) => {
        profileById.set(profile.id, profile);
      });
    }

    const directReplyCountByCommentId = new Map<string, number>();
    rows.forEach((row) => {
      if (!row.parent_comment_id) return;
      directReplyCountByCommentId.set(
        row.parent_comment_id,
        (directReplyCountByCommentId.get(row.parent_comment_id) ?? 0) + 1,
      );
    });

    setComments(
      rows.map((comment) => ({
        ...comment,
        like_count: comment.like_count ?? 0,
        postTitle: postContextById.get(comment.post_id)?.title ?? "Unknown post",
        postTopicName: getPostTopicName(postContextById.get(comment.post_id)),
        authorName:
          profileById.get(comment.author_id)?.name ??
          profileById.get(comment.author_id)?.username ??
          "anonymous",
        authorAvatarUrl: profileById.get(comment.author_id)?.avatar_url ?? null,
        replyCount: directReplyCountByCommentId.get(comment.id) ?? 0,
      })),
    );
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, []);

  const handleDelete = async (comment: Comment) => {
    const { error } = await supabase.from("comments").delete().eq("id", comment.id);
    if (error) {
      toast({ title: "Error deleting comment", description: error.message, variant: "destructive" });
      return;
    }

    if (user) {
      await logAdminAction({
        actorId: user.id,
        action: "comment.delete",
        entityType: "comment",
        entityId: comment.id,
        details: {
          postId: comment.post_id,
          authorId: comment.author_id,
          content: comment.content,
        },
      });
    }

    toast({ title: "Comment deleted" });
    fetchComments();
  };

  const handleSaveComment = async (comment: Comment, nextContent: string) => {
    if (!nextContent.replace(/<[^>]*>/g, "").trim()) {
      toast({ title: "Comment content is required", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("comments")
      .update({ content: nextContent })
      .eq("id", comment.id);

    if (error) {
      toast({ title: "Error updating comment", description: error.message, variant: "destructive" });
      return;
    }

    if (user) {
      await logAdminAction({
        actorId: user.id,
        action: "comment.edit",
        entityType: "comment",
        entityId: comment.id,
        details: {
          postId: comment.post_id,
          authorId: comment.author_id,
          changed: { content: { from: comment.content, to: nextContent } },
        },
      });
    }

    setEditingComment(null);
    toast({ title: "Comment updated" });
    fetchComments();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[40px] font-bold leading-none tracking-tight">Comments</h1>
          <p className="mt-2 text-[13px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
            {comments.length.toLocaleString()} comments loaded for review
          </p>
        </div>
        <AdminSortSelect
          variant="plain"
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          options={SORT_OPTIONS}
        />
      </div>

      {loadWarning && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {loadWarning}
        </div>
      )}

      <div
        className="overflow-hidden rounded-xl shadow-sm"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid hsl(var(--admin-border))",
        }}
      >
        <div
          className="flex items-center justify-between gap-3 border-b px-5 py-4"
          style={{ borderColor: "hsl(var(--admin-border))" }}
        >
          <div>
            <h2 className="text-[15px] font-semibold">Comment moderation queue</h2>
            <p className="text-[13px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
              Review context, engagement, and author details before editing or deleting.
            </p>
          </div>
          <div
            className="rounded-full px-3 py-1 text-[12px] font-medium"
            style={{
              backgroundColor: "hsl(var(--admin-primary-soft))",
              color: "hsl(var(--admin-primary))",
            }}
          >
            {sortedComments.length.toLocaleString()} shown
          </div>
        </div>

        <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="h-11 px-5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Comment</TableHead>
              <TableHead className="h-11 px-5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Post Context</TableHead>
              <TableHead className="h-11 px-5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Author</TableHead>
              <TableHead className="h-11 px-5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Activity</TableHead>
              <TableHead className="h-11 px-5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Created</TableHead>
              <TableHead className="h-11 w-[112px] px-5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedComments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No comments found.</TableCell>
              </TableRow>
            ) : (
              sortedComments.map((c) => (
                <TableRow key={c.id} className="bg-white transition-colors hover:bg-slate-50/80">
                  <TableCell className="min-w-[320px] max-w-[520px] px-5 py-4 align-top">
                    <div className="space-y-2">
                      <Badge
                        variant={c.parent_comment_id ? "secondary" : "outline"}
                        className="h-6 rounded-full px-2 text-[11px]"
                      >
                        {c.parent_comment_id ? "Reply" : "Top-level"}
                      </Badge>
                      <p className="line-clamp-3 text-[14px] leading-6 text-slate-900">
                        {getPlainCommentText(c.content)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[240px] max-w-[340px] px-5 py-4 align-top">
                    <div className="space-y-1">
                      <p className="truncate text-[14px] font-semibold text-slate-900">{c.postTitle}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {c.postTopicName && <span className="truncate">{c.postTopicName}</span>}
                        {c.postTopicName && <span aria-hidden>|</span>}
                        <Link
                          to={getPostHref(c)}
                          className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[190px] px-5 py-4 align-top">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {c.authorAvatarUrl && <AvatarImage src={c.authorAvatarUrl} alt={c.authorName} />}
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {getInitials(c.authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-slate-900">{c.authorName}</p>
                        <p className="font-mono text-xs text-slate-500">{c.author_id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[140px] px-5 py-4 align-top">
                    <div className="flex flex-col gap-1.5 text-[13px] text-slate-600">
                      <span className="font-medium text-slate-800">{c.like_count.toLocaleString()} likes</span>
                      <span className="inline-flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {c.replyCount.toLocaleString()} replies
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[150px] px-5 py-4 align-top text-sm">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">{format(parseISO(c.created_at), "MMM d, yyyy")}</p>
                      <p className="text-xs text-slate-500">
                        {formatDistanceToNow(parseISO(c.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 align-top">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        onClick={() => setEditingComment(c)}
                        aria-label="Edit comment"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-red-100 bg-white text-destructive hover:bg-red-50 hover:text-destructive"
                            aria-label="Delete comment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete this comment and any replies below it.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(c)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      <EditCommentDialog
        comment={editingComment}
        open={!!editingComment}
        onOpenChange={(open) => {
          if (!open) setEditingComment(null);
        }}
        onSave={handleSaveComment}
      />
    </div>
  );
}

function EditCommentDialog({
  comment,
  open,
  onOpenChange,
  onSave,
}: {
  comment: Comment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (comment: Comment, content: string) => void;
}) {
  const [content, setContent] = useState("");

  useEffect(() => {
    setContent(comment?.content ?? "");
  }, [comment]);

  if (!comment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit comment</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {comment.authorName} on {comment.postTitle}
            </p>
          </div>
          <RichTextEditor
            key={comment.id}
            initialContent={comment.content}
            placeholder="Edit comment..."
            minHeight="180px"
            onUpdate={setContent}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(comment, content)}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getPlainCommentText(content: string) {
  if (typeof window === "undefined") {
    return content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  const doc = new DOMParser().parseFromString(content, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim() || "Empty comment";
}

function getPostHref(comment: Comment) {
  if (!comment.postTopicName) return `/admin/posts`;
  const slug = slugifyPostTitle(comment.postTitle) || comment.post_id;
  return `/topic/${encodeURIComponent(comment.postTopicName)}/post/${slug}#discussion`;
}

function getPostTopicName(post: PostContextRow | undefined) {
  const topics = post?.topics;
  if (!topics) return null;
  return Array.isArray(topics) ? topics[0]?.name ?? null : topics.name;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
