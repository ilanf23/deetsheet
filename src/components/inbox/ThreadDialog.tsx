import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ThreadConversation from "./ThreadConversation";
import ThreadActionsMenu from "./ThreadActionsMenu";

interface ThreadDialogProps {
  threadId: string | null;
  onOpenChange: (open: boolean) => void;
  /** Fired after the thread is read so the list can clear its unread dot. */
  onRead?: (threadId: string) => void;
  /** Fired after a request is accepted/declined or a member is blocked. */
  onChanged?: () => void;
}

export default function ThreadDialog({
  threadId,
  onOpenChange,
  onRead,
  onChanged,
}: ThreadDialogProps) {
  const [title, setTitle] = useState("Message");
  const [meta, setMeta] = useState<{ otherUserId: string | null; isDirect: boolean }>({
    otherUserId: null,
    isDirect: false,
  });

  useEffect(() => {
    if (threadId) {
      setTitle("Message");
      setMeta({ otherUserId: null, isDirect: false });
    }
  }, [threadId]);

  return (
    <Dialog open={Boolean(threadId)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full gap-0 p-0 h-[100dvh] max-h-[100dvh] rounded-none sm:h-auto sm:max-h-[85vh] sm:rounded-lg">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <div className="flex items-start justify-between gap-3 pr-8">
            <DialogTitle className="text-lg leading-snug">{title}</DialogTitle>
            {threadId && meta.isDirect && (
              <ThreadActionsMenu
                threadId={threadId}
                otherUserId={meta.otherUserId}
                onBlocked={() => {
                  onChanged?.();
                  onOpenChange(false);
                }}
              />
            )}
          </div>
        </DialogHeader>
        <div className="overflow-y-auto px-5 py-5">
          {threadId && (
            <ThreadConversation
              threadId={threadId}
              onTitle={setTitle}
              onMeta={setMeta}
              onNotFound={() => onOpenChange(false)}
              onRead={() => onRead?.(threadId)}
              onRequestResolved={onChanged}
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
