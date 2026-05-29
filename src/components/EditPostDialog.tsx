import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface EditPostDialogProps {
  postId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const EditPostDialog = ({ postId, open, onOpenChange, onSaved }: EditPostDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>("approved");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [story, setStory] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    if (!open || !postId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, content, story, image_url, author_id, status, is_anonymous")
        .eq("id", postId)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        toast({ title: "Could not load post", variant: "destructive" });
        onOpenChange(false);
        setLoading(false);
        return;
      }
      setAuthorId(data.author_id ?? null);
      setCurrentStatus((data.status as string) ?? "approved");
      setTitle(data.title ?? "");
      setContent(data.content ?? "");
      setStory(data.story ?? "");
      setImageUrl(data.image_url ?? null);
      setIsAnonymous(!!(data as { is_anonymous?: boolean }).is_anonymous);
      setNewImage(null);
      setNewImagePreview(null);
      setRemoveImage(false);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, postId, onOpenChange, toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
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
    if (!postId || !user) return;
    if (!title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    if (authorId && authorId !== user.id) {
      toast({ title: "You can only edit your own posts", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let nextImageUrl: string | null = imageUrl;
      if (newImage) {
        const ext = newImage.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${postId}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("post-images")
          .upload(path, newImage, { upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("post-images").getPublicUrl(path);
        nextImageUrl = pub.publicUrl;
      } else if (removeImage) {
        nextImageUrl = null;
      }

      // Edits by the author re-enter moderation unless already rejected.
      const nextStatus = currentStatus === "rejected" ? "rejected" : "pending";

      const trimmedStory = story.trim();
      const updates: Record<string, unknown> = {
        title: title.trim(),
        content,
        image_url: nextImageUrl,
        status: nextStatus,
      };
      // Only touch `story` if the user typed one — keeps the update working
      // when the posts.story migration hasn't been applied to the live DB.
      if (trimmedStory) updates.story = trimmedStory;

      const { error: updErr } = await supabase
        .from("posts")
        .update(updates as never)
        .eq("id", postId);
      if (updErr) throw updErr;

      toast({
        title: "Post updated",
        description:
          nextStatus === "pending"
            ? "Your edited post will be re-reviewed before going live again."
            : undefined,
      });
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
          <DialogDescription>
            {currentStatus === "rejected"
              ? "This post was rejected. You can revise and resubmit it."
              : "Changes go back to admin review before they're public again."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="h-6 w-6 rounded-full animate-spin border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-post-title">Title</Label>
              <Input
                id="edit-post-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-post-content">Content</Label>
              <Textarea
                id="edit-post-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-post-story">Comment / Story (optional)</Label>
              <Textarea
                id="edit-post-story"
                value={story}
                onChange={(e) => setStory(e.target.value)}
                rows={4}
                placeholder="Share a comment or story regarding your post."
              />
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
};

export default EditPostDialog;
