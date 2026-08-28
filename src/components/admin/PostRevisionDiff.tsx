import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { wordDiff, hasDiff, type DiffToken } from "@/lib/wordDiff";

interface Revision {
  edited_at: string;
  title: string | null;
  content: string | null;
  story: string | null;
  image_url: string | null;
  is_anonymous: boolean | null;
}

interface Props {
  postId?: string | null;
  /** Current values as they read right now in the review dialog. */
  currentText: string;
  currentStory: string;
}

const Tokens = ({ tokens }: { tokens: DiffToken[] }) => (
  <p className="whitespace-pre-wrap text-sm leading-relaxed">
    {tokens.map((t, i) =>
      t.op === "same" ? (
        <span key={i}>{t.text}</span>
      ) : t.op === "added" ? (
        <mark key={i} className="rounded bg-primary/15 px-0.5 text-primary">
          {t.text}
        </mark>
      ) : (
        <mark key={i} className="rounded bg-destructive/10 px-0.5 text-destructive line-through">
          {t.text}
        </mark>
      ),
    )}
  </p>
);

/**
 * "Edited Post" comparison — shows the previous stored version against the
 * current one with a word-level diff. Renders nothing when the post has no
 * revision history (everything edited before revisions existed).
 */
export default function PostRevisionDiff({ postId, currentText, currentStory }: Props) {
  const [revision, setRevision] = useState<Revision | null>(null);

  useEffect(() => {
    if (!postId) {
      setRevision(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("post_revisions")
        .select("edited_at, title, content, story, image_url, is_anonymous")
        .eq("post_id", postId)
        .order("edited_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setRevision((data as Revision) ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  if (!revision) return null;

  const prevText = (revision.title ?? revision.content ?? "").trim();
  const prevStory = (revision.story ?? "").trim();
  const textTokens = wordDiff(prevText, currentText.trim());
  const storyTokens = wordDiff(prevStory, currentStory.trim());
  const textChanged = hasDiff(textTokens);
  const storyChanged = hasDiff(storyTokens);

  if (!textChanged && !storyChanged) return null;

  return (
    <div className="space-y-3 rounded-md border border-secondary/40 bg-muted/30 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-xs uppercase tracking-wide">Edited post — what changed</Label>
        <span className="text-[11px] text-muted-foreground">
          previous version {new Date(revision.edited_at).toLocaleString()}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        <span className="text-destructive line-through">removed</span> ·{" "}
        <span className="text-primary">added</span>
      </p>

      {textChanged && (
        <div className="space-y-1">
          <Label className="text-xs">Post</Label>
          <Tokens tokens={textTokens} />
        </div>
      )}

      {storyChanged && (
        <div className="space-y-1">
          <Label className="text-xs">Comment / story</Label>
          <Tokens tokens={storyTokens} />
        </div>
      )}
    </div>
  );
}
