import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { logAdminAction } from "@/lib/auditLog";
import type { Tables } from "@/integrations/supabase/types";

type Post = Tables<"posts">;
type TopicLite = Pick<Tables<"topics">, "id" | "name">;

interface AuthorInfo {
  id: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string | null;
  email: string | null;
  totalPosts: number;
  approvedPosts: number;
  pendingPosts: number;
  rejectedPosts: number;
}

interface Props {
  postId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const STATUS_OPTIONS = ["pending", "approved", "rejected"] as const;

export default function AdminEditPostDialog({ postId, open, onOpenChange, onSaved }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [topics, setTopics] = useState<TopicLite[]>([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [story, setStory] = useState("");
  const [topicId, setTopicId] = useState<string>("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("pending");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isNational, setIsNational] = useState(false);
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [author, setAuthor] = useState<AuthorInfo | null>(null);

  useEffect(() => {
    if (!open || !postId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [postRes, topicsRes] = await Promise.all([
        supabase.from("posts").select("*").eq("id", postId).maybeSingle(),
        supabase.from("topics").select("id, name").order("name"),
      ]);
      if (cancelled) return;
      const p = postRes.data as Post | null;
      setPost(p);
      setTopics((topicsRes.data ?? []) as TopicLite[]);

      if (p) {
        const combined = (p.content ?? "").trim() || (p.title ?? "");
        setTitle(combined);
        setContent(combined);
        setStory(p.story ?? "");
        setTopicId(p.topic_id);
        setStatus((p.status as typeof status) ?? "pending");
        setIsAnonymous(!!p.is_anonymous);
        setIsNational(!!p.is_national);
        setImageUrl(p.image_url ?? null);
        setNewImage(null);
        setNewImagePreview(null);
        setRemoveImage(false);
        setCity("");
        setStateCode("");
        setAuthor(null);

        // Author profile + post stats — helps admins spot spam accounts
        // (no bio, very recent signup, lots of rejected posts, etc.).
        if (p.author_id) {
          const [profileRes, postsRes] = await Promise.all([
            supabase
              .from("profiles")
              .select("id, username, name, avatar_url, bio, created_at")
              .eq("id", p.author_id)
              .maybeSingle(),
            supabase
              .from("posts")
              .select("status")
              .eq("author_id", p.author_id),
          ]);
          if (!cancelled) {
            const profile = profileRes.data as
              | {
                  id: string;
                  username: string | null;
                  name: string | null;
                  avatar_url: string | null;
                  bio: string | null;
                  created_at: string | null;
                }
              | null;
            const rows = (postsRes.data ?? []) as Array<{ status: string | null }>;
            const counts = rows.reduce(
              (acc, r) => {
                acc.total += 1;
                const s = r.status ?? "approved";
                if (s === "approved") acc.approved += 1;
                else if (s === "pending") acc.pending += 1;
                else if (s === "rejected") acc.rejected += 1;
                return acc;
              },
              { total: 0, approved: 0, pending: 0, rejected: 0 }
            );
            setAuthor({
              id: p.author_id,
              username: profile?.username ?? null,
              name: profile?.name ?? null,
              avatarUrl: profile?.avatar_url ?? null,
              bio: profile?.bio ?? null,
              createdAt: profile?.created_at ?? null,
              email: null,
              totalPosts: counts.total,
              approvedPosts: counts.approved,
              pendingPosts: counts.pending,
              rejectedPosts: counts.rejected,
            });
          }
        }

        if (p.location_id) {
          const { data: loc } = await supabase
            .from("locations")
            .select("city, state")
            .eq("id", p.location_id)
            .maybeSingle();
          if (!cancelled && loc) {
            setCity(loc.city ?? "");
            setStateCode(loc.state ?? "");
          }
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, postId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 5 MB.", variant: "destructive" });
      return;
    }
    setNewImage(file);
    setNewImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const clearImageSelection = () => {
    setNewImage(null);
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    setNewImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!post || !user) return;
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast({ title: "Post required", variant: "destructive" });
      return;
    }
    setSaving(true);

    let nextImageUrl: string | null = post.image_url ?? null;
    try {
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

      // City/state and national flag are fixed at post creation time and
      // intentionally not editable here — admins shouldn't be able to relocate
      // a post after the fact.
      const trimmedStory = story.trim();
      const updates: Record<string, unknown> = {
        title: trimmedContent,
        content: trimmedContent,
        topic_id: topicId,
        status,
        is_anonymous: isAnonymous,
        image_url: nextImageUrl,
      };
      // Only include `story` when set — works even if the posts.story
      // migration isn't live yet.
      if (trimmedStory) updates.story = trimmedStory;

      const { error: updErr } = await supabase.from("posts").update(updates).eq("id", post.id);
      if (updErr) throw updErr;

      const changed: Record<string, { from: unknown; to: unknown }> = {};
      const before = post as unknown as Record<string, unknown>;
      Object.entries(updates).forEach(([k, v]) => {
        if (before[k] !== v) changed[k] = { from: before[k], to: v };
      });

      await logAdminAction({
        actorId: user.id,
        action: "post.edit",
        entityType: "post",
        entityId: post.id,
        details: { changed },
      });

      toast({ title: "Post updated" });
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save changes";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const previewSrc = newImagePreview ?? (removeImage ? null : imageUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit post</DialogTitle>
        </DialogHeader>

        {loading || !post ? (
          <div className="py-12 flex justify-center">
            <div className="h-6 w-6 rounded-full animate-spin border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-content">Post</Label>
              <Input
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-story">Comment / Story</Label>
              <Textarea
                id="edit-story"
                value={story}
                onChange={(e) => setStory(e.target.value)}
                rows={4}
                placeholder="Optional long-form context the author shared."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Topic</Label>
                <Select value={topicId} onValueChange={setTopicId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {topics.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Image</Label>
              {previewSrc ? (
                <div className="relative rounded-md overflow-hidden border">
                  <img src={previewSrc} alt="" className="w-full max-h-64 object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      clearImageSelection();
                      setRemoveImage(true);
                    }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No image</div>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4 mr-1" />
                  {previewSrc ? "Replace image" : "Add image"}
                </Button>
                {newImage && (
                  <Button type="button" variant="ghost" size="sm" onClick={clearImageSelection}>
                    Cancel
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            </div>

            {author && (
              <div className="space-y-2 pt-1">
                <Label className="text-xs text-muted-foreground">Author</Label>
                <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      {author.avatarUrl ? (
                        <AvatarImage src={author.avatarUrl} alt={author.username ?? ""} />
                      ) : null}
                      <AvatarFallback>
                        {(author.username ?? author.name ?? "?").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {author.name ?? author.username ?? "Unknown user"}
                      </div>
                      {author.username && (
                        <div className="text-xs text-muted-foreground truncate">
                          @{author.username}
                        </div>
                      )}
                      {author.createdAt && (
                        <div className="text-xs text-muted-foreground">
                          Joined{" "}
                          {new Date(author.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-foreground">
                    {author.bio?.trim() ? (
                      <p className="whitespace-pre-wrap">{author.bio}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No bio</p>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="rounded border bg-background p-2">
                      <div className="text-sm font-semibold text-foreground">
                        {author.totalPosts}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Total
                      </div>
                    </div>
                    <div className="rounded border bg-background p-2">
                      <div className="text-sm font-semibold text-foreground">
                        {author.approvedPosts}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Approved
                      </div>
                    </div>
                    <div className="rounded border bg-background p-2">
                      <div className="text-sm font-semibold text-foreground">
                        {author.pendingPosts}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Pending
                      </div>
                    </div>
                    <div className="rounded border bg-background p-2">
                      <div className="text-sm font-semibold text-foreground">
                        {author.rejectedPosts}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Rejected
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <Label className="text-xs text-muted-foreground">Location (locked)</Label>
              <div className="flex items-center gap-2">
                <Checkbox id="edit-national" checked={isNational} disabled />
                <Label htmlFor="edit-national" className="font-normal text-muted-foreground">
                  National (no city)
                </Label>
              </div>
              {!isNational && (
                <div className="grid grid-cols-[1fr_120px] gap-2">
                  <Input placeholder="City" value={city} readOnly disabled />
                  <Input placeholder="ST" maxLength={2} value={stateCode} readOnly disabled />
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
