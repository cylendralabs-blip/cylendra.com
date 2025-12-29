/**
 * AI User Settings Edge Function
 *
 * Provides APIs to load/save/reset indicator & fusion settings per user.
 *
 * Routes:
 *  - GET /?user_id=<uuid> -> load merged settings
 *  - POST /save -> save custom settings
 *  - POST /reset -> reset to defaults
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('ai-user-settings');

interface RequestContext {
  supabase: SupabaseClient;
  userId: string;
}

function getSupabaseClient(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });
}

async function getUserContext(req: Request): Promise<RequestContext> {
  const supabase = getSupabaseClient(req);
  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace('Bearer ', '');

  const {
    data: { user },
    error
  } = await supabase.auth.getUser(jwt);

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return { supabase, userId: user.id };
}

async function loadSettings(ctx: RequestContext) {
  const { supabase, userId } = ctx;

  const { data, error } = await supabase
    .from('ai_signal_user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

async function saveSettings(ctx: RequestContext, body: any) {
  const { supabase, userId } = ctx;

  const payload = {
    user_id: userId,
    smart_mode_enabled: body.smartModeEnabled ?? true,
    global_settings: body.globalSettings ?? {},
    timeframe_profiles: body.timeframeProfiles ?? {},
    weight_presets: body.weightPresets ?? {},
    last_reset_at: body.lastResetAt ?? null,
    signal_source: body.signalSource ?? 'ai'
  };

  const { error } = await supabase
    .from('ai_signal_user_settings')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    throw error;
  }

  return { success: true };
}

async function resetSettings(ctx: RequestContext) {
  const { supabase, userId } = ctx;

  const payload = {
    user_id: userId,
    smart_mode_enabled: true,
    global_settings: {},
    timeframe_profiles: {},
    weight_presets: {},
    last_reset_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('ai_signal_user_settings')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    throw error;
  }

  return { success: true };
}

function withCors(response: Response) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    headers
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return withCors(new Response(null, { status: 204 }));
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname.replace('/ai-user-settings', '');
    const headerAction = req.headers.get('x-action');
    const queryAction = url.searchParams.get('action');
    const pathAction = pathname.replace('/', '');
    const action = headerAction || queryAction || pathAction;

    if (req.method === 'GET') {
      const ctx = await getUserContext(req);
      const data = await loadSettings(ctx);
      return withCors(
        new Response(JSON.stringify({ data }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );
    }

    if (req.method === 'POST' && (pathname === '/save' || action === 'save')) {
      const ctx = await getUserContext(req);
      const body = await req.json();
      const result = await saveSettings(ctx, body);
      return withCors(
        new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );
    }

    if (req.method === 'POST' && (pathname === '/reset' || action === 'reset')) {
      const ctx = await getUserContext(req);
      const result = await resetSettings(ctx);
      return withCors(
        new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );
    }

    return withCors(
      new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  } catch (error) {
    logger.error('ai-user-settings error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    return withCors(
      new Response(JSON.stringify({ error: message }), {
        status: message === 'Unauthorized' ? 401 : 500,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  }
});

