import { supabase } from "@/integrations/supabase/client";

/**
 * Finds an existing direct thread between two members, or creates one.
 * All safety rules (kill switch, blocks, rate limits, request state) are
 * enforced by database triggers — this helper just surfaces their messages.
 */
export async function startDirectThread(
  userId: string,
  targetUserId: string,
  targetLabel?: string | null,
): Promise<{ threadId?: string; error?: string }> {
  if (userId === targetUserId) return { error: "You can't message yourself." };

  const pairFilter =
    `and(user_id.eq.${userId},other_user_id.eq.${targetUserId}),` +
    `and(user_id.eq.${targetUserId},other_user_id.eq.${userId})`;

  const { data: existing } = await supabase
    .from("message_threads")
    .select("id")
    .eq("kind", "direct")
    .or(pairFilter)
    .limit(1)
    .maybeSingle();

  if (existing?.id) return { threadId: existing.id };

  const { data: created, error } = await supabase
    .from("message_threads")
    .insert({
      kind: "direct",
      user_id: userId,
      other_user_id: targetUserId,
      subject: targetLabel ? `Chat with ${targetLabel}` : "Direct message",
      status: "open",
      last_sender: "user",
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: error?.message ?? "Couldn't start this conversation." };
  }
  return { threadId: created.id };
}

/**
 * Removes a conversation from one participant's inbox only. The message rows
 * are never deleted, so the other person keeps their copy — and a new incoming
 * message un-hides the thread again (handled by a DB trigger).
 */
export async function hideThreadForMe(threadId: string, userId: string) {
  const { data } = await supabase
    .from("message_threads")
    .select("user_id,other_user_id")
    .eq("id", threadId)
    .maybeSingle();
  if (!data) return { error: "Conversation not found." };

  const patch =
    data.user_id === userId
      ? { hidden_for_user_at: new Date().toISOString() }
      : { hidden_for_other_at: new Date().toISOString() };

  const { error } = await supabase.from("message_threads").update(patch).eq("id", threadId);
  return { error: error?.message };
}

export async function blockMember(blockerId: string, blockedId: string) {

  return supabase.from("user_blocks").insert({ blocker_id: blockerId, blocked_id: blockedId });
}

export async function unblockMember(blockerId: string, blockedId: string) {
  return supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
}

export async function reportThread(params: {
  threadId: string;
  reporterId: string;
  reportedUserId: string | null;
  reason: string;
  details?: string;
}) {
  return supabase.from("thread_reports").insert({
    thread_id: params.threadId,
    reporter_id: params.reporterId,
    reported_user_id: params.reportedUserId,
    reason: params.reason,
    details: params.details ?? null,
  });
}

export const THREAD_REPORT_REASONS = [
  "Harassment or abuse",
  "Spam or scam",
  "Hateful content",
  "Sexual or explicit content",
  "Something else",
];

/**
 * Soft-deletes a single message. The row is never removed — RLS only lets the
 * original sender (or an admin) stamp the two deletion columns, and a DB
 * trigger rejects any attempt to alter the body.
 */
export async function deleteMessage(messageId: string, userId: string) {
  const { error } = await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString(), deleted_by: userId })
    .eq("id", messageId);
  return { error: error?.message };
}

export const DELETE_MESSAGE_WARNING =
  "This removes the message from DeetSheet for both people and replaces it with " +
  "“This message was deleted”. It cannot recall an email that was already sent, " +
  "if this message went out by email, that copy still exists in their mailbox.";
