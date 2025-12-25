/**
 * System Telegram Alerts Edge Function
 * 
 * Phase X.14 - Sends critical system alerts to Telegram
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';
import { getSupabaseClient } from '../_shared/utils.ts';

const logger = createLogger('system-telegram-alerts');

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const TELEGRAM_ADMIN_CHAT_ID = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID') || '';

/**
 * Send Telegram message
 */
async function sendTelegramMessage(
  message: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) {
    logger.warn('Telegram credentials not configured');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_ADMIN_CHAT_ID,
        text: message,
        parse_mode: parseMode,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Telegram API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Failed to send Telegram message:', error);
    return false;
  }
}

/**
 * Format system alert message
 */
function formatAlertMessage(
  level: 'ERROR' | 'CRITICAL' | 'WARNING',
  serviceName: string,
  message: string,
  details?: Record<string, any>
): string {
  const emoji = level === 'CRITICAL' ? '🚨' : level === 'ERROR' ? '❌' : '⚠️';
  const title = level === 'CRITICAL' ? 'حرج' : level === 'ERROR' ? 'خطأ' : 'تحذير';

  let text = `${emoji} <b>${title} في النظام</b>\n\n`;
  text += `<b>الخدمة:</b> ${serviceName}\n`;
  text += `<b>الرسالة:</b> ${message}\n`;

  if (details) {
    text += `\n<b>التفاصيل:</b>\n`;
    Object.entries(details).forEach(([key, value]) => {
      text += `• ${key}: ${value}\n`;
    });
  }

  text += `\n<i>الوقت:</i> ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}`;

  return text;
}

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

    if (req.method === 'POST') {
      const body = await req.json();
      const { level, service_name, message, details } = body;

      if (!level || !service_name || !message) {
        return new Response(
          JSON.stringify({ error: 'level, service_name, and message are required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Check if Telegram alerts are enabled
      const { data: settings } = await supabaseClient
        .from('system_settings' as any)
        .select('setting_value')
        .eq('setting_key', 'telegram_alerts_enabled')
        .maybeSingle();

      const alertsEnabled = settings?.setting_value?.enabled !== false;

      if (!alertsEnabled) {
        return new Response(
          JSON.stringify({ success: true, message: 'Telegram alerts disabled' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Format and send message
      const formattedMessage = formatAlertMessage(
        level as 'ERROR' | 'CRITICAL' | 'WARNING',
        service_name,
        message,
        details
      );

      const sent = await sendTelegramMessage(formattedMessage);

      // Log the alert attempt
      await supabaseClient
        .from('system_logs' as any)
        .insert({
          level: 'INFO',
          source: 'SystemTelegramAlerts',
          message: `Telegram alert ${sent ? 'sent' : 'failed'}: ${service_name} - ${message}`,
          metadata: {
            telegram_sent: sent,
            level,
            service_name,
          },
        });

      return new Response(
        JSON.stringify({
          success: sent,
          message: sent ? 'Alert sent to Telegram' : 'Failed to send alert',
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

