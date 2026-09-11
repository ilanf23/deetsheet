import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendAppEmail } from '../_shared/transactional-email-templates/send-app-email.ts'

/**
 * Sends the branded "we received your post" email to the post's author.
 * Everything is re-derived server-side from the post id, so the caller can only
 * trigger the email for their own post.
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

  let postId: string | undefined
  try {
    const body = await req.json()
    postId = body?.postId ?? body?.post_id
  } catch {
    // handled below
  }
  if (!postId || typeof postId !== 'string') {
    return new Response(JSON.stringify({ error: 'postId is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceKey)

  const { data: post } = await admin
    .from('posts')
    .select('id, title, author_id, image_url, is_anonymous, topic_id')
    .eq('id', postId)
    .maybeSingle()

  if (!post || post.author_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Post not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: topic } = await admin
    .from('topics')
    .select('name')
    .eq('id', post.topic_id)
    .maybeSingle()

  try {
    await sendAppEmail('post-received', user.email!, {
      idempotencyKey: `post-received-${post.id}`,
      templateData: {
        topic: topic?.name ?? undefined,
        title: post.title,
        imageUrl: post.image_url ?? undefined,
        isAnonymous: !!post.is_anonymous,
        ctaUrl: 'https://deetsheet.com/profile',
      },
    })
  } catch (e) {
    console.error('post-received email failed', e)
    return new Response(JSON.stringify({ error: 'Failed to send' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
