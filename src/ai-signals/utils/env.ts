/**
 * Environment helpers for code that can run in browser or Node contexts.
 */
type EnvRecord = Record<string, string | undefined>;

export function getEnvValue(key: string): string | undefined {
  const metaEnv =
    typeof import.meta !== 'undefined' && (import.meta as any)?.env
      ? ((import.meta as any).env as EnvRecord)
      : undefined;

  if (metaEnv && typeof metaEnv[key] !== 'undefined') {
    return metaEnv[key];
  }

  if (typeof process !== 'undefined' && process.env && typeof process.env[key] !== 'undefined') {
    return process.env[key];
  }

  return undefined;
}

