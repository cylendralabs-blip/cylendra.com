/**
 * Risk Presets Configuration
 * 
 * Constants and types for risk presets
 * Separated from component for Fast Refresh compatibility
 */

import { Shield, TrendingUp, Zap } from 'lucide-react';

export interface RiskPreset {
  id: 'low' | 'medium' | 'high';
  name: string;
  description: string;
  icon: any;
  color: string;
  riskPercentage: number;
  leverage: number;
  takeProfitPct: number;
  stopLossPct: number;
  initialOrderPercentage: number;
  dcaLevels: number;
  dailyLossLimit: number;
  maxDrawdown: number;
}

export const RISK_PRESETS: Record<'low' | 'medium' | 'high', RiskPreset> = {
  low: {
    id: 'low',
    name: 'Low Risk',
    description: 'Conservative approach with minimal risk per trade',
    icon: Shield,
    color: 'text-green-600',
    riskPercentage: 1,
    leverage: 1,
    takeProfitPct: 3,
    stopLossPct: 1.5,
    initialOrderPercentage: 100,
    dcaLevels: 0,
    dailyLossLimit: 5,
    maxDrawdown: 10,
  },
  medium: {
    id: 'medium',
    name: 'Medium Risk',
    description: 'Balanced risk/reward ratio for steady growth',
    icon: TrendingUp,
    color: 'text-blue-600',
    riskPercentage: 2,
    leverage: 2,
    takeProfitPct: 4,
    stopLossPct: 2,
    initialOrderPercentage: 80,
    dcaLevels: 2,
    dailyLossLimit: 10,
    maxDrawdown: 15,
  },
  high: {
    id: 'high',
    name: 'High Risk',
    description: 'Aggressive strategy with higher risk tolerance',
    icon: Zap,
    color: 'text-orange-600',
    riskPercentage: 3,
    leverage: 5,
    takeProfitPct: 6,
    stopLossPct: 3,
    initialOrderPercentage: 60,
    dcaLevels: 3,
    dailyLossLimit: 15,
    maxDrawdown: 25,
  },
};

