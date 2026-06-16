import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, Pencil, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getTopicSubtitle } from "@/hooks/useSupabaseTopics";
import PostImageEditorDialog from "@/components/PostImageEditorDialog";
import type { Post } from "@/data/seedData";
import { buildPostSlug } from "@/lib/postSlug";
import { formatTitle } from "@/lib/formatTitle";

interface CreatePostDialogProps {
  topicName: string;
  categoryName: string;
  subtitleOverride?: string | null;
  existingPosts?: Post[];
  onSubmit: (detail: string, story: string, image: File | null, isAnonymous: boolean) => void;
  onDismiss?: () => void;
}

const DETAIL_CHAR_LIMIT = 99;
const SUGGEST_MIN_CHARS = 3;
const SUGGEST_MAX_RESULTS = 5;
const STOP_WORDS = new Set([
  "the", "and", "for", "with", "you", "your", "are", "but", "not", "have",
  "has", "this", "that", "from", "what", "when", "how", "why", "who",
  "about", "into", "out", "can", "will", "just", "also", "than", "then",
]);

const tokenize = (input: string): string[] => {
  return Array.from(
    new Set(
      input
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length >= SUGGEST_MIN_CHARS && !STOP_WORDS.has(t)),
    ),
  );
};

const CreatePostDialog = ({
  topicName,
  categoryName,
  existingPosts = [],
  onSubmit,
  onDismiss,
}: CreatePostDialogProps) => {
  const navigate = useNavigate();
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

  const suggestions = useMemo(() => {
    const tokens = tokenize(detail);
    if (tokens.length === 0 || existingPosts.length === 0) return [];
    // Require a meaningful match: at least half of the user's keywords must
    // appear as whole words in the candidate post (min 2 when possible).
    const minMatches = Math.max(tokens.length >= 2 ? 2 : 1, Math.ceil(tokens.length / 2));
    const scored = existingPosts
      .map((post) => {
        const haystackTokens = new Set(
          `${post.title ?? ""} ${post.content ?? ""}`
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter(Boolean),
        );
        let score = 0;
        for (const t of tokens) {
          if (haystackTokens.has(t)) score += 1;
        }
        return { post, score };
      })
      .filter((s) => s.score >= minMatches)
      .sort((a, b) => b.score - a.score)
      .slice(0, SUGGEST_MAX_RESULTS);
    return scored.map((s) => s.post);
  }, [detail, existingPosts]);

  const goToExisting = (post: Post) => {
    const title = formatTitle(post.title || post.content);
    const slug = buildPostSlug(title, post.id) || post.id;
    onDismiss?.();
    navigate(`/topic/${encodeURIComponent(topicName)}/post/${slug}`);
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
          autoComplete="off"
          placeholder="Your tip, advice, or perspective..."
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          maxLength={DETAIL_CHAR_LIMIT}
        />
        {suggestions.length > 0 && (
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Similar posts already in this topic
            </p>
            <ul className="space-y-1.5">
              {suggestions.map((post) => {
                const display = formatTitle(post.title || post.content);
                return (
                  <li key={post.id}>
                    <button
                      type="button"
                      onClick={() => goToExisting(post)}
                      className="block w-full text-left text-sm text-primary hover:underline"
                    >
                      {display}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Tap one to review it — or keep typing if yours is different.
            </p>
          </div>
        )}
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
              {comment.trim() || "Your comment or story will appear here."}
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
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
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
