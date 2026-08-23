import { useState } from "react";
import { Navigate, useParams, Link } from "react-router-dom";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import ThreadConversation from "@/components/inbox/ThreadConversation";
import ThreadActionsMenu from "@/components/inbox/ThreadActionsMenu";
import { useAuth } from "@/contexts/AuthContext";

export default function InboxThread() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user, loading } = useAuth();
  const [title, setTitle] = useState("Message");
  const [notFound, setNotFound] = useState(false);
  const [meta, setMeta] = useState<{ otherUserId: string | null; isDirect: boolean }>({
    otherUserId: null,
    isDirect: false,
  });
  const [gone, setGone] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (notFound || gone) return <Navigate to="/inbox" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      <DeetHeader />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10">
        <Link to="/inbox" className="text-sm text-primary hover:underline">
          ← Back to inbox
        </Link>
        <div className="mt-3 mb-6 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{title}</h1>
          {threadId && (
            <ThreadActionsMenu
              threadId={threadId}
              otherUserId={meta.otherUserId}
              isDirect={meta.isDirect}
              onBlocked={() => setGone(true)}
              onDeleted={() => setGone(true)}
            />
          )}
        </div>
        {threadId && (
          <ThreadConversation
            threadId={threadId}
            onTitle={setTitle}
            onMeta={setMeta}
            onNotFound={() => setNotFound(true)}
          />
        )}
      </main>
      <DeetFooter />
    </div>
  );
}
