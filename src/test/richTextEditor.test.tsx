import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { Editor } from "@tiptap/react";
import RichTextEditor from "@/components/RichTextEditor";

// jsdom lacks the range/layout APIs ProseMirror probes on mount.
beforeAll(() => {
  document.createRange = () => {
    const range = new Range();
    range.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0, toJSON: () => ({}) });
    range.getClientRects = () => ({ item: () => null, length: 0, [Symbol.iterator]: [][Symbol.iterator] } as unknown as DOMRectList);
    return range;
  };
  // ResizeObserver is not implemented in jsdom.
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const IMG_HTML = '<p>Look at this</p><img src="https://example.com/photo.jpg" alt="photo.jpg"><p>nice</p>';

describe("RichTextEditor image support", () => {
  it("keeps existing <img> nodes when re-editing content (no image node = TipTap drops them)", async () => {
    let editor: Editor | null = null;
    render(
      <RichTextEditor
        initialContent={IMG_HTML}
        editorRef={(e) => {
          editor = e;
        }}
      />,
    );
    await waitFor(() => expect(editor).not.toBeNull());
    expect(editor!.getHTML()).toContain('<img src="https://example.com/photo.jpg"');
  });

  it("shows the Photo button only when an upload handler is provided", async () => {
    const { unmount } = render(<RichTextEditor />);
    await waitFor(() => expect(document.querySelector(".ProseMirror")).not.toBeNull());
    expect(screen.queryByRole("button", { name: /add photo/i })).toBeNull();
    unmount();

    render(<RichTextEditor onImageUpload={vi.fn(async () => null)} />);
    await waitFor(() => expect(screen.getByRole("button", { name: /add photo/i })).toBeInTheDocument());
  });

  it("uploads a picked file and inserts the returned URL as an image", async () => {
    let editor: Editor | null = null;
    const upload = vi.fn(async () => "https://cdn.test/uploaded.png");
    const { container } = render(
      <RichTextEditor
        onImageUpload={upload}
        editorRef={(e) => {
          editor = e;
        }}
      />,
    );
    await waitFor(() => expect(editor).not.toBeNull());

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "pic.png", { type: "image/png" });
    Object.defineProperty(input, "files", { value: [file] });
    input.dispatchEvent(new Event("change", { bubbles: true }));

    await waitFor(() => expect(upload).toHaveBeenCalledWith(file));
    await waitFor(() => expect(editor!.getHTML()).toContain('<img src="https://cdn.test/uploaded.png"'));
  });
});
