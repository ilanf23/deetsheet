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

    // Find or create thread
    let threadId = payload.thread_id ?? null;
    if (!threadId) {
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

    // Send email via existing send-email function
    let emailSent = false;
    let emailMessageId: string | null = null;
    if (payload.send_email !== false && recipientEmail) {
      try {
        const emailRes = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              to: recipientEmail,
              subject: payload.subject,
              html: bodyHtml,
            }),
          }
        );
        const emailData = await emailRes.json();
        if (emailRes.ok) {
          emailSent = true;
          emailMessageId = emailData?.data?.id ?? null;
        } else {
          console.error("send-email failed:", emailData);
        }
      } catch (e) {
        console.error("send-email exception:", e);
      }
    }

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

    // Reset thread status to open on admin send (was needs_contact after user reply)
    await admin
      .from("message_threads")
      .update({ status: "open", subject: payload.subject })
      .eq("id", threadId);

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
