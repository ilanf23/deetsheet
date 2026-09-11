import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendTemplateEmail } from './send-email.ts'
import { TEMPLATES } from './registry.ts'

// Optional email categories users can turn off on /email-preferences.
// Templates not listed here are account/security emails and always send.
const TEMPLATE_CATEGORY: Record<
  string,
  'post_updates' | 'admin_messages' | 'comment_notifications' | 'member_messages' | undefined
> = {
  'post-received': 'post_updates',
  'post-approved': 'post_updates',
  'post-approved-adjusted': 'post_updates',
  'post-pending': 'post_updates',
  'post-photo-denied': 'post_updates',
  'post-denied': 'post_updates',
  'admin-message': 'admin_messages',
  'comment-notification': 'comment_notifications',
}

export type SendAppEmailResult =
  | { sent: true; messageId: string }
  | { sent: false; reason: 'recipient_suppressed' | 'opted_out' }

/**
 * Project wrapper around the managed send helper. It keeps the two behaviours
 * this app relies on: the recipient's own email-category preferences, and the
 * append-only `email_send_log` history. Suppression, retries, rate limits and
 * unsubscribe are handled by Lovable's managed email delivery.
 */
export async function sendAppEmail(
  templateName: string,
  recipientEmail: string,
  options: { templateData?: Record<string, unknown>; idempotencyKey?: string } = {},
): Promise<SendAppEmailResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const template = TEMPLATES[templateName]
  const effectiveRecipient = template?.to || recipientEmail
  const messageId = crypto.randomUUID()

  const logRow = (status: string, errorMessage?: string) =>
    supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status,
      ...(errorMessage ? { error_message: errorMessage.slice(0, 1000) } : {}),
    })

  const logFailure = async (status: string, errorMessage?: string) => {
    const { error } = await logRow(status, errorMessage)
    if (error) {
      console.error('Failed to write email_send_log row', { status, error })
    }
  }

  // Respect the recipient's email preferences. Account/security emails
  // (welcome, auth) have no category and always send.
  const category = TEMPLATE_CATEGORY[templateName]
  if (category) {
    const { data: prefs } = await supabase
      .from('email_preferences')
      .select('post_updates, admin_messages, comment_notifications, member_messages')
      .ilike('email', effectiveRecipient)
      .maybeSingle()

    if (prefs && (prefs as Record<string, unknown>)[category] === false) {
      await logFailure('suppressed', `Recipient opted out of ${category}`)
      console.log('Email skipped by preference', { templateName, category })
      return { sent: false, reason: 'opted_out' }
    }
  }

  try {
    const result = await sendTemplateEmail(templateName, effectiveRecipient, {
      templateData: options.templateData as Record<string, any> | undefined,
      idempotencyKey: options.idempotencyKey,
    })

    if (!result.sent) {
      await logFailure('suppressed', 'Recipient is suppressed')
      return { sent: false, reason: 'recipient_suppressed' }
    }

    await logFailure('sent')
    return { sent: true, messageId }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await logFailure('failed', message)
    throw error
  }
}
