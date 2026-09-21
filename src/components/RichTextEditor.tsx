import { useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import type { MarkType } from "@tiptap/pm/model";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  ImagePlus,
  Loader2,
} from "lucide-react";

/** Uploads a picked/pasted image and resolves to its public URL (or null to skip insertion). */
export type ImageUploadHandler = (file: File) => Promise<string | null>;

const imageFiles = (list: FileList | undefined | null): File[] =>
  Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));

interface RichTextEditorProps {
  initialContent?: string;
  placeholder?: string;
  onUpdate?: (html: string) => void;
  onSubmit?: () => void;
  editorRef?: (editor: ReturnType<typeof useEditor>) => void;
  /** Wrap in a bordered/rounded surface. Default true preserves existing call sites. */
  bordered?: boolean;
  /** Show the format toolbar above the content area. Default true preserves existing call sites. */
  showToolbar?: boolean;
  /** Override the minimum content height. Default "60px" preserves existing call sites. */
  minHeight?: string;
  /**
   * When provided, an "Add photo" toolbar button appears and pasted/dropped image
   * files are uploaded through it, then inserted as an <img> at the cursor.
   */
  onImageUpload?: ImageUploadHandler;
}

const RichTextEditor = ({
  initialContent,
  placeholder = "Add a comment...",
  onUpdate,
  editorRef,
  bordered = true,
  showToolbar = true,
  minHeight = "60px",
  onImageUpload,
}: RichTextEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // Keep the latest handler reachable from ProseMirror's paste/drop callbacks,
  // which are bound once when the editor is created.
  const uploadRef = useRef(onImageUpload);
  uploadRef.current = onImageUpload;
  const editorInstanceRef = useRef<Editor | null>(null);

  const insertImages = async (files: File[]) => {
    const upload = uploadRef.current;
    const ed = editorInstanceRef.current;
    if (!upload || !ed) return;
    setUploading(true);
    try {
      for (const file of files) {
        const src = await upload(file);
        if (src && !ed.isDestroyed) ed.chain().focus().setImage({ src, alt: file.name }).run();
      }
    } finally {
      setUploading(false);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      // Registered unconditionally so existing image nodes survive a re-edit
      // (TipTap drops HTML it has no node for). Insertion is only offered when
      // `onImageUpload` is passed.
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none px-3 py-2 text-sm h-full [&_img]:max-h-64 [&_img]:rounded-md [&_img.ProseMirror-selectednode]:ring-2 [&_img.ProseMirror-selectednode]:ring-primary",
        style: `min-height: ${minHeight};`,
      },
      handlePaste: (_view, event) => {
        const files = imageFiles(event.clipboardData?.files);
        if (!files.length || !uploadRef.current) return false;
        event.preventDefault();
        void insertImages(files);
        return true;
      },
      handleDrop: (_view, event) => {
        const files = imageFiles(event.dataTransfer?.files);
        if (!files.length || !uploadRef.current) return false;
        event.preventDefault();
        void insertImages(files);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML());
    },
    onCreate: ({ editor }) => {
      editorRef?.(editor);
    },
  });

  editorInstanceRef.current = editor;

  if (!editor) return null;

  // Empty-selection: ProseMirror's implicit storedMarks path doesn't reliably carry the
  // mark forward, so for empty selections we set/clear stored marks ourselves — that way
  // the next typed character picks them up and the toolbar's active pill flips immediately.
  const toggleMark = (markName: "bold" | "italic" | "underline" | "strike") => {
    const markType = editor.schema.marks[markName] as MarkType | undefined;
    if (!markType) return;

    editor.chain().focus().run();

    const { state, view } = editor;
    if (state.selection.empty) {
      const tr = editor.isActive(markName)
        ? state.tr.removeStoredMark(markType)
        : state.tr.addStoredMark(markType.create());
      view.dispatch(tr);
      return;
    }

    const cmd = {
      bold: "toggleBold",
      italic: "toggleItalic",
      underline: "toggleUnderline",
      strike: "toggleStrike",
    }[markName];
    (editor.chain().focus() as unknown as Record<string, () => { run: () => boolean }>)[cmd]().run();
  };

  const tools = [
    { icon: Bold, action: () => toggleMark("bold"), active: editor.isActive("bold") },
    { icon: Italic, action: () => toggleMark("italic"), active: editor.isActive("italic") },
    { icon: UnderlineIcon, action: () => toggleMark("underline"), active: editor.isActive("underline") },
    { icon: Strikethrough, action: () => toggleMark("strike"), active: editor.isActive("strike") },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
  ];

  const toolbar = showToolbar ? (
    <div className="flex items-center gap-0.5 border-b px-2 py-1">
      {tools.map(({ icon: Icon, action, active }, i) => (
        <button
          key={i}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            action();
          }}
          className={`p-1.5 rounded transition-colors ${
            active
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
      {onImageUpload && (
        <>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = imageFiles(e.target.files);
              e.target.value = "";
              if (files.length) void insertImages(files);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            aria-label="Add photo"
            title="Add photo"
            onMouseDown={(e) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
            className="inline-flex items-center gap-1 p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" />
            )}
            <span className="text-xs">{uploading ? "Uploading…" : "Photo"}</span>
          </button>
        </>
      )}
    </div>
  ) : null;

  if (!bordered) {
    return (
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        {toolbar}
        <EditorContent editor={editor} className="flex-1 min-h-0 overflow-auto" />
      </div>
    );
  }

  return (
    <div className="flex-1 border rounded-lg bg-background overflow-hidden">
      {toolbar}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
