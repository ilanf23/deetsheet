import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@/data/seedData";
import { getTopicSubtitle } from "@/hooks/useSupabaseTopics";

interface CreatePostDialogProps {
  topicName: string;
  categoryName: string;
  onSubmit: (detail: string, category: string) => void;
}

const DETAIL_CHAR_LIMIT = 200;

const CreatePostDialog = ({ topicName, categoryName, onSubmit }: CreatePostDialogProps) => {
  const [subject, setSubject] = useState(topicName);
  const [detail, setDetail] = useState("");
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState(categoryName);
  const [anonymous, setAnonymous] = useState(true);

  const handleSubmit = () => {
    if (!detail.trim()) return;
    onSubmit(detail.trim(), category);
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
          {subject ? getTopicSubtitle(subject, category) : "What are the most important details of being a ..."}
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

      {/* Category */}
      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
