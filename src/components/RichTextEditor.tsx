import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import type { MarkType } from "@tiptap/pm/model";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
} from "lucide-react";

interface RichTextEditorProps {
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
}

const RichTextEditor = ({
  placeholder = "Add a comment...",
  onUpdate,
  editorRef,
  bordered = true,
  showToolbar = true,
  minHeight = "60px",
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none px-3 py-2 text-sm h-full",
        style: `min-height: ${minHeight};`,
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML());
    },
    onCreate: ({ editor }) => {
      editorRef?.(editor);
    },
  });

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
