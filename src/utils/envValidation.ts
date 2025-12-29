/**
 * Environment Variables Validation
 * 
 * التحقق من صحة متغيرات البيئة
 * 
 * Phase 1: إصلاح بيئة التشغيل
 */

/**
 * Required Environment Variables
 */
const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
] as const;

/**
 * Validate Required Environment Variables
 */
export function validateEnv(): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const value = import.meta.env[varName];
    
    if (!value || value.trim() === '') {
      missing.push(varName);
    }
  }

  // Check for common issues
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    warnings.push('VITE_SUPABASE_URL يجب أن يبدأ بـ https://');
  }

  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (anonKey && anonKey.length < 100) {
    warnings.push('VITE_SUPABASE_ANON_KEY يبدو غير صحيح (قصير جداً)');
  }

  // Check if in development mode
  if (import.meta.env.DEV) {
    if (missing.length > 0) {
      console.warn('⚠️ متغيرات البيئة المطلوبة مفقودة:', missing);
      console.warn('📝 راجع docs/ENVIRONMENT.md للتعليمات');
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}

/**
 * Get Environment Variable with Fallback
 */
export function getEnvVar(name: string, fallback?: string): string {
  const value = import.meta.env[name];
  
  if (!value || value.trim() === '') {
    if (fallback) {
      return fallback;
    }
    throw new Error(`Environment variable ${name} is not set`);
  }
  
  return value;
}

/**
 * Check if Development Mode
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

/**
 * Check if Production Mode
 */
export function isProduction(): boolean {
  return import.meta.env.PROD;
}

/**
 * Get App Version
 */
export function getAppVersion(): string {
  return import.meta.env.VITE_APP_VERSION || '1.0.0';
}

/**
 * Get App Environment
 */
export function getAppEnv(): string {
  return import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development';
}

/**
 * Check Feature Flag
 */
export function isFeatureEnabled(feature: string): boolean {
  const envKey = `VITE_ENABLE_${feature.toUpperCase()}`;
  const value = import.meta.env[envKey];
  
  if (value === undefined) {
    return false;
  }
  
  return value === 'true' || value === true;
}

/**
 * Validate and Log Environment on App Start
 */
export function validateAndLogEnv(): void {
  const { valid, missing, warnings } = validateEnv();
  
  // Check if we're using fallback values (from client.ts)
  // If fallback values exist, the app will work but env vars weren't available at build time
  const usingFallback = isProduction() && !valid;
  
  if (!valid) {
    // In production, if we have fallback values, show a single quiet warning
    // The app works fine, this is just informational
    if (isProduction()) {
      // Only log once, quietly, since the app works with fallback values
      if (missing.length > 0) {
        console.debug('ℹ️ Environment variables not available at build time, using fallback values:', missing);
        console.debug('💡 To use Netlify env vars: Set them in Netlify Dashboard, then trigger a new deploy');
      }
    } else {
      console.error('❌ متغيرات البيئة المطلوبة مفقودة:', missing);
      console.error('📝 راجع docs/ENVIRONMENT.md للتعليمات');
      console.warn('💡 تأكد من وجود ملف .env في جذر المشروع');
      console.warn('💡 انسخ .env.example إلى .env وأكمل المتغيرات');
    }
  } else {
    // Only log success in development to avoid console noise in production
    if (isDevelopment()) {
      console.log('✅ جميع متغيرات البيئة المطلوبة موجودة');
    }
  }
  
  if (warnings.length > 0 && isDevelopment()) {
    console.warn('⚠️ تحذيرات:', warnings);
  }
  
  // Only log environment info in development
  if (isDevelopment()) {
    console.log('📊 بيئة التطبيق:', {
      mode: import.meta.env.MODE,
      env: getAppEnv(),
      version: getAppVersion(),
      isDev: isDevelopment(),
      isProd: isProduction()
    });
  }
}


