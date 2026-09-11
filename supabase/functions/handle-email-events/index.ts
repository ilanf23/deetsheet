import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.1.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

type Reason = 'bounce' | 'complaint' | 'unsubscribe'

const STATUS: Record<Reason, 'bounced' | 'complained' | 'suppressed'> = {
  bounce: 'bounced',
  complaint: 'complained',
  unsubscribe: 'suppressed',
}

const MESSAGE: Record<Reason, string> = {
  bounce: 'Permanent bounce, email address is invalid or rejected',
  complaint: 'Spam complaint, recipient marked email as spam',
  unsubscribe: 'Recipient unsubscribed',
}

/**
 * Records the delivery outcome in the project's own history tables. These rows
 * are notification-only: Lovable's managed delivery enforces suppression and
 * hosts unsubscribe, so nothing here gates a future send.
 */
async function record(reason: Reason, event: { event_id: string; data: { recipient?: string } }) {
  const email = String(event.data?.recipient ?? '').toLowerCase()
  if (!email) {
    console.warn('Email event without recipient', { event_id: event.event_id })
    return
  }

  const { error: suppressError } = await supabase
    .from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })
  if (suppressError) {
    console.error('Failed to record suppression', {
      event_id: event.event_id,
      code: suppressError.code,
      message: suppressError.message,
    })
    throw new Error('Failed to record suppression')
  }

  const { error: logError } = await supabase.from('email_send_log').insert({
    message_id: null,
    template_name: 'system',
    recipient_email: email,
    status: STATUS[reason],
    error_message: MESSAGE[reason],
    metadata: null,
  })
  if (logError) {
    console.error('Failed to record email_send_log entry', {
      event_id: event.event_id,
      code: logError.code,
      message: logError.message,
    })
    throw new Error('Failed to record email event')
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': async (event) => {
      await record('bounce', event as never)
    },
    'email.complaint': async (event) => {
      await record('complaint', event as never)
    },
    'email.unsubscribed': async (event) => {
      await record('unsubscribe', event as never)
    },
  },
})

Deno.serve((req) => handler(req))
