import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
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
          "prose prose-sm max-w-none focus:outline-none px-3 py-2 text-sm",
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

  const tools = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline") },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike") },
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
      <div className="flex-1 min-w-0">
        {toolbar}
        <EditorContent editor={editor} />
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
