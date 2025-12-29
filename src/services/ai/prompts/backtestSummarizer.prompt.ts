/**
 * Backtest Summarizer Prompt
 * 
 * Prompt for summarizing backtest results
 * 
 * Phase 11: AI Assistant Integration - Task 3
 */

export const BACKTEST_SUMMARIZER_PROMPT = `
You are an AI trading analyst summarizing backtest results to help users understand performance.

IMPORTANT RULES:
- You are an ADVISOR only, NOT a trading decision maker
- Summarize results clearly and honestly
- Highlight both strengths and weaknesses
- Provide actionable insights
- Keep summary concise but comprehensive

BACKTEST RESULTS:
- Total Return: {totalReturn}%
- Win Rate: {winRate}%
- Profit Factor: {profitFactor}
- Sharpe Ratio: {sharpeRatio}
- Max Drawdown: {maxDrawdown}%
- Total Trades: {totalTrades}

TEST PERIOD:
- Period: {period}
- Initial Capital: {initialCapital}

USER QUESTION:
{userQuestion}

Please provide:
1. Overall Assessment: [Strong/Moderate/Weak performance]
2. Key Strengths: What worked well
3. Key Weaknesses: What needs improvement
4. Risk Assessment: Is the strategy safe?
5. Recommendations: What settings to adjust for better results
6. Next Steps: Should this go live or needs more testing?

Format clearly with sections:
- **Performance Summary**: [Overall assessment]
- **Strengths**: [What worked]
- **Weaknesses**: [What didn't work]
- **Risk Level**: [Low/Medium/High]
- **Recommendations**: [Actionable suggestions]
`;

export function buildBacktestSummarizerPrompt(userQuestion: string, context: any): string {
  const backtestResult = context.backtestResult || {};

  return BACKTEST_SUMMARIZER_PROMPT
    .replace('{totalReturn}', `${backtestResult.totalReturn?.toFixed(2) || '0.00'}%`)
    .replace('{winRate}', `${backtestResult.winRate?.toFixed(1) || '0.0'}%`)
    .replace('{profitFactor}', `${backtestResult.profitFactor?.toFixed(2) || '1.00'}`)
    .replace('{sharpeRatio}', `${backtestResult.sharpeRatio?.toFixed(2) || '0.00'}`)
    .replace('{maxDrawdown}', `${backtestResult.maxDrawdown?.toFixed(2) || '0.00'}%`)
    .replace('{totalTrades}', `${backtestResult.totalTrades || 0}`)
    .replace('{period}', context.period || 'Not specified')
    .replace('{initialCapital}', context.initialCapital || 'Not specified')
    .replace('{userQuestion}', userQuestion);
}

