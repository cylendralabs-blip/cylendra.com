/**
 * API Key Rotation System
 * 
 * Phase X.15 - Security Hardening
 * Manages automatic rotation of exchange API keys
 */

import { supabase } from '@/integrations/supabase/client';

export interface KeyRotationConfig {
  apiKeyId: string;
  autoRotateEnabled: boolean;
  rotationScheduleDays: number; // Default: 90 days
}

export interface RotationHistory {
  id: string;
  api_key_id: string;
  rotation_reason: 'scheduled' | 'security_breach' | 'manual' | 'expired';
  rotated_at: string;
  metadata?: Record<string, any>;
}

/**
 * Enable auto-rotation for an API key
 */
export async function enableKeyRotation(
  apiKeyId: string,
  scheduleDays: number = 90
): Promise<void> {
  const { error } = await (supabase as any)
    .from('api_keys')
    .update({
      auto_rotate_enabled: true,
      rotation_schedule_days: scheduleDays,
    })
    .eq('id', apiKeyId);

  if (error) {
    throw new Error(`Failed to enable key rotation: ${error.message}`);
  }
}

/**
 * Disable auto-rotation for an API key
 */
export async function disableKeyRotation(apiKeyId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('api_keys')
    .update({
      auto_rotate_enabled: false,
    })
    .eq('id', apiKeyId);

  if (error) {
    throw new Error(`Failed to disable key rotation: ${error.message}`);
  }
}

/**
 * Get keys that need rotation
 */
export async function getKeysNeedingRotation(): Promise<Array<{
  api_key_id: string;
  user_id: string;
  platform: string;
  days_since_rotation: number;
  rotation_schedule_days: number;
}>> {
  const { data, error } = await (supabase as any).rpc('check_key_rotation_needed');

  if (error) {
    throw new Error(`Failed to check rotation needs: ${error.message}`);
  }

  return ((data || []) as unknown as Array<{
    api_key_id: string;
    user_id: string;
    platform: string;
    days_since_rotation: number;
    rotation_schedule_days: number;
  }>);
}

/**
 * Get rotation history for an API key
 */
export async function getRotationHistory(apiKeyId: string): Promise<RotationHistory[]> {
  const { data, error } = await (supabase as any)
    .from('api_key_rotations')
    .select('*')
    .eq('api_key_id', apiKeyId)
    .order('rotated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get rotation history: ${error.message}`);
  }

  return ((data || []) as unknown as RotationHistory[]);
}

/**
 * Record a key rotation
 */
export async function recordKeyRotation(
  apiKeyId: string,
  reason: RotationHistory['rotation_reason'],
  metadata?: Record<string, any>
): Promise<void> {
  const { data: apiKey } = await (supabase as any)
    .from('api_keys')
    .select('user_id')
    .eq('id', apiKeyId)
    .single();

  if (!apiKey) {
    throw new Error('API key not found');
  }

  const apiKeyData = apiKey as any;

  const { error } = await (supabase as any)
    .from('api_key_rotations')
    .insert({
      api_key_id: apiKeyId,
      user_id: apiKeyData.user_id,
      rotation_reason: reason,
      metadata: metadata || {},
    });

  if (error) {
    throw new Error(`Failed to record rotation: ${error.message}`);
  }

  // Update last_rotated_at
  await (supabase as any)
    .from('api_keys')
    .update({
      last_rotated_at: new Date().toISOString(),
    })
    .eq('id', apiKeyId);
}

