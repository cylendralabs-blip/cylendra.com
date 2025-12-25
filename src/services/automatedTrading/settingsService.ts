
import { AutoTradingSettings } from '@/types/automatedTrading';
import { getDefaultAutoTradingSettings, parseAutoTradingSettings } from '@/utils/autoTradingDefaults';

export class AutoTradingSettingsService {
  static async loadSettings(userId: string): Promise<AutoTradingSettings> {
    try {
      console.log('📥 تحميل إعدادات التداول الآلي للمستخدم:', userId);
      
      // محاكاة جلب الإعدادات من قاعدة البيانات
      // يمكن استبدال هذا بالاستعلام الحقيقي
      const savedSettings = null; // من قاعدة البيانات
      
      return savedSettings ? parseAutoTradingSettings(savedSettings) : getDefaultAutoTradingSettings();
    } catch (error) {
      console.error('خطأ في تحميل الإعدادات:', error);
      return getDefaultAutoTradingSettings();
    }
  }

  static async saveSettings(userId: string, settings: AutoTradingSettings): Promise<boolean> {
    try {
      console.log('💾 حفظ إعدادات التداول الآلي للمستخدم:', userId);
      
      // محاكاة حفظ الإعدادات في قاعدة البيانات
      // يمكن استبدال هذا بالاستعلام الحقيقي
      
      return true;
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      return false;
    }
  }
}
