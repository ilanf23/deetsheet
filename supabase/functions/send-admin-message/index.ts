import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Slip {
  status?: string;
  post?: string;
  reason?: string;
  suggestions?: string;
  deadline_text?: string;
}

interface Payload {
  thread_id?: string;
  user_id: string;
  post_id?: string | null;
  subject: string;
  body_html?: string;
  slip?: Slip;
  send_email?: boolean;
  /** Registered transactional template name, e.g. "post-approved". */
  email_template?: string;
  template_data?: Record<string, unknown>;
  /** Default true. When false, no thread/message row is created (review outcomes). */
  create_thread?: boolean;

}


function htmlToText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

function renderSlipHtml(subject: string, slip: Slip | undefined, bodyHtml: string | undefined) {
  const rows: [string, string][] = [];
  if (slip?.status) rows.push(["Status", slip.status]);
  if (slip?.post) rows.push(["Post", slip.post]);
  if (slip?.reason) rows.push(["Reason", slip.reason]);
  if (slip?.suggestions) rows.push(["Suggestions", slip.suggestions]);
  if (slip?.deadline_text) rows.push(["Deadline", slip.deadline_text]);

  const rowsHtml = rows
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:10px 14px;background:#f6f7f9;color:#1e2a44;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;vertical-align:top;width:120px;border-bottom:1px solid #e6e8ee;">${escapeHtml(k)}</td>
        <td style="padding:10px 14px;color:#1a1a1a;font-size:14px;border-bottom:1px solid #e6e8ee;">${escapeHtml(v).replace(/\n/g, "<br/>")}</td>
      </tr>`
    )
    .join("");

  const extra = bodyHtml && bodyHtml.trim().length > 0
    ? `<div style="margin-top:16px;color:#1a1a1a;font-size:14px;line-height:1.5;">${bodyHtml}</div>`
    : "";

  return `<!doctype html><html><body style="margin:0;padding:0;background:#f0f2f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:#0e2a4a;color:#fff;padding:12px 16px;border-radius:8px 8px 0 0;font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;">Review Slip — DeetSheet</div>
      <div style="background:#e9edf5;border:1px solid #d4dae5;border-top:none;border-radius:0 0 8px 8px;padding:16px;">
        <h2 style="margin:0 0 12px;font-size:18px;color:#0e2a4a;">${escapeHtml(subject)}</h2>
        <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e6e8ee;border-radius:6px;overflow:hidden;">${rowsHtml}</table>
        ${extra}
        <p style="margin:20px 0 0;font-size:12px;color:#64708b;">Reply directly on DeetSheet: <a href="https://deetsheet.com/inbox" style="color:#2d5a3d;">deetsheet.com/inbox</a></p>
      </div>
    </div>
  </body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const senderId = claims.claims.sub as string;

    // Confirm admin
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", senderId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as Payload;
    if (!payload?.user_id || !payload?.subject) {
      return new Response(JSON.stringify({ error: "user_id and subject required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Review outcomes pass create_thread: false — they get email + in-app
    // notification only, and must never appear in the member's inbox.
    const createThread = payload.create_thread !== false;

    // Find or create thread
    let threadId = payload.thread_id ?? null;
    if (createThread && !threadId) {
      if (payload.post_id) {
        const { data: existing } = await admin
          .from("message_threads")
          .select("id")
          .eq("user_id", payload.user_id)
          .eq("post_id", payload.post_id)
          .maybeSingle();
        threadId = existing?.id ?? null;
      }
      if (!threadId) {
        const { data: created, error: threadErr } = await admin
          .from("message_threads")
          .insert({
            user_id: payload.user_id,
            post_id: payload.post_id ?? null,
            subject: payload.subject,
          })
          .select("id")
          .single();
        if (threadErr) throw threadErr;
        threadId = created.id;
      }
    }


    const bodyHtml = renderSlipHtml(payload.subject, payload.slip, payload.body_html);
    const bodyText = [
      payload.slip?.status && `Status: ${payload.slip.status}`,
      payload.slip?.post && `Post: ${payload.slip.post}`,
      payload.slip?.reason && `Reason: ${payload.slip.reason}`,
      payload.slip?.suggestions && `Suggestions: ${payload.slip.suggestions}`,
      payload.slip?.deadline_text && `Deadline: ${payload.slip.deadline_text}`,
    ]
      .filter(Boolean)
      .join("\n");

    // Fetch recipient email
    const { data: userInfo } = await admin.auth.admin.getUserById(payload.user_id);
    const recipientEmail = userInfo?.user?.email ?? null;

    // Send email. ALL admin emails go through send-transactional-email so that
    // suppression and the recipient's email preferences are always enforced.
    // Direct messages with no explicit template fall back to the branded
    // "admin-message" template built from the review slip.
    let emailSent = false;
    let emailMessageId: string | null = null;
    if (payload.send_email !== false && recipientEmail) {
      try {
        const templateName = payload.email_template || "admin-message";
        const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`;
        const emailBody = payload.email_template
          ? {
              templateName,
              recipientEmail,
              idempotencyKey: `${templateName}-${payload.post_id ?? payload.user_id}-${Date.now()}`,
              templateData: payload.template_data ?? {},
            }
          : {
              templateName,
              recipientEmail,
              idempotencyKey: `admin-message-${payload.user_id}-${Date.now()}`,
              templateData: {
                eyebrow: "MESSAGE FROM DEETSHEET",
                statusValue: payload.slip?.status ?? undefined,
                headline: payload.subject,
                quotedTitle: payload.slip?.post ?? undefined,
                reason: payload.slip?.reason ?? undefined,
                suggestions: payload.slip?.suggestions
                  ? [payload.slip.suggestions]
                  : undefined,
                bodyText: htmlToText(payload.body_html ?? ""),
                callout: payload.slip?.deadline_text ?? undefined,
                ...(payload.template_data ?? {}),
              },
            };

        const emailRes = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify(emailBody),
        });
        const emailData = await emailRes.json();
        if (emailRes.ok && emailData?.success !== false) {

          emailSent = true;
          emailMessageId = emailData?.data?.id ?? null;
        } else {
          console.error("email send failed:", emailData);
        }
      } catch (e) {
        console.error("email send exception:", e);
      }
    }


    let messageId: string | null = null;

    if (createThread) {
      // Insert message row
      const { data: message, error: msgErr } = await admin
        .from("messages")
        .insert({
          thread_id: threadId,
          sender_id: senderId,
          sender_role: "admin",
          body_html: bodyHtml,
          body_text: bodyText,
          slip: payload.slip ?? null,
          email_sent: emailSent,
          email_message_id: emailMessageId,
        })
        .select("id")
        .single();
      if (msgErr) throw msgErr;
      messageId = message.id;

      // Reset thread status to open on admin send (was needs_contact after user reply)
      await admin
        .from("message_threads")
        .update({ status: "open", subject: payload.subject })
        .eq("id", threadId);
    } else {
      // No inbox thread for review outcomes — the in-app notification is the
      // only on-site surface. The posts status trigger already notifies on a
      // status change, so skip if one was just written for this post.
      const since = new Date(Date.now() - 60_000).toISOString();
      const { data: recent } = await admin
        .from("notifications")
        .select("id")
        .eq("user_id", payload.user_id)
        .eq("post_id", payload.post_id ?? null)
        .gte("created_at", since)
        .limit(1);

      if (!recent?.length) {
        let link = "/profile";
        if (payload.post_id) {
          const { data: built } = await admin.rpc("build_post_link", {
            _post_id: payload.post_id,
          });
          if (typeof built === "string" && built) link = built;
        }
        await admin.from("notifications").insert({
          user_id: payload.user_id,
          type: "post_status",
          message: payload.subject,
          link,
          post_id: payload.post_id ?? null,
        });
      }
    }


    return new Response(
      JSON.stringify({ success: true, thread_id: threadId, message_id: message.id, email_sent: emailSent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-admin-message error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
