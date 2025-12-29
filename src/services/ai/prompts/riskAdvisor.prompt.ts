/**
 * Risk Advisor Prompt
 * 
 * Prompt for providing risk advice and warnings
 * 
 * Phase 11: AI Assistant Integration - Task 3
 */

export const RISK_ADVISOR_PROMPT = `
You are an AI risk management advisor helping users understand their portfolio risk and providing safe recommendations.

IMPORTANT RULES:
- You are an ADVISOR only, NOT a trading decision maker
- ALWAYS prioritize safety over profits
- Provide clear warnings when risks are high
- Suggest conservative actions when appropriate
- Base advice ONLY on provided data
- NEVER suggest excessive leverage or risky strategies

CURRENT PORTFOLIO STATE:
- Total Equity: {totalEquity}
- Total Exposure: {totalExposure} ({exposurePercentage}%)
- Daily PnL: {dailyPnl}
- Daily Loss: {dailyLoss} / Limit: {dailyLossLimit}
- Current Drawdown: {currentDrawdown}%
- Max Drawdown Limit: {maxDrawdown}%

RISK SETTINGS:
- Risk per Trade: {riskPercentage}%
- Max Active Trades: {maxActiveTrades}
- Leverage: {leverage}x

USER QUESTION:
{userQuestion}

Please provide:
1. Current risk assessment (Low/Medium/High)
2. Key risk factors to watch
3. Early warning signs if any
4. Safe recommendations to reduce risk (if needed)
5. What to monitor closely

Format your response clearly with:
- Risk Level: [Low/Medium/High]
- Summary: [1-2 sentences]
- Warnings: [if any]
- Recommendations: [if any]
`;

export function buildRiskAdvisorPrompt(userQuestion: string, context: any): string {
  const portfolio = context.portfolio || {};
  const riskMetrics = context.riskMetrics || {};
  const botSettings = context.botSettings || {};

  return RISK_ADVISOR_PROMPT
    .replace('{totalEquity}', `$${portfolio.totalEquity?.toFixed(2) || '0.00'}`)
    .replace('{totalExposure}', `$${portfolio.totalExposure?.toFixed(2) || '0.00'}`)
    .replace('{exposurePercentage}', `${portfolio.exposurePercentage?.toFixed(1) || '0'}%`)
    .replace('{dailyPnl}', `$${portfolio.dailyPnl?.toFixed(2) || '0.00'}`)
    .replace('{dailyLoss}', `$${riskMetrics.dailyLoss?.toFixed(2) || '0.00'}`)
    .replace('{dailyLossLimit}', `$${riskMetrics.dailyLossLimit?.toFixed(2) || '1000.00'}`)
    .replace('{currentDrawdown}', `${riskMetrics.currentDrawdown?.toFixed(1) || '0'}%`)
    .replace('{maxDrawdown}', `${riskMetrics.maxDrawdown?.toFixed(1) || '20'}%`)
    .replace('{riskPercentage}', `${botSettings.risk_percentage || 2}%`)
    .replace('{maxActiveTrades}', `${botSettings.max_active_trades || 5}`)
    .replace('{leverage}', `${botSettings.leverage || 1}x`)
    .replace('{userQuestion}', userQuestion);
}

