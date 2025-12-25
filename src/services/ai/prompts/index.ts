/**
 * Prompts System - Main Export
 * 
 * Phase 11: AI Assistant Integration - Task 3
 */

export * from './tradeExplainer.prompt';
export * from './riskAdvisor.prompt';
export * from './settingsOptimizer.prompt';
export * from './backtestSummarizer.prompt';
export * from './userSupport.prompt';

import { AIMode } from '../types';
import { buildTradeExplainerPrompt } from './tradeExplainer.prompt';
import { buildRiskAdvisorPrompt } from './riskAdvisor.prompt';
import { buildSettingsOptimizerPrompt } from './settingsOptimizer.prompt';
import { buildBacktestSummarizerPrompt } from './backtestSummarizer.prompt';
import { buildUserSupportPrompt } from './userSupport.prompt';

/**
 * Get prompt builder for a specific mode
 */
export function getPromptBuilder(mode: AIMode) {
  const builders: Record<AIMode, (question: string, context: any) => string> = {
    trade_explainer: buildTradeExplainerPrompt,
    risk_advisor: buildRiskAdvisorPrompt,
    settings_optimizer: buildSettingsOptimizerPrompt,
    backtest_summarizer: buildBacktestSummarizerPrompt,
    user_support: buildUserSupportPrompt,
  };

  return builders[mode] || buildUserSupportPrompt;
}

/**
 * Build prompt for a specific mode
 */
export function buildPrompt(mode: AIMode, userQuestion: string, context: any): string {
  const builder = getPromptBuilder(mode);
  return builder(userQuestion, context);
}

