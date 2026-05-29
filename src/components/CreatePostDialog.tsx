import { useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getTopicSubtitle } from "@/hooks/useSupabaseTopics";
import PostImageEditorDialog from "@/components/PostImageEditorDialog";

interface CreatePostDialogProps {
  topicName: string;
  categoryName: string;
  onSubmit: (detail: string, story: string, image: File | null, isAnonymous: boolean) => void;
}

const DETAIL_CHAR_LIMIT = 99;

const CreatePostDialog = ({ topicName, categoryName, onSubmit }: CreatePostDialogProps) => {
  const [subject, setSubject] = useState(topicName);
  const [detail, setDetail] = useState("");
  const [comment, setComment] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceImagePreviewRef = useRef<string | null>(null);
  const imagePreviewRef = useRef<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearImage();
    setSourceImagePreview(URL.createObjectURL(file));
    setImageEditorOpen(true);
  };

  const clearImage = () => {
    setImage(null);
    if (sourceImagePreview) URL.revokeObjectURL(sourceImagePreview);
    setSourceImagePreview(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageEditorOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleApplyImage = (file: File, previewUrl: string) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(file);
    setImagePreview(previewUrl);
  };

  const chooseDifferentImage = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
  };

  const handleSubmit = () => {
    if (!detail.trim()) return;
    onSubmit(detail.trim(), comment.trim(), image, isAnonymous);
  };

  useEffect(() => {
    sourceImagePreviewRef.current = sourceImagePreview;
  }, [sourceImagePreview]);

  useEffect(() => {
    imagePreviewRef.current = imagePreview;
  }, [imagePreview]);

  useEffect(() => {
    return () => {
      if (sourceImagePreviewRef.current) URL.revokeObjectURL(sourceImagePreviewRef.current);
      if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
    };
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-orange-500">
          You're About to Create a New Post
        </h2>
        <ul className="mt-2 text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li>Posts should contain useful advice, tips, or insights</li>
          <li>Be respectful and constructive in your contributions</li>
          <li>Avoid duplicate posts — check existing ones first</li>
        </ul>
      </div>

      {/* Subject */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="subject">Subject</Label>
          <span className="text-xs text-muted-foreground">{subject.length} characters</span>
        </div>
        <Input
          id="subject"
          value={subject}
          readOnly
          className="bg-muted cursor-not-allowed"
        />
      </div>

      {/* Preview */}
      <div className="rounded-md bg-muted/50 px-3 py-2">
        <p className="text-sm text-muted-foreground">
          {subject ? getTopicSubtitle(subject, categoryName) : "What are the most important details of being a ..."}
        </p>
      </div>

      {/* Detail */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="detail">Detail</Label>
          <span className={`text-xs ${detail.length > DETAIL_CHAR_LIMIT ? "text-red-500" : "text-muted-foreground"}`}>
            {detail.length}/{DETAIL_CHAR_LIMIT}
          </span>
        </div>
        <Input
          id="detail"
          autoFocus
          placeholder="Your tip, advice, or perspective..."
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          maxLength={DETAIL_CHAR_LIMIT}
        />
      </div>

      {/* Comment/story */}
      <div className="space-y-1.5">
        <Label htmlFor="comment">Comment / Story (optional)</Label>
        <Textarea
          id="comment"
          placeholder="Share a comment or story regarding your post."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
      </div>

      {/* Image upload */}
      <div className="space-y-1.5">
        <Label>Photo (optional)</Label>
        {imagePreview ? (
          <div className="space-y-3">
            <div className="relative max-w-md overflow-hidden rounded-lg border bg-muted">
              <img
                src={imagePreview}
                alt="Selected post preview"
                className="aspect-[4/3] w-full object-cover"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute right-2 top-2 rounded-full border bg-background p-1.5 shadow-sm hover:bg-accent"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImageEditorOpen(true)}
                disabled={!sourceImagePreview}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit crop
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={chooseDifferentImage}>
                <ImagePlus className="mr-2 h-4 w-4" />
                Replace photo
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={chooseDifferentImage}
            className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-md text-sm text-muted-foreground hover:bg-accent/40"
          >
            <ImagePlus className="w-4 h-4" />
            Add a photo
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>

      {(detail.trim() || imagePreview) && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {subject}
            </div>
            <h3 className="mb-3 text-lg font-heading font-semibold text-primary">
              {detail.trim() || "Your post detail will appear here"}
            </h3>
            {imagePreview && (
              <img
                src={imagePreview}
                alt=""
                className="mb-3 aspect-[4/3] w-full max-w-[480px] rounded-lg border object-cover"
              />
            )}
            <p className="whitespace-pre-line text-sm leading-6 text-card-foreground">
              {detail.trim() || "Add a detail to preview the finished post."}
            </p>
          </div>
        </div>
      )}

      {/* Anonymous toggle */}
      <label className="flex items-start gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-input accent-primary cursor-pointer"
        />
        <span className="text-sm">
          <span className="font-medium text-foreground">Post anonymously</span>
          <span className="block text-xs text-muted-foreground">
            Your username and avatar won't be shown on this post.
          </span>
        </span>
      </label>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!detail.trim()}
        className="w-full bg-[#1a2340] hover:bg-[#252f4a] text-white font-semibold tracking-wide"
      >
        SUBMIT
      </Button>

      {/* Helpful hints */}
      <div className="border-t pt-4">
        <p className="text-sm font-semibold text-muted-foreground mb-2">
          Want a popular post? Here's some helpful hints:
        </p>
        <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
          <li>Write your post short using the fewest amount of words to make your point.</li>
          <li>Make sure there are no spelling or grammatical errors.</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">Hate messages will not be posted.</p>
        <p className="text-xs text-muted-foreground mt-2">Thanks</p>

      </div>

      <PostImageEditorDialog
        open={imageEditorOpen}
        imageSrc={sourceImagePreview}
        onOpenChange={setImageEditorOpen}
        onApply={handleApplyImage}
        onReselect={chooseDifferentImage}
      />
    </div>
  );
};

export default CreatePostDialog;
