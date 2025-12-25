/**
 * Shared Utilities for Supabase Edge Functions
 * 
 * أدوات مساعدة موحدة لجميع Edge Functions
 * 
 * Phase 1: تنظيم Supabase Functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Get Supabase Client with Service Role
 */
export function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Get User from Authorization Header
 */
export async function getUserFromRequest(
  req: Request,
  supabaseClient: ReturnType<typeof getSupabaseClient>
): Promise<{ id: string; email?: string } | null> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    return null;
  }
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email
    };
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

/**
 * Parse JSON Body with Error Handling
 */
export async function parseJsonBody<T = any>(req: Request): Promise<T> {
  try {
    const body = await req.json();
    return body;
  } catch (error) {
    throw new Error(`Invalid JSON body: ${error.message}`);
  }
}

/**
 * Validate Required Fields
 */
export function validateRequiredFields(
  data: any,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Handle Function Error
 */
export function handleError(error: unknown): {
  code: string;
  message: string;
  details?: any;
} {
  if (error instanceof Error) {
    return {
      code: 'INTERNAL_ERROR',
      message: error.message,
      details: error.stack
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    details: error
  };
}


