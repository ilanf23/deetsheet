import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { buildPostSlug } from "@/lib/postSlug";



export type ReviewAction = "approve" | "reject" | "edit";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ReviewAction;
  itemKind: "topic" | "post";
  itemTitle: string;
  authorId: string;
  authorLabel: string;
  postId?: string | null;
  /** Called after the message is sent successfully. Perform the DB action here. */
  onConfirmed: () => Promise<void>;
}

const REJECT_REASONS: { value: string; label: string; detail: string }[] = [
  {
    value: "off_topic",
    label: "Off-topic / wrong subject",
    detail:
      "Your post didn't fit the subject it was submitted under. Feel free to resubmit it under a more relevant topic.",
  },
  {
    value: "duplicate",
    label: "Duplicate of existing content",
    detail:
      "A very similar post already exists on DeetSheet. To keep discussions focused, we only publish one version. You're welcome to add your perspective as a comment on the original.",
  },
  {
    value: "low_quality",
    label: "Too short / lacks detail",
    detail:
      "Your post didn't include enough detail for other readers to learn from it. Please expand on your experience or reasoning and resubmit.",
  },
  {
    value: "unverified",
    label: "Unverified or misleading claims",
    detail:
      "Some of the claims in your post couldn't be verified or appeared misleading. Please add sources or firsthand context and resubmit.",
  },
  {
    value: "vulgar",
    label: "Vulgar / offensive language",
    detail:
      "Your post included language that doesn't meet our community guidelines. Please revise the tone and resubmit.",
  },
  {
    value: "personal_attack",
    label: "Personal attack / harassment",
    detail:
      "Your post targeted an individual in a way that violates our community guidelines. Please focus critique on ideas or experiences rather than people.",
  },
  {
    value: "spam",
    label: "Spam / promotional",
    detail:
      "Your post read as promotional or spam. DeetSheet is for firsthand insight, not advertising.",
  },
  {
    value: "formatting",
    label: "Formatting / readability",
    detail:
      "Your post was hard to read due to formatting. Please break it into short paragraphs or bullet points and resubmit.",
  },
  {
    value: "other",
    label: "Other (write your own reason)",
    detail: "",
  },
];

const EDIT_REASONS: { value: string; label: string; detail: string }[] = [
  {
    value: "add_detail",
    label: "Add more detail / context",
    detail:
      "Please expand your post with more specifics — firsthand examples, numbers, or context — so readers can learn from your experience.",
  },
  {
    value: "clarify_title",
    label: "Clarify the title",
    detail:
      "Please tighten the title so it more clearly reflects what the post is about. A specific title helps the right readers find it.",
  },
  {
    value: "formatting",
    label: "Improve formatting / readability",
    detail:
      "Please break the post into short paragraphs or bullet points so it's easier to scan and read.",
  },
  {
    value: "grammar",
    label: "Fix grammar / spelling",
    detail:
      "Please give the post a quick pass for spelling and grammar so it reads more cleanly.",
  },
  {
    value: "tone",
    label: "Soften tone / adjust language",
    detail:
      "Please soften some of the wording so the post stays within our community guidelines while keeping your point intact.",
  },
  {
    value: "sources",
    label: "Add sources or firsthand context",
    detail:
      "Please add sources or clarify which parts come from firsthand experience so readers can trust the claims.",
  },
  {
    value: "trim",
    label: "Trim for length",
    detail:
      "Please trim repetitive sections so the post stays focused on the main point.",
  },
  {
    value: "other",
    label: "Other (write your own suggestion)",
    detail: "",
  },
];

/** Reasons that mean the post is denied outright (conduct), not just pending. */
const DENY_REASON_KEYS = new Set(["vulgar", "personal_attack"]);

function defaultCopy(

  action: ReviewAction,
  itemKind: "topic" | "post",
  itemTitle: string,
  reasonDetail: string,
) {
  const label = itemKind === "topic" ? "topic" : "post";
  const quoted = `"${itemTitle}"`;
  if (action === "approve") {
    return {
      subject: `Your ${label} was approved`,
      body:
        `Good news — your ${label} ${quoted} has been approved and is now live on DeetSheet.\n\n` +
        `Thanks for contributing!\n\n— The DeetSheet team`,
    };
  }
  if (action === "reject") {
    return {
      subject: `Update on your ${label}: not approved`,
      body:
        `Hi,\n\nThanks for submitting your ${label} ${quoted}. After review, we weren't able to approve it for publication.\n\n` +
        `Reason: ${reasonDetail || "[select a reason above or write your own]"}\n\n` +
        `You're welcome to revise and resubmit. If you have questions, just reply to this message.\n\n— The DeetSheet team`,
    };
  }
  return {
    subject: `Suggestions to help your ${label} get approved`,
    body:
      `Hi,\n\nThanks for submitting your ${label} ${quoted}. Before we can approve it, we'd like you to make a few changes.\n\n` +
      `Suggestion: ${reasonDetail || "[select a suggestion above or write your own]"}\n\n` +
      `Once you've updated your ${label}, it will go back into review. Reply here if you have questions.\n\n— The DeetSheet team`,
  };
}

