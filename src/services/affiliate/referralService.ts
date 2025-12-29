/**
 * Referral Service
 * 
 * Handles referral tracking, CPA, and Revenue Share calculations
 * 
 * Phase 11A: Influence Economy
 */

import { ReferralSource, RewardType } from './types';

/**
 * Calculate CPA reward
 */
export function calculateCPAReward(
  cpaRate: number,
  userQuality: number = 1.0, // 0-1 quality score
  countryMultiplier: number = 1.0
): number {
  return Math.round(cpaRate * userQuality * countryMultiplier * 100) / 100;
}

/**
 * Calculate Revenue Share
 */
export function calculateRevenueShare(
  subscriptionAmount: number,
  revenueSharePct: number
): number {
  return Math.round(subscriptionAmount * (revenueSharePct / 100) * 100) / 100;
}

/**
 * Calculate monthly revenue share
 */
export function calculateMonthlyRevenueShare(
  monthlySubscriptionAmount: number,
  revenueSharePct: number,
  activeMonths: number
): number {
  return Math.round(
    monthlySubscriptionAmount * (revenueSharePct / 100) * activeMonths * 100
  ) / 100;
}

/**
 * Generate referral link
 */
export function generateReferralLink(
  baseUrl: string,
  referralCode: string,
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
  }
): string {
  const params = new URLSearchParams();
  params.set('ref', referralCode);

  if (utmParams) {
    if (utmParams.source) params.set('utm_source', utmParams.source);
    if (utmParams.medium) params.set('utm_medium', utmParams.medium);
    if (utmParams.campaign) params.set('utm_campaign', utmParams.campaign);
    if (utmParams.content) params.set('utm_content', utmParams.content);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Parse referral from URL
 */
export function parseReferralFromURL(url: string): {
  referralCode?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
} {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    return {
      referralCode: params.get('ref') || undefined,
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      utmContent: params.get('utm_content') || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Determine referral source from data
 */
export function determineReferralSource(data: {
  referralCode?: string;
  referralLink?: string;
  utmSource?: string;
  pixelCode?: string;
}): ReferralSource {
  if (data.pixelCode) return 'pixel';
  if (data.utmSource) return 'utm';
  if (data.referralLink) return 'link';
  if (data.referralCode) return 'code';
  return 'link'; // Default
}

/**
 * Calculate user quality score
 */
export function calculateUserQualityScore(metrics: {
  hasApiKey: boolean;
  botActivated: boolean;
  backtestCount: number;
  tradingVolume: number;
  daysActive: number;
  isPremium: boolean;
}): number {
  let score = 0;

  // API Key connected
  if (metrics.hasApiKey) score += 0.2;

  // Bot activated
  if (metrics.botActivated) score += 0.3;

  // Backtests run
  score += Math.min(metrics.backtestCount * 0.05, 0.2);

  // Trading volume
  if (metrics.tradingVolume > 1000) score += 0.1;
  if (metrics.tradingVolume > 10000) score += 0.1;

  // Days active
  if (metrics.daysActive > 7) score += 0.05;
  if (metrics.daysActive > 30) score += 0.05;

  // Premium user
  if (metrics.isPremium) score += 0.1;

  return Math.min(score, 1.0); // Cap at 1.0
}

/**
 * Get country multiplier for CPA
 */
export function getCountryMultiplier(countryCode: string): number {
  // Tier 1 countries (higher CPA)
  const tier1 = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP', 'SG'];
  // Tier 2 countries (medium CPA)
  const tier2 = ['ES', 'IT', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK'];

  if (tier1.includes(countryCode)) return 1.5;
  if (tier2.includes(countryCode)) return 1.2;
  return 1.0; // Default
}

