import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifyDirectMessage, type NotificationDependencies } from '../../supabase/functions/send-dm-notification/notification';

const threadId = '4cb1512f-0014-4c5c-8c91-bd18ceef5138';
const sender = 'sender';
const recipient = 'recipient';
let deps: NotificationDependencies;

beforeEach(() => {
  deps = {
    getThread: vi.fn().mockResolvedValue({ user_id: sender, other_user_id: recipient, kind: 'direct', request_status: 'accepted' }),
    isBlocked: vi.fn().mockResolvedValue(false),
    getRecentMessage: vi.fn().mockResolvedValue({ id: 'message-1', email_sent: false }),
    getRecipient: vi.fn().mockResolvedValue({ email: 'recipient@example.com', optedOut: false }),
    send: vi.fn().mockResolvedValue({ sent: true }),
    markSent: vi.fn().mockResolvedValue(undefined),
  };
});

describe('DM email notification', () => {
  it('emails the other participant and reports email_sent true', async () => {
    expect(await notifyDirectMessage(threadId, sender, deps)).toEqual({ status: 200, body: { success: true, email_sent: true } });
    expect(deps.getRecipient).toHaveBeenCalledWith(recipient);
    expect(deps.send).toHaveBeenCalledWith('recipient@example.com', expect.objectContaining({ preferenceCategory: 'member_messages' }));
    expect(deps.markSent).toHaveBeenCalledWith('message-1');
  });
  it('resolves the primary participant when the counterpart sends', async () => {
    await notifyDirectMessage(threadId, recipient, deps);
    expect(deps.getRecipient).toHaveBeenCalledWith(sender);
  });
  it('rejects callers who are not participants without looking up an email', async () => {
    expect((await notifyDirectMessage(threadId, 'outsider', deps)).status).toBe(403);
    expect(deps.getRecipient).not.toHaveBeenCalled();
    expect(deps.send).not.toHaveBeenCalled();
  });
  it('skips non-direct threads', async () => {
    vi.mocked(deps.getThread).mockResolvedValue({ user_id: sender, other_user_id: null, kind: 'admin', request_status: 'accepted' });
    expect((await notifyDirectMessage(threadId, sender, deps)).body).toEqual({ success: true, email_sent: false });
    expect(deps.send).not.toHaveBeenCalled();
  });
  it('skips explicit recipient opt-outs', async () => {
    vi.mocked(deps.getRecipient).mockResolvedValue({ email: 'recipient@example.com', optedOut: true });
    await notifyDirectMessage(threadId, sender, deps);
    expect(deps.send).not.toHaveBeenCalled();
  });
  it('skips recipients with no email', async () => {
    vi.mocked(deps.getRecipient).mockResolvedValue({ optedOut: false });
    await notifyDirectMessage(threadId, sender, deps);
    expect(deps.send).not.toHaveBeenCalled();
  });
  it('requires a recent persisted member message', async () => {
    vi.mocked(deps.getRecentMessage).mockResolvedValue(null);
    await notifyDirectMessage(threadId, sender, deps);
    expect(deps.send).not.toHaveBeenCalled();
  });
  it('does not send an already-notified message again', async () => {
    vi.mocked(deps.getRecentMessage).mockResolvedValue({ id: 'message-1', email_sent: true });
    await notifyDirectMessage(threadId, sender, deps);
    expect(deps.send).not.toHaveBeenCalled();
  });
  it('uses the same event key on retries', async () => {
    await notifyDirectMessage(threadId, sender, deps);
    await notifyDirectMessage(threadId, sender, deps);
    const keys = vi.mocked(deps.send).mock.calls.map((call) => call[1].idempotencyKey);
    expect(keys).toEqual([`dm-notification-${threadId}-message-1`, `dm-notification-${threadId}-message-1`]);
  });
  it('reports suppression without marking an email sent', async () => {
    vi.mocked(deps.send).mockResolvedValue({ sent: false });
    expect((await notifyDirectMessage(threadId, sender, deps)).body).toEqual({ success: true, email_sent: false });
    expect(deps.markSent).not.toHaveBeenCalled();
  });
  it('skips blocked pairs', async () => {
    vi.mocked(deps.isBlocked).mockResolvedValue(true);
    await notifyDirectMessage(threadId, sender, deps);
    expect(deps.send).not.toHaveBeenCalled();
  });
  it('skips declined conversations', async () => {
    vi.mocked(deps.getThread).mockResolvedValue({ user_id: sender, other_user_id: recipient, kind: 'direct', request_status: 'declined' });
    await notifyDirectMessage(threadId, sender, deps);
    expect(deps.send).not.toHaveBeenCalled();
  });
});