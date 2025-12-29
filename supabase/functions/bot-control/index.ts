/**
 * Bot Control Edge Function
 * Phase 3: Backend Implementation - Bot Start/Stop Logic
 * 
 * Handles bot lifecycle: START, STOP, STATUS
 * Enforces safe switching (stop/restart only)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('bot-control');

interface BotControlRequest {
  action: 'START' | 'STOP' | 'STATUS';
  userId?: string; // For admin use
}

interface BotControlResponse {
  success: boolean;
  status?: 'STOPPED' | 'RUNNING' | 'PAUSED' | 'ERROR';
  message?: string;
  error?: string;
  data?: any;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const body: BotControlRequest = await req.json();
    const { action, userId: targetUserId } = body;
    const userId = targetUserId || user.id;

    logger.info(`Bot control action: ${action} for user ${userId}`);

    // Route to appropriate handler
    let response: BotControlResponse;

    switch (action) {
      case 'START':
        response = await handleStart(supabase, userId);
        break;
      case 'STOP':
        response = await handleStop(supabase, userId);
        break;
      case 'STATUS':
        response = await handleStatus(supabase, userId);
        break;
      default:
        response = {
          success: false,
          error: `Unknown action: ${action}`
        };
    }

    return new Response(
      JSON.stringify(response),
      {
        status: response.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('Bot control error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Handle START action
 */
async function handleStart(supabase: any, userId: string): Promise<BotControlResponse> {
  try {
    // 1. Load bot settings
    const { data: settings, error: settingsError } = await supabase
      .from('bot_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError || !settings) {
      return {
        success: false,
        error: 'Bot settings not found'
      };
    }

    // 2. Validate current status
    if (settings.status === 'RUNNING') {
      return {
        success: false,
        error: 'Bot is already running. Please stop it first.'
      };
    }

    // 3. Check if strategy_instance_id exists
    if (!settings.strategy_instance_id) {
      return {
        success: false,
        error: 'No strategy selected. Please assign a strategy instance in Bot Settings.'
      };
    }

    // 4. Load strategy instance
    const { data: instance, error: instanceError } = await supabase
      .from('strategy_instances')
      .select('*')
      .eq('id', settings.strategy_instance_id)
      .eq('user_id', userId)
      .single();

    if (instanceError || !instance) {
      return {
        success: false,
        error: 'Strategy instance not found or access denied'
      };
    }

    // 5. Load strategy template
    const { data: template, error: templateError } = await supabase
      .from('strategy_templates')
      .select('*')
      .eq('id', instance.template_id)
      .single();

    if (templateError || !template) {
      return {
        success: false,
        error: 'Strategy template not found'
      };
    }

    // 6. Validate template is active
    if (!template.is_active) {
      return {
        success: false,
        error: `Strategy template "${template.name}" is not active`
      };
    }

    // 7. Validate config against template schema
    // TODO: Add Zod validation here when schema is available
    // For now, just check that config exists
    if (!instance.config || typeof instance.config !== 'object') {
      return {
        success: false,
        error: 'Invalid strategy configuration'
      };
    }

    // 8. Update bot settings to RUNNING
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('bot_settings')
      .update({
        status: 'RUNNING',
        is_active: true,
        active_strategy_instance_id: instance.id,
        last_started_at: now,
        error_message: null,
        updated_at: now
      })
      .eq('user_id', userId);

    if (updateError) {
      logger.error('Failed to update bot status:', updateError);
      return {
        success: false,
        error: 'Failed to start bot: ' + updateError.message
      };
    }

    // 9. Mark strategy instance as in use
    await supabase
      .from('strategy_instances')
      .update({
        is_in_use: true,
        last_used_at: now,
        updated_at: now
      })
      .eq('id', instance.id);

    logger.info(`✅ Bot started successfully for user ${userId} with strategy ${template.name} v${instance.version}`);

    return {
      success: true,
      status: 'RUNNING',
      message: `Bot started successfully with strategy "${instance.name}" (${template.name} v${instance.version})`,
      data: {
        strategyName: instance.name,
        templateName: template.name,
        version: instance.version,
        startedAt: now
      }
    };

  } catch (error) {
    logger.error('Error in handleStart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Handle STOP action
 */
async function handleStop(supabase: any, userId: string): Promise<BotControlResponse> {
  try {
    // 1. Load bot settings
    const { data: settings, error: settingsError } = await supabase
      .from('bot_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError || !settings) {
      return {
        success: false,
        error: 'Bot settings not found'
      };
    }

    // 2. Check if bot is already stopped
    if (settings.status === 'STOPPED') {
      return {
        success: true,
        status: 'STOPPED',
        message: 'Bot is already stopped'
      };
    }

    // 3. Update bot settings to STOPPED
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('bot_settings')
      .update({
        status: 'STOPPED',
        is_active: false,
        last_stopped_at: now,
        updated_at: now
      })
      .eq('user_id', userId);

    if (updateError) {
      logger.error('Failed to update bot status:', updateError);
      return {
        success: false,
        error: 'Failed to stop bot: ' + updateError.message
      };
    }

    // 4. Mark strategy instance as not in use (if exists)
    if (settings.active_strategy_instance_id) {
      await supabase
        .from('strategy_instances')
        .update({
          is_in_use: false,
          updated_at: now
        })
        .eq('id', settings.active_strategy_instance_id);
    }

    logger.info(`✅ Bot stopped successfully for user ${userId}`);

    return {
      success: true,
      status: 'STOPPED',
      message: 'Bot stopped successfully',
      data: {
        stoppedAt: now
      }
    };

  } catch (error) {
    logger.error('Error in handleStop:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Handle STATUS action
 */
async function handleStatus(supabase: any, userId: string): Promise<BotControlResponse> {
  try {
    const { data: settings, error } = await supabase
      .from('bot_settings')
      .select(`
        *,
        active_strategy:active_strategy_instance_id (
          id,
          name,
          version,
          template:template_id (
            name,
            key
          )
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error || !settings) {
      return {
        success: false,
        error: 'Bot settings not found'
      };
    }

    return {
      success: true,
      status: settings.status || 'STOPPED',
      data: {
        status: settings.status || 'STOPPED',
        isActive: settings.is_active || false,
        activeStrategy: settings.active_strategy,
        lastStartedAt: settings.last_started_at,
        lastStoppedAt: settings.last_stopped_at,
        errorMessage: settings.error_message
      }
    };

  } catch (error) {
    logger.error('Error in handleStatus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

