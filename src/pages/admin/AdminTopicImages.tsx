import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Trash2,
  Upload,
  Search,
  RefreshCw,
  ImageOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logAdminAction } from "@/lib/auditLog";

interface TopicRow {
  id: string;
  name: string;
  category_name: string | null;
  image_url: string | null;
  pinned_image_id: string | null;
  image_count: number;
}

interface TopicImageRow {
  id: string;
  topic_id: string;
  url: string;
  average_rating: number;
  rating_count: number;
  is_approved: boolean;
  created_at: string;
}

const TopicThumb = ({ url, alt }: { url: string | null; alt: string }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  if (!url || failed) {
    return (
      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
        <ImageOff className="h-4 w-4" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className="w-10 h-10 rounded object-cover bg-muted"
      onError={() => setFailed(true)}
    />
  );
};

const ImageThumb = ({ url, alt }: { url: string; alt: string }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
        Image unavailable
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className="absolute inset-0 w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  );
};

export default function AdminTopicImages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [topicQuery, setTopicQuery] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const [images, setImages] = useState<TopicImageRow[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TopicImageRow | null>(null);
  const [supportsPinnedImages, setSupportsPinnedImages] = useState(true);
  const [supportsImageApproval, setSupportsImageApproval] = useState(true);

  const selectedTopic = useMemo(
    () => topics.find((t) => t.id === selectedTopicId) ?? null,
    [topics, selectedTopicId]
  );

  const selectedPinnedImageId = selectedTopic?.pinned_image_id ?? null;

  const fetchTopics = async () => {
    setLoadingTopics(true);
    let { data, error } = await supabase
      .from("topics")
      .select("id, name, category_name, image_url, pinned_image_id" as never)
      .order("name");

    if (error?.message.includes("pinned_image_id")) {
      setSupportsPinnedImages(false);
      const fallback = await supabase
        .from("topics")
        .select("id, name, category_name, image_url")
        .order("name");
      data = fallback.data as never;
      error = fallback.error;
    }

    if (error) {
      toast({
        title: "Error loading topics",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const imageCounts = new Map<string, number>();
      const { data: imageTopicRows } = await supabase
        .from("topic_images")
        .select("topic_id");
      ((imageTopicRows ?? []) as unknown as { topic_id: string }[]).forEach((row) => {
        imageCounts.set(row.topic_id, (imageCounts.get(row.topic_id) ?? 0) + 1);
      });

      const rows = ((data ?? []) as unknown as Partial<TopicRow>[]).map((row) => ({
        id: row.id ?? "",
        name: row.name ?? "",
        category_name: row.category_name ?? null,
        image_url: row.image_url ?? null,
        pinned_image_id: row.pinned_image_id ?? null,
        image_count: imageCounts.get(row.id ?? "") ?? 0,
      }));
      setTopics(rows);
      if (!selectedTopicId && rows.length > 0) {
        setSelectedTopicId((rows.find((row) => row.image_count > 0) ?? rows[0]).id);
      }
    }
    setLoadingTopics(false);
  };

  const fetchImages = async (topicId: string) => {
    setLoadingImages(true);
    let { data, error } = await supabase
      .from("topic_images")
      .select(
        "id, topic_id, url, average_rating, rating_count, is_approved, created_at" as never
      )
      .eq("topic_id", topicId)
      .order("average_rating", { ascending: false })
      .order("created_at", { ascending: true });

    if (error?.message.includes("is_approved")) {
      setSupportsImageApproval(false);
      const fallback = await supabase
        .from("topic_images")
        .select("id, topic_id, url, average_rating, rating_count, created_at")
        .eq("topic_id", topicId)
        .order("average_rating", { ascending: false })
        .order("created_at", { ascending: true });
      data = fallback.data as never;
      error = fallback.error;
    }

    if (error) {
      toast({
        title: "Error loading images",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setImages(
        ((data ?? []) as unknown as Partial<TopicImageRow>[]).map((row) => ({
          id: row.id ?? "",
          topic_id: row.topic_id ?? topicId,
          url: row.url ?? "",
          average_rating: Number(row.average_rating ?? 0),
          rating_count: row.rating_count ?? 0,
          is_approved: row.is_approved ?? true,
          created_at: row.created_at ?? new Date().toISOString(),
        })),
      );
    }
    setLoadingImages(false);
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    if (selectedTopicId) fetchImages(selectedTopicId);
    else setImages([]);
  }, [selectedTopicId]);

  const filteredTopics = useMemo(() => {
    const q = topicQuery.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.category_name ?? "").toLowerCase().includes(q)
    );
  }, [topics, topicQuery]);

  const audit = (
    action: string,
    entityId: string,
    details: Record<string, unknown>
  ) => {
    if (!user) return;
    logAdminAction({
      actorId: user.id,
      action: action as never,
      entityType: "topic",
      entityId,
      details,
    });
  };

  const handlePin = async (img: TopicImageRow) => {
    if (!selectedTopic) return;
    let { error } = await supabase
      .from("topics")
      .update(
        supportsPinnedImages
          ? ({ pinned_image_id: img.id, image_url: img.url } as never)
          : ({ image_url: img.url } as never),
      )
      .eq("id", selectedTopic.id);

    if (error?.message.includes("pinned_image_id")) {
      setSupportsPinnedImages(false);
      const fallback = await supabase
        .from("topics")
        .update({ image_url: img.url } as never)
        .eq("id", selectedTopic.id);
      error = fallback.error;
    }

    if (error) {
      toast({
        title: "Couldn't pin image",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    audit("topic.image.pin", selectedTopic.id, {
      image_id: img.id,
      url: img.url,
    });
    toast({
      title: "Pinned as topic header",
      description: supportsPinnedImages
        ? undefined
        : "Using topic header image fallback until the pinned-image migration is applied.",
    });
    fetchTopics();
  };

  const handleUnpin = async () => {
    if (!selectedTopic) return;
    let { error } = await supabase
      .from("topics")
      .update(
        supportsPinnedImages
          ? ({ pinned_image_id: null } as never)
          : ({ image_url: null } as never),
      )
      .eq("id", selectedTopic.id);

    if (error?.message.includes("pinned_image_id")) {
      setSupportsPinnedImages(false);
      const fallback = await supabase
        .from("topics")
        .update({ image_url: null } as never)
        .eq("id", selectedTopic.id);
      error = fallback.error;
    }

    if (error) {
      toast({
        title: "Couldn't unpin",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    audit("topic.image.unpin", selectedTopic.id, {});
    toast({
      title: "Unpinned",
      description: "Community voting will resume choosing the header.",
    });
    fetchTopics();
  };

  const handleToggleApproved = async (img: TopicImageRow) => {
    if (!supportsImageApproval) {
      toast({
        title: "Image visibility controls unavailable",
        description: "Apply the topic image admin migration to approve or hide candidate images.",
        variant: "destructive",
      });
      return;
    }

    const next = !img.is_approved;
    const { error } = await supabase
      .from("topic_images")
      .update({ is_approved: next } as never)
      .eq("id", img.id);
    if (error) {
      toast({
        title: "Couldn't update image",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    audit(next ? "topic.image.approve" : "topic.image.hide", img.topic_id, {
      image_id: img.id,
    });
    fetchImages(img.topic_id);
  };

  const handleDelete = async (img: TopicImageRow) => {
    // Surface RLS / FK errors instead of failing silently.
    const { error } = await supabase
      .from("topic_images")
      .delete()
      .eq("id", img.id);
    if (error) {
      toast({
        title: "Couldn't delete image",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    audit("topic.image.delete", img.topic_id, {
      image_id: img.id,
      url: img.url,
    });
    toast({ title: "Image deleted" });
    setDeleteTarget(null);
    fetchImages(img.topic_id);
    // pinned FK is ON DELETE SET NULL, so refresh the topic row to reflect that.
    fetchTopics();
  };

  const handleUpload = async (file: File) => {
    if (!selectedTopic) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Use JPEG, PNG, or WebP", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be 5MB or smaller", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user?.id ?? "admin"}/topic-images/${selectedTopic.id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("post-images")
      .upload(path, file, { upsert: false });
    if (upErr) {
      toast({
        title: "Upload failed",
        description: upErr.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }
    const url = supabase.storage.from("post-images").getPublicUrl(path).data
      .publicUrl;
    let { data: inserted, error } = await supabase
      .from("topic_images")
      .insert({
        topic_id: selectedTopic.id,
        url,
        is_approved: true,
        uploaded_by: user?.id ?? null,
      } as never)
      .select("id")
      .single();

    if (error?.message.includes("is_approved") || error?.message.includes("uploaded_by")) {
      setSupportsImageApproval(false);
      const fallback = await supabase
        .from("topic_images")
        .insert({
          topic_id: selectedTopic.id,
          url,
        } as never)
        .select("id")
        .single();
      inserted = fallback.data;
      error = fallback.error;
    }

    if (error) {
      toast({
        title: "Couldn't add image",
        description: error.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }
    const newId = (inserted as unknown as { id: string } | null)?.id;
    if (newId) {
      audit("topic.image.upload", selectedTopic.id, {
        image_id: newId,
        url,
      });
    }
    toast({ title: "Image added" });
    setUploading(false);
    fetchImages(selectedTopic.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Topic Images</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pick which images appear in the ranking dialog. Pin one to override
            community voting.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchTopics();
            if (selectedTopicId) fetchImages(selectedTopicId);
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-4 xl:col-span-3 border rounded-md bg-card flex flex-col max-h-[calc(100vh-220px)]">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={topicQuery}
                onChange={(e) => setTopicQuery(e.target.value)}
                placeholder="Search topics"
                className="pl-8 h-9"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingTopics && (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                Loading topics…
              </div>
            )}
            {!loadingTopics && filteredTopics.length === 0 && (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                No topics match.
              </div>
            )}
            <ul>
              {filteredTopics.map((t) => {
                const active = t.id === selectedTopicId;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedTopicId(t.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 flex items-center gap-3 border-b last:border-b-0 transition-colors",
                        active
                          ? "bg-primary/10"
                          : "hover:bg-muted/60"
                      )}
                    >
                      <TopicThumb url={t.image_url} alt={t.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate text-foreground">
                            {t.name}
                          </span>
                          {(t.pinned_image_id || (!supportsPinnedImages && t.image_url)) && (
                            <Pin className="h-3 w-3 text-secondary shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {t.category_name ?? "—"} · {t.image_count} image
                          {t.image_count === 1 ? "" : "s"}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <section className="col-span-8 xl:col-span-9 space-y-4">
          {!selectedTopic ? (
            <div className="rounded-md border bg-card p-10 text-center text-sm text-muted-foreground">
              Pick a topic to manage its images.
            </div>
          ) : (
            <>
              <div className="rounded-md border bg-card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <TopicThumb
                    url={selectedTopic.image_url}
                    alt={selectedTopic.name}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold truncate text-foreground">
                        {selectedTopic.name}
                      </h2>
                      {selectedPinnedImageId || (!supportsPinnedImages && selectedTopic.image_url) ? (
                        <Badge
                          variant="secondary"
                          className="gap-1 bg-secondary text-secondary-foreground"
                        >
                          <Pin className="h-3 w-3" /> Admin-pinned
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Voting selects header
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedTopic.category_name ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {(selectedPinnedImageId || (!supportsPinnedImages && selectedTopic.image_url)) && (
                    <Button variant="outline" size="sm" onClick={handleUnpin}>
                      <PinOff className="h-4 w-4 mr-2" />
                      Unpin
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading…" : "Upload image"}
                  </Button>
                </div>
              </div>

              {loadingImages ? (
                <div className="rounded-md border bg-card p-10 text-center text-sm text-muted-foreground">
                  Loading images…
                </div>
              ) : images.length === 0 ? (
                <div className="rounded-md border bg-card p-10 text-center text-sm text-muted-foreground">
                  No candidate images yet. Upload one to seed the gallery.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {images.map((img) => {
                    const isPinned = supportsPinnedImages
                      ? selectedPinnedImageId === img.id
                      : selectedTopic.image_url === img.url;
                    return (
                      <div
                        key={img.id}
                        className={cn(
                          "rounded-md border bg-card overflow-hidden flex flex-col",
                          isPinned && "ring-2 ring-secondary"
                        )}
                      >
                        <div className="relative aspect-[4/3] bg-muted">
                          <ImageThumb url={img.url} alt="Candidate" />
                          {!img.is_approved && (
                            <div className="absolute inset-0 bg-background/70 flex items-center justify-center text-xs font-medium text-muted-foreground">
                              Hidden from users
                            </div>
                          )}
                          {isPinned && (
                            <Badge className="absolute top-2 left-2 gap-1 bg-secondary text-secondary-foreground">
                              <Pin className="h-3 w-3" /> Pinned
                            </Badge>
                          )}
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Rank{" "}
                              <span className="text-secondary font-semibold tabular-nums">
                                {img.rating_count > 0
                                  ? Number(img.average_rating).toFixed(1)
                                  : "—"}
                              </span>
                            </span>
                            <span className="text-muted-foreground">
                              {img.rating_count} vote
                              {img.rating_count === 1 ? "" : "s"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              size="sm"
                              variant={isPinned ? "secondary" : "default"}
                              className="h-8 px-2 text-xs flex-1 min-w-[88px]"
                              onClick={() =>
                                isPinned ? handleUnpin() : handlePin(img)
                              }
                              disabled={!img.is_approved && !isPinned}
                              title={
                                !img.is_approved && !isPinned
                                  ? "Approve before pinning"
                                  : undefined
                              }
                            >
                              {isPinned ? (
                                <>
                                  <PinOff className="h-3.5 w-3.5 mr-1" />
                                  Unpin
                                </>
                              ) : (
                                <>
                                  <Pin className="h-3.5 w-3.5 mr-1" />
                                  Pin
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-xs"
                              onClick={() => handleToggleApproved(img)}
                              title={
                                img.is_approved
                                  ? "Hide from ranking dialog"
                                  : "Show in ranking dialog"
                              }
                            >
                              {img.is_approved ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(img)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this candidate image?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the image and all of its ratings. If it was pinned,
              the topic header will revert to community voting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
