import { useState } from "react";
import { Navigate, useParams, Link } from "react-router-dom";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import ThreadConversation from "@/components/inbox/ThreadConversation";
import { useAuth } from "@/contexts/AuthContext";

export default function InboxThread() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user, loading } = useAuth();
  const [title, setTitle] = useState("Message");
  const [notFound, setNotFound] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (notFound) return <Navigate to="/inbox" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      <DeetHeader />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10">
        <Link to="/inbox" className="text-sm text-primary hover:underline">
          ← Back to inbox
        </Link>
        <h1 className="text-2xl font-bold mt-3 mb-6">{title}</h1>
        {threadId && (
          <ThreadConversation
            threadId={threadId}
            onTitle={setTitle}
            onNotFound={() => setNotFound(true)}
          />
        )}
      </main>
      <DeetFooter />
    </div>
  );
}
