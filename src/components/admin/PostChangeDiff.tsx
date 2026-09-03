import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { diffWords, hasTextChange, type DiffPart } from "@/lib/wordDiff";

interface Revision {
  edited_at: string;
  edited_by: string | null;
  title: string | null;
  content: string | null;
  story: string | null;
}

interface Props {
  postId?: string | null;
  /** Post text as it currently reads in the dialog (live, includes admin edits). */
  currentText: string;
  /** Story / comment as it currently reads in the dialog. */
  currentStory: string;
}

/**
 * Inline, track-changes style diff of the most recent prior revision against
 * the current post text. Renders nothing at all when the post has no history.
 */
export default function PostChangeDiff({ postId, currentText, currentStory }: Props) {
  const [revision, setRevision] = useState<Revision | null>(null);
  const [editorLabel, setEditorLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) {
      setRevision(null);
      setEditorLabel(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("post_revisions")
        .select("edited_at, edited_by, title, content, story")
        .eq("post_id", postId)
        .order("edited_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      setRevision((data as Revision) ?? null);
      setEditorLabel(null);
      if (data?.edited_by) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("name, username")
          .eq("id", data.edited_by)
          .maybeSingle();
        if (!cancelled) setEditorLabel(prof?.name || prof?.username || null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  if (!revision) return null;

  const previousText = revision.title ?? revision.content ?? "";
  const previousStory = revision.story ?? "";

  const textChanged = hasTextChange(previousText, currentText);
  const storyChanged = hasTextChange(previousStory, currentStory);
  if (!textChanged && !storyChanged) return null;

  const when = new Date(revision.edited_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        What changed
      </div>
      <p className="text-[11px] text-muted-foreground">
        Edited by {editorLabel ?? "the author"} on {when}. Struck through red text was removed,
        highlighted green text was added.
      </p>
      <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
        {textChanged && (
          <DiffSection label="Post" before={previousText} after={currentText} />
        )}
        {storyChanged && (
          <DiffSection label="Comment / story" before={previousStory} after={currentStory} />
        )}
      </div>
    </div>
  );
}

function DiffSection({ label, before, after }: { label: string; before: string; after: string }) {
  const parts = diffWords(before, after);
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
        {parts.map((part, i) => (
          <DiffToken key={i} part={part} />
        ))}
      </p>
    </div>
  );
}

function DiffToken({ part }: { part: DiffPart }) {
  if (part.type === "removed") {
    return (
      <del
        className="rounded-sm bg-[hsl(var(--diff-removed-bg))] px-0.5 text-[hsl(var(--diff-removed-fg))] line-through decoration-2"
        aria-label={`Removed: ${part.value}`}
      >
        {part.value}
      </del>
    );
  }
  if (part.type === "added") {
    return (
      <ins
        className="rounded-sm bg-[hsl(var(--diff-added-bg))] px-0.5 font-medium text-[hsl(var(--diff-added-fg))] no-underline"
        aria-label={`Added: ${part.value}`}
      >
        {part.value}
      </ins>
    );
  }
  return <span>{part.value}</span>;
}
