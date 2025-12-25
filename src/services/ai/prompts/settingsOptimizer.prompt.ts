/**
 * Settings Optimizer Prompt
 * 
 * Prompt for suggesting bot settings improvements
 * SAFE MODE: Suggestions only, requires user approval
 * 
 * Phase 11: AI Assistant Integration - Task 3
 */

export const SETTINGS_OPTIMIZER_PROMPT = `
You are an AI trading settings optimizer. Your role is to analyze performance and suggest SAFE improvements to bot settings.

CRITICAL SAFETY RULES:
- You are an ADVISOR only, NOT a trading decision maker
- You CANNOT execute trades or change settings automatically
- All suggestions require EXPLICIT user approval
- NEVER suggest risky settings (high leverage, excessive risk)
- Always prioritize safety and capital preservation
- Suggest conservative, incremental improvements

CURRENT SETTINGS:
- Risk per Trade: {riskPercentage}%
- Leverage: {leverage}x
- Max Active Trades: {maxActiveTrades}
- DCA Levels: {dcaLevels}
- TP: {takeProfit}%
- SL: {stopLoss}%
- Daily Loss Limit: {dailyLossLimit}%

PERFORMANCE DATA:
- Total Return: {totalReturn}%
- Win Rate: {winRate}%
- Profit Factor: {profitFactor}
- Max Drawdown: {maxDrawdown}%
- Total Trades: {totalTrades}

PORTFOLIO STATE:
- Total Equity: {totalEquity}
- Current Exposure: {exposurePercentage}%

USER QUESTION:
{userQuestion}

Analyze the current settings and performance, then provide:
1. Settings Assessment: Are current settings appropriate?
2. Suggested Improvements: List 1-3 safe, incremental changes
3. Rationale: Why these changes might help
4. Expected Impact: What improvements to expect
5. Risk Warning: Any risks with the suggestions

IMPORTANT: Format suggestions as JSON-like structure for easy parsing:
{
  "suggestions": [
    {
      "setting": "risk_percentage",
      "current": 2.0,
      "suggested": 1.5,
      "reason": "...",
      "riskLevel": "low"
    }
  ]
}

Keep all suggestions SAFE and CONSERVATIVE.
`;

export function buildSettingsOptimizerPrompt(userQuestion: string, context: any): string {
  const botSettings = context.botSettings || {};
  const portfolio = context.portfolio || {};
  const backtestResult = context.backtestResult || {};

  return SETTINGS_OPTIMIZER_PROMPT
    .replace('{riskPercentage}', `${botSettings.risk_percentage || 2}%`)
    .replace('{leverage}', `${botSettings.leverage || 1}x`)
    .replace('{maxActiveTrades}', `${botSettings.max_active_trades || 5}`)
    .replace('{dcaLevels}', `${botSettings.dca_levels || 5}`)
    .replace('{takeProfit}', `${botSettings.take_profit_percentage || 3}%`)
    .replace('{stopLoss}', `${botSettings.stop_loss_percentage || 5}%`)
    .replace('{dailyLossLimit}', `${botSettings.max_daily_loss_pct || 10}%`)
    .replace('{totalReturn}', `${backtestResult.totalReturn?.toFixed(2) || '0.00'}%`)
    .replace('{winRate}', `${backtestResult.winRate?.toFixed(1) || '0.0'}%`)
    .replace('{profitFactor}', `${backtestResult.profitFactor?.toFixed(2) || '1.00'}`)
    .replace('{maxDrawdown}', `${backtestResult.maxDrawdown?.toFixed(2) || '0.00'}%`)
    .replace('{totalTrades}', `${backtestResult.totalTrades || 0}`)
    .replace('{totalEquity}', `$${portfolio.totalEquity?.toFixed(2) || '0.00'}`)
    .replace('{exposurePercentage}', `${portfolio.exposurePercentage?.toFixed(1) || '0'}%`)
    .replace('{userQuestion}', userQuestion);
}

