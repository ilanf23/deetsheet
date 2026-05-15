import { supabase } from "@/integrations/supabase/client";

type AuditAction =
  | "post.edit"
  | "post.approve"
  | "post.reject"
  | "post.delete"
  | "topic.approve"
  | "topic.reject";

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
