/**
 * AI Guardrails & Safety Layer
 * 
 * Ensures AI suggestions are safe and don't violate risk rules
 * 
 * Phase 11: AI Assistant Integration - Task 10
 */

import { AISuggestion, AIContext } from './types';

/**
 * Maximum safe limits (hard caps)
 */
const MAX_LEVERAGE_CAP = 10; // Maximum leverage AI can suggest
const MAX_RISK_PERCENTAGE = 5; // Maximum risk percentage AI can suggest
const MIN_RISK_PERCENTAGE = 0.5; // Minimum risk percentage AI can suggest
const MAX_DCA_LEVELS = 10; // Maximum DCA levels AI can suggest

/**
 * Validate AI suggestion
 */
export function validateAISuggestion(
  suggestion: AISuggestion,
  currentSettings: Record<string, any>
): { valid: boolean; error?: string; warning?: string } {
  // Only validate setting changes
  if (suggestion.type !== 'setting_change' || !suggestion.data) {
    return { valid: true };
  }

  const { setting, suggested, current } = suggestion.data;

  // Leverage validation
  if (setting === 'leverage') {
    if (suggested > MAX_LEVERAGE_CAP) {
      return {
        valid: false,
        error: `Leverage suggestion (${suggested}x) exceeds maximum safe limit (${MAX_LEVERAGE_CAP}x)`,
      };
    }
    if (suggested > (current || 1) * 2) {
      return {
        valid: true,
        warning: `Leverage increase from ${current}x to ${suggested}x is significant. Proceed with caution.`,
      };
    }
  }

  // Risk percentage validation
  if (setting === 'risk_percentage') {
    if (suggested > MAX_RISK_PERCENTAGE) {
      return {
        valid: false,
        error: `Risk percentage (${suggested}%) exceeds maximum safe limit (${MAX_RISK_PERCENTAGE}%)`,
      };
    }
    if (suggested < MIN_RISK_PERCENTAGE) {
      return {
        valid: false,
        error: `Risk percentage (${suggested}%) is below minimum recommended (${MIN_RISK_PERCENTAGE}%)`,
      };
    }
    if (suggested > (current || 2) * 1.5) {
      return {
        valid: true,
        warning: `Risk increase from ${current}% to ${suggested}% is significant. Consider testing in paper trading first.`,
      };
    }
  }

  // DCA levels validation
  if (setting === 'dca_levels') {
    if (suggested > MAX_DCA_LEVELS) {
      return {
        valid: false,
        error: `DCA levels (${suggested}) exceeds maximum recommended (${MAX_DCA_LEVELS})`,
      };
    }
  }

  // Stop loss validation (should not be too tight or too wide)
  if (setting === 'stop_loss_percentage') {
    if (suggested < 0.5) {
      return {
        valid: false,
        error: 'Stop loss is too tight (less than 0.5%). This may cause premature exits.',
      };
    }
    if (suggested > 20) {
      return {
        valid: true,
        warning: 'Stop loss is very wide (more than 20%). Ensure you can afford potential losses.',
      };
    }
  }

  // Take profit validation
  if (setting === 'take_profit_percentage') {
    if (suggested < 1) {
      return {
        valid: false,
        error: 'Take profit is too low (less than 1%). Consider a higher target.',
      };
    }
  }

  return { valid: true };
}

/**
 * Validate all suggestions in AI response
 */
export function validateAIResponse(
  response: { suggestions?: AISuggestion[] },
  currentSettings: Record<string, any>
): {
  validatedSuggestions: AISuggestion[];
  warnings: string[];
  errors: string[];
} {
  const validatedSuggestions: AISuggestion[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!response.suggestions || response.suggestions.length === 0) {
    return { validatedSuggestions: [], warnings: [], errors: [] };
  }

  for (const suggestion of response.suggestions) {
    const validation = validateAISuggestion(suggestion, currentSettings);

    if (!validation.valid) {
      errors.push(validation.error || 'Invalid suggestion');
      // Skip invalid suggestions
      continue;
    }

    if (validation.warning) {
      warnings.push(validation.warning);
      // Add warning to suggestion metadata
      suggestion.data = {
        ...suggestion.data,
        warning: validation.warning,
      };
    }

    validatedSuggestions.push(suggestion);
  }

  return {
    validatedSuggestions,
    warnings,
    errors,
  };
}

/**
 * Check if AI response requires risk warning
 */
export function requiresRiskWarning(context: AIContext): boolean {
  // Check if portfolio is in risky state
  if (context.riskMetrics) {
    const { dailyLoss, dailyLossLimit, exposurePercentage } = context.riskMetrics;

    // Risk warning if:
    // 1. Daily loss is close to limit (>80%)
    if (dailyLossLimit > 0 && dailyLoss / dailyLossLimit > 0.8) {
      return true;
    }

    // 2. Exposure is very high (>70%)
    if (exposurePercentage > 70) {
      return true;
    }

    // 3. Current drawdown is high
    const { currentDrawdown, maxDrawdown } = context.riskMetrics;
    if (maxDrawdown > 0 && currentDrawdown / maxDrawdown > 0.8) {
      return true;
    }
  }

  return false;
}

/**
 * Get risk warning message
 */
export function getRiskWarningMessage(context: AIContext): string {
  const messages: string[] = [];

  if (context.riskMetrics) {
    const { dailyLoss, dailyLossLimit, exposurePercentage } = context.riskMetrics;

    if (dailyLossLimit > 0 && dailyLoss / dailyLossLimit > 0.8) {
      messages.push(
        `⚠️ Daily loss limit warning: You've used ${((dailyLoss / dailyLossLimit) * 100).toFixed(1)}% of your daily loss limit.`
      );
    }

    if (exposurePercentage > 70) {
      messages.push(
        `⚠️ High exposure warning: Your portfolio exposure is ${exposurePercentage.toFixed(1)}%, which is very high. Consider reducing position sizes.`
      );
    }
  }

  return messages.join('\n\n') || '';
}

