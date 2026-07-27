import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

/**
 * Sends the branded "welcome" email exactly once per account.
 *
 * Called by the client on the first authenticated session (works for both
 * email/password and Google sign-ups). Idempotency is enforced server-side by
 * checking email_send_log for an existing `welcome` row for this address.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userRes, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userRes?.user?.email) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const user = userRes.user
  const email = user.email!.toLowerCase()

  const admin = createClient(supabaseUrl, serviceKey)

  const { data: existing, error: logErr } = await admin
    .from('email_send_log')
    .select('id')
    .eq('template_name', 'welcome')
    .eq('recipient_email', email)
    .limit(1)

  if (logErr) {
    console.error('welcome dedupe check failed', logErr)
    return new Response(JSON.stringify({ error: 'Failed to check send history' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (existing && existing.length > 0) {
    return new Response(JSON.stringify({ success: true, skipped: 'already_sent' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('username, full_name')
    .eq('id', user.id)
    .maybeSingle()

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const rawName =
    (profile?.full_name as string | null) ||
    (profile?.username as string | null) ||
    (meta.full_name as string | undefined) ||
    (meta.name as string | undefined) ||
    (meta.username as string | undefined) ||
    ''
  const firstName = rawName.trim().split(/\s+/)[0] || undefined

  const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      templateName: 'welcome',
      recipientEmail: email,
      idempotencyKey: `welcome-${user.id}`,
      templateData: { firstName },
    }),
  })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    console.error('welcome send failed', data)
    return new Response(JSON.stringify({ error: 'Failed to send welcome email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
