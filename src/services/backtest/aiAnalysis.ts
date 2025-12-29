/**
 * AI Backtest Analysis Service
 * 
 * Generates AI-powered insights and commentary for backtest results
 * 
 * Phase 4: Advanced Features - Task 1
 */

import { supabase } from '@/integrations/supabase/client';
import type { BacktestRunStatus } from './backtestService';

export interface AIAnalysisResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  marketConditions: string;
  riskAssessment: string;
  confidence: number;
}

/**
 * Generate AI analysis for backtest results
 */
export async function generateAIAnalysis(
  runId: string
): Promise<AIAnalysisResult> {
  try {
    // Call AI assistant Edge Function
    const { data, error } = await supabase.functions.invoke('ai-assistant', {
      body: {
        prompt: buildAnalysisPrompt(runId),
        mode: 'backtest_analysis',
        context: {
          backtestId: runId
        }
      }
    });

    if (error) {
      throw error;
    }

    // Parse AI response
    return parseAIResponse(data);
  } catch (error) {
    console.error('AI Analysis error:', error);
    // Return fallback analysis
    return generateFallbackAnalysis();
  }
}

/**
 * Build prompt for AI analysis
 */
function buildAnalysisPrompt(runId: string): string {
  return `Analyze this backtest result and provide professional trading insights:

Backtest ID: ${runId}

Please analyze:
1. Overall performance and profitability
2. Risk management effectiveness
3. Market condition adaptability
4. Strengths and weaknesses
5. Recommendations for improvement

Provide a comprehensive analysis in a structured format.`;
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(aiResponse: any): AIAnalysisResult {
  // If AI returns structured data, use it directly
  if (aiResponse.analysis) {
    return aiResponse.analysis;
  }

  // Otherwise, parse from text
  const content = aiResponse.content || aiResponse.text || '';
  
  return {
    summary: extractSection(content, 'summary') || 'Analysis generated successfully.',
    strengths: extractList(content, 'strengths'),
    weaknesses: extractList(content, 'weaknesses'),
    recommendations: extractList(content, 'recommendations'),
    marketConditions: extractSection(content, 'market conditions') || 'Analysis available.',
    riskAssessment: extractSection(content, 'risk') || 'Moderate risk profile.',
    confidence: 0.8
  };
}

/**
 * Extract section from text
 */
function extractSection(text: string, keyword: string): string | null {
  const regex = new RegExp(`${keyword}[:\\s]+([^\\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extract list items from text
 */
function extractList(text: string, keyword: string): string[] {
  const regex = new RegExp(`${keyword}[:\\s]+([^\\n]+)`, 'i');
  const match = text.match(regex);
  if (!match) return [];
  
  // Try to extract bullet points or numbered items
  const listRegex = /[-•*]\s*([^\n]+)/g;
  const items: string[] = [];
  let listMatch;
  
  while ((listMatch = listRegex.exec(match[1])) !== null) {
    items.push(listMatch[1].trim());
  }
  
  return items.length > 0 ? items : [match[1].trim()];
}

/**
 * Generate fallback analysis when AI is unavailable
 */
function generateFallbackAnalysis(): AIAnalysisResult {
  return {
    summary: 'AI analysis is temporarily unavailable. Please review the metrics manually.',
    strengths: ['Review performance metrics above'],
    weaknesses: ['Check drawdown periods'],
    recommendations: ['Consider adjusting risk parameters', 'Test different timeframes'],
    marketConditions: 'Analysis pending',
    riskAssessment: 'Review risk metrics in summary',
    confidence: 0.5
  };
}

/**
 * Generate analysis from backtest data directly
 */
export function generateAnalysisFromData(
  summary: any,
  metrics: any
): AIAnalysisResult {
  const winrate = summary.winrate || 0;
  const maxDrawdown = summary.maxDrawdown || 0;
  const profitFactor = summary.profitFactor || 0;
  const totalReturn = summary.totalReturnPct || 0;
  
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];
  
  // Analyze winrate
  if (winrate >= 60) {
    strengths.push('High win rate indicates consistent strategy execution');
  } else if (winrate < 40) {
    weaknesses.push('Low win rate suggests strategy may need refinement');
    recommendations.push('Consider adjusting entry conditions or stop loss levels');
  }
  
  // Analyze drawdown
  if (maxDrawdown > 20) {
    weaknesses.push('High maximum drawdown indicates significant risk exposure');
    recommendations.push('Implement stricter risk management or reduce position sizes');
  } else if (maxDrawdown < 10) {
    strengths.push('Low drawdown shows good risk control');
  }
  
  // Analyze profit factor
  if (profitFactor >= 2) {
    strengths.push('Strong profit factor indicates profitable strategy');
  } else if (profitFactor < 1) {
    weaknesses.push('Profit factor below 1.0 indicates unprofitable strategy');
    recommendations.push('Review and optimize strategy parameters');
  }
  
  // Analyze return
  if (totalReturn > 20) {
    strengths.push('Strong returns demonstrate strategy effectiveness');
  } else if (totalReturn < 0) {
    weaknesses.push('Negative returns require strategy review');
  }
  
  // Market conditions assessment
  let marketConditions = 'Strategy performance varies by market conditions. ';
  if (winrate > 50 && profitFactor > 1.5) {
    marketConditions += 'Performs well in current market environment.';
  } else {
    marketConditions += 'May struggle in certain market conditions.';
  }
  
  // Risk assessment
  let riskAssessment = 'Moderate risk profile. ';
  if (maxDrawdown > 15) {
    riskAssessment = 'High risk profile. ';
  } else if (maxDrawdown < 5) {
    riskAssessment = 'Low risk profile. ';
  }
  riskAssessment += `Max drawdown of ${maxDrawdown.toFixed(2)}% requires careful position sizing.`;
  
  return {
    summary: `This strategy achieved ${totalReturn.toFixed(2)}% return with ${winrate.toFixed(1)}% win rate. ` +
             `Profit factor of ${profitFactor.toFixed(2)} indicates ${profitFactor >= 1.5 ? 'strong' : 'moderate'} profitability.`,
    strengths,
    weaknesses,
    recommendations,
    marketConditions,
    riskAssessment,
    confidence: 0.7
  };
}