const ACTION_LABEL: Record<ReviewAction, string> = {
  approve: "Send & approve",
  reject: "Send & reject",
  edit: "Send suggestions",
};

const TITLE_LABEL: Record<ReviewAction, string> = {
  approve: "Approve",
  reject: "Reject",
  edit: "Suggest changes",
};

export default function ReviewActionDialog({
  open,
  onOpenChange,
  action,
  itemKind,
  itemTitle,
  authorId,
  authorLabel,
  postId,
  onConfirmed,
}: Props) {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reasonKey, setReasonKey] = useState<string>("");
  const [customReason, setCustomReason] = useState("");
  // Approve flow: mark the post as "approved with a slight adjustment" so the
  // author receives the original-vs-final version of the branded email.
  const [adjusted, setAdjusted] = useState(false);
  const [originalText, setOriginalText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [photoDenied, setPhotoDenied] = useState(false);
  /** One suggestion per line — rendered in the email's green suggestions box. */
  const [suggestions, setSuggestions] = useState("");


  
  const [postDetail, setPostDetail] = useState<{
    title: string;
    content: string | null;
    story: string | null;
    image_url: string | null;
    topic_name: string | null;
  } | null>(null);
  const [postRefreshKey] = useState(0);

  const reasonList = action === "reject" ? REJECT_REASONS : action === "edit" ? EDIT_REASONS : [];
  const showReasonPicker = action === "reject" || action === "edit";



  useEffect(() => {
    if (!open) return;
    setReasonKey("");
    setCustomReason("");
    setSuggestions("");

    setSendEmail(true);
    setAdjusted(false);
    setPhotoDenied(false);
    setOriginalText("");
    setFinalText("");
    const c = defaultCopy(action, itemKind, itemTitle, "");

    setSubject(c.subject);
    setBody(c.body);
  }, [open, action, itemKind, itemTitle]);

  // Fetch the full post so the admin can review it (and optionally edit it)
  // right inside the message dialog.
  useEffect(() => {
    if (!open || itemKind !== "post" || !postId) {
      setPostDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("posts")
        .select("title, content, story, image_url, topics(name)")
        .eq("id", postId)
        .maybeSingle();
      if (cancelled || !data) return;
      const t = (data as { topics: { name: string } | { name: string }[] | null }).topics;
      const topicName = Array.isArray(t) ? (t[0]?.name ?? null) : (t?.name ?? null);
      setPostDetail({
        title: data.title ?? "",
        content: data.content ?? null,
        story: data.story ?? null,
        image_url: data.image_url ?? null,
        topic_name: topicName,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [open, itemKind, postId, postRefreshKey]);


  // Re-render the default message whenever the admin picks a reason.
  useEffect(() => {
    if (!open || !showReasonPicker) return;
    const picked = reasonList.find((r) => r.value === reasonKey);
    const detail = picked?.value === "other" ? customReason : picked?.detail ?? "";
    const c = defaultCopy(action, itemKind, itemTitle, detail);
    setSubject(c.subject);
    setBody(c.body);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reasonKey, customReason, open]);

  const submit = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Subject and message are required", variant: "destructive" });
      return;
    }
    if (showReasonPicker && !reasonKey) {
      toast({
        title: action === "reject" ? "Please choose a reason for rejection" : "Please choose what you changed",
        variant: "destructive",
      });
      return;
    }
    if (showReasonPicker && reasonKey === "other" && !customReason.trim()) {
      toast({
        title: action === "reject" ? "Please write a rejection reason" : "Please write a short edit summary",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      // Send the message first — if the send fails, the action does NOT happen.
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      const bodyHtml = body
        .split("\n")
        .map((line) => `<p style="margin:0 0 10px;">${line.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string))}</p>`)
        .join("");

      // Resolve which branded template the author should receive.
      const picked = reasonList.find((r) => r.value === reasonKey);
      const reasonText = (picked?.value === "other" ? customReason : picked?.detail ?? picked?.label ?? "").trim();
      const suggestionList = suggestions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const topicName = postDetail?.topic_name ?? undefined;
      const postTitle = postDetail?.title ?? itemTitle;
      const profileUrl = "https://deetsheet.com/profile";
      const postUrl =
        topicName && postId
          ? `https://deetsheet.com/topic/${encodeURIComponent(topicName)}/post/${buildPostSlug(postTitle, postId)}`
          : profileUrl;

      let emailTemplate = "admin-message";
      let templateData: Record<string, unknown> = {
        headline: subject,
        bodyText: body,
        quotedTitle: [topicName, postTitle].filter(Boolean).join(": "),
        reasons: reasonText ? [reasonText] : undefined,
        suggestions: suggestionList.length ? suggestionList : undefined,
        ctaLabel: "View your post",
        ctaUrl: postUrl,
      };

      if (itemKind === "post") {
        const base = {
          topic: topicName,
          title: postTitle,
          adminNote: body,
        };
        if (action === "approve" && photoDenied) {
          emailTemplate = "post-photo-denied";
          templateData = { ...base, reasons: reasonText ? [reasonText] : [], ctaUrl: profileUrl };
        } else if (action === "approve" && adjusted) {
          emailTemplate = "post-approved-adjusted";
          templateData = {
            ...base,
            originalText: originalText || postDetail?.content || "",
            finalText,
            reasons: reasonText ? [reasonText] : suggestionList,
            ctaUrl: postUrl,
          };
        } else if (action === "approve") {
          emailTemplate = "post-approved";
          templateData = { ...base, ctaUrl: postUrl };
        } else if (action === "edit") {
          emailTemplate = "post-pending";
          templateData = {
            ...base,
            reasons: reasonText ? [reasonText] : [],
            suggestions: suggestionList,
            ctaUrl: profileUrl,
          };
        } else if (action === "reject") {
          const isConduct = DENY_REASON_KEYS.has(reasonKey);
          emailTemplate = isConduct ? "post-denied" : "post-pending";
          templateData = {
            ...base,
            reasons: reasonText ? [reasonText] : [],
            suggestions: isConduct ? undefined : suggestionList,
            ctaUrl: profileUrl,
          };
        }
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-admin-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            user_id: authorId,
            post_id: itemKind === "post" ? postId ?? null : null,
            subject,
            body_html: bodyHtml,
            send_email: sendEmail,
            email_template: emailTemplate,
            template_data: templateData,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to send message");

      // Now perform the actual action.
      await onConfirmed();

      toast({
        title: `${TITLE_LABEL[action]} — message sent to ${authorLabel}`,
        description: sendEmail ? "Delivered in-app and by email." : "Delivered in-app.",
      });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {TITLE_LABEL[action]} — message to {authorLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  {itemKind === "topic" ? "Topic" : "Post"}
                  {postDetail?.topic_name && (
                    <span className="ml-2 normal-case tracking-normal text-muted-foreground">
                      in <span className="text-primary">{postDetail.topic_name}</span>
                    </span>
                  )}
                </div>
                <div className="font-medium">{postDetail?.title ?? itemTitle}</div>
                <div className="text-xs text-muted-foreground mt-1">Author: {authorLabel}</div>
              </div>
            </div>

            {itemKind === "post" && postDetail && (
              <div className="pt-2 border-t border-border/60 space-y-2">
                {postDetail.image_url && (
                  <img
                    src={postDetail.image_url}
                    alt=""
                    className="max-h-56 w-auto rounded-md border"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.style.display = "none";
                    }}
                  />
                )}
                {postDetail.story && postDetail.story.trim().length > 0 ? (
                  <div
                    className="prose prose-sm max-w-none text-foreground [&_p]:my-1"
                    dangerouslySetInnerHTML={{ __html: postDetail.story }}
                  />
                ) : postDetail.content && postDetail.content.trim().length > 0 ? (
                  <p className="whitespace-pre-wrap text-foreground text-sm">{postDetail.content}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No body content.</p>
                )}
              </div>
            )}
          </div>


          <p className="text-sm text-muted-foreground">
            {action === "approve" && "The message below will be sent to the author, then the item will be approved and go live."}
            {action === "reject" && "Choose a reason so the author knows why. The message below will be sent to them, then the item will be rejected."}
            {action === "edit" && "Choose a suggestion so the author knows what to improve. The post will stay pending until they update it and resubmit."}
          </p>

          {showReasonPicker && (
            <div className="space-y-2">
              <Label className="text-xs">
                {action === "reject" ? "Reason for rejection" : "Suggestion for the author"}
                <span className="text-destructive"> *</span>
              </Label>
              <Select value={reasonKey} onValueChange={setReasonKey}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      action === "reject" ? "Select a reason…" : "Select a suggestion…"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {reasonList.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reasonKey === "other" && (
                <Textarea
                  rows={3}
                  placeholder={
                    action === "reject"
                      ? "Write a short reason the author will see…"
                      : "Write a short suggestion the author will see…"
                  }
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="text-sm"
                />
              )}
              <p className="text-xs text-muted-foreground">
                {action === "edit"
                  ? "Picking a suggestion updates the message below. You can still edit it before sending."
                  : "Picking a reason updates the message below. You can still edit it before sending."}
              </p>
            </div>
          )}

          <div>
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Message to author</Label>
            <Textarea
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="review-send-email"
              checked={sendEmail}
              onCheckedChange={(v) => setSendEmail(v === true)}
            />
            <Label htmlFor="review-send-email" className="text-sm">
              Also send as email
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Sending…" : ACTION_LABEL[action]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

