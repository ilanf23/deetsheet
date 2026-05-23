import { useEffect, useRef, useState } from "react";
import { ChevronDown, Hash, ImagePlus, MessageSquare, User as UserIcon, X } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useProfileFollowCounts } from "@/hooks/useUserFollow";
import { useFollowing, useFollowers } from "@/hooks/useFollowLists";
import { logAdminAction } from "@/lib/auditLog";
import type { Tables } from "@/integrations/supabase/types";

type Post = Tables<"posts">;
type TopicLite = Pick<Tables<"topics">, "id" | "name">;

interface AuthorPost {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  topicName: string | null;
}

interface AuthorTopic {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

interface AuthorComment {
  id: string;
  content: string;
  createdAt: string;
  postTitle: string | null;
}

interface AuthorInfo {
  id: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string | null;
  email: string | null;
  education: string | null;
  highSchool: string | null;
  college: string | null;
  degree: string | null;
  major: string | null;
  job: string | null;
  cityBorn: string | null;
  sex: string | null;
  favoriteMovie: string | null;
  reading: string | null;
  birthDay: string | null;
  birthMonth: string | null;
  birthYear: string | null;
  locationLabel: string | null;
  totalPosts: number;
  approvedPosts: number;
  pendingPosts: number;
  rejectedPosts: number;
  topicCount: number;
  commentCount: number;
  posts: AuthorPost[];
}

const EDUCATION_LABELS: Record<string, string> = {
  "grade-school": "Grade School",
  "high-school": "High School",
  "trade-school": "Trade School",
  bachelors: "Bachelors",
  masters: "Masters",
  doctorate: "Doctorate",
};

/** Best-effort age from a stored birthdate. Year is required; month/day refine it. */
function computeAge(
  year: string | null,
  month: string | null,
  day: string | null
): number | null {
  const y = year ? parseInt(year, 10) : NaN;
  if (!y || Number.isNaN(y)) return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  const m = month ? parseInt(month, 10) : NaN;
  const d = day ? parseInt(day, 10) : NaN;
  if (!Number.isNaN(m)) {
    const curM = now.getMonth() + 1;
    if (curM < m || (curM === m && !Number.isNaN(d) && now.getDate() < d)) age -= 1;
  }
  return age >= 0 && age < 150 ? age : null;
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

  // Author activity tabs — mirror the public profile page. Topics and comments
  // load lazily the first time their tab is opened; follow lists come from the
  // shared profile hooks, also gated on the active tab.
  const [authorTab, setAuthorTab] = useState("posts");
  // Sections (Posts/Topics/Comments/Following/Followers) start collapsed so admins
  // see a compact summary first; expanding is opt-in via the chevron on each tab.
  const [authorSectionOpen, setAuthorSectionOpen] = useState(false);
  const [authorTopics, setAuthorTopics] = useState<AuthorTopic[] | null>(null);
  const [authorComments, setAuthorComments] = useState<AuthorComment[] | null>(null);
  const { data: followCounts } = useProfileFollowCounts(author?.id);
  const { data: followingData } = useFollowing(author?.id, {
    enabled: !!author && authorSectionOpen && authorTab === "following",
  });
  const { data: followersData } = useFollowers(author?.id, {
    enabled: !!author && authorSectionOpen && authorTab === "followers",
  });

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
        setAuthorTab("posts");
        setAuthorSectionOpen(false);
        setAuthorTopics(null);
        setAuthorComments(null);

        // Full author profile + every post they've written — gives admins the
        // whole picture (education, age, career, history) without leaving the
        // dialog, and helps spot spam accounts (no bio, very recent signup,
        // lots of rejected posts, etc.).
        if (p.author_id) {
          const [profileRes, postsRes, commentCountRes, topicCountRes] =
            await Promise.all([
              supabase
                .from("profiles")
                .select(
                  "id, username, name, avatar_url, bio, created_at, education, " +
                    "high_school, college, degree, major, job, city_born, sex, " +
                    "favorite_movie, reading, birth_day, birth_month, birth_year, " +
                    "city, state, country, location_id"
                )
                .eq("id", p.author_id)
                .maybeSingle(),
              supabase
                .from("posts")
                .select("id, title, status, created_at, topic_id, topics(name)")
                .eq("author_id", p.author_id)
                .order("created_at", { ascending: false }),
              supabase
                .from("comments")
                .select("id", { count: "exact", head: true })
                .eq("author_id", p.author_id),
              supabase
                .from("topics")
                .select("id", { count: "exact", head: true })
                .eq("created_by", p.author_id),
            ]);

          const profile = profileRes.data as unknown as
            | (Record<string, unknown> & {
                id: string;
                username: string | null;
                name: string | null;
                avatar_url: string | null;
                bio: string | null;
                created_at: string | null;
              })
            | null;

          // Resolve a human location: prefer the profile's own city/state,
          // fall back to the linked `locations` row.
          let locationLabel: string | null =
            [profile?.city, profile?.state, profile?.country]
              .filter(Boolean)
              .join(", ") || null;
          if (!locationLabel && profile?.location_id) {
            const { data: loc } = await supabase
              .from("locations")
              .select("city, state")
              .eq("id", profile.location_id as string)
              .maybeSingle();
            if (loc) locationLabel = [loc.city, loc.state].filter(Boolean).join(", ") || null;
          }

          if (!cancelled) {
            type AuthorPostRow = {
              id: string;
              title: string;
              status: string | null;
              created_at: string;
              topic_id: string;
              topics: { name: string } | { name: string }[] | null;
            };
            const rows = (postsRes.data ?? []) as AuthorPostRow[];
            const topicNameOf = (t: AuthorPostRow["topics"]) =>
              Array.isArray(t) ? (t[0]?.name ?? null) : (t?.name ?? null);
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
              education: (profile?.education as string) ?? null,
              highSchool: (profile?.high_school as string) ?? null,
              college: (profile?.college as string) ?? null,
              degree: (profile?.degree as string) ?? null,
              major: (profile?.major as string) ?? null,
              job: (profile?.job as string) ?? null,
              cityBorn: (profile?.city_born as string) ?? null,
              sex: (profile?.sex as string) ?? null,
              favoriteMovie: (profile?.favorite_movie as string) ?? null,
              reading: (profile?.reading as string) ?? null,
              birthDay: (profile?.birth_day as string) ?? null,
              birthMonth: (profile?.birth_month as string) ?? null,
              birthYear: (profile?.birth_year as string) ?? null,
              locationLabel,
              totalPosts: counts.total,
              approvedPosts: counts.approved,
              pendingPosts: counts.pending,
              rejectedPosts: counts.rejected,
              topicCount: topicCountRes.count ?? 0,
              commentCount: commentCountRes.count ?? 0,
              posts: rows.map((r) => ({
                id: r.id,
                title: r.title,
                status: r.status ?? "approved",
                createdAt: r.created_at,
                topicName: topicNameOf(r.topics),
              })),
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

  // Lazy-load the Topics / Comments tabs the first time they're opened.
  useEffect(() => {
    if (!author) return;
    let cancelled = false;

    if (authorSectionOpen && authorTab === "topics" && authorTopics === null) {
      void supabase
        .from("topics")
        .select("id, name, description, created_at")
        .eq("created_by", author.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (cancelled) return;
          const rows = (data ?? []) as Array<{
            id: string;
            name: string;
            description: string | null;
            created_at: string;
          }>;
          setAuthorTopics(
            rows.map((t) => ({
              id: t.id,
              name: t.name,
              description: t.description,
              createdAt: t.created_at,
            }))
          );
        });
    }

    if (authorSectionOpen && authorTab === "comments" && authorComments === null) {
      void supabase
        .from("comments")
        .select("id, content, created_at, posts(title)")
        .eq("author_id", author.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (cancelled) return;
          const rows = (data ?? []) as Array<{
            id: string;
            content: string;
            created_at: string;
            posts: { title: string } | { title: string }[] | null;
          }>;
          setAuthorComments(
            rows.map((c) => ({
              id: c.id,
              content: c.content,
              createdAt: c.created_at,
              postTitle: Array.isArray(c.posts)
                ? (c.posts[0]?.title ?? null)
                : (c.posts?.title ?? null),
            }))
          );
        });
    }

    return () => {
      cancelled = true;
    };
  }, [authorTab, authorSectionOpen, author, authorTopics, authorComments]);

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

  // Key facts shown in the Author section — every populated field, in a
  // sensible reading order. Empty fields are dropped so the list stays tight.
  const authorRows: Array<{ label: string; value: string }> = [];
  if (author) {
    const eduLabel = author.education
      ? EDUCATION_LABELS[author.education] ?? author.education
      : null;
    const age = computeAge(author.birthYear, author.birthMonth, author.birthDay);
    const timeOnPlatform = author.createdAt
      ? formatDistanceToNow(parseISO(author.createdAt))
      : null;
    const push = (label: string, value: string | number | null | undefined) => {
      if (value !== null && value !== undefined && String(value).trim() !== "")
        authorRows.push({ label, value: String(value) });
    };
    push("Name", author.name);
    push("Email", author.email);
    push("Sex", author.sex);
    push("Age", age);
    push("Town", author.locationLabel);
    push("Hometown", author.cityBorn);
    push("Education", eduLabel);
    push("High School", author.highSchool);
    push("College", author.college);
    push("Degree", author.degree);
    push("Major", author.major);
    push("Job Description", author.job);
    push("Favorite Movie", author.favoriteMovie);
    push("Favorite Book", author.reading);
    push("Time on Platform", timeOnPlatform);
  }

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
                  {/* Avatar + key facts side by side; bio sits below it all */}
                  <div className="flex items-start gap-5">
                    <Avatar className="h-28 w-28 shrink-0 rounded-md">
                      {author.avatarUrl ? (
                        <AvatarImage src={author.avatarUrl} alt={author.username ?? ""} />
                      ) : null}
                      <AvatarFallback className="rounded-md text-2xl">
                        {(author.username ?? author.name ?? "?").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="text-xl font-bold text-foreground truncate">
                        {author.username ?? author.name ?? "Unknown user"}
                        {author.username && author.name && (
                          <span className="ml-1.5 text-base font-normal text-muted-foreground">
                            ({author.username})
                          </span>
                        )}
                      </div>

                      {authorRows.length > 0 && (
                        <div className="mt-3 gap-x-8 gap-y-1.5 sm:columns-2">
                          {authorRows.map((row) => (
                            <div
                              key={row.label}
                              className="break-inside-avoid text-sm leading-7"
                            >
                              <span className="text-muted-foreground">
                                {row.label}:{" "}
                              </span>
                              <span className="font-semibold text-foreground break-words">
                                {row.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio — below all the key facts */}
                  <div className="text-sm text-foreground">
                    {author.bio?.trim() ? (
                      <p className="whitespace-pre-wrap">{author.bio}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No bio</p>
                    )}
                  </div>

                  {/* Post activity summary */}
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

                  {/* Activity tabs — mirrors the public profile page, but each
                      section is collapsed by default. Clicking a tab expands it;
                      clicking the active tab again collapses it. */}
                  <Tabs value={authorTab} onValueChange={setAuthorTab}>
                    <TabsList className="flex h-auto w-full flex-wrap justify-start gap-0 rounded-none border-b bg-transparent p-0">
                      {[
                        { value: "posts", label: "Posts", count: author.posts.length },
                        { value: "topics", label: "Topics", count: author.topicCount },
                        { value: "comments", label: "Comments", count: author.commentCount },
                        {
                          value: "following",
                          label: "Following",
                          count: followCounts?.followingCount ?? 0,
                        },
                        {
                          value: "followers",
                          label: "Followers",
                          count: followCounts?.followerCount ?? 0,
                        },
                      ].map((t) => {
                        const isActive = authorTab === t.value;
                        const isExpanded = isActive && authorSectionOpen;
                        return (
                          <TabsTrigger
                            key={t.value}
                            value={t.value}
                            onClick={(e) => {
                              // Intercept Tabs' default behavior so the same tab
                              // can toggle its section open/closed.
                              e.preventDefault();
                              if (isActive) {
                                setAuthorSectionOpen((prev) => !prev);
                              } else {
                                setAuthorTab(t.value);
                                setAuthorSectionOpen(true);
                              }
                            }}
                            aria-expanded={isExpanded}
                            className="rounded-none border-b-2 border-transparent px-3 py-2 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                          >
                            {t.label}
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              {t.count}
                            </span>
                            <ChevronDown
                              className={`ml-1 h-3.5 w-3.5 text-muted-foreground transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                              aria-hidden="true"
                            />
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>

                    {authorSectionOpen && (
                      <>
                    {/* Posts */}
                    <TabsContent value="posts" className="mt-3">
                      {author.posts.length === 0 ? (
                        <TabEmpty text="No posts yet." />
                      ) : (
                        <div className="space-y-2">
                          {author.posts.map((ap) => (
                            <Card key={ap.id} className="bg-card">
                              <CardContent className="flex items-start gap-2 p-3">
                                <span
                                  className={`mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${statusDot(
                                    ap.status
                                  )}`}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="break-words text-sm font-medium text-foreground">
                                    {ap.title}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    {ap.topicName && (
                                      <Badge variant="secondary" className="font-normal">
                                        {ap.topicName}
                                      </Badge>
                                    )}
                                    <span className="capitalize">{ap.status}</span>
                                    <span>
                                      · {formatDistanceToNow(parseISO(ap.createdAt))} ago
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Topics */}
                    <TabsContent value="topics" className="mt-3">
                      {authorTopics === null ? (
                        <TabLoading />
                      ) : authorTopics.length === 0 ? (
                        <TabEmpty text="No topics created." />
                      ) : (
                        <div className="space-y-2">
                          {authorTopics.map((t) => (
                            <Card key={t.id} className="bg-card">
                              <CardContent className="flex items-start gap-2 p-3">
                                <Hash className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-foreground">
                                    {t.name}
                                  </div>
                                  {t.description && (
                                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                      {t.description}
                                    </p>
                                  )}
                                  <div className="mt-0.5 text-xs text-muted-foreground">
                                    Created {formatDistanceToNow(parseISO(t.createdAt))} ago
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Comments */}
                    <TabsContent value="comments" className="mt-3">
                      {authorComments === null ? (
                        <TabLoading />
                      ) : authorComments.length === 0 ? (
                        <TabEmpty text="No comments yet." />
                      ) : (
                        <div className="space-y-2">
                          {authorComments.map((c) => (
                            <Card key={c.id} className="bg-card">
                              <CardContent className="flex items-start gap-2 p-3">
                                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-3 break-words text-sm text-foreground">
                                    {c.content}
                                  </p>
                                  <div className="mt-0.5 text-xs text-muted-foreground">
                                    {c.postTitle ? `on “${c.postTitle}” · ` : ""}
                                    {formatDistanceToNow(parseISO(c.createdAt))} ago
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Following */}
                    <TabsContent value="following" className="mt-3">
                      {!followingData ? (
                        <TabLoading />
                      ) : followingData.total === 0 ? (
                        <TabEmpty text="Not following anything." />
                      ) : (
                        <div className="space-y-4">
                          {followingData.users.length > 0 && (
                            <FollowGroup title={`People (${followingData.users.length})`}>
                              {followingData.users.map((u) => (
                                <PersonRow
                                  key={u.id}
                                  name={u.name || u.username || "User"}
                                  sub={u.username && u.name ? `@${u.username}` : null}
                                  avatarUrl={u.avatarUrl}
                                />
                              ))}
                            </FollowGroup>
                          )}
                          {followingData.topics.length > 0 && (
                            <FollowGroup title={`Topics (${followingData.topics.length})`}>
                              {followingData.topics.map((t) => (
                                <div
                                  key={t.id}
                                  className="flex items-center gap-2 text-sm text-foreground"
                                >
                                  <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  <span className="truncate">{t.name}</span>
                                </div>
                              ))}
                            </FollowGroup>
                          )}
                          {followingData.posts.length > 0 && (
                            <FollowGroup title={`Posts (${followingData.posts.length})`}>
                              {followingData.posts.map((p) => (
                                <div key={p.id} className="text-sm text-foreground">
                                  <span className="break-words font-medium">{p.title}</span>
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    in {p.topicName}
                                  </span>
                                </div>
                              ))}
                            </FollowGroup>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    {/* Followers */}
                    <TabsContent value="followers" className="mt-3">
                      {!followersData ? (
                        <TabLoading />
                      ) : followersData.length === 0 ? (
                        <TabEmpty text="No followers yet." />
                      ) : (
                        <div className="space-y-2">
                          {followersData.map((u) => (
                            <PersonRow
                              key={u.id}
                              name={u.name || u.username || "User"}
                              sub={u.username && u.name ? `@${u.username}` : null}
                              avatarUrl={u.avatarUrl}
                              meta={`Followed ${formatDistanceToNow(
                                parseISO(u.followedAt)
                              )} ago`}
                            />
                          ))}
                        </div>
                      )}
                    </TabsContent>
                      </>
                    )}
                  </Tabs>
                </div>
              </div>
            )}

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

/** Status → dot color, matching the post-status palette used elsewhere. */
function statusDot(status: string) {
  if (status === "approved") return "bg-green-500";
  if (status === "rejected") return "bg-red-500";
  return "bg-amber-500";
}

function TabEmpty({ text }: { text: string }) {
  return (
    <div className="rounded-md border bg-card py-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function TabLoading() {
  return (
    <div className="flex justify-center py-8">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

function FollowGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function PersonRow({
  name,
  sub,
  avatarUrl,
  meta,
}: {
  name: string;
  sub: string | null;
  avatarUrl: string | null;
  meta?: string;
}) {
  return (
    <Card className="bg-card">
      <CardContent className="flex items-center gap-3 p-3">
        <Avatar className="h-9 w-9 shrink-0">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
          <AvatarFallback>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">{name}</div>
          {sub && <div className="truncate text-xs text-muted-foreground">{sub}</div>}
          {meta && <div className="text-xs text-muted-foreground">{meta}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
