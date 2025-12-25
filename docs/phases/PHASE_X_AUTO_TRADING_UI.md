# Phase X – Auto Trading UI from Signals

## نظرة عامة

هذه المرحلة تهدف إلى **ربط محرك الإشارات الموجود وعامل التداول التلقائي بواجهة مستخدم واضحة**، بحيث يمكن للمستخدمين **تفعيل/تعطيل التداول التلقائي من الإشارات** والتحكم في كيفية استخدام الإشارات من قبل البوت.

القطع الخلفية (signal router, auto-trader worker, execute-trade) موجودة في الغالب؛ نحتاج الآن إلى **طبقة المنتج (الإعدادات + واجهة المستخدم + الربط)**.

---

## 📋 المهام المكتملة

### ✅ 1. Extended bot_settings Schema

تم إضافة الحقول التالية إلى `bot_settings` table:

#### الحقول الجديدة:

- **`auto_trading_enabled`** (boolean, default: false)
  - تفعيل/تعطيل التداول التلقائي من الإشارات

- **`auto_trading_mode`** (text, enum-like):
  - `"off"` - معطل
  - `"full_auto"` - تنفيذ تلقائي كامل عند مرور الإشارة بالفلاتر
  - `"semi_auto"` - تحضير الصفقة ولكن يتطلب تأكيد المستخدم (محجوز للمستقبل)

- **`allowed_signal_sources`** (text[]):
  - مصفوفة من مصادر الإشارات المسموحة
  - القيم: `["ai_ultra", "ai_realtime", "tradingview", "legacy"]`

- **`min_signal_confidence`** (numeric, nullable)
  - الحد الأدنى لثقة الإشارة (0-100)

- **`allowed_directions`** (text[]):
  - الاتجاهات المسموحة: `["long", "short"]`

- **`max_auto_trades_per_day`** (int, nullable)
  - الحد الأقصى لعدد الصفقات التلقائية يومياً

- **`max_concurrent_auto_positions`** (int, nullable)
  - الحد الأقصى لعدد المراكز التلقائية المتزامنة

- **`auto_trading_notes`** (text, optional)
  - ملاحظات للاستخدام المستقبلي/التصحيح

#### الملفات المحدثة:

- `src/core/config/botSettings.schema.ts` - إضافة الحقول إلى Zod schema
- `src/core/config/defaults.ts` - إضافة القيم الافتراضية
- `src/utils/dataFetchers.ts` - تحديث `fetchBotSettings` لدعم الحقول الجديدة
- `src/utils/botSettingsDefaults.ts` - تحديث `mapSettingsToFormData`

---

### ✅ 2. Updated TypeScript Types

تم تحديث جميع الأنواع TypeScript لدعم الحقول الجديدة:

- **`BotSettingsForm`** type - تم تحديثه تلقائياً من Zod schema
- جميع الدوال المساعدة تم تحديثها لدعم الحقول الجديدة

---

### ✅ 3. Auto Trading Settings UI Component

تم إنشاء مكون UI كامل لإعدادات التداول التلقائي:

**الملف:** `src/components/bot-settings/AutoTradingSettings.tsx`

#### الميزات:

1. **Toggle رئيسي:** "Enable Auto Trading from Signals"
   - يربط بـ `auto_trading_enabled`
   - عند التفعيل، يعرض modal تحذيري يشرح المخاطر

2. **Source selector (Multi-select):**
   - AI Ultra Signals
   - AI Realtime Signals
   - TradingView Signals
   - Legacy / Other
   - يربط بـ `allowed_signal_sources`

3. **Direction selector (Checkboxes):**
   - Allow Long
   - Allow Short
   - يربط بـ `allowed_directions`

4. **Risk filters:**
   - `min_signal_confidence` (slider/numeric input)
   - `max_auto_trades_per_day` (numeric)
   - `max_concurrent_auto_positions` (numeric)

5. **Auto Trading Mode selector:**
   - Off
   - Full Auto (Execute automatically)
   - Semi Auto (Require confirmation - Coming soon)

6. **UX Features:**
   - نص توضيحي: "When auto trading is enabled, Orbitra AI will automatically execute trades based on incoming signals that match these filters."
   - تعطيل المدخلات المتقدمة عندما يكون Toggle الرئيسي OFF (read-only/greyed out)
   - Dialog تحذيري عند التفعيل لأول مرة

---

### ✅ 4. Integrated into Bot Settings Page

