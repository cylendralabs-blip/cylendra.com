# 🧹 خطة تنظيف المشروع قبل Phase 6

## 🎯 الهدف

إزالة جميع الأكواد الوهمية (Mocks) من مسار الإنتاج لضمان أن البوت يعمل فقط على:
1. **TradingView Webhook** - إشارات من TradingView
2. **Internal Strategy Engine** - إشارات من mainStrategy في strategy-runner-worker

---

## 📋 الملفات المراد نقلها/حذفها

### 1. ملفات Mock في `src/` يجب نقلها إلى `dev-mocks/`:

#### ✅ يجب نقلها:
- `src/services/automatedTrading/engineService.ts` → `src/dev-mocks/engineService.mock.ts` (موجود بالفعل)
- `src/utils/newEnhancedSignalEngine.ts` → `src/dev-mocks/newEnhancedSignalEngine.mock.ts` (موجود بالفعل)
- `src/utils/advancedAnalysisEngine.ts` → `src/dev-mocks/advancedAnalysisEngine.mock.ts` (موجود بالفعل)

#### ✅ يجب حذفها أو نقلها:
- `src/hooks/useNewEnhancedSignalEngine.ts` → إزالة أو نقل
- `src/hooks/useAutoTradeExecution.ts` → إزالة أو نقل
- `src/services/autoTradingService.ts` → إزالة أو تعديل

---

## 🚫 المكونات المراد تعطيلها/إخفاؤها

### Components التي تستخدم Mock signals:

1. **`src/components/signals/NewEnhancedSignalEnginePanel.tsx`**
   - يستخدم: `useNewEnhancedSignalEngine`
   - يجب: إخفاء من UI أو ربط بـ DEV_MODE

2. **`src/components/signals/AdvancedAnalysisPanel.tsx`**
   - يستخدم: `AdvancedAnalysisEngine`
   - يجب: إخفاء من UI أو ربط بـ DEV_MODE

3. **`src/pages/Signals.tsx`**
   - يستخدم: `NewEnhancedSignalEnginePanel` و `AdvancedAnalysisPanel`
   - يجب: إزالة هذه المكونات من الصفحة

---

## ✅ الخطوات التنفيذية

### Step 1: نقل الملفات إلى dev-mocks/

1. تحقق من أن الملفات الموجودة في `dev-mocks/` هي نفس الملفات في `src/`
2. إذا كانت مختلفة، انسخ النسخة الأحدث
3. احذف الملفات من `src/`

### Step 2: إزالة/تعطيل Hooks

1. احذف أو علّق `useNewEnhancedSignalEngine.ts`
2. احذف أو علّق `useAutoTradeExecution.ts`
3. عدّل `autoTradingService.ts` لإزالة التصدير

### Step 3: تعطيل Components في UI

1. في `Signals.tsx`: أزل `NewEnhancedSignalEnginePanel` و `AdvancedAnalysisPanel`
2. أو أضف شرط `DEV_MODE` لإظهارها فقط في وضع التطوير

### Step 4: التحقق من عدم وجود imports

1. ابحث عن جميع imports لهذه الملفات
2. احذف أو علّق الاستيرادات
3. تحقق من عدم وجود استيرادات غير مباشرة

---

## 🔍 فحص ما بعد التنظيف

### يجب التحقق من:

- [ ] لا يوجد `Math.random()` في مسار الإنتاج (باستثناء UI components للعرض فقط)
- [ ] لا يوجد imports لـ `engineService`, `newEnhancedSignalEngine`, `advancedAnalysisEngine` من `src/`
- [ ] لا توجد components تستخدم Mock signals في UI
- [ ] فقط TradingView Webhook و Internal Strategy Engine يُستخدمان

---

## 📝 ملاحظات

- الملفات الموجودة في `dev-mocks/` يجب أن تبقى للاختبار
- يمكن إعادة استخدام هذه الملفات في المستقبل إذا لزم الأمر
- التركيز على إزالتها من مسار الإنتاج فقط

---

**تاريخ الإنشاء:** 2025-01-17

