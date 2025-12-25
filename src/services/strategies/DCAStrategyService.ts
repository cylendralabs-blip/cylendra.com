
import { StrategyService } from './StrategyService';
import { DCAStrategy, DCASettings } from '@/types/strategies';

export class DCAStrategyService extends StrategyService {
  static async createDCAStrategy(
    name: string,
    userId: string,
    settings: DCASettings,
    type: 'dca_basic' | 'dca_advanced' | 'dca_smart' = 'dca_basic'
  ): Promise<DCAStrategy> {
    const strategy = {
      name,
      type,
      userId,
      description: this.generateDescription(type, settings),
      settings,
      isActive: false
    };

    return this.createStrategy(strategy) as Promise<DCAStrategy>;
  }

  static getDefaultSettings(type: 'dca_basic' | 'dca_advanced' | 'dca_smart'): DCASettings {
    const baseSettings: DCASettings = {
      maxInvestment: 1000,
      numberOfLevels: 5,
      priceDropPercentages: [2, 4, 6, 8, 10],
      investmentPercentages: [20, 20, 20, 20, 20],
      takeProfitPercentage: 3,
      stopLossPercentage: 15,
      cooldownPeriod: 24,
      maxActiveDeals: 3,
      riskRewardRatio: 2,
      enableSmartEntry: false,
      enableDynamicTP: false,
      enableTrailingStop: false,
      minVolumeThreshold: 1000000,
      blacklistPeriods: []
    };

    switch (type) {
      case 'dca_advanced':
        return {
          ...baseSettings,
          numberOfLevels: 7,
          priceDropPercentages: [1.5, 3, 5, 7, 10, 15, 20],
          investmentPercentages: [15, 15, 15, 15, 15, 15, 10],
          enableSmartEntry: true,
          enableDynamicTP: true,
          takeProfitPercentage: 2.5
        };

      case 'dca_smart':
        return {
          ...baseSettings,
          numberOfLevels: 10,
          priceDropPercentages: [1, 2, 3, 5, 7, 10, 15, 20, 25, 30],
          investmentPercentages: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
          enableSmartEntry: true,
          enableDynamicTP: true,
          enableTrailingStop: true,
          takeProfitPercentage: 2,
          maxActiveDeals: 5
        };

      default:
        return baseSettings;
    }
  }

  static validateSettings(settings: DCASettings): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (settings.numberOfLevels !== settings.priceDropPercentages.length) {
      errors.push('عدد المستويات يجب أن يطابق عدد نسب انخفاض السعر');
    }

    if (settings.numberOfLevels !== settings.investmentPercentages.length) {
      errors.push('عدد المستويات يجب أن يطابق عدد نسب الاستثمار');
    }

    const totalInvestmentPercentage = settings.investmentPercentages.reduce((sum, p) => sum + p, 0);
    if (Math.abs(totalInvestmentPercentage - 100) > 0.01) {
      errors.push('مجموع نسب الاستثمار يجب أن يساوي 100%');
    }

    if (settings.takeProfitPercentage <= 0) {
      errors.push('نسبة جني الأرباح يجب أن تكون أكبر من صفر');
    }

    if (settings.stopLossPercentage <= 0) {
      errors.push('نسبة وقف الخسائر يجب أن تكون أكبر من صفر');
    }

    if (settings.maxInvestment <= 0) {
      errors.push('الحد الأقصى للاستثمار يجب أن يكون أكبر من صفر');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static calculateExpectedReturn(settings: DCASettings, scenarios: {
    dropPercentage: number;
    probability: number;
  }[]): {
    expectedReturn: number;
    worstCase: number;
    bestCase: number;
    riskScore: number;
  } {
    let expectedReturn = 0;
    let worstCase = 0;
    let bestCase = 0;

    scenarios.forEach(scenario => {
      const levelsTriggered = settings.priceDropPercentages.filter(
        drop => drop <= scenario.dropPercentage
      ).length;

      if (levelsTriggered > 0) {
        const totalInvested = settings.investmentPercentages
          .slice(0, levelsTriggered)
          .reduce((sum, p) => sum + (settings.maxInvestment * p / 100), 0);

        const returnAmount = totalInvested * (settings.takeProfitPercentage / 100);
        const scenarioReturn = returnAmount * scenario.probability;
        
        expectedReturn += scenarioReturn;
        
        if (scenario.dropPercentage > settings.stopLossPercentage) {
          const loss = totalInvested * (settings.stopLossPercentage / 100);
          worstCase = Math.min(worstCase, -loss);
        }
        
        bestCase = Math.max(bestCase, returnAmount);
      }
    });

    const riskScore = Math.abs(worstCase) / (bestCase || 1) * 100;

    return {
      expectedReturn,
      worstCase,
      bestCase,
      riskScore
    };
  }

  private static generateDescription(
    type: 'dca_basic' | 'dca_advanced' | 'dca_smart',
    settings: DCASettings
  ): string {
    const typeNames = {
      dca_basic: 'DCA الأساسية',
      dca_advanced: 'DCA المتقدمة', 
      dca_smart: 'DCA الذكية'
    };

    return `${typeNames[type]} مع ${settings.numberOfLevels} مستوى، هدف ربح ${settings.takeProfitPercentage}%، ووقف خسائر ${settings.stopLossPercentage}%`;
  }
}