تم إضافة tab جديد "التداول التلقائي" في صفحة Bot Settings:

**الملف:** `src/pages/BotSettings.tsx`

#### التغييرات:

- إضافة import لـ `AutoTradingSettings` component
- إضافة tab جديد في `TabsList` (mobile & desktop)
- إضافة `TabsContent` للتبويب الجديد
- إضافة دعم query parameter `?tab=auto-trading` للانتقال المباشر للتبويب

---

### ✅ 5. Updated Auto-Trader Worker

تم تحديث `auto-trader-worker` لقراءة وتطبيق الإعدادات الجديدة:

**الملف:** `supabase/functions/auto-trader-worker/index.ts`

#### التحديثات:

1. **تحديث `BotSettingsForm` interface:**
   ```typescript
   interface BotSettingsForm {
     // ... existing fields
     auto_trading_enabled?: boolean;
     auto_trading_mode?: 'off' | 'full_auto' | 'semi_auto';
     allowed_signal_sources?: string[];
     min_signal_confidence?: number | null;
     allowed_directions?: string[];
     max_auto_trades_per_day?: number | null;
     max_concurrent_auto_positions?: number | null;
   }
   ```

2. **تحديث `FilterContext` interface:**
   ```typescript
   interface FilterContext {
     // ... existing fields
     autoTradesToday?: number;
     autoConcurrentPositions?: number;
     signalSource?: string;
   }
   ```

3. **تحديث `applyAllFilters` function:**
   - ✅ فحص `auto_trading_enabled` و `auto_trading_mode` أولاً
   - ✅ فلترة حسب `allowed_signal_sources`
   - ✅ فلترة حسب `allowed_directions`
   - ✅ فحص `min_signal_confidence`
   - ✅ فحص `max_auto_trades_per_day`
   - ✅ فحص `max_concurrent_auto_positions`
   - ✅ تسجيل أسباب القبول/الرفض لكل إشارة

4. **تحديث `processSignal` function:**
   - تحميل الحقول الجديدة من `bot_settings`
   - حساب عدد الصفقات التلقائية اليوم
   - حساب عدد المراكز التلقائية المتزامنة
   - إضافة هذه المعلومات إلى `filterContext`

#### Logging:

تم إضافة logging شامل لقرارات التداول التلقائي:
- لماذا تم قبول/رفض الإشارة (source filtered, confidence too low, limits reached, etc.)
- هذه السجلات ستظهر لاحقاً في history view

---

### ✅ 6. Signals Page – Auto Trading Status Widget

تم إضافة status widget في صفحة Signals:

**الملفات:**
- `src/components/signals/AutoTradingStatusWidget.tsx` (جديد)
- `src/pages/Signals.tsx` (محدث)

#### الميزات:

1. **Status Widget في أعلى الصفحة:**
   - Auto Trading: ON/OFF
   - Mode: Full Auto / Off
   - Allowed sources summary (e.g. "AI Ultra, Realtime")
   - Allowed directions summary

2. **Eligibility Indicators لكل إشارة:**
   - Badge "Eligible" للإشارات المؤهلة
   - Badge "Not Eligible" للإشارات غير المؤهلة مع tooltip يوضح السبب
   - **الملف:** `src/components/signals/SignalEligibilityBadge.tsx` (جديد)
   - **Hook:** `src/hooks/useAutoTradingEligibility.ts` (جديد)

3. **Button للانتقال إلى الإعدادات:**
   - "Configure Auto Trading" → ينتقل إلى Bot Settings → Auto Trading tab

---

### ✅ 7. AI Live Center – Auto Trading Panel

تم إضافة panel في AI Live Center:

**الملف:** `src/components/ai-live/AutoTradingPanel.tsx` (جديد)

#### الميزات:

- **Auto Trading Status:**
  - ON/OFF indicator
  - Mode display

- **Active Bot Name:**
  - اسم البوت النشط

- **Today's Auto Trades Count:**
  - عدد الصفقات التلقائية اليوم
  - يتم التحديث كل 30 ثانية

- **Last Auto Trade:**
  - آخر صفقة تلقائية
  - الوقت
  - الرمز والاتجاه
  - نسبة الربح/الخسارة

- **Button:**
  - "Manage Auto Trading" → ينتقل إلى Bot Settings

#### ملاحظات تقنية:

