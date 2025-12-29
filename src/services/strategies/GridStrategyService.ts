
import { StrategyService } from './StrategyService';
import { GridStrategy, GridSettings } from '@/types/strategies';

export class GridStrategyService extends StrategyService {
  static async createGridStrategy(
    name: string,
    userId: string,
    settings: GridSettings,
    type: 'grid_classic' | 'grid_infinity' | 'grid_futures' = 'grid_classic'
  ): Promise<GridStrategy> {
    const strategy = {
      name,
      type,
      userId,
      description: this.generateDescription(type, settings),
      settings,
      isActive: false
    };

    return this.createStrategy(strategy) as Promise<GridStrategy>;
  }

  static getDefaultSettings(type: 'grid_classic' | 'grid_infinity' | 'grid_futures'): GridSettings {
    const baseSettings: GridSettings = {
      upperPrice: 50000,
      lowerPrice: 40000,
      gridNumber: 20,
      investmentPerGrid: 50,
      profitPerGrid: 1,
      enableInfiniteGrid: false,
      enableFuturesMode: false,
      leverage: 1,
      hedgingEnabled: false,
      rebalanceThreshold: 5,
      stopLossPercentage: 10,
      dynamicGridAdjustment: false,
      volatilityBasedSpacing: false
    };

    switch (type) {
      case 'grid_infinity':
        return {
          ...baseSettings,
          enableInfiniteGrid: true,
          dynamicGridAdjustment: true,
          volatilityBasedSpacing: true,
          gridNumber: 50
        };

      case 'grid_futures':
        return {
          ...baseSettings,
          enableFuturesMode: true,
          leverage: 3,
          hedgingEnabled: true,
          stopLossPercentage: 5
        };

      default:
        return baseSettings;
    }
  }

  static calculateGridMetrics(settings: GridSettings): {
    gridSpacing: number;
    totalInvestment: number;
    profitPerCycle: number;
    priceRange: number;
    gridDensity: number;
    maxProfit: number;
    maxLoss: number;
  } {
    const priceRange = settings.upperPrice - settings.lowerPrice;
    const gridSpacing = priceRange / (settings.gridNumber - 1);
    const totalInvestment = settings.investmentPerGrid * settings.gridNumber;
    const profitPerCycle = settings.profitPerGrid * settings.gridNumber;
    const gridDensity = settings.gridNumber / priceRange * 1000; // grids per 1000 units

    // حساب أقصى ربح وخسارة
    const maxProfit = settings.enableInfiniteGrid ? Infinity : profitPerCycle * 10; // تقدير
    const maxLoss = settings.enableFuturesMode 
      ? totalInvestment * (settings.stopLossPercentage / 100) * settings.leverage
      : totalInvestment * (settings.stopLossPercentage / 100);

    return {
      gridSpacing,
      totalInvestment,
      profitPerCycle,
      priceRange,
      gridDensity,
      maxProfit,
      maxLoss
    };
  }

  static validateSettings(settings: GridSettings): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (settings.upperPrice <= settings.lowerPrice) {
      errors.push('السعر العلوي يجب أن يكون أكبر من السعر السفلي');
    }

    if (settings.gridNumber < 2) {
      errors.push('عدد الشبكات يجب أن يكون 2 على الأقل');
    }

    if (settings.investmentPerGrid <= 0) {
      errors.push('الاستثمار لكل شبكة يجب أن يكون أكبر من صفر');
    }

    if (settings.profitPerGrid <= 0) {
      errors.push('الربح لكل شبكة يجب أن يكون أكبر من صفر');
    }

    if (settings.enableFuturesMode && settings.leverage < 1) {
      errors.push('الرافعة المالية يجب أن تكون 1 على الأقل');
    }

    if (settings.enableFuturesMode && settings.leverage > 20) {
      errors.push('الرافعة المالية مرتفعة جداً (أكثر من 20x)');
    }

    const gridSpacing = (settings.upperPrice - settings.lowerPrice) / (settings.gridNumber - 1);
    if (gridSpacing < 0.01) {
      errors.push('المسافة بين الشبكات صغيرة جداً');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static optimizeGridSettings(
    currentPrice: number,
    volatility: number,
    targetInvestment: number
  ): Partial<GridSettings> {
    // خوارزمية تحسين إعدادات الشبكة بناءً على السعر الحالي والتقلبات
    const priceRange = currentPrice * (volatility / 100) * 2;
    const upperPrice = currentPrice + priceRange / 2;
    const lowerPrice = currentPrice - priceRange / 2;
    
    // عدد الشبكات الأمثل بناءً على التقلبات
    const optimalGrids = Math.max(10, Math.min(50, Math.floor(volatility * 2)));
    const investmentPerGrid = targetInvestment / optimalGrids;
    
    // الربح لكل شبكة بناءً على التقلبات
    const profitPerGrid = Math.max(0.5, volatility / 20);

    return {
      upperPrice,
      lowerPrice,
      gridNumber: optimalGrids,
      investmentPerGrid,
      profitPerGrid,
      volatilityBasedSpacing: volatility > 15,
      dynamicGridAdjustment: volatility > 20
    };
  }

  private static generateDescription(
    type: 'grid_classic' | 'grid_infinity' | 'grid_futures',
    settings: GridSettings
  ): string {
    const typeNames = {
      grid_classic: 'Grid تقليدية',
      grid_infinity: 'Grid لا نهائية',
      grid_futures: 'Grid العقود الآجلة'
    };

    const priceRange = settings.upperPrice - settings.lowerPrice;
    const leverage = settings.enableFuturesMode ? ` برافعة ${settings.leverage}x` : '';
    
    return `${typeNames[type]} مع ${settings.gridNumber} شبكة في نطاق ${priceRange.toFixed(2)}${leverage}`;
  }
}
