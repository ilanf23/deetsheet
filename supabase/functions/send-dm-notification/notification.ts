type Thread = {
  user_id: string;
  other_user_id: string | null;
  kind: string;
  request_status: string;
};

type Message = { id: string; email_sent: boolean };

export interface NotificationDependencies {
  getThread: (id: string) => Promise<Thread | null>;
  isBlocked: (sender: string, recipient: string) => Promise<boolean>;
  getRecentMessage: (threadId: string, sender: string) => Promise<Message | null>;
  getRecipient: (id: string) => Promise<{ email?: string; optedOut: boolean }>;
  send: (email: string, options: {
    idempotencyKey: string;
    preferenceCategory: 'member_messages';
    templateData: Record<string, string>;
  }) => Promise<{ sent: boolean }>;
  markSent: (messageId: string) => Promise<void>;
}

export async function notifyDirectMessage(
  threadId: string,
  senderId: string,
  deps: NotificationDependencies,
): Promise<{ status: number; body: { success: true; email_sent: boolean } | { error: string } }> {
  const skipped = { status: 200, body: { success: true as const, email_sent: false } };
  const thread = await deps.getThread(threadId);
  if (!thread) return { status: 404, body: { error: 'Thread not found' } };
  if (senderId !== thread.user_id && senderId !== thread.other_user_id) {
    return { status: 403, body: { error: 'Forbidden' } };
  }
  if (thread.kind !== 'direct' || thread.request_status === 'declined') return skipped;
  const recipientId = senderId === thread.user_id ? thread.other_user_id : thread.user_id;
  if (!recipientId || recipientId === senderId) return skipped;
  if (await deps.isBlocked(senderId, recipientId)) return skipped;

  // Only a recent, persisted member message can trigger an alert. Repeated
  // requests reuse its event key, so callers cannot generate arbitrary emails.
  const message = await deps.getRecentMessage(threadId, senderId);
  if (!message || message.email_sent) return skipped;
  const recipient = await deps.getRecipient(recipientId);
  if (recipient.optedOut || !recipient.email) return skipped;
  const result = await deps.send(recipient.email, {
    idempotencyKey: `dm-notification-${threadId}-${message.id}`,
    preferenceCategory: 'member_messages',
    templateData: {
      eyebrow: 'NEW MESSAGE ON DEETSHEET',
      headline: 'You have a new message',
      bodyText: 'Someone sent you a message on DeetSheet.',
      callout: 'Log in to read and reply at deetsheet.com/inbox',
    },
  });
  if (result.sent) await deps.markSent(message.id);
  return { status: 200, body: { success: true, email_sent: result.sent } };
}