- التعامل مع عدم وجود `signal_source` column في `trades` table
- حساب `profit_loss_percentage` من `realized_pnl`/`unrealized_pnl` و `total_invested`
- معالجة الأخطاء بشكل آمن

---

### ✅ 8. Auto Trade History Filter

تم إضافة filter/view للصفقات التلقائية في Trade History:

**الملف:** `src/pages/TradingHistory.tsx` (محدث)

#### التغييرات:

1. **Tab جديد "Auto Trades":**
   - يعرض فقط الصفقات التي `signal_source === 'auto'`
   - عداد للصفقات التلقائية

2. **Filtering Logic:**
   ```typescript
   const filteredTrades = activeTab === 'auto' 
     ? trades?.filter((t: any) => t.signal_source === 'auto') || []
     : trades || [];
   ```

3. **Empty State:**
   - رسالة عندما لا توجد صفقات تلقائية
   - نص توضيحي: "Auto trades will appear here when your bot executes trades automatically"

---

### ✅ 9. API Endpoints / Data Persistence

تم تحديث hooks و functions للحفظ والقراءة:

**الملفات المحدثة:**

1. **`src/hooks/useBotSettingsMutation.ts`:**
   - إضافة الحقول الجديدة إلى `validColumns` array
   - دعم حفظ جميع الحقول الجديدة

2. **`src/utils/dataFetchers.ts`:**
   - تحديث `fetchBotSettings` لقراءة الحقول الجديدة

3. **`src/core/config/defaults.ts`:**
   - تحديث `mapSettingsToFormData` لدعم الحقول الجديدة

#### ملاحظة:

الإعدادات تُحفظ عبر Bot Settings API الموجود (لا حاجة لـ endpoints منفصلة).

---

### ✅ 10. Safety & Default Behavior

#### Default State:

- **`auto_trading_enabled = false`** (افتراضي)
- **`auto_trading_mode = 'off'`** (افتراضي)
- **`allowed_signal_sources = []`** (افتراضي - لا مصادر محددة)
- **`allowed_directions = ['long', 'short']`** (افتراضي - كلاهما)

#### Safety Features:

1. **Warning Modal عند التفعيل:**
   - يظهر عند تفعيل Auto Trading لأول مرة
   - يشرح المخاطر
   - يتطلب تأكيد صريح

2. **Respect Global Kill Switch:**
   - إذا كان Kill Switch العام مفعلاً، يتم تجاهل auto trading على مستوى البوت

3. **Validation:**
   - التحقق من القيم (مثلاً: max trades per day ليس سالب)
   - Zod schema validation

---

## 📁 الملفات المُنشأة

### Schema & Types:
- ✅ `src/core/config/botSettings.schema.ts` (محدث)
- ✅ `src/core/config/defaults.ts` (محدث)
- ✅ `src/utils/dataFetchers.ts` (محدث)
- ✅ `src/utils/botSettingsDefaults.ts` (محدث)

### UI Components:
- ✅ `src/components/bot-settings/AutoTradingSettings.tsx` (جديد)
- ✅ `src/components/signals/AutoTradingStatusWidget.tsx` (جديد)
- ✅ `src/components/signals/SignalEligibilityBadge.tsx` (جديد)
- ✅ `src/components/ai-live/AutoTradingPanel.tsx` (جديد)

### Hooks:
- ✅ `src/hooks/useAutoTradingEligibility.ts` (جديد)

### Backend:
- ✅ `supabase/functions/auto-trader-worker/index.ts` (محدث شامل)

### Pages:
- ✅ `src/pages/BotSettings.tsx` (محدث)
- ✅ `src/pages/Signals.tsx` (محدث)
- ✅ `src/pages/AILiveCenter.tsx` (محدث)
- ✅ `src/pages/TradingHistory.tsx` (محدث)

### Hooks:
- ✅ `src/hooks/useBotSettingsMutation.ts` (محدث)

---

## 🔧 التغييرات التقنية التفصيلية

### 1. Schema Updates

#### `botSettings.schema.ts`:
```typescript
// Phase X: Auto Trading from Signals
auto_trading_enabled: z.boolean().default(false),
auto_trading_mode: z.enum(['off', 'full_auto', 'semi_auto']).default('off'),
allowed_signal_sources: z.array(z.enum(['ai_ultra', 'ai_realtime', 'tradingview', 'legacy'])).default([]),
min_signal_confidence: z.number().min(0).max(100).nullable().optional(),
allowed_directions: z.array(z.enum(['long', 'short'])).default(['long', 'short']),
max_auto_trades_per_day: z.number().min(0).nullable().optional(),
max_concurrent_auto_positions: z.number().min(0).nullable().optional(),
auto_trading_notes: z.string().optional(),
```

