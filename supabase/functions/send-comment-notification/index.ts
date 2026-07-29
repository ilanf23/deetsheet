import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

/**
 * Sends the branded "comment-notification" email to a post author when someone
 * comments on their post. Called by the client right after a comment insert.
 *
 * Everything is re-derived server-side from the comment id, so the caller can
 * only trigger a notification for a comment that actually exists. The send goes
 * through send-transactional-email, which enforces suppression and the
 * recipient's `comment_notifications` preference.
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
  if (userErr || !userRes?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let commentId: string | undefined
  try {
    const body = await req.json()
    commentId = body?.commentId ?? body?.comment_id
  } catch {
    // handled below
  }
  if (!commentId || typeof commentId !== 'string') {
    return new Response(JSON.stringify({ error: 'commentId is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceKey)

  const { data: comment, error: commentErr } = await admin
    .from('comments')
    .select('id, post_id, author_id, content, is_anonymous')
    .eq('id', commentId)
    .maybeSingle()

  if (commentErr || !comment) {
    return new Response(JSON.stringify({ error: 'Comment not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: post } = await admin
    .from('posts')
    .select('id, title, author_id')
    .eq('id', comment.post_id)
    .maybeSingle()

  if (!post?.author_id || post.author_id === comment.author_id) {
    return new Response(JSON.stringify({ success: true, skipped: 'no_recipient' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: authorUser } = await admin.auth.admin.getUserById(post.author_id)
  const recipientEmail = authorUser?.user?.email
  if (!recipientEmail) {
    return new Response(JSON.stringify({ success: true, skipped: 'no_email' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let commenterName = 'Someone'
  if (!comment.is_anonymous) {
    const { data: profile } = await admin
      .from('profiles')
      .select('name, username')
      .eq('id', comment.author_id)
      .maybeSingle()
    commenterName = profile?.name?.trim() || profile?.username?.trim() || 'Someone'
  }

  const { data: link } = await admin.rpc('build_post_link', { _post_id: post.id })
  const postUrl = link ? `https://deetsheet.com${link}` : 'https://deetsheet.com'

  // Strip any HTML the rich-text editor produced; the template renders plain text.
  const plainComment = String(comment.content ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600)

  const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      templateName: 'comment-notification',
      recipientEmail,
      idempotencyKey: `comment-notification-${comment.id}`,
      templateData: {
        commenterName,
        postTitle: post.title,
        commentText: plainComment,
        postUrl,
      },
    }),
  })

  const result = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('comment notification send failed', result)
    return new Response(JSON.stringify({ error: 'Failed to send' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true, result }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
