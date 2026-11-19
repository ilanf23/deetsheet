import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  isMobile: false,
  navigate: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => mocks.isMobile }));
vi.mock("@/components/UserRatingIndicator", () => ({ default: () => null }));
vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

import PostCard from "@/components/PostCard";
import { topicSlug } from "@/lib/topicSlug";
import { buildPostSlug } from "@/lib/postSlug";
import { formatTitle } from "@/lib/formatTitle";
import type { Post } from "@/data/seedData";

const post: Post = {
  id: "p1",
  topicName: "Best coffee",
  categoryName: "Life",
  title: "Best coffee in Town!",
  content: "body text",
  username: "jane",
  ratingScore: 8,
  ratingCount: 3,
  commentCount: 2,
  createdAt: new Date("2026-01-01"),
};

const contentText = formatTitle(post.title || post.content);
const expectedUrl = `${window.location.origin}/topic/${topicSlug(post.topicName)}/post/${
  buildPostSlug(contentText, post.id) || post.id
}`;

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
  mocks.navigate.mockReset();
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

const shareButton = () => screen.getByRole("button", { name: "Share this post" });

// jsdom has no PointerEvent, so the Radix trigger is opened with the keyboard path.
const openShareMenu = () => {
  fireEvent.keyDown(shareButton(), { key: "Enter" });
};

describe("PostCard share", () => {
  it("desktop Share opens a menu with Facebook, X and Copy link", () => {
    render(<PostCard post={post} />);
    openShareMenu();

    expect(screen.getByText("Facebook")).toBeInTheDocument();
    expect(screen.getByText("X")).toBeInTheDocument();
    expect(screen.getByText("Copy link")).toBeInTheDocument();
  });

  it("desktop Facebook item opens the Facebook sharer with the encoded post url", () => {
    render(<PostCard post={post} />);
    openShareMenu();
    mocks.navigate.mockReset();
    fireEvent.click(screen.getByText("Facebook"));

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0][0]).toBe(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(expectedUrl)}`,
    );
    expect(openSpy.mock.calls[0][1]).toBe("_blank");
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("desktop X item opens the Twitter intent with encoded url and title", () => {
    render(<PostCard post={post} />);
    openShareMenu();
    mocks.navigate.mockReset();
    fireEvent.click(screen.getByText("X"));

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0][0]).toBe(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(expectedUrl)}&text=${encodeURIComponent(contentText)}`,
    );
    expect(openSpy.mock.calls[0][1]).toBe("_blank");
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("desktop Copy link copies the post url and toasts Link copied without opening a tab", async () => {
    render(<PostCard post={post} />);
    openShareMenu();
    mocks.navigate.mockReset();
    fireEvent.click(screen.getByText("Copy link"));

    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith({ title: "Link copied", description: expectedUrl }),
    );
    expect(writeTextSpy).toHaveBeenCalledWith(expectedUrl);
    expect(openSpy).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("mobile Share uses the native share sheet and shows no menu", async () => {
    mocks.isMobile = true;
    Object.defineProperty(window.navigator, "share", {
      configurable: true,
      value: shareSpy,
    });
    render(<PostCard post={post} />);
    fireEvent.click(shareButton());

    await waitFor(() =>
      expect(shareSpy).toHaveBeenCalledWith({ title: contentText, url: expectedUrl }),
    );
    expect(screen.queryByText("Facebook")).not.toBeInTheDocument();
    expect(screen.queryByText("Copy link")).not.toBeInTheDocument();
  });

  it("clicking the desktop Share trigger does not navigate the card", () => {
    render(<PostCard post={post} />);
    fireEvent.click(shareButton());

    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
