/**
 * System Settings Edge Function
 * 
 * Phase X.14 - Manage global system settings
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';
import { getSupabaseClient, getUserFromRequest } from '../_shared/utils.ts';

const logger = createLogger('system-settings');

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = getSupabaseClient();
    const user = await getUserFromRequest(req, supabaseClient);

    // Only allow authenticated users (admin check can be added)
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'GET') {
      // Get all settings
      const { data: settings, error } = await supabaseClient
        .from('system_settings' as any)
        .select('*')
        .order('setting_key');

      if (error) {
        logger.error('Error fetching settings:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch settings' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Convert to key-value object
      const settingsObj: Record<string, any> = {};
      settings?.forEach((setting: any) => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });

      return new Response(
        JSON.stringify({
          success: true,
          settings: settingsObj,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { setting_key, setting_value, description } = body;

      if (!setting_key || setting_value === undefined) {
        return new Response(
          JSON.stringify({ error: 'setting_key and setting_value required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Upsert setting
      const { data, error } = await supabaseClient
        .from('system_settings' as any)
        .upsert({
          setting_key,
          setting_value: typeof setting_value === 'string' ? JSON.parse(setting_value) : setting_value,
          description: description || null,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'setting_key',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error updating setting:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update setting' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          setting: data,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('Handler error:', error);
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

