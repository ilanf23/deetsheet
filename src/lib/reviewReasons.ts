import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ReviewReasonKind = "edit" | "reject";

export interface ReviewReason {
  id: string;
  kind: ReviewReasonKind;
  label: string;
  detail: string;
  sort_order: number;
}

/** Client-approved defaults, used when the admin-managed table is empty. */
export const DEFAULT_EDIT_REASONS: Omit<ReviewReason, "id">[] = [
  { kind: "edit", label: "Avoid personalization", detail: "Avoid personalization (Ex: I, me, you, yours, we, ours).", sort_order: 10 },
  { kind: "edit", label: "Avoid gender", detail: "Avoid gender (Ex: her, him, she, he, etc.).", sort_order: 20 },
  {
    kind: "edit",
    label: "Avoid exact numbers",
    detail:
      "Avoid exact numbers (Ex: People call me 10 times a day — should be — people call me too many times a day.).",
    sort_order: 30,
  },
  {
    kind: "edit",
    label: "Capitalization",
    detail: "Capitalize first word if it's a sentence. Otherwise, you can capitalize each word if it's a headline.",
    sort_order: 40,
  },
  { kind: "edit", label: "Avoid topic name in post", detail: "Avoid using name of the topic in the post.", sort_order: 50 },
  { kind: "edit", label: "Period at end", detail: "Period at end if it's a sentence.", sort_order: 60 },
  { kind: "edit", label: "Too many words", detail: "Too many words.", sort_order: 70 },
  { kind: "edit", label: "Too vague", detail: "Too vague.", sort_order: 80 },
  { kind: "edit", label: "Grammar", detail: "Grammar.", sort_order: 90 },
  { kind: "edit", label: "No interjections", detail: "No interjections.", sort_order: 100 },
  { kind: "edit", label: "Wrong category", detail: "Wrong category.", sort_order: 110 },
  { kind: "edit", label: "No opinions", detail: "No opinions.", sort_order: 120 },
  { kind: "edit", label: "No slang", detail: "No Slang.", sort_order: 130 },
  { kind: "edit", label: "Other (write your own)", detail: "", sort_order: 140 },
];

export const DEFAULT_REJECT_REASONS: Omit<ReviewReason, "id">[] = [
  { kind: "reject", label: "Political", detail: "Political.", sort_order: 10 },
  { kind: "reject", label: "Self-promoting", detail: "Self-promoting.", sort_order: 20 },
  {
    kind: "reject",
    label: "Includes a link to dangerous landing page",
    detail: "Includes a link to dangerous landing page.",
    sort_order: 30,
  },
  { kind: "reject", label: "Obscene or Vulgar", detail: "Obscene or Vulgar.", sort_order: 40 },
  { kind: "reject", label: "Malicious or Hateful", detail: "Malicious or Hateful.", sort_order: 50 },
  { kind: "reject", label: "Other (write your own)", detail: "", sort_order: 60 },
];

const withFallbackIds = (rows: Omit<ReviewReason, "id">[]): ReviewReason[] =>
  rows.map((r, i) => ({ ...r, id: `default-${r.kind}-${i}` }));

export const isOtherReason = (label: string) => label.trim().toLowerCase().startsWith("other");

export const fetchReviewReasons = async (): Promise<ReviewReason[]> => {
  const { data, error } = await supabase
    .from("review_reasons")
    .select("id, kind, label, detail, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ReviewReason[];
};

/** Admin-managed reasons, falling back to the seeded defaults when empty. */
export const useReviewReasons = () =>
  useQuery({
    queryKey: ["review-reasons"],
    queryFn: fetchReviewReasons,
    select: (rows: ReviewReason[]) => {
      const edit = rows.filter((r) => r.kind === "edit");
      const reject = rows.filter((r) => r.kind === "reject");
      return {
        edit: edit.length ? edit : withFallbackIds(DEFAULT_EDIT_REASONS),
        reject: reject.length ? reject : withFallbackIds(DEFAULT_REJECT_REASONS),
      };
    },
    placeholderData: [],
  });
