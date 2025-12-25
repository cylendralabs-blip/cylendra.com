# Dev Mocks - ملفات التطوير الوهمية

⚠️ **هذا المجلد يحتوي على ملفات محاكاة للتطوير فقط**

**ملاحظة مهمة:**
- هذه الملفات تستخدم للاختبار والتطوير فقط
- لا يجب استيرادها في كود الإنتاج
- سيتم استبدالها بملفات حقيقية في المراحل القادمة

## الملفات الموجودة:

### 1. `engineService.mock.ts`
- محاكاة Automated Trading Engine
- يستخدم بيانات وهمية للصفقات والإشارات

### 2. `advancedAnalysisEngine.mock.ts`
- محاكاة Advanced Analysis Engine
- يستخدم Math.random() لتوليد البيانات

### 3. `newEnhancedSignalEngine.mock.ts`
- محاكاة Signal Engine
- يستخدم أسعار يدوية وبيانات وهمية

### 4. `strategyService.mock.ts`
- محاكاة Strategy Service
- يستخدم mock backtest data

### 5. `syncPlatformTrades.mock.ts`
- محاكاة Sync Platform Trades
- يستخدم بيانات صفقات وهمية

## كيفية الاستخدام:

```typescript
// في التطوير فقط
import { AutomatedTradingEngineService } from '@/dev-mocks/engineService.mock';

// في الإنتاج - استبدل بـ:
// import { AutomatedTradingEngineService } from '@/services/automatedTrading/engineService';
```


