import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { buildPostSlug } from "@/lib/postSlug";
import { isOtherReason, useReviewReasons, type ReviewReason } from "@/lib/reviewReasons";
import { useTopics } from "@/hooks/useSupabaseTopics";




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
  onConfirmed: (meta?: { reason?: string }) => Promise<void>;
}

const RULES_URL = "https://deetsheet.com/rules";

function defaultCopy(
  action: ReviewAction,
  itemKind: "topic" | "post",
  quotedTitle: string,
  reasonDetail: string,
) {
  const label = itemKind === "topic" ? "topic" : "post";
  const quoted = `"${quotedTitle}"`;
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
      subject: `Your DeetSheet ${label} has been denied`,
      body:
        `Thank you for posting on DeetSheet, but your recent ${label} has been denied: ${quotedTitle}.\n\n` +
        `It was denied for the following reason: ${reasonDetail || "[select a reason above or write your own]"}\n\n` +
        `DeetSheet does not tolerate vulgar or hateful language. We built this platform to help others and not bring them down. Your post has been deleted.\n\n` +
        `You may post again, but this is a warning that your account is now on probation and will be blocked if you post again and don't follow the Rules and Guidelines of DeetSheet: ${RULES_URL}\n\n— The DeetSheet team`,
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
    topic_id: string | null;
    topic_name: string | null;
  } | null>(null);
  const [postRefreshKey] = useState(0);

  // Editable copy of the post — the admin adjusts it in the left column and it
  // is saved when the action is submitted.
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editStory, setEditStory] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  /** Topic the post will be filed under — admins can move it while reviewing. */
  const [editTopicId, setEditTopicId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [finalTextTouched, setFinalTextTouched] = useState(false);
  /** Once the admin edits the message themselves we stop regenerating it. */
  const [messageTouched, setMessageTouched] = useState(false);

  const { data: topics } = useTopics();
  const selectedTopic = topics?.find((t) => t.id === editTopicId) ?? null;
  const { data: reasons } = useReviewReasons();
  const reasonList: ReviewReason[] =
    action === "reject" ? reasons?.reject ?? [] : action === "edit" ? reasons?.edit ?? [] : [];
  const showReasonPicker = action === "reject" || action === "edit";
  const pickedReason = reasonList.find((r) => r.id === reasonKey) ?? null;
  const isOther = !!pickedReason && isOtherReason(pickedReason.label);
  /** Human-readable reason, stored alongside the soft delete on rejection. */
  const reasonTextForAction = (
    isOther ? customReason : pickedReason?.detail || pickedReason?.label || ""
  ).trim();

  /** Title as it currently reads in the left column — keeps the message in sync. */
  const liveTitle = (itemKind === "post" ? editTitle.trim() : "") || postDetail?.title || itemTitle;
  /** Topic name as currently selected — the message follows any topic change. */
  const liveTopicName = selectedTopic?.name ?? postDetail?.topic_name ?? null;
  const quotedTitle = [liveTopicName, liveTitle].filter(Boolean).join(": ");




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
    setFinalTextTouched(false);
    setMessageTouched(false);
    setNewImage(null);
    setNewImagePreview(null);
    setRemoveImage(false);
    setEditTopicId("");
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
        .select("title, content, story, image_url, topic_id, topics(name)")
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
        topic_id: (data as { topic_id: string | null }).topic_id ?? null,
        topic_name: topicName,
      });
      setEditTopicId((data as { topic_id: string | null }).topic_id ?? "");
      setEditTitle(data.title ?? "");
      setEditContent(data.content ?? "");
      setEditStory(data.story ?? "");
    })();
    return () => {
      cancelled = true;
    };
  }, [open, itemKind, postId, postRefreshKey]);

  const pickImage = (file: File | null) => {
    if (!file) return;
    setNewImage(file);
    setRemoveImage(false);
    setNewImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setNewImage(null);
    setNewImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const photoRemoved = removeImage || photoDenied;
  const currentImage = photoDenied
    ? null
    : newImagePreview ?? (removeImage ? null : postDetail?.image_url ?? null);

  /** Whether the admin actually changed the post in the left column. */
  const postEdited =
    !!postDetail &&
    (editTitle !== (postDetail.title ?? "") ||
      editContent !== (postDetail.content ?? "") ||
      editStory !== (postDetail.story ?? "") ||
      editTopicId !== (postDetail.topic_id ?? "") ||
      !!newImage ||
      photoRemoved);



  // Re-render the default message whenever the admin picks a reason or edits
  // the post title — unless the admin already customised the message body.
  useEffect(() => {
    if (!open || messageTouched) return;
    const detail = isOther ? customReason : pickedReason?.detail ?? "";
    const c = defaultCopy(action, itemKind, quotedTitle || itemTitle, detail);
    setSubject(c.subject);
    setBody(c.body);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reasonKey, customReason, open, quotedTitle, messageTouched]);


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
      const picked = pickedReason;
      const reasonText = (
        picked ? (isOther ? customReason : picked.detail || picked.label) : customReason
      ).trim();


      const suggestionList = suggestions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const topicName = liveTopicName ?? undefined;
      const postTitle = (itemKind === "post" ? editTitle.trim() : "") || postDetail?.title || itemTitle;
      const profileUrl = "https://deetsheet.com/profile";
      // Pending / rejected posts deep-link straight into the edit dialog.
      const editUrl = postId ? `${profileUrl}?edit=${postId}` : profileUrl;
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
            // Original = the post as submitted; Final = the admin's edited copy.
            originalText: originalText || postDetail?.content || "",
            finalText: (finalTextTouched ? finalText : editContent) || editContent,
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
            ctaUrl: editUrl,
          };
        } else if (action === "reject") {
          emailTemplate = "post-denied";
          templateData = {
            ...base,
            reasons: reasonText ? [reasonText] : [],
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
            // Review outcomes deliver email + in-app notification only —
            // they must not create an inbox thread for the member.
            create_thread: false,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to send message");

      // Message delivered — now persist the admin's inline post edits, then
      // apply the review action.
      if (itemKind === "post" && postId && postEdited) {
        let nextImageUrl: string | null = postDetail?.image_url ?? null;
        if (photoDenied) {
          nextImageUrl = null;
        } else if (newImage) {
          const uid = sess.session?.user?.id;
          const ext = newImage.name.split(".").pop() ?? "jpg";
          const path = `${uid}/${postId}-${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("post-images")
            .upload(path, newImage, { upsert: true });
          if (upErr) throw upErr;
          nextImageUrl = supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
        } else if (removeImage) {
          nextImageUrl = null;
        }

        // A denied (or removed) photo must never survive in the topic image
        // queue that was seeded from this post.
        const droppedImage = postDetail?.image_url ?? null;
        if (droppedImage && nextImageUrl !== droppedImage) {
          await supabase.from("topic_images").delete().eq("url", droppedImage);
        }
        const { error: updErr } = await supabase
          .from("posts")
          .update({
            title: editTitle.trim() || postDetail?.title,
            content: editContent.trim(),
            story: editStory.trim() ? editStory : null,
            image_url: nextImageUrl,
            ...(editTopicId && editTopicId !== (postDetail?.topic_id ?? "")
              ? { topic_id: editTopicId }
              : {}),
          })
          .eq("id", postId);
        if (updErr) throw updErr;
      }

      // Now perform the actual action.
      await onConfirmed({ reason: reasonTextForAction });


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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {TITLE_LABEL[action]} — message to {authorLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          {/* LEFT — the post itself, editable in place. */}
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {itemKind === "topic" ? "Topic" : "Post"}
              {liveTopicName && (
                <span className="ml-2 normal-case tracking-normal">
                  in <span className="text-primary">{liveTopicName}</span>
                </span>
              )}
              <span className="ml-2 normal-case tracking-normal">· {authorLabel}</span>
            </div>

            {itemKind === "post" && postDetail ? (
              <>
                <div>
                  <Label className="text-xs">Category / topic</Label>
                  <Select value={editTopicId} onValueChange={setEditTopicId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a topic…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {(topics ?? []).map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} · {t.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Post text</Label>
                  <Textarea
                    rows={4}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Comment / story</Label>
                  <Textarea
                    rows={8}
                    value={editStory}
                    onChange={(e) => setEditStory(e.target.value)}
                    placeholder="No comment provided."
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Photo</Label>
                  {currentImage ? (
                    <img
                      src={currentImage}
                      alt=""
                      className="max-h-64 w-auto rounded-md border"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      {photoDenied ? "Photo denied — it will be removed from the live post." : "No photo."}
                    </p>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {currentImage ? "Replace photo" : "Add photo"}
                    </Button>
                    {currentImage && (
                      <Button type="button" size="sm" variant="outline" onClick={clearImage}>
                        Remove photo
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Any edits here are saved when you submit this action.
                </p>
              </>
            ) : (
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <div className="font-medium">{itemTitle}</div>
              </div>
            )}
          </div>

          {/* RIGHT — action reason, message to author, and submit controls. */}
          <div className="space-y-3">



          <p className="text-sm text-muted-foreground">
            {action === "approve" && "The message below will be sent to the author, then the item will be approved and go live."}
            {action === "reject" && "Choose a reason so the author knows why. The message below will be sent to them, then the item will be rejected."}
            {action === "edit" && "Choose a suggestion so the author knows what to improve. The post will stay pending until they update it and resubmit."}
          </p>

          {action === "approve" && itemKind === "post" && (
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="approve-adjusted"
                  checked={adjusted}
                  onCheckedChange={(v) => setAdjusted(!!v)}
                />
                <Label htmlFor="approve-adjusted" className="text-sm font-normal">
                  Approved with a slight adjustment
                </Label>
              </div>
              {adjusted && (
                <div className="space-y-2">
                  <Label className="text-xs">Original text</Label>
                  <Textarea
                    rows={2}
                    value={originalText || postDetail?.content || ""}
                    onChange={(e) => setOriginalText(e.target.value)}
                    className="text-sm"
                  />
                  <Label className="text-xs">Final text</Label>
                  <Textarea
                    rows={2}
                    value={finalTextTouched ? finalText : editContent}
                    onChange={(e) => {
                      setFinalTextTouched(true);
                      setFinalText(e.target.value);
                    }}
                    placeholder="The approved wording the author will see…"
                    className="text-sm"
                  />

                  <Label className="text-xs">Why it was adjusted (one per line)</Label>
                  <Textarea
                    rows={2}
                    value={suggestions}
                    onChange={(e) => setSuggestions(e.target.value)}
                    className="text-sm"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="approve-photo-denied"
                  checked={photoDenied}
                  onCheckedChange={(v) => setPhotoDenied(!!v)}
                />
                <Label htmlFor="approve-photo-denied" className="text-sm font-normal">
                  Photo denied (post approved, image rejected)
                </Label>
              </div>
              {photoDenied && (
                <Textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Why the photo was denied…"
                  className="text-sm"
                />
              )}
            </div>
          )}

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
                    <SelectItem key={r.id} value={r.id}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isOther && (

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
              <Label className="text-xs">
                Suggested rewrites for the author (one per line, optional)
              </Label>
              <Textarea
                rows={3}
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                placeholder={"Preppy clothing\nSpandex clothing"}
                className="text-sm"
              />
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
              onChange={(e) => {
                setMessageTouched(true);
                setBody(e.target.value);
              }}

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
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? "Sending…" : ACTION_LABEL[action]}
            </Button>
          </div>
          </div>
        </div>
      </DialogContent>

    </Dialog>
  );
}

