import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface TelegramAlertRequest {
  chatId: string;
  title: string;
  body: string;
  level?: 'critical' | 'high' | 'medium' | 'low';
}

const LEVEL_EMOJI: Record<string, string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    let payload: TelegramAlertRequest;

    try {
      payload = await req.json();
    } catch (error) {
      console.error('telegram-alert: invalid JSON body', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { chatId, title, body, level = 'medium' } = payload;

    if (!chatId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'chatId, title and body are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

    if (!botToken) {
      console.error('telegram-alert: TELEGRAM_BOT_TOKEN is not configured');
      return new Response(
        JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN is not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const emoji = LEVEL_EMOJI[level] || LEVEL_EMOJI.low;
    const message = `${emoji} *${title}*\n\n${body}`;

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    if (!telegramResponse.ok) {
      const errorText = await telegramResponse.text();
      console.error('telegram-alert: Telegram API error', errorText);
      return new Response(
        JSON.stringify({ error: 'Telegram API call failed', details: errorText }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('telegram-alert: unexpected error', error);
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

