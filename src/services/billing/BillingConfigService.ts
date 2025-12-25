/**
 * Billing Configuration Service
 * 
 * Beta Free Billing Mode: Check billing mode configuration
 */

import { supabase } from '@/integrations/supabase/client';
import { getBetaModeConfig } from '@/services/admin/SystemSettingsService';

export type BillingMode = 'beta_free' | 'live';

export interface BillingConfig {
  mode: BillingMode;
  betaExpirationDays: number;
}

/**
 * Get billing mode configuration
 * Checks database settings first, then falls back to environment variable
 */
export async function getBillingMode(): Promise<BillingMode> {
  try {
    // First, try to get from database settings (admin-controlled)
    const { config } = await getBetaModeConfig();
    
    if (config?.enabled) {
      return 'beta_free';
    }

    // Fallback: Try environment variable
    const envMode = import.meta.env.VITE_BILLING_MODE as BillingMode;
    if (envMode === 'beta_free' || envMode === 'live') {
      return envMode;
    }

    // Fallback: Try billing-config endpoint
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/billing-config`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          return data.mode || 'live';
        }
      } catch (error) {
        console.warn('Could not fetch billing config, using default:', error);
      }
    }

    // Default to live mode
    return 'live';
  } catch (error) {
    console.error('Error getting billing mode:', error);
    return 'live';
  }
}

/**
 * Check if beta free mode is enabled
 */
export async function isBetaFreeMode(): Promise<boolean> {
  try {
    // Check database settings first
    const { config } = await getBetaModeConfig();
    
    if (config?.enabled) {
      return true;
    }

    // Fallback to billing mode check
    const mode = await getBillingMode();
    return mode === 'beta_free';
  } catch (error) {
    console.error('Error checking beta mode:', error);
    return false;
  }
}

/**
 * Get beta mode config with expiration date
 */
export async function getBetaModeConfigWithExpiration(): Promise<{
  enabled: boolean;
  endDate: string | null;
  daysRemaining: number | null;
}> {
  try {
    const { config } = await getBetaModeConfig();
    
    if (!config) {
      return { enabled: false, endDate: null, daysRemaining: null };
    }

    const daysRemaining = config.endDate
      ? Math.ceil((new Date(config.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      enabled: config.enabled,
      endDate: config.endDate,
      daysRemaining: daysRemaining !== null && daysRemaining > 0 ? daysRemaining : null,
    };
  } catch (error) {
    console.error('Error getting beta mode config:', error);
    return { enabled: false, endDate: null, daysRemaining: null };
  }
}

