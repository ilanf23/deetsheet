import { useState, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getTopicSubtitle } from "@/hooks/useSupabaseTopics";

interface CreatePostDialogProps {
  topicName: string;
  categoryName: string;
  onSubmit: (detail: string, image: File | null, anonymous: boolean) => void;
}

const DETAIL_CHAR_LIMIT = 200;

const CreatePostDialog = ({ topicName, categoryName, onSubmit }: CreatePostDialogProps) => {
  const [subject, setSubject] = useState(topicName);
  const [detail, setDetail] = useState("");
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!detail.trim()) return;
    onSubmit(detail.trim(), image, anonymous);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-orange-500 italic">
          You're About to Create a New Sub-Topic
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
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      {/* Preview */}
      <div className="rounded-md bg-muted/50 px-3 py-2">
        <p className="text-sm text-muted-foreground italic">
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
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-48 rounded-md border"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-background border rounded-full p-1 shadow-sm hover:bg-accent"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
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

      {/* Anonymous checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="anonymous"
          checked={anonymous}
          onCheckedChange={(checked) => setAnonymous(checked === true)}
        />
        <Label htmlFor="anonymous" className="text-sm cursor-pointer">
          Create post anonymously
        </Label>
      </div>

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
          <li>Keep your post concise and actionable</li>
          <li>Share advice from personal experience</li>
          <li>Be specific — vague tips don't help anyone</li>
          <li>Think about what you wish you knew earlier</li>
        </ul>
      </div>
    </div>
  );
};

export default CreatePostDialog;
