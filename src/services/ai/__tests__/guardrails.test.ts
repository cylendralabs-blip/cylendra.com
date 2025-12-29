/**
 * Guardrails Tests
 * 
 * Unit tests for AI guardrails and safety layer
 * 
 * Phase 11: AI Assistant Integration - Task 12
 */

import { describe, it, expect } from 'vitest';
import {
  validateAISuggestion,
  validateAIResponse,
  requiresRiskWarning,
  getRiskWarningMessage,
} from '../guardrails';
import { AISuggestion } from '../types';

describe('AI Guardrails', () => {
  describe('validateAISuggestion', () => {
    it('should reject leverage above max cap', () => {
      const suggestion: AISuggestion = {
        type: 'setting_change',
        title: 'Increase Leverage',
        description: 'Test',
        data: {
          setting: 'leverage',
          suggested: 20,
          current: 5,
        },
      };

      const result = validateAISuggestion(suggestion, {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum safe limit');
    });

    it('should accept valid leverage', () => {
      const suggestion: AISuggestion = {
        type: 'setting_change',
        title: 'Increase Leverage',
        description: 'Test',
        data: {
          setting: 'leverage',
          suggested: 5,
          current: 3,
        },
      };

      const result = validateAISuggestion(suggestion, {});
      expect(result.valid).toBe(true);
    });

    it('should reject risk percentage above max', () => {
      const suggestion: AISuggestion = {
        type: 'setting_change',
        title: 'Increase Risk',
        description: 'Test',
        data: {
          setting: 'risk_percentage',
          suggested: 10,
          current: 2,
        },
      };

      const result = validateAISuggestion(suggestion, {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum safe limit');
    });

    it('should reject risk percentage below min', () => {
      const suggestion: AISuggestion = {
        type: 'setting_change',
        title: 'Decrease Risk',
        description: 'Test',
        data: {
          setting: 'risk_percentage',
          suggested: 0.1,
          current: 2,
        },
      };

      const result = validateAISuggestion(suggestion, {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('below minimum recommended');
    });

    it('should warn on significant risk increase', () => {
      const suggestion: AISuggestion = {
        type: 'setting_change',
        title: 'Increase Risk',
        description: 'Test',
        data: {
          setting: 'risk_percentage',
          suggested: 4,
          current: 2,
        },
      };

      const result = validateAISuggestion(suggestion, {});
      expect(result.valid).toBe(true);
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('significant');
    });

    it('should reject stop loss too tight', () => {
      const suggestion: AISuggestion = {
        type: 'setting_change',
        title: 'Tighten Stop Loss',
        description: 'Test',
        data: {
          setting: 'stop_loss_percentage',
          suggested: 0.1,
          current: 2,
        },
      };

      const result = validateAISuggestion(suggestion, {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too tight');
    });
  });

  describe('validateAIResponse', () => {
    it('should filter out invalid suggestions', () => {
      const response = {
        suggestions: [
          {
            type: 'setting_change' as const,
            title: 'Valid',
            description: 'Valid suggestion',
            data: {
              setting: 'leverage',
              suggested: 5,
              current: 3,
            },
          },
          {
            type: 'setting_change' as const,
            title: 'Invalid',
            description: 'Invalid suggestion',
            data: {
              setting: 'leverage',
              suggested: 20,
              current: 5,
            },
          },
        ] as AISuggestion[],
      };

      const result = validateAIResponse(response, {});
      expect(result.validatedSuggestions).toHaveLength(1);
      expect(result.validatedSuggestions[0].title).toBe('Valid');
      expect(result.errors).toHaveLength(1);
    });

    it('should preserve warnings', () => {
      const response = {
        suggestions: [
          {
            type: 'setting_change' as const,
            title: 'Warning',
            description: 'Warning suggestion',
            data: {
              setting: 'risk_percentage',
              suggested: 4,
              current: 2,
            },
          },
        ] as AISuggestion[],
      };

      const result = validateAIResponse(response, {});
      expect(result.validatedSuggestions).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('requiresRiskWarning', () => {
    it('should return true when daily loss is high', () => {
      const context = {
        userId: 'test',
        mode: 'risk_advisor' as const,
        riskMetrics: {
          dailyLoss: 900,
          dailyLossLimit: 1000,
          maxDrawdown: 20,
          currentDrawdown: 5,
          exposurePercentage: 50,
        },
      };

      expect(requiresRiskWarning(context)).toBe(true);
    });

    it('should return true when exposure is high', () => {
      const context = {
        userId: 'test',
        mode: 'risk_advisor' as const,
        riskMetrics: {
          dailyLoss: 100,
          dailyLossLimit: 1000,
          maxDrawdown: 20,
          currentDrawdown: 5,
          exposurePercentage: 80,
        },
      };

      expect(requiresRiskWarning(context)).toBe(true);
    });

    it('should return false when risk is low', () => {
      const context = {
        userId: 'test',
        mode: 'risk_advisor' as const,
        riskMetrics: {
          dailyLoss: 100,
          dailyLossLimit: 1000,
          maxDrawdown: 20,
          currentDrawdown: 5,
          exposurePercentage: 30,
        },
      };

      expect(requiresRiskWarning(context)).toBe(false);
    });
  });

  describe('getRiskWarningMessage', () => {
    it('should return warning for high daily loss', () => {
      const context = {
        userId: 'test',
        mode: 'risk_advisor' as const,
        riskMetrics: {
          dailyLoss: 900,
          dailyLossLimit: 1000,
          maxDrawdown: 20,
          currentDrawdown: 5,
          exposurePercentage: 50,
        },
      };

      const message = getRiskWarningMessage(context);
      expect(message).toContain('Daily loss limit warning');
      expect(message).toContain('90');
    });

    it('should return warning for high exposure', () => {
      const context = {
        userId: 'test',
        mode: 'risk_advisor' as const,
        riskMetrics: {
          dailyLoss: 100,
          dailyLossLimit: 1000,
          maxDrawdown: 20,
          currentDrawdown: 5,
          exposurePercentage: 80,
        },
      };

      const message = getRiskWarningMessage(context);
      expect(message).toContain('High exposure warning');
      expect(message).toContain('80');
    });
  });
});