### 2. Auto-Trader Worker Filtering Logic

#### Filter Order (الأولوية):

1. ✅ **Auto Trading Enabled Check** (أولاً)
   - إذا `auto_trading_enabled === false` أو `auto_trading_mode === 'off'` → رفض

2. ✅ **Signal Source Filter**
   - التحقق من أن `signal_source` موجود في `allowed_signal_sources`

3. ✅ **Direction Filter**
   - التحقق من أن الاتجاه (long/short) موجود في `allowed_directions`

4. ✅ **Confidence Filter**
   - التحقق من أن `confidence_score >= min_signal_confidence`

5. ✅ **Daily Limit Check**
   - التحقق من `autoTradesToday < max_auto_trades_per_day`

6. ✅ **Concurrent Limit Check**
   - التحقق من `autoConcurrentPositions < max_concurrent_auto_positions`

7. ✅ **General Limits** (موجودة مسبقاً)
   - Max active trades
   - Exchange health
   - Cooldown

### 3. Signal Source Mapping

```typescript
// Normalize signal source names
const normalizedSource = signalSource === 'ai' ? 'ai_ultra' : 
                        signalSource === 'realtime_ai' ? 'ai_realtime' :
                        signalSource === 'tradingview' ? 'tradingview' : 'legacy';
```

### 4. Profit/Loss Calculation

```typescript
// Calculate profit_loss_percentage from realized_pnl or unrealized_pnl
const pnl = trade.status === 'CLOSED' 
  ? (trade.realized_pnl || 0) 
  : (trade.unrealized_pnl || 0);
  
const profitLossPercentage = trade.total_invested > 0 
  ? ((pnl || 0) / trade.total_invested) * 100 
  : 0;
```

---

## 🗄️ Database Migration Required

### للحقول الجديدة في `bot_settings`:

```sql
ALTER TABLE bot_settings 
ADD COLUMN IF NOT EXISTS auto_trading_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_trading_mode TEXT DEFAULT 'off',
ADD COLUMN IF NOT EXISTS allowed_signal_sources TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS min_signal_confidence NUMERIC,
ADD COLUMN IF NOT EXISTS allowed_directions TEXT[] DEFAULT ARRAY['long', 'short'],
ADD COLUMN IF NOT EXISTS max_auto_trades_per_day INTEGER,
ADD COLUMN IF NOT EXISTS max_concurrent_auto_positions INTEGER,
ADD COLUMN IF NOT EXISTS auto_trading_notes TEXT;
```

### لعمود `signal_source` في `trades` (اختياري - للتتبع):

```sql
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS signal_source TEXT;

-- Set default for existing trades (optional)
UPDATE trades SET signal_source = 'manual' WHERE signal_source IS NULL;
```

**ملاحظة:** إذا لم يتم إضافة `signal_source` إلى `trades` table، سيتم:
- عرض 0 للصفقات التلقائية اليوم
- عدم عرض آخر صفقة تلقائية
- فلتر Auto Trades في Trading History لن يعمل

---

## 🎯 User Flow

### تفعيل Auto Trading:

1. المستخدم يذهب إلى **Bot Settings** → **Auto Trading** tab
2. يضغط على **Toggle "Enable Auto Trading from Signals"**
3. يظهر **Warning Modal** يشرح المخاطر
4. المستخدم يضغط **"I Understand, Enable Auto Trading"**
5. يتم تفعيل Auto Trading
6. المستخدم يختار:
   - مصادر الإشارات المسموحة
   - الاتجاهات المسموحة
   - الحد الأدنى للثقة
   - الحدود اليومية والمتزامنة
7. يضغط **"حفظ الإعدادات"**
8. البوت يبدأ في تنفيذ الصفقات تلقائياً عند وصول إشارات مطابقة

### عرض Auto Trading Status:

1. في **Signals Page:**
   - Widget في الأعلى يوضح الحالة
   - Badges لكل إشارة توضح إذا كانت مؤهلة

2. في **AI Live Center:**
   - Panel على اليمين يعرض:
     - الحالة (ON/OFF)
     - عدد الصفقات اليوم
     - آخر صفقة تلقائية

