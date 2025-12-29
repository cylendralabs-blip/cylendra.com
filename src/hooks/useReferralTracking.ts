/**
 * Referral Tracking Hook
 * 
 * Tracks referral codes from URL and stores in localStorage
 * Integrates with affiliate system
 * 
 * Phase 11A: Influence Economy - Task 8
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { parseReferralFromURL } from '@/services/affiliate/referralService';

export function useReferralTracking() {
  const location = useLocation();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Parse referral from URL
    const url = window.location.href;
    const parsed = parseReferralFromURL(url);

    if (parsed.referralCode) {
      // Store in localStorage
      localStorage.setItem('referral_code', parsed.referralCode);
      
      // Store UTM parameters
      if (parsed.utmSource) localStorage.setItem('utm_source', parsed.utmSource);
      if (parsed.utmMedium) localStorage.setItem('utm_medium', parsed.utmMedium);
      if (parsed.utmCampaign) localStorage.setItem('utm_campaign', parsed.utmCampaign);
      if (parsed.utmContent) localStorage.setItem('utm_content', parsed.utmContent);

      setReferralCode(parsed.referralCode);

      // Track referral
      trackReferral(parsed);
    } else {
      // Check localStorage for existing referral
      const stored = localStorage.getItem('referral_code');
      if (stored) {
        setReferralCode(stored);
      }
    }
  }, [location]);

  return { referralCode };
}

/**
 * Track referral visit
 */
async function trackReferral(data: {
  referralCode?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
}) {
  if (!data.referralCode) return;

  if (typeof window === 'undefined') return;

  try {
    // Get device info
    const deviceId = getDeviceId();
    const browserFingerprint = getBrowserFingerprint();
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

    // Get IP (would need a service for this in production)
    const ipAddress = await getIPAddress();

    const referralLink = typeof window !== 'undefined' ? window.location.href : '';
    
    await supabase.functions.invoke('affiliate-track', {
      body: {
        referralCode: data.referralCode,
        referralLink,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        deviceId,
        browserFingerprint,
        userAgent,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Error tracking referral:', error);
  }
}

/**
 * Get or create device ID
 */
function getDeviceId(): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

/**
 * Get browser fingerprint (simplified)
 */
function getBrowserFingerprint(): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 'unknown';
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('fingerprint', 2, 2);
  const canvasHash = canvas.toDataURL().slice(-50);

  const fingerprint = [
    typeof navigator !== 'undefined' ? navigator.userAgent : '',
    typeof navigator !== 'undefined' ? navigator.language : '',
    typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '0x0',
    new Date().getTimezoneOffset(),
    canvasHash,
  ].join('|');

  return btoa(fingerprint).slice(0, 32);
}

/**
 * Get IP address (simplified - would use a service in production)
 */
async function getIPAddress(): Promise<string | undefined> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return undefined;
  }
}

/**
 * Link referral to user account (call after signup/login)
 */
export async function linkReferralToUser(userId: string): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  
  const referralCode = localStorage.getItem('referral_code');
  if (!referralCode) return;

  try {
    const utmSource = localStorage.getItem('utm_source');
    const utmMedium = localStorage.getItem('utm_medium');
    const utmCampaign = localStorage.getItem('utm_campaign');
    const utmContent = localStorage.getItem('utm_content');

    await supabase.functions.invoke('affiliate-track', {
      body: {
        referralCode,
        userId,
        utmSource: utmSource || undefined,
        utmMedium: utmMedium || undefined,
        utmCampaign: utmCampaign || undefined,
        utmContent: utmContent || undefined,
      },
    });
  } catch (error) {
    console.error('Error linking referral to user:', error);
  }
}

