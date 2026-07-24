import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

function defaultCopy(action: ReviewAction, itemKind: "topic" | "post", itemTitle: string) {
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
      subject: `Update on your ${label}`,
      body:
        `Hi,\n\nAfter review, your ${label} ${quoted} wasn't approved for publication.\n\n` +
        `Reason: [add a short reason here]\n\n` +
        `You're welcome to revise and resubmit.\n\n— The DeetSheet team`,
    };
  }
  return {
    subject: `Small edits to your ${label}`,
    body:
      `Hi,\n\nAn editor made small revisions to your ${label} ${quoted} for clarity and formatting. ` +
      `The updated version is now live.\n\n` +
      `Summary of changes: [add a short note here]\n\n— The DeetSheet team`,
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

  useEffect(() => {
    if (!open) return;
    const c = defaultCopy(action, itemKind, itemTitle);
    setSubject(c.subject);
    setBody(c.body);
    setSendEmail(true);
  }, [open, action, itemKind, itemTitle]);

  const submit = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Subject and message are required", variant: "destructive" });
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {TITLE_LABEL[action]} — message to {authorLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {action === "approve" && "The message below will be sent to the author, then the item will be approved and go live."}
            {action === "reject" && "The message below will be sent to the author explaining the rejection, then the item will be rejected."}
            {action === "edit" && "The message below will be sent to the author summarizing your edits, then the edits will be saved and go live."}
          </p>
          <div>
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Message</Label>
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
