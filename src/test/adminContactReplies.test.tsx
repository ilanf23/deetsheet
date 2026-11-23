import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mocks = vi.hoisted(() => ({
  messages: [] as Record<string, unknown>[],
  toast: vi.fn(),
  getSession: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  fetch: vi.fn(),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getSession: mocks.getSession },
    from: () => ({
      select: () => ({ order: async () => ({ data: mocks.messages }) }),
      update: mocks.update,
    }),
    channel: () => { const channel = { on: () => channel, subscribe: () => channel }; return channel; },
    removeChannel: vi.fn(),
  },
}));
import AdminContactMessages from "@/pages/admin/AdminContactMessages";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.messages = [{ id: "contact-1", name: "Sender", email: "sender@example.test", subject: "Question", message: "Original message", is_read: false, created_at: "2026-11-23", user_id: "member-1", category: null }];
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: "test-token" } } });
  mocks.eq.mockResolvedValue({ error: null });
  mocks.update.mockReturnValue({ eq: mocks.eq });
  mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
  vi.stubGlobal("fetch", mocks.fetch);
});

async function compose() {
  render(<QueryClientProvider client={new QueryClient()}><AdminContactMessages /></QueryClientProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "Reply" }));
  fireEvent.change(screen.getByLabelText("Reply"), { target: { value: "Hello <friend>\nThanks & welcome" } });
  fireEvent.click(screen.getByRole("button", { name: "Send Reply" }));
}

describe("admin contact replies", () => {
  it("sends member replies through the admin function and marks unread contact messages read", async () => {
    await compose();
    await waitFor(() => expect(mocks.eq).toHaveBeenCalledWith("id", "contact-1"));
    expect(mocks.update).toHaveBeenCalledWith({ is_read: true });
    const [url, options] = mocks.fetch.mock.calls[0];
    expect(url).toMatch(/\/functions\/v1\/send-admin-message$/);
    expect(options.headers.Authorization).toBe("Bearer test-token");
    expect(JSON.parse(options.body)).toEqual({ user_id: "member-1", subject: "Re: Question", body_html: "<p>Hello &lt;friend&gt;<br/>Thanks &amp; welcome</p>", send_email: true });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("does not update read state for an already-read message", async () => {
    mocks.messages[0].is_read = true;
    await compose();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("routes guest replies to the email client without sending an in-app message or marking read", async () => {
    mocks.messages[0].user_id = null;
    await compose();
    expect(mocks.toast).toHaveBeenCalledWith({ title: "This visitor has no DeetSheet account — opening email client instead" });
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the dialog open and preserves read state when sending fails", async () => {
    mocks.fetch.mockResolvedValue({ ok: false, json: async () => ({ error: "Not authorized" }) });
    await compose();
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith({ title: "Reply failed", description: "Not authorized", variant: "destructive" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("never sends a member reply without an authenticated session", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    await compose();
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" })));
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});