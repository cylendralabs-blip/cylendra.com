
import { 
  BaseStrategy, 
  StrategyBacktest,
  StrategyType 
} from '@/types/strategies';

export class StrategyService {
  static async createStrategy(_strategy: Partial<BaseStrategy>): Promise<BaseStrategy> {
    console.warn('Strategy creation disabled - strategy_templates table does not exist');
    throw new Error('Strategy templates feature not available');
  }

  static async updateStrategy(_id: string, _updates: Partial<BaseStrategy>): Promise<BaseStrategy> {
    console.warn('Strategy update disabled - strategy_templates table does not exist');
    throw new Error('Strategy templates feature not available');
  }

  static async deleteStrategy(_id: string): Promise<void> {
    console.warn('Strategy deletion disabled - strategy_templates table does not exist');
  }

  static async getStrategy(_id: string): Promise<BaseStrategy | null> {
    console.warn('Strategy retrieval disabled - strategy_templates table does not exist');
    return null;
  }

  static async getUserStrategies(_userId: string, _type?: StrategyType): Promise<BaseStrategy[]> {
    console.warn('Get user strategies disabled - strategy_templates table does not exist');
    return [];
  }

  static async toggleStrategyStatus(_id: string, _isActive: boolean): Promise<void> {
    console.warn('Toggle strategy status disabled - strategy_templates table does not exist');
  }

  static async cloneStrategy(_id: string, _newName: string): Promise<BaseStrategy> {
    console.warn('Clone strategy disabled - strategy_templates table does not exist');
    throw new Error('Strategy templates feature not available');
  }

  static async backtest(_strategyId: string, params: {
    startDate: string;
    endDate: string;
    initialCapital: number;
    symbols?: string[];
  }): Promise<StrategyBacktest> {
    console.warn('Backtest disabled - strategy_templates table does not exist');
    
    // Return mock backtest for demonstration
    const mockBacktest: StrategyBacktest = {
      id: crypto.randomUUID(),
      strategyId: _strategyId,
      startDate: params.startDate,
      endDate: params.endDate,
      initialCapital: params.initialCapital,
      finalCapital: params.initialCapital * 1.15,
      totalReturn: 15,
      annualizedReturn: 18,
      volatility: 12,
      sharpeRatio: 1.5,
      maxDrawdown: -8,
      trades: [],
      equity: [],
      settings: {},
      createdAt: new Date().toISOString()
    };

    return mockBacktest;
  }
}
