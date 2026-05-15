import { supabase } from "@/integrations/supabase/client";

type AuditAction =
  | "post.edit"
  | "post.approve"
  | "post.reject"
  | "post.delete"
  | "comment.edit"
  | "comment.delete"
  | "topic.approve"
  | "topic.reject"
  | "topic.image.pin"
  | "topic.image.unpin"
  | "topic.image.approve"
  | "topic.image.hide"
  | "topic.image.upload"
  | "topic.image.delete";

export async function logAdminAction(params: {
  actorId: string;
  action: AuditAction;
  entityType: "post" | "topic" | "comment";
  entityId: string;
  details?: Record<string, unknown>;
}) {
  const { actorId, action, entityType, entityId, details = {} } = params;
  const { error } = await supabase.from("audit_logs").insert([
    {
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details as never,
    },
  ]);
  if (error) {
    // Audit failure must not block the moderation action — surface in console only.
    console.warn("audit log insert failed", error);
  }
}
