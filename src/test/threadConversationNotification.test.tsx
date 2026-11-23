import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  insert: vi.fn(), invoke: vi.fn(), toast: vi.fn(),
  user: { id: 'sender' },
  thread: { id: 'thread-1', subject: 'Conversation', user_id: 'sender', other_user_id: 'recipient', kind: 'direct', status: 'open', request_status: 'accepted', initiated_by: 'sender' },
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: mocks.invoke },
    from: (table: string) => {
      const chain = {
        select: () => chain, eq: () => chain,
        maybeSingle: async () => ({ data: table === 'message_threads' ? mocks.thread : { id: 'recipient', username: 'Recipient' } }),
        order: async () => ({ data: [] }), in: async () => ({ data: [] }),
        insert: mocks.insert,
      };
      return chain;
    },
  },
}));
import ThreadConversation from '@/components/inbox/ThreadConversation';

beforeEach(() => {
  mocks.insert.mockReset().mockResolvedValue({ error: null });
  mocks.invoke.mockReset().mockResolvedValue({ data: { success: true } });
  mocks.toast.mockReset();
});

async function sendReply(senderRole: 'user' | 'admin' = 'user') {
  render(<ThreadConversation threadId="thread-1" markRead={false} senderRole={senderRole} />);
  const input = await screen.findByPlaceholderText('Write a reply…');
  fireEvent.change(input, { target: { value: 'A real reply' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send Message' }));
  await waitFor(() => expect(mocks.insert).toHaveBeenCalled());
}

describe('conversation DM notification trigger', () => {
  it('invokes the DM notification after a successful member reply', async () => {
    await sendReply();
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('send-dm-notification', { body: { thread_id: 'thread-1' } }));
  });
  it('never invokes for admin replies', async () => {
    await sendReply('admin');
    await waitFor(() => expect(screen.getByPlaceholderText('Write a reply…')).toHaveValue(''));
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it('never invokes when the message insert fails', async () => {
    mocks.insert.mockResolvedValue({ error: { message: 'Insert failed' } });
    await sendReply();
    await waitFor(() => expect(mocks.toast).toHaveBeenCalled());
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it('does not fail the reply when notification sending rejects', async () => {
    mocks.invoke.mockRejectedValue(new Error('Email unavailable'));
    await sendReply();
    await waitFor(() => expect(screen.getByPlaceholderText('Write a reply…')).toHaveValue(''));
    expect(mocks.toast).not.toHaveBeenCalled();
  });
});