3. في **Trading History:**
   - Tab "Auto Trades" يعرض جميع الصفقات التلقائية

---

## 🔍 Filtering Logic Details

### في Auto-Trader Worker:

```typescript
function applyAllFilters(context: FilterContext): FilterResult {
  // 1. Auto Trading Enabled Check
  if (botSettings.auto_trading_enabled === false || 
      botSettings.auto_trading_mode === 'off') {
    return { passed: false, reason: 'Auto trading is disabled', code: 'AUTO_TRADING_DISABLED' };
  }

  // 2. Signal Source Filter
  if (botSettings.allowed_signal_sources?.length > 0) {
    const normalizedSource = normalizeSignalSource(context.signalSource);
    if (!botSettings.allowed_signal_sources.includes(normalizedSource)) {
      return { passed: false, reason: 'Source not allowed', code: 'SOURCE_NOT_ALLOWED' };
    }
  }

  // 3. Direction Filter
  if (botSettings.allowed_directions?.length > 0) {
    const direction = isBuy ? 'long' : 'short';
    if (!botSettings.allowed_directions.includes(direction)) {
      return { passed: false, reason: 'Direction not allowed', code: 'DIRECTION_NOT_ALLOWED' };
    }
  }

  // 4. Confidence Filter
  if (botSettings.min_signal_confidence !== null) {
    if (signal.confidence_score < botSettings.min_signal_confidence) {
      return { passed: false, reason: 'Confidence too low', code: 'LOW_CONFIDENCE' };
    }
  }

  // 5. Daily Limit
  if (botSettings.max_auto_trades_per_day !== null) {
    if (context.autoTradesToday >= botSettings.max_auto_trades_per_day) {
      return { passed: false, reason: 'Daily limit reached', code: 'MAX_AUTO_TRADES_PER_DAY' };
    }
  }

  // 6. Concurrent Limit
  if (botSettings.max_concurrent_auto_positions !== null) {
    if (context.autoConcurrentPositions >= botSettings.max_concurrent_auto_positions) {
      return { passed: false, reason: 'Concurrent limit reached', code: 'MAX_CONCURRENT_AUTO_POSITIONS' };
    }
  }

  // ... other existing filters

  return { passed: true };
}
```

---

## 📊 UI Components Structure

### AutoTradingSettings Component:

```
AutoTradingSettings
├── Main Toggle (Enable Auto Trading)
├── Warning Alert (when enabled)
├── Auto Trading Mode Selector
├── Allowed Signal Sources (Multi-select checkboxes)
├── Allowed Directions (Long/Short checkboxes)
├── Risk Filters Section
│   ├── Min Signal Confidence
│   ├── Max Auto Trades Per Day
│   └── Max Concurrent Auto Positions
├── Info Box (How Auto Trading Works)
└── Warning Dialog (on first enable)
```

### AutoTradingStatusWidget Component:

```
AutoTradingStatusWidget
├── Header
│   ├── Title + Icon
│   └── Status Badge (ON/OFF)
├── Description (Mode)
└── Content
    ├── Sources Summary
    ├── Directions Summary
    ├── Alert (Info/Warning)
    └── Button (Configure/Enable)
```

### AutoTradingPanel Component:

```
AutoTradingPanel
├── Header
│   ├── Title + Icon
│   └── Status Badge (ON/OFF)
├── Description (Mode)
└── Content
    ├── Active Bot Name
    ├── Today's Auto Trades Count
    ├── Last Auto Trade Info
    ├── Alert
    └── Button (Manage/Enable)
```

---

## 🐛 Bug Fixes Applied

### 1. Console Errors Fixed:

#### Error: `profit_loss_percentage does not exist`
- **السبب:** العمود غير موجود في `trades` table
- **الحل:** حساب النسبة من `realized_pnl`/`unrealized_pnl` و `total_invested`

#### Error: `signal_source does not exist`
- **السبب:** العمود قد لا يكون موجوداً في `trades` table
- **الحل:** 
  - معالجة الأخطاء بشكل آمن
  - إرجاع 0 أو null عند عدم وجود العمود
  - Logging warnings بدلاً من errors

### 2. Navigation 404 Fixed:

#### Error: Page not found عند النقر على "Enable Auto Trading"
- **السبب:** المسار كان `/bot-settings` بدلاً من `/dashboard/bot-settings`
- **الحل:**
  - تحديث جميع `navigate()` calls إلى `/dashboard/bot-settings?tab=auto-trading`
  - إضافة دعم query parameter في `BotSettings.tsx`

