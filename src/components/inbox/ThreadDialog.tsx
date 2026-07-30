import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ThreadConversation from "./ThreadConversation";

interface ThreadDialogProps {
  threadId: string | null;
  onOpenChange: (open: boolean) => void;
  /** Fired after the thread is read so the list can clear its unread dot. */
  onRead?: (threadId: string) => void;
}

export default function ThreadDialog({
  threadId,
  onOpenChange,
  onRead,
}: ThreadDialogProps) {
  const [title, setTitle] = useState("Message");

  useEffect(() => {
    if (threadId) setTitle("Message");
  }, [threadId]);

  return (
    <Dialog open={Boolean(threadId)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full gap-0 p-0 h-[100dvh] max-h-[100dvh] rounded-none sm:h-auto sm:max-h-[85vh] sm:rounded-lg">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <DialogTitle className="pr-8 text-lg leading-snug">{title}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto px-5 py-5">
          {threadId && (
            <ThreadConversation
              threadId={threadId}
              onTitle={setTitle}
              onNotFound={() => onOpenChange(false)}
              onRead={() => onRead?.(threadId)}
            />
          )}
        </div>
        {threadId && (
          <div className="border-t px-5 py-3">
            <Link
              to={`/inbox/${threadId}`}
              className="text-xs text-primary hover:underline"
            >
              Open full page
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
