import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.25.76';
import { sendAppEmail } from '../_shared/transactional-email-templates/send-app-email.ts';
import { notifyDirectMessage } from './notification.ts';

const BodySchema = z.object({ thread_id: z.string().uuid() }).strict();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !anonKey || !serviceKey) throw new Error('Missing configuration');
    const client = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data, error } = await client.auth.getClaims(authHeader.slice(7));
    const senderId = data?.claims?.sub;
    if (error || typeof senderId !== 'string') return json({ error: 'Unauthorized' }, 401);
    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: 'thread_id must be a valid UUID' }, 400);

    const admin = createClient(url, serviceKey);
    const result = await notifyDirectMessage(parsed.data.thread_id, senderId, {
      getThread: async (id) => {
        const { data, error } = await admin.from('message_threads')
          .select('user_id,other_user_id,kind,request_status').eq('id', id).maybeSingle();
        if (error) throw error;
        return data;
      },
      isBlocked: async (sender, recipient) => {
        const { data, error } = await admin.rpc('is_blocked_pair', { _a: sender, _b: recipient });
        if (error) throw error;
        return data === true;
      },
      getRecentMessage: async (threadId, sender) => {
        const { data, error } = await admin.from('messages').select('id,email_sent')
          .eq('thread_id', threadId).eq('sender_id', sender).eq('sender_role', 'user')
          .is('deleted_at', null).gte('created_at', new Date(Date.now() - 5 * 60_000).toISOString())
          .order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (error) throw error;
        return data;
      },
      getRecipient: async (id) => {
        // There is no profiles.email_preferences/direct_messages field.
        // Preserve both existing message-email opt-out controls instead.
        const { data: profile, error: profileError } = await admin.from('profiles')
          .select('email_on_message').eq('id', id).maybeSingle();
        const { data: prefs, error: prefsError } = await admin.from('email_preferences')
          .select('member_messages').eq('user_id', id).maybeSingle();
        if (profileError || prefsError) throw profileError || prefsError;
        if (profile?.email_on_message === false || prefs?.member_messages === false) {
          return { optedOut: true };
        }
        const { data, error } = await admin.auth.admin.getUserById(id);
        if (error) throw error;
        return { email: data.user?.email, optedOut: false };
      },
      send: (email, options) => sendAppEmail('admin-message', email, options),
      markSent: async (id) => {
        const { error } = await admin.from('messages').update({ email_sent: true }).eq('id', id);
        if (error) throw error;
      },
    });
    return json(result.body, result.status);
  } catch {
    console.error('send-dm-notification failed');
    return json({ error: 'Failed to send notification' }, 500);
  }
});