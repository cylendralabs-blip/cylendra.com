/**
 * Fraud Detection Service
 * 
 * Detects fraudulent referrals and activities
 * 
 * Phase 11A: Influence Economy
 */

import { FraudDetectionResult } from './types';

/**
 * Detect fraud in referral
 */
export function detectFraud(data: {
  ipAddress?: string;
  deviceId?: string;
  browserFingerprint?: string;
  userAgent?: string;
  referralSource?: string;
  timeOnPlatform?: number;
  hasApiKey?: boolean;
  botActivated?: boolean;
  backtestCount?: number;
  tradingVolume?: number;
  previousIPs?: string[];
  previousDevices?: string[];
}): FraudDetectionResult {
  const flags: string[] = [];
  let fraudScore = 0;

  // Check for duplicate IP
  if (data.ipAddress && data.previousIPs?.includes(data.ipAddress)) {
    flags.push('duplicate_ip');
    fraudScore += 30;
  }

  // Check for duplicate device
  if (data.deviceId && data.previousDevices?.includes(data.deviceId)) {
    flags.push('duplicate_device');
    fraudScore += 40;
  }

  // Check for low time on platform
  if (data.timeOnPlatform && data.timeOnPlatform < 60) {
    flags.push('low_engagement');
    fraudScore += 20;
  }

  // Check for no activity
  if (!data.hasApiKey && !data.botActivated && !data.backtestCount) {
    flags.push('no_activity');
    fraudScore += 15;
  }

  // Check for suspicious user agent
  if (data.userAgent) {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /headless/i,
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(data.userAgent))) {
      flags.push('bot_user_agent');
      fraudScore += 25;
    }
  }

  // Check for VPN/Proxy (basic check)
  // In production, use a VPN detection service
  if (data.ipAddress) {
    // This would check against VPN databases
    // For now, we'll skip this check
  }

  // Quality checks (positive signals)
  if (data.hasApiKey) fraudScore -= 10;
  if (data.botActivated) fraudScore -= 15;
  if (data.backtestCount && data.backtestCount > 0) fraudScore -= 10;
  if (data.tradingVolume && data.tradingVolume > 100) fraudScore -= 10;

  // Normalize score to 0-100
  fraudScore = Math.max(0, Math.min(100, fraudScore));

  // Determine if fraud
  const isFraud = fraudScore >= 50;

  // Calculate confidence
  const confidence = Math.min(fraudScore / 100, 1.0);

  return {
    fraud_score: Math.round(fraudScore * 100) / 100,
    flags,
    is_fraud: isFraud,
    confidence: Math.round(confidence * 100) / 100,
    details: {
      ipAddress: data.ipAddress,
      deviceId: data.deviceId,
      timeOnPlatform: data.timeOnPlatform,
      hasApiKey: data.hasApiKey,
      botActivated: data.botActivated,
    },
  };
}

/**
 * Verify referral quality
 */
export function verifyReferralQuality(metrics: {
  daysSinceSignup: number;
  hasApiKey: boolean;
  botActivated: boolean;
  backtestCount: number;
  tradingVolume: number;
  isPremium: boolean;
}): {
  quality: 'high' | 'medium' | 'low';
  score: number;
} {
  let score = 0;

  // Time on platform
  if (metrics.daysSinceSignup >= 30) score += 30;
  else if (metrics.daysSinceSignup >= 7) score += 15;

  // API Key
  if (metrics.hasApiKey) score += 20;

  // Bot activated
  if (metrics.botActivated) score += 25;

  // Backtests
  if (metrics.backtestCount >= 10) score += 10;
  else if (metrics.backtestCount >= 3) score += 5;

  // Trading volume
  if (metrics.tradingVolume >= 10000) score += 10;
  else if (metrics.tradingVolume >= 1000) score += 5;

  // Premium
  if (metrics.isPremium) score += 5;

  let quality: 'high' | 'medium' | 'low' = 'low';
  if (score >= 70) quality = 'high';
  else if (score >= 40) quality = 'medium';

  return { quality, score };
}

/**
 * Check if referral should be approved
 */
export function shouldApproveReferral(
  fraudResult: FraudDetectionResult,
  qualityScore: number
): boolean {
  // Reject if fraud detected
  if (fraudResult.is_fraud) return false;

  // Reject if quality is too low
  if (qualityScore < 20) return false;

  return true;
}

