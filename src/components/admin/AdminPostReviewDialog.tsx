import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ExternalLink, ImageOff, MapPin, Pencil, Upload, User as UserIcon, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { logAdminAction } from "@/lib/auditLog";
import { formatDistanceToNow, parseISO } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Post = Tables<"posts">;
type Profile = Tables<"profiles">;

interface AuthorStats {
  totalPosts: number;
  approvedPosts: number;
  postsInTopic: number;
  recent: Array<{ id: string; title: string; status: string; created_at: string; topic_name: string | null }>;
}

interface Props {
  postId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: string) => void | Promise<void>;
  onReject: (id: string) => void | Promise<void>;
  /** Opens the Edit/Suggest action popup that notifies the author of changes. */
  onSuggestEdit?: (id: string) => void;
  /** Called after inline edits are saved. */
  onSaved?: () => void;
}

export default function AdminPostReviewDialog({
  postId,
  open,
  onOpenChange,
  onApprove,
  onReject,
  onSuggestEdit,
  onSaved,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [topicName, setTopicName] = useState<string | null>(null);
  const [topicSlug, setTopicSlug] = useState<string | null>(null);
  const [author, setAuthor] = useState<Profile | null>(null);
  const [postLocation, setPostLocation] = useState<{ city: string; state: string } | null>(null);
  const [authorLocation, setAuthorLocation] = useState<{ city: string; state: string } | null>(null);
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);

  // Inline editing state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [story, setStory] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetEditState = (p: Post | null) => {
    setEditing(false);
    setTitle(p?.title ?? "");
    setContent(p?.content ?? "");
    setStory(p?.story ?? "");
    setImageUrl(p?.image_url ?? null);
    setNewImage(null);
    setNewImagePreview(null);
    setRemoveImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (!open || !postId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setPost(null);
      setAuthor(null);
      setStats(null);
      setTopicName(null);
      setTopicSlug(null);
      setPostLocation(null);
      setAuthorLocation(null);
      resetEditState(null);

      const { data: postRow } = await supabase
        .from("posts_privileged")
        .select("*")
        .eq("id", postId)
        .maybeSingle();
      if (cancelled || !postRow) {
        setLoading(false);
        return;
      }
      setPost(postRow as Post);
      resetEditState(postRow as Post);

      const [topicRes, authorRes, postLocRes] = await Promise.all([
        supabase.from("topics").select("name, slug").eq("id", postRow.topic_id).maybeSingle(),
        supabase.from("profiles_private").select("*").eq("id", postRow.author_id).maybeSingle(),
        postRow.location_id
          ? supabase.from("locations").select("city, state").eq("id", postRow.location_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      const topicData = topicRes.data as { name: string; slug: string } | null;
      setTopicName(topicData?.name ?? null);
      setTopicSlug(topicData?.slug ?? null);
      const authorProfile = (authorRes.data as Profile) ?? null;
      setAuthor(authorProfile);
      const pl = postLocRes.data as { city: string; state: string } | null;
      if (pl) setPostLocation({ city: pl.city, state: pl.state });

      if (authorProfile?.location_id) {
        const { data: al } = await supabase
          .from("locations")
          .select("city, state")
          .eq("id", authorProfile.location_id)
          .maybeSingle();
        if (!cancelled && al) setAuthorLocation({ city: al.city, state: al.state });
      }

      const { data: authorPosts } = await supabase
        .from("posts_privileged")
        .select("id, title, status, created_at, topic_id, topics(name)")
        .eq("author_id", postRow.author_id)
        .order("created_at", { ascending: false });
      if (cancelled) return;

      type AuthorPostRow = {
        id: string;
        title: string;
        status: string;
        created_at: string;
        topic_id: string;
        topics: { name: string } | { name: string }[] | null;
      };
      const rows = (authorPosts ?? []) as AuthorPostRow[];
      const topicNameOf = (t: AuthorPostRow["topics"]) =>
        Array.isArray(t) ? (t[0]?.name ?? null) : (t?.name ?? null);
      setStats({
        totalPosts: rows.length,
        approvedPosts: rows.filter((r) => r.status === "approved").length,
        postsInTopic: rows.filter((r) => r.topic_id === postRow.topic_id).length,
        recent: rows.slice(0, 5).map((r) => ({
          id: r.id,
          title: r.title,
          status: r.status,
          created_at: r.created_at,
          topic_name: topicNameOf(r.topics),
        })),
      });

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, postId]);

  const handleApprove = async () => {
    if (!postId) return;
    setActing("approve");
    try {
      await onApprove(postId);
      onOpenChange(false);
    } finally {
      setActing(null);
    }
  };

  const handleReject = async () => {
    if (!postId) return;
    setActing("reject");
    try {
      await onReject(postId);
      onOpenChange(false);
    } finally {
      setActing(null);
    }
  };

  const handlePickImage = (file: File | null) => {
    if (!file) return;
    setNewImage(file);
    setRemoveImage(false);
    setNewImagePreview(URL.createObjectURL(file));
  };

  const handleSaveEdits = async () => {
    if (!post || !user) return;
    if (!title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let nextImageUrl: string | null = post.image_url ?? null;
      if (newImage) {
        const ext = newImage.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${post.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("post-images")
          .upload(path, newImage, { upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("post-images").getPublicUrl(path);
        nextImageUrl = pub.publicUrl;
      } else if (removeImage) {
        nextImageUrl = null;
      }

      // Status intentionally untouched — inline edits keep the post where it is.
      const updates: Record<string, unknown> = {
        title: title.trim(),
        content: title.trim(),
        story: story.trim() || null,
        image_url: nextImageUrl,
      };

      const before = post as unknown as Record<string, unknown>;
      const changed: Record<string, { from: unknown; to: unknown }> = {};
      Object.entries(updates).forEach(([k, v]) => {
        if (before[k] !== v) changed[k] = { from: before[k], to: v };
      });

      const { error } = await supabase.from("posts").update(updates).eq("id", post.id);
      if (error) throw error;

      await logAdminAction({
        actorId: user.id,
        action: "post.edit",
        entityType: "post",
        entityId: post.id,
        details: { changed, source: "review_dialog_inline" },
      });

      const nextPost = { ...post, ...(updates as Partial<Post>) } as Post;
      setPost(nextPost);
      resetEditState(nextPost);
      toast({ title: "Post updated" });
      onSaved?.();
    } catch (e) {
      toast({
        title: "Could not save changes",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const statusColor =
    post?.status === "approved"
      ? "bg-green-100 text-green-800"
      : post?.status === "rejected"
        ? "bg-red-100 text-red-800"
        : "bg-amber-100 text-amber-800";

  const displayName = author?.name || author?.username || "Unknown";
  const initials = (displayName || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const shownImage = newImagePreview ?? (removeImage ? null : imageUrl);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-5xl overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Review post</SheetTitle>
        </SheetHeader>

        {loading || !post ? (
          <div className="flex justify-center py-20">
            <div className="h-7 w-7 rounded-full animate-spin border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-6 items-start">
            {/* LEFT: post + author dossier */}
            <div className="space-y-6 min-w-0">
              <section className="space-y-3">
                {editing ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="review-title">Post</Label>
                      <Textarea
                        id="review-title"
                        rows={3}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="review-story">Comment / Story</Label>
                      <Textarea
                        id="review-story"
                        rows={5}
                        value={story}
                        onChange={(e) => setStory(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Photo</Label>
                      {shownImage ? (
                        <img
                          src={shownImage}
                          alt=""
                          className="w-full max-h-64 object-cover rounded-md border"
                        />
                      ) : (
                        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground text-center">
                          No photo
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePickImage(e.target.files?.[0] ?? null)}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          {shownImage ? "Replace photo" : "Add photo"}
                        </Button>
                        {shownImage && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNewImage(null);
                              setNewImagePreview(null);
                              setRemoveImage(true);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                          >
                            <ImageOff className="h-4 w-4 mr-1" />
                            Remove photo
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button onClick={handleSaveEdits} disabled={saving}>
                        {saving ? "Saving…" : "Save changes"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => resetEditState(post)}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-foreground">{post.title}</h3>

                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt=""
                        className="w-full max-h-80 object-cover rounded-md border"
                      />
                    )}

                    {post.content?.trim() &&
                      post.content.trim() !== post.title.trim() &&
                      post.content.trim() !== post.story?.trim() && (
                        <p className="text-sm leading-6 text-card-foreground whitespace-pre-line">
                          {post.content}
                        </p>
                      )}

                    {post.story?.trim() && post.story.trim() !== post.title.trim() && (
                      <div className="rounded-md border bg-muted/40 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                          Comment / Story
                        </div>
                        <p className="text-sm leading-6 text-card-foreground whitespace-pre-line">
                          {post.story}
                        </p>
                      </div>
                    )}

                    {topicSlug && (
                      <Link
                        to={`/topic/${topicSlug}`}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        View topic page <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </>
                )}
              </section>

              <Separator />

              {/* Author block */}
              <section className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Author
                </div>
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={author?.avatar_url ?? undefined} alt={displayName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{displayName}</span>
                      {author?.username && (
                        <span className="text-sm text-muted-foreground">@{author.username}</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {(author?.city || author?.state) && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[author.city, author.state, author.country]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}
                      {authorLocation && !author?.city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {authorLocation.city}, {authorLocation.state}
                        </span>
                      )}
                      {author?.job && (
                        <span className="inline-flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          {author.job}
                        </span>
                      )}
                    </div>
                    {author?.bio && (
                      <p className="mt-2 text-sm text-card-foreground line-clamp-3">{author.bio}</p>
                    )}
                  </div>
                </div>

                {stats && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <StatBlock label="Total posts" value={stats.totalPosts} />
                    <StatBlock label="Approved" value={stats.approvedPosts} />
                    <StatBlock
                      label={topicName ? `In “${topicName}”` : "In this topic"}
                      value={stats.postsInTopic}
                    />
                  </div>
                )}

                {author && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-1">
                    {author.college && <ProfileField label="College" value={author.college} />}
                    {author.degree && <ProfileField label="Degree" value={author.degree} />}
                    {author.high_school && (
                      <ProfileField label="High school" value={author.high_school} />
                    )}
                    {author.city_born && <ProfileField label="Born in" value={author.city_born} />}
                    {author.sex && <ProfileField label="Sex" value={author.sex} />}
                  </div>
                )}
              </section>

              {stats && stats.recent.length > 0 && (
                <>
                  <Separator />
                  <section className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Recent posts by this author
                    </div>
                    <ul className="space-y-1.5">
                      {stats.recent.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center gap-2 text-sm text-card-foreground"
                        >
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full ${
                              r.status === "approved"
                                ? "bg-green-500"
                                : r.status === "rejected"
                                  ? "bg-red-500"
                                  : "bg-amber-500"
                            }`}
                          />
                          <span className="truncate flex-1">{r.title}</span>
                          {r.topic_name && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {r.topic_name}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDistanceToNow(parseISO(r.created_at))} ago
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </>
              )}
            </div>

            {/* RIGHT: action panel */}
            <aside className="lg:sticky lg:top-4 space-y-3 rounded-lg border bg-card p-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={`capitalize ${statusColor} border-0`}>
                  {post.status}
                </Badge>
                {topicName && (
                  <Badge variant="outline" className="text-primary">
                    {topicName}
                  </Badge>
                )}
                {post.is_national ? (
                  <Badge variant="outline">National</Badge>
                ) : postLocation ? (
                  <Badge variant="outline">
                    <MapPin className="h-3 w-3 mr-1" />
                    {postLocation.city}, {postLocation.state}
                  </Badge>
                ) : null}
              </div>

              <div className="text-xs text-muted-foreground">
                Submitted {formatDistanceToNow(parseISO(post.created_at))} ago
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleApprove}
                  disabled={!!acting || editing || post.status === "approved"}
                  className="w-full"
                >
                  <Check className="h-4 w-4 mr-1" />
                  {acting === "approve" ? "Approving…" : "Approve"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={!!acting || editing || post.status === "rejected"}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-1" />
                  {acting === "reject" ? "Rejecting…" : "Reject"}
                </Button>
                {onSuggestEdit && (
                  <Button
                    variant="outline"
                    onClick={() => onSuggestEdit(post.id)}
                    disabled={!!acting || editing}
                    className="w-full"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Suggest edit &amp; notify
                  </Button>
                )}
                {!editing && (
                  <Button
                    variant="ghost"
                    onClick={() => setEditing(true)}
                    disabled={!!acting}
                    className="w-full"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit post inline
                  </Button>
                )}
              </div>

              <p className="text-[11px] leading-4 text-muted-foreground">
                Inline edits save immediately and keep the post in its current status. Use
                “Suggest edit &amp; notify” to adjust and inform the author.
              </p>
            </aside>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-xl font-semibold text-foreground">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-card-foreground">{value}</div>
    </div>
  );
}
