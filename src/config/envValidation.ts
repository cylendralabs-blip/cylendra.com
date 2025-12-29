/**
 * Environment Variables Validation
 * 
 * Phase 18: Validate all environment variables at startup
 */

interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  aiProvider?: string;
  aiModel?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
}

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validate required environment variables
 */
export function validateEnvVariables(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Required variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.trim() === '') {
    missing.push('VITE_SUPABASE_URL');
  }

  if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
    missing.push('VITE_SUPABASE_ANON_KEY');
  }

  // Optional but recommended
  const aiProvider = import.meta.env.VITE_AI_PROVIDER;
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const anthropicApiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (aiProvider && (aiProvider === 'openai' || aiProvider === 'anthropic')) {
    if (aiProvider === 'openai' && (!openaiApiKey || openaiApiKey === 'your-openai-api-key')) {
      warnings.push('VITE_OPENAI_API_KEY is not configured but AI provider is set to OpenAI');
    }
    if (aiProvider === 'anthropic' && (!anthropicApiKey || anthropicApiKey === 'your-anthropic-api-key')) {
      warnings.push('VITE_ANTHROPIC_API_KEY is not configured but AI provider is set to Anthropic');
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Get environment configuration
 */
export function getEnvConfig(): EnvConfig {
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    aiProvider: import.meta.env.VITE_AI_PROVIDER,
    aiModel: import.meta.env.VITE_AI_MODEL,
    openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY,
    anthropicApiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  };
}

/**
 * Log environment validation results
 */
export function logEnvValidation(): void {
  const validation = validateEnvVariables();

  if (!validation.valid) {
    console.error('❌ Missing required environment variables:', validation.missing);
    console.error('Please check your .env file and ensure all required variables are set.');
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Environment variable warnings:', validation.warnings);
  }

  if (validation.valid && validation.warnings.length === 0) {
    console.log('✅ All environment variables are properly configured');
  }
}

