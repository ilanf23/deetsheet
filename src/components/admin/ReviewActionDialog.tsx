import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminEditPostDialog from "@/components/admin/AdminEditPostDialog";


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
    value: "grammar",
    label: "Grammar / spelling",
    detail: "I corrected a few small spelling and grammar issues so the post reads more clearly.",
  },
  {
    value: "formatting",
    label: "Formatting / readability",
    detail: "I lightly reformatted the post (paragraph breaks, bullets) to make it easier to scan.",
  },
  {
    value: "title",
    label: "Clarified the title",
    detail: "I tightened the title so it more accurately reflects what the post is about.",
  },
  {
    value: "trim",
    label: "Trimmed for length",
    detail: "I trimmed a few sections that were repetitive so the post stays focused.",
  },
  {
    value: "tone",
    label: "Softened tone / removed language",
    detail:
      "I softened some wording so the post stays within our community guidelines while keeping your point intact.",
  },
  {
    value: "other",
    label: "Other (write your own summary)",
    detail: "",
  },
];

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
    subject: `Small edits to your ${label}`,
    body:
      `Hi,\n\nAn editor made small revisions to your ${label} ${quoted} for clarity and formatting. ` +
      `The updated version is now live.\n\n` +
      `What changed: ${reasonDetail || "[select a change type above or write your own summary]"}\n\n` +
      `The substance of your post wasn't changed. If anything doesn't look right, just reply to this message.\n\n— The DeetSheet team`,
  };
}

const ACTION_LABEL: Record<ReviewAction, string> = {
  approve: "Send & approve",
  reject: "Send & reject",
  edit: "Send & apply edits",
};

const TITLE_LABEL: Record<ReviewAction, string> = {
  approve: "Approve",
  reject: "Reject",
  edit: "Apply edits",
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
  const [editOpen, setEditOpen] = useState(false);
  const [postDetail, setPostDetail] = useState<{
    title: string;
    content: string | null;
    story: string | null;
    image_url: string | null;
    topic_name: string | null;
  } | null>(null);
  const [postRefreshKey, setPostRefreshKey] = useState(0);


  useEffect(() => {
    if (!open) return;
    setReasonKey("");
    setCustomReason("");
    setSendEmail(true);
    const c = defaultCopy(action, itemKind, itemTitle, "");
    setSubject(c.subject);
    setBody(c.body);
  }, [open, action, itemKind, itemTitle]);

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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {TITLE_LABEL[action]} — message to {authorLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              {itemKind === "topic" ? "Topic" : "Post"}
            </div>
            <div className="font-medium line-clamp-2">{itemTitle}</div>
            <div className="text-xs text-muted-foreground mt-1">Author: {authorLabel}</div>
          </div>

          <p className="text-sm text-muted-foreground">
            {action === "approve" && "The message below will be sent to the author, then the item will be approved and go live."}
            {action === "reject" && "Choose a reason so the author knows why. The message below will be sent to them, then the item will be rejected."}
            {action === "edit" && "Tell the author what you changed. The message below will be sent to them, then your edits will be saved and go live."}
          </p>

          {showReasonPicker && (
            <div className="space-y-2">
              <Label className="text-xs">
                {action === "reject" ? "Reason for rejection" : "What did you change?"}
                <span className="text-destructive"> *</span>
              </Label>
              <Select value={reasonKey} onValueChange={setReasonKey}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      action === "reject" ? "Select a reason…" : "Select what you edited…"
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
                      : "Write a short summary of what you edited…"
                  }
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="text-sm"
                />
              )}
              <p className="text-xs text-muted-foreground">
                Picking a reason updates the message below. You can still edit it before sending.
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
