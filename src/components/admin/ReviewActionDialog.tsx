import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { buildPostSlug } from "@/lib/postSlug";
import { isOtherReason, useReviewReasons, type ReviewReason } from "@/lib/reviewReasons";
import { useTopics } from "@/hooks/useSupabaseTopics";
import { absolutizeMarkdownLinks, pendingClosingWithEditLink } from "@/lib/reviewCopy";
import { LINK_SHORTCUTS, insertMarkdownLink } from "@/lib/linkShortcuts";
import { useQueryClient } from "@tanstack/react-query";
import { invalidatePostCaches } from "@/lib/postCacheInvalidation";




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
  editPostId?: string | null,
) {
  const label = itemKind === "topic" ? "topic" : "post";
  const quoted = `"${quotedTitle}"`;
  // Reasons arrive newline-separated — render them as their own bullet lines
  // rather than jamming them into one sentence.
  const reasonLines = reasonDetail
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);
  const reasonBlock = reasonLines.length
    ? reasonLines.map((r) => `- ${r}`).join("\n")
    : "";
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
        `It was denied for the following reason${reasonLines.length > 1 ? "s" : ""}:\n${reasonBlock || "- [select a reason above or write your own]"}\n\n` +
        `DeetSheet does not tolerate vulgar or hateful language. We built this platform to help others and not bring them down. Your post has been deleted.\n\n` +
        `You may post again, but this is a warning that your account is now on probation and will be blocked if you post again and don't follow the Rules and Guidelines of DeetSheet: ${RULES_URL}\n\n— The DeetSheet team`,
    };
  }
  return {
    subject: `Suggestions to help your ${label} get approved`,
    body:
      `Hi,\n\nThanks for submitting your ${label} ${quoted}. Before we can approve it, we'd like you to make a few changes.\n\n` +
      `Suggestion${reasonLines.length > 1 ? "s" : ""}:\n${reasonBlock || "- [select a suggestion above or write your own]"}\n\n` +
      `${pendingClosingWithEditLink(editPostId)}\n\nReply here if you have questions.\n\n— The DeetSheet team`,
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
  const queryClient = useQueryClient();
  /** Admin-typed overrides. While untouched, the copy is DERIVED (see below). */
  const [subjectDraft, setSubjectDraft] = useState("");
  const [bodyDraft, setBodyDraft] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reasonKeys, setReasonKeys] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState("");
  // Approve flow: mark the post as "approved with a slight adjustment" so the
  // author receives the original-vs-final version of the branded email.
  const [adjusted, setAdjusted] = useState(false);
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
  /** Single source of truth for the post sentence — written to title AND content. */
  const [editContent, setEditContent] = useState("");
  const [editStory, setEditStory] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  /** Topic the post will be filed under — admins can move it while reviewing. */
  const [editTopicId, setEditTopicId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Once the admin edits the message themselves we stop regenerating it. */
  const [messageTouched, setMessageTouched] = useState(false);
  /** Same for the subject line. */
  const [subjectTouched, setSubjectTouched] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  /**
   * Insert a markdown link at the caret when the body textarea is focused;
   * otherwise place it before the sign-off line so it never fuses onto it.
   */
  const insertLink = (label: string, path: string) => {
    const el = bodyRef.current;
    setMessageTouched(true);
    const focused = el !== null && typeof document !== "undefined" && document.activeElement === el;
    const source = el?.value ?? body;
    const { text, caret } = insertMarkdownLink(
      source,
      label,
      path,
      focused ? el!.selectionStart ?? null : null,
      focused ? el!.selectionEnd ?? null : null,
    );
    setBodyDraft(text);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  };


  const { data: topics } = useTopics();
  const selectedTopic = topics?.find((t) => t.id === editTopicId) ?? null;
  const { data: reasons } = useReviewReasons();
  const reasonList: ReviewReason[] =
    action === "reject" ? reasons?.reject ?? [] : action === "edit" ? reasons?.edit ?? [] : [];
  const showReasonPicker = action === "reject" || action === "edit";
  const pickedReasons = reasonList.filter((r) => reasonKeys.includes(r.id));
  const isOther = pickedReasons.some((r) => isOtherReason(r.label));
  /** Every selected reason as author-facing text, plus any custom "other" copy. */
  const reasonTexts: string[] = [
    ...pickedReasons
      .filter((r) => !isOtherReason(r.label))
      .map((r) => (r.detail || r.label).trim()),
    ...(isOther && customReason.trim() ? [customReason.trim()] : []),
  ].filter(Boolean);
  /** Human-readable reason, stored alongside the soft delete on rejection. */
  const reasonTextForAction = reasonTexts.join("\n");

  /** Title as it currently reads in the left column — keeps the message in sync. */
  const liveTitle = (itemKind === "post" ? editContent.trim() : "") || postDetail?.title || itemTitle;
  /** Topic name as currently selected — the message follows any topic change. */
  const liveTopicName = selectedTopic?.name ?? postDetail?.topic_name ?? null;
  const quotedTitle = [liveTopicName, liveTitle].filter(Boolean).join(": ");




  useEffect(() => {
    if (!open) return;
    setReasonKeys([]);
    setCustomReason("");
    setSuggestions("");

    setSendEmail(true);
    setAdjusted(false);
    setPhotoDenied(false);
    setMessageTouched(false);
    setSubjectTouched(false);
    setSubjectDraft("");
    setBodyDraft("");
    setNewImage(null);
    setNewImagePreview(null);
    setRemoveImage(false);
    setEditTopicId("");
  }, [open, action, itemKind, itemTitle, postId]);



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
      setEditContent(data.title ?? data.content ?? "");
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

  /**
   * The canonical post text for this action. Approve-with-adjustment must use
   * this exact value for both persistence and the author email.
   */
  const persistedPostText =
    (editContent.trim() ||
      postDetail?.title ||
      itemTitle);

  /** Whether the admin actually changed the post in either editable text field. */
  const postEdited =
    !!postDetail &&
    (persistedPostText !== (postDetail.title ?? "") ||
      editStory !== (postDetail.story ?? "") ||
      editTopicId !== (postDetail.topic_id ?? "") ||
      !!newImage ||
      photoRemoved);



  // The auto-generated copy is DERIVED, not stored in state, so it always
  // tracks the current post text, topic and reasons. State only holds what the
  // admin actually typed — a programmatic update can never mark it "touched".
  const generated = defaultCopy(
    action,
    itemKind,
    quotedTitle || itemTitle,
    reasonTexts.join("\n"),
    postId,
  );
  const subject = subjectTouched ? subjectDraft : generated.subject;
  const body = messageTouched ? bodyDraft : generated.body;



  const submit = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Subject and message are required", variant: "destructive" });
      return;
    }
    if (showReasonPicker && reasonKeys.length === 0) {
      toast({
        title: action === "reject" ? "Please choose a reason for rejection" : "Please choose what you changed",
        variant: "destructive",
      });
      return;
    }
    if (showReasonPicker && isOther && !customReason.trim()) {
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
      const reasonItems = reasonTexts;


      const suggestionList = suggestions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const topicName = liveTopicName ?? undefined;
      const postTitle = itemKind === "post" ? persistedPostText : itemTitle;
      const profileUrl = "https://deetsheet.com/profile";
      // Pending / rejected posts deep-link straight into the edit dialog.
      const editUrl = postId ? `${profileUrl}?edit=${postId}` : profileUrl;
      const postUrl =
        topicName && postId
          ? `https://deetsheet.com/topic/${encodeURIComponent(topicName)}/post/${buildPostSlug(postTitle, postId)}`
          : profileUrl;

      // The in-app thread keeps site-relative links; email copy must not.
      const emailBody = absolutizeMarkdownLinks(body);

      let emailTemplate = "admin-message";
      let templateData: Record<string, unknown> = {
        headline: subject,
        bodyText: emailBody,
        quotedTitle: [topicName, postTitle].filter(Boolean).join(": "),
        reasons: reasonItems.length ? reasonItems : undefined,
        suggestions: suggestionList.length ? suggestionList : undefined,
        ctaLabel: "View your post",
        ctaUrl: postUrl,
      };

      if (itemKind === "post") {
        const base = {
          topic: topicName,
          title: postTitle,
          adminNote: emailBody,
        };
        if (action === "approve" && photoDenied) {
          emailTemplate = "post-photo-denied";
          templateData = { ...base, reasons: reasonItems, ctaUrl: profileUrl };
        } else if (action === "approve" && adjusted) {
          emailTemplate = "post-approved-adjusted";
          templateData = {
            ...base,
            // Original = the post as submitted; Final = the admin's edited copy.
            originalText: postDetail?.content || "",
            finalText: persistedPostText,
            reasons: reasonItems.length ? reasonItems : suggestionList,
            ctaUrl: postUrl,
          };

        } else if (action === "approve") {
          emailTemplate = "post-approved";
          templateData = { ...base, ctaUrl: postUrl };
        } else if (action === "edit") {
          emailTemplate = "post-pending";
          templateData = {
            ...base,
            // Only forward a genuinely custom note. The auto-generated default
            // already restates the reason + suggestions, which the email
            // renders as its own REASON / SUGGESTIONS boxes.
            adminNote: messageTouched ? emailBody : undefined,
            reasons: reasonItems,
            suggestions: suggestionList,
            ctaUrl: editUrl,
          };
        } else if (action === "reject") {
          emailTemplate = "post-denied";
          templateData = {
            ...base,
            reasons: reasonItems,
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
            // Approve / reject deliver email + in-app notification only — they
            // must not create an inbox thread. A "suggest changes" outcome is
            // actionable, so it does get a thread the author can reply in.
            create_thread: action === "edit",
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
        // Written through an admin-only security-definer RPC. It flags the
        // write as an admin review action so notify_admins_of_post_edit does
        // not raise a false "a member edited their post" alert.
        const { error: updErr } = await supabase.rpc("admin_update_post_review_edit", {
          _post_id: postId,
          _text: persistedPostText,
          _story: editStory.trim() ? editStory : null,
          _image_url: nextImageUrl,
          _topic_id:
            editTopicId && editTopicId !== (postDetail?.topic_id ?? "") ? editTopicId : null,
        });
        if (updErr) throw updErr;
      }

      // "Suggest changes" flags the post so the author sees an actionable
      // "Needs Editing Before Approval" state. Written through an admin-only
      // security-definer RPC — clients never write the column directly.
      if (action === "edit" && itemKind === "post" && postId) {
        const { error: flagErr } = await supabase.rpc("mark_post_needs_author_edit", {
          _post_id: postId,
        });
        if (flagErr) throw flagErr;
      }

      // Now perform the actual action.
      await onConfirmed({ reason: reasonTextForAction });

      // Approve / reject / suggest all mutate the post row (status, text, or
      // the needs-edit flag). Drop the cached post surfaces so an open home
      // page can't keep serving pre-review data for its 60s staleTime.
      invalidatePostCaches(queryClient, postId ?? undefined);



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
                  <Label className="text-xs">Post</Label>
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
                  <Label className="text-xs">Original text (as submitted)</Label>
                  <Textarea
                    rows={2}
                    value={postDetail?.content || ""}
                    readOnly
                    aria-readonly="true"
                    tabIndex={-1}
                    className="text-sm bg-muted text-muted-foreground cursor-default focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                  />
                  <Label className="text-xs" htmlFor="approve-final-preview">
                    Final text (preview)
                  </Label>
                  <Textarea
                    id="approve-final-preview"
                    rows={2}
                    value={persistedPostText}
                    readOnly
                    aria-readonly="true"
                    tabIndex={-1}
                    className="text-sm bg-muted text-muted-foreground cursor-default focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Read-only preview — it updates automatically as you edit the Post field above.
                  </p>

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
                {action === "reject" ? "Reasons for rejection" : "Suggestions for the author"}
                <span className="text-destructive"> *</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate text-left">
                      {pickedReasons.length
                        ? pickedReasons.map((r) => r.label).join(", ")
                        : action === "reject"
                          ? "Select one or more reasons…"
                          : "Select one or more suggestions…"}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-[--radix-popover-trigger-width] max-h-72 overflow-y-auto p-1"
                >
                  {reasonList.map((r) => {
                    const checked = reasonKeys.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className="flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) =>
                            setReasonKeys((prev) =>
                              v ? [...prev, r.id] : prev.filter((id) => id !== r.id),
                            )
                          }
                          className="mt-0.5"
                        />
                        <span>{r.label}</span>
                      </label>
                    );
                  })}
                </PopoverContent>
              </Popover>
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
            <Input
              value={subject}
              onChange={(e) => {
                setSubjectTouched(true);
                setSubjectDraft(e.target.value);
              }}
            />

          </div>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-xs">Message to author</Label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Insert link:</span>
                {LINK_SHORTCUTS.map((l) => (
                  <Button
                    key={l.path}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[11px]"
                    onClick={() => insertLink(l.label, l.path)}
                  >
                    {l.label}
                  </Button>
                ))}
              </div>
            </div>
            <Textarea
              ref={bodyRef}
              rows={10}
              value={body}
              onChange={(e) => {
                setMessageTouched(true);
                setBodyDraft(e.target.value);
              }}

              className="text-sm"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Tip: you can write links by hand as [Rules](/rules) — the label becomes a link
              in the email and in the member&apos;s inbox.
            </p>
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

