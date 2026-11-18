import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  isMobile: false,
}));

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => mocks.isMobile }));
vi.mock("@/components/PostActionMenu", () => ({ default: () => null }));
vi.mock("@/components/EditPostDialog", () => ({ default: () => null }));

import PostMetaBar from "@/components/post/PostMetaBar";

const TITLE = "Best coffee in Town!";

const openSpy = vi.fn();
const shareSpy = vi.fn();
const writeTextSpy = vi.fn(async () => {});

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  mocks.toast.mockReset();
  mocks.isMobile = false;
  openSpy.mockReset();
  shareSpy.mockReset();
  writeTextSpy.mockClear();
  window.open = openSpy as unknown as typeof window.open;
  Object.defineProperty(window.navigator, "clipboard", {
    configurable: true,
    value: { writeText: writeTextSpy },
  });
});

afterEach(() => {
  delete (window.navigator as unknown as { share?: unknown }).share;
});

const shareButton = () => screen.getByRole("button", { name: "Share this answer" });

// jsdom has no PointerEvent, so the Radix trigger is opened with the keyboard path.
const openShareMenu = () => {
  fireEvent.keyDown(shareButton(), { key: "Enter" });
};

describe("PostMetaBar share", () => {
  it("desktop Share opens a menu with Facebook, X and Copy link", () => {
    render(<PostMetaBar commentCount={3} postTitle={TITLE} />);
    openShareMenu();

    expect(screen.getByText("Facebook")).toBeInTheDocument();
    expect(screen.getByText("X")).toBeInTheDocument();
    expect(screen.getByText("Copy link")).toBeInTheDocument();
  });

  it("desktop Facebook item opens the Facebook sharer with the encoded url", () => {
    render(<PostMetaBar commentCount={3} postTitle={TITLE} />);
    openShareMenu();
    fireEvent.click(screen.getByText("Facebook"));

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0][0]).toBe(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
    );
    expect(openSpy.mock.calls[0][1]).toBe("_blank");
  });

  it("desktop X item opens the Twitter intent with encoded url and title", () => {
    render(<PostMetaBar commentCount={3} postTitle={TITLE} />);
    openShareMenu();
    fireEvent.click(screen.getByText("X"));

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0][0]).toBe(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(TITLE)}`,
    );
    expect(openSpy.mock.calls[0][1]).toBe("_blank");
  });

  it("desktop Copy link copies the url and toasts Link copied without opening a tab", async () => {
    render(<PostMetaBar commentCount={3} postTitle={TITLE} />);
    openShareMenu();
    fireEvent.click(screen.getByText("Copy link"));

    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith({ title: "Link copied" }));
    expect(writeTextSpy).toHaveBeenCalledWith(window.location.href);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("mobile Share uses the native share sheet and shows no menu", async () => {
    mocks.isMobile = true;
    Object.defineProperty(window.navigator, "share", {
      configurable: true,
      value: shareSpy,
    });
    render(<PostMetaBar commentCount={3} postTitle={TITLE} />);
    fireEvent.click(shareButton());

    await waitFor(() =>
      expect(shareSpy).toHaveBeenCalledWith({
        title: TITLE,
        url: window.location.href,
      }),
    );
    expect(screen.queryByText("Facebook")).not.toBeInTheDocument();
    expect(screen.queryByText("Copy link")).not.toBeInTheDocument();
  });
});