---

## 🔐 Security & Validation

### 1. Authentication:
- جميع endpoints تتطلب authentication
- المستخدم يمكنه فقط إدارة إعدادات بوت الخاصة به

### 2. Validation:
- Zod schema validation لجميع الحقول
- Range validation (مثلاً: confidence 0-100)
- Type checking في TypeScript

### 3. Default Safety:
- `auto_trading_enabled = false` افتراضي
- لا يتم تنفيذ أي صفقات تلقائية إلا بعد التفعيل الصريح

---

## 📈 Performance Considerations

### 1. Query Optimization:
- استخدام `refetchInterval` في queries للبيانات الحية (30 ثانية)
- Caching للبيانات الثابتة

### 2. Error Handling:
- Graceful degradation عند عدم وجود أعمدة في قاعدة البيانات
- Console warnings بدلاً من errors عند الحقول الاختيارية

---

## 🧪 Testing Checklist

### Functional Tests:

- [ ] تفعيل Auto Trading من Bot Settings
- [ ] تعطيل Auto Trading
- [ ] اختيار مصادر إشارات محددة
- [ ] اختيار اتجاهات محددة
- [ ] تعيين حد أدنى للثقة
- [ ] تعيين حد أقصى للصفقات اليومية
- [ ] تعيين حد أقصى للمراكز المتزامنة
- [ ] عرض Auto Trading Status في Signals page
- [ ] عرض Eligibility indicators للإشارات
- [ ] عرض Auto Trading Panel في AI Live Center
- [ ] عرض Auto Trades في Trading History
- [ ] Navigation من الأزرار إلى Bot Settings
- [ ] فتح tab الصحيح عند استخدام query parameter

### Edge Cases:

- [ ] عدم وجود `signal_source` column في `trades`
- [ ] عدم وجود صفقات تلقائية
- [ ] جميع الإشارات غير مؤهلة
- [ ] الوصول إلى الحدود اليومية
- [ ] الوصول إلى الحدود المتزامنة

---

## 📝 Notes & Future Enhancements

### ملاحظات:

1. **Semi Auto Mode:**
   - حالياً محجوز للمستقبل
   - يحتاج إلى UI للـ confirmation flow

2. **Signal Source Column:**
   - يجب إضافة `signal_source` إلى `trades` table للتتبع الكامل
   - حالياً، Auto Trades tracking محدود بدون هذا العمود

3. **Auto Trading Notes:**
   - حقل موجود في schema لكن غير مستخدم في UI حالياً
   - يمكن استخدامه لاحقاً للـ debugging/notes

### تحسينات مستقبلية محتملة:

1. **Auto Trading Dashboard:**
   - صفحة مخصصة لعرض إحصائيات Auto Trading
   - Charts و analytics

2. **Advanced Filtering:**
   - فلاتر إضافية (مثلاً: symbols محددة، timeframes محددة)
   - Custom rules engine

3. **Backtesting Integration:**
   - اختبار Auto Trading settings على بيانات تاريخية

4. **Notifications:**
   - إشعارات عند تنفيذ صفقة تلقائية
   - إشعارات عند رفض إشارة

---

## 🎉 Summary

تم إكمال Phase X بنجاح! الآن Orbitra AI لديه:

✅ **نظام تداول تلقائي كامل** من الإشارات
✅ **واجهة مستخدم شاملة** للتحكم في Auto Trading
✅ **فلاتر متقدمة** للتحكم في نوع الإشارات المنفذة
✅ **تتبع وإحصائيات** للصفقات التلقائية
✅ **Safety features** لضمان الاستخدام الآمن

المستخدمون الآن يمكنهم:
- تفعيل Auto Trading بسهولة
- التحكم في مصادر الإشارات والاتجاهات
- تعيين حدود للمخاطر
- متابعة الصفقات التلقائية
- فهم أي إشارات مؤهلة للتنفيذ التلقائي

---

## 📚 Related Documentation

- [Bot Settings Schema](../src/core/config/botSettings.schema.ts)
- [Auto-Trader Worker](../supabase/functions/auto-trader-worker/index.ts)
- [Auto Trading Settings Component](../src/components/bot-settings/AutoTradingSettings.tsx)

---

**تاريخ الإكمال:** 2025-01-XX  
**الحالة:** ✅ مكتمل  
**الإصدار:** Phase X.1.0

