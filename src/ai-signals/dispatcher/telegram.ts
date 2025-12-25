/**
 * Telegram Broadcasting
 * 
 * Broadcasts Ultra Signals to Telegram channel/group
 * 
 * Phase X.3: Real-Time Engine + Telegram + TTL
 */

import type { UltraSignal } from '../fusion/types';
import { getEnvValue } from '../utils/env';

/**
 * Telegram Bot Configuration
 */
export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

/**
 * Get Telegram configuration from environment
 */
function getTelegramConfig(
  override?: Partial<TelegramConfig>
): TelegramConfig {
  const botToken =
    override?.botToken ||
    getEnvValue('VITE_TELEGRAM_BOT_TOKEN') ||
    getEnvValue('TELEGRAM_BOT_TOKEN') ||
    '';

  const chatId =
    override?.chatId ||
    getEnvValue('VITE_TELEGRAM_CHAT_ID') ||
    getEnvValue('TELEGRAM_CHAT_ID') ||
    '';

  const enabledRaw =
    typeof override?.enabled === 'boolean'
      ? override.enabled
      : (getEnvValue('VITE_TELEGRAM_ENABLED') ||
          getEnvValue('TELEGRAM_ENABLED') ||
          'false') === 'true';

  return {
    botToken,
    chatId,
    enabled: enabledRaw
  };
}

/**
 * Format signal strength emoji
 */
function getStrengthEmoji(confidence: number): string {
  if (confidence >= 80) return '🔥';
  if (confidence >= 70) return '⚡';
  if (confidence >= 60) return '✅';
  return '⚠️';
}

/**
 * Format risk level emoji
 */
function getRiskEmoji(riskLevel: string): string {
  switch (riskLevel) {
    case 'LOW':
      return '🟢';
    case 'MEDIUM':
      return '🟡';
    case 'HIGH':
      return '🟠';
    case 'EXTREME':
      return '🔴';
    default:
      return '⚪';
  }
}

/**
 * Format signal side emoji
 */
function getSideEmoji(side: string): string {
  switch (side) {
    case 'BUY':
      return '📈';
    case 'SELL':
      return '📉';
    case 'WAIT':
      return '⏸️';
    default:
      return '❓';
  }
}

/**
 * Format Ultra Signal for Telegram message (Live/Real-time version)
 * Phase X.8: Real-Time AI Signal Stream
 */
export function formatSignalForTelegramLive(signal: UltraSignal): string {
  const strengthEmoji = getStrengthEmoji(signal.finalConfidence);
  const riskEmoji = getRiskEmoji(signal.riskLevel);
  const sideEmoji = getSideEmoji(signal.side);

  let message = `⚡ *AI LIVE SIGNAL*\n`;
  message += `🚀 *${signal.symbol} — ${signal.timeframe}*\n\n`;
  
  message += `${sideEmoji} *${signal.side === 'BUY' ? 'شراء' : signal.side === 'SELL' ? 'بيع' : 'انتظار'}*\n\n`;
  
  message += `*AI Score:* \`${signal.aiScore}\`\n`;
  message += `Technical: \`${signal.technicalScore}\` | Volume: \`${signal.volumeScore}\` | Sentiment: \`${signal.sentimentScore}\`\n\n`;
  
  if (signal.entryPrice) {
    message += `💰 *Entry:* \`${signal.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}\`\n`;
  }
  
  if (signal.stopLoss) {
    message += `🛡️ *Stop:* \`${signal.stopLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}\`\n`;
  }
  
  if (signal.takeProfit) {
    message += `🎯 *TP:* \`${signal.takeProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}\`\n`;
  }
  
  message += `\n${strengthEmoji} *Confidence:* \`${signal.finalConfidence}%\`\n`;
  message += `${riskEmoji} *Risk:* ${signal.riskLevel}\n`;
  
  if (signal.reasoning && signal.reasoning.length > 0) {
    message += `\n*Reasoning:*\n`;
    signal.reasoning.slice(0, 3).forEach((reason, idx) => {
      message += `${idx + 1}. ${reason}\n`;
    });
  }
  
  message += `\n_⚡ Real-Time AI Analysis_`;

  return message;
}

/**
 * Format Ultra Signal for Telegram message
 */
