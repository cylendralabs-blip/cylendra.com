/**
 * ⚠️ MOCK FILE - للتطوير فقط
 * 
 * هذا الملف محاكاة لـ Automated Trading Engine Service
 * يستخدم بيانات وهمية للصفقات والإشارات
 * 
 * في الإنتاج، استبدل هذا بـ:
 * import { AutomatedTradingEngineService } from '@/services/automatedTrading/engineService';
 */

import { AutoTradingSettings, EnhancedTradingSignal, ActiveAutoTrade } from '@/types/automatedTrading';

export class AutomatedTradingEngineServiceMock {
  static async fetchEligibleSignals(
    userId: string, 
    settings: AutoTradingSettings
  ): Promise<EnhancedTradingSignal[]> {
    console.log('🔍 [MOCK] جاري البحث عن الإشارات المؤهلة...');
    
    // محاكاة جلب الإشارات من قاعدة البيانات
    // يمكن استبدال هذا بالاستعلام الحقيقي
    return [];
  }

  static async executeAutoTrade(
    signal: EnhancedTradingSignal, 
    settings: AutoTradingSettings
  ): Promise<ActiveAutoTrade | null> {
    console.log('🚀 [MOCK] تنفيذ صفقة تلقائية للإشارة:', signal.id);
    
    // محاكاة تنفيذ الصفقة
    const newTrade: ActiveAutoTrade = {
      id: `auto_${Date.now()}`,
      signalId: signal.id,
      symbol: signal.symbol,
      status: 'ACTIVE',
      entryPrice: signal.entry_price,
      currentPrice: signal.entry_price,
      pnl: 0,
      riskAmount: settings.riskPerTrade,
      dcaLevel: 1,
      createdAt: new Date().toISOString()
    };

    return newTrade;
  }

  static async monitorActiveTrades(trades: ActiveAutoTrade[]): Promise<ActiveAutoTrade[]> {
    console.log('📊 [MOCK] مراقبة الصفقات النشطة...');
    
    // محاكاة تحديث أسعار الصفقات
    return trades.map(trade => ({
      ...trade,
      currentPrice: trade.entryPrice * (1 + (Math.random() - 0.5) * 0.02), // تغيير عشوائي ±1%
      pnl: Math.random() * 100 - 50 // ربح/خسارة عشوائية
    }));
  }
}

// Export as default for backward compatibility
export default AutomatedTradingEngineServiceMock;


