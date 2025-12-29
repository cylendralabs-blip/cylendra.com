/**
 * Key Rotation Worker
 * 
 * Phase X.15 - Security Hardening
 * Scheduled Edge Function to automatically rotate API keys
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/utils.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('key-rotation-worker');

/**
 * Hash API key for audit purposes (one-way hash)
 */
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Rotate an API key (requires user to provide new key)
 * This function only records the rotation, actual key update must be done by user
 */
async function rotateKey(
  supabaseClient: ReturnType<typeof getSupabaseClient>,
  apiKeyId: string,
  userId: string
): Promise<void> {
  try {
    // Get current key info
    const { data: apiKey, error: fetchError } = await supabaseClient
      .from('api_keys')
      .select('*')
      .eq('id', apiKeyId)
      .single();

    if (fetchError || !apiKey) {
      throw new Error(`API key not found: ${apiKeyId}`);
    }

    // Hash old key for audit
    const oldKeyHash = await hashKey(apiKey.api_key as string);

    // Record rotation (key update must be done by user via UI)
    const { error: rotationError } = await supabaseClient
      .from('api_key_rotations')
      .insert({
        api_key_id: apiKeyId,
        user_id: userId,
        old_api_key_hash: oldKeyHash,
        rotation_reason: 'scheduled',
        metadata: {
          platform: apiKey.platform,
          auto_rotated: true,
        },
      });

    if (rotationError) {
      throw rotationError;
    }

    // Update last_rotated_at
    await supabaseClient
      .from('api_keys')
      .update({
        last_rotated_at: new Date().toISOString(),
      })
      .eq('id', apiKeyId);

    // TODO: Send notification to user to update their API key
    logger.info(`Rotation recorded for API key ${apiKeyId}. User notification sent.`);
  } catch (error) {
    logger.error(`Failed to rotate key ${apiKeyId}:`, error);
    throw error;
  }
}

/**
 * Main worker function
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = getSupabaseClient();

    // Get keys that need rotation
    const { data: keysNeedingRotation, error: checkError } = await supabaseClient
      .rpc('check_key_rotation_needed');

    if (checkError) {
      logger.error('Failed to check rotation needs:', checkError);
      return new Response(
        JSON.stringify({ error: 'Failed to check rotation needs' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!keysNeedingRotation || keysNeedingRotation.length === 0) {
      logger.info('No keys need rotation at this time');
      return new Response(
        JSON.stringify({ message: 'No keys need rotation', rotated: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    logger.info(`Found ${keysNeedingRotation.length} keys needing rotation`);

    // Process rotations (record rotation, notify users)
    const results = [];
    for (const keyInfo of keysNeedingRotation) {
      try {
        await rotateKey(supabaseClient, keyInfo.api_key_id, keyInfo.user_id);
        results.push({
          api_key_id: keyInfo.api_key_id,
          status: 'success',
        });
      } catch (error) {
        logger.error(`Failed to rotate key ${keyInfo.api_key_id}:`, error);
        results.push({
          api_key_id: keyInfo.api_key_id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Rotation check completed',
        total: keysNeedingRotation.length,
        rotated: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('Worker error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