export function formatSignalForTelegram(signal: UltraSignal, isLive: boolean = false): string {
  // Use live format for real-time signals
  if (isLive) {
    return formatSignalForTelegramLive(signal);
  }

  const strengthEmoji = getStrengthEmoji(signal.finalConfidence);
  const riskEmoji = getRiskEmoji(signal.riskLevel);
  const sideEmoji = getSideEmoji(signal.side);

  let message = `🚀 *Ultra Signal — ${signal.symbol} (${signal.timeframe})*\n\n`;
  
  message += `${sideEmoji} *الاتجاه:* ${signal.side === 'BUY' ? '**شراء**' : signal.side === 'SELL' ? '**بيع**' : '**انتظار**'}\n`;
  
  if (signal.entryPrice) {
    message += `💰 *الدخول:* \`${signal.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}\`\n`;
  }
  
  if (signal.takeProfit) {
    message += `🎯 *الهدف:* \`${signal.takeProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}\`\n`;
  }
  
  if (signal.stopLoss) {
    message += `🛡️ *وقف الخسارة:* \`${signal.stopLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}\`\n`;
  }
  
  if (signal.rrRatio) {
    message += `📊 *نسبة المخاطرة/العائد:* \`1:${signal.rrRatio.toFixed(2)}\`\n`;
  }
  
  message += `${strengthEmoji} *قوة الإشارة:* \`${signal.finalConfidence}%\`\n`;
  message += `${riskEmoji} *مستوى المخاطرة:* ${signal.riskLevel}\n\n`;

  // Scores breakdown
  message += `*التحليل:*\n`;
  message += `• المؤشرات التقنية: ${signal.technicalScore}%\n`;
  message += `• الحجم: ${signal.volumeScore}%\n`;
  message += `• الأنماط: ${signal.patternScore}%\n`;
  message += `• الموجات: ${signal.waveScore}%\n`;
  message += `• المشاعر: ${signal.sentimentScore}%\n`;
  message += `• الذكاء الاصطناعي: ${signal.aiScore}%\n\n`;

  // Sources used
  if (signal.sourcesUsed && signal.sourcesUsed.length > 0) {
    const sources = signal.sourcesUsed.map(s => {
      switch (s.source) {
        case 'AI_ANALYZER':
          return 'تحليل AI';
        case 'TV_WEBHOOK':
          return 'TradingView';
        case 'LEGACY_ENGINE':
          return 'المحرك الحالي';
        case 'MANUAL':
          return 'يدوي';
        default:
          return s.source;
      }
    }).join(', ');
    
    message += `*المصادر:* ${sources}\n\n`;
  }

  // Disclaimer
  message += `_⚠️ تنبيه: هذه ليست نصيحة استثمارية، قم دائمًا بإدارة مخاطر محفظتك بنفسك._`;

  return message;
}

/**
 * Broadcast signal to Telegram
 * Phase X.8: Enhanced with real-time support
 */
export async function broadcastToTelegram(
  signal: UltraSignal,
  overrideConfig?: Partial<TelegramConfig>,
  options?: {
    isLive?: boolean;
    minConfidence?: number;
    filterStrongOnly?: boolean;
  }
): Promise<boolean> {
  const config = getTelegramConfig(overrideConfig);

  // Check if Telegram is enabled
  if (!config.enabled) {
    console.log('Telegram broadcasting is disabled');
    return false;
  }

  // Validate configuration
  if (!config.botToken || !config.chatId) {
    console.warn('Telegram bot token or chat ID not configured');
    return false;
  }

  // Phase X.8: Filter by confidence for live signals
  const minConfidence = options?.minConfidence || (options?.isLive ? 60 : 55);
  if (signal.finalConfidence < minConfidence) {
    console.log(`Signal confidence ${signal.finalConfidence}% below threshold ${minConfidence}%, skipping Telegram broadcast`);
    return false;
  }

  // Phase X.8: Filter strong signals only if requested
  if (options?.filterStrongOnly && signal.finalConfidence < 75) {
    console.log(`Signal confidence ${signal.finalConfidence}% below strong threshold, skipping Telegram broadcast`);
    return false;
  }

  // Phase X.8: Skip WAIT signals for live mode
  if (options?.isLive && signal.side === 'WAIT') {
    console.log('WAIT signal skipped for live Telegram broadcast');
    return false;
  }

  try {
    const message = formatSignalForTelegram(signal, options?.isLive);
    
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Telegram API error:', errorData);
      return false;
    }

    const result = await response.json();
    
    if (result.ok) {
      console.log(`✅ Signal broadcasted to Telegram: ${signal.symbol} ${signal.side}`);
      return true;
    } else {
      console.error('Telegram API returned error:', result);
      return false;
    }
  } catch (error) {
    console.error('Error broadcasting to Telegram:', error);
    return false;
  }
}

/**
 * Test Telegram connection
 */
export async function testTelegramConnection(
  overrideConfig?: Partial<TelegramConfig>
): Promise<boolean> {
  const config = getTelegramConfig(overrideConfig);

  if (!config.enabled || !config.botToken || !config.chatId) {
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${config.botToken}/getMe`;
    const response = await fetch(url);

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.ok === true;
  } catch (error) {
    console.error('Error testing Telegram connection:', error);
    return false;
  }
}

