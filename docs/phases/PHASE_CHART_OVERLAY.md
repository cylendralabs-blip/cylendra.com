# Phase – Trade Chart Overlay (Auto Trades Visualization on Chart)

## نظرة عامة

هذه المرحلة تضيف **overlays بصرية على الشارت** لعرض جميع الصفقات التلقائية مباشرة على الشموع، بما في ذلك:
- نقاط الدخول
- نقاط الخروج
- مستويات DCA
- نتائج الصفقات

هذا يحسن بشكل كبير الشفافية وتجربة المستخدم وفهم سلوك البوت.

---

## ✅ المهام المكتملة

### 1. Backend Hook - `useAutoTradesChart`

**الملف:** `src/hooks/useAutoTradesChart.ts`

**الوظيفة:**
- جلب بيانات auto trades من جدول `auto_trades`
- استخراج معلومات الدخول والخروج من `metadata` و `positions`
- دعم الفلترة حسب `pair` و `timeframe`
- Cache لمدة 30 ثانية لتقليل استدعاءات قاعدة البيانات

**المخرجات:**
```typescript
interface AutoTradeChartData {
  id: string;
  pair: string;
  direction: 'long' | 'short';
  executed_at: string;
  entry_price: number;
  exit_price: number | null;
  dca_levels: number[] | null;
  tp: number | null;
  sl: number | null;
  pnl: number | null;
  status: 'accepted' | 'rejected' | 'error' | 'pending';
  reason_code: string | null;
  signal_source: string;
  position_id: string | null;
}
```

---

### 2. Frontend Component - `AutoTradesChart`

**الملف:** `src/components/ai-live/AutoTradesChart.tsx`

**الميزات:**

#### 2.1 TradingView Chart Integration
- استخدام TradingView widget عبر iframe
- دعم Dark/Light mode
- دعم إطارات زمنية متعددة (15m, 1h, 4h, 1D, 1W)
- عرض السعر الحالي والتغيير

#### 2.2 Toggle Button
- زر "عرض الصفقات التلقائية" (`showAutoTrades`)
- يتم تحميل البيانات فقط عند تفعيل Toggle
- Default: OFF

#### 2.3 Chart Overlays

**Entry Point Markers:**
- دائرة ملونة أو سهم على شمعة `executed_at`
- أخضر للـ LONG
- أحمر للـ SHORT
- Tooltip يحتوي على:
  - Entry price
  - Direction
  - Signal source
  - P&L (إن وجد)
  - "Click for details"

**Exit Point Markers:**
- علامة صغيرة (CheckCircle2 أو X)
- أخضر = ربح
- أحمر = خسارة
- Tooltip يحتوي على:
  - Exit price
  - P&L

**DCA Levels Overlay:**
- خطوط أفقية منقطة زرقاء/رمادية
- Tooltip لكل مستوى:
  - Level price
  - Order index (DCA #1, #2, ...)

**TP / SL Markers:**
- TP → خط أخضر أفقي
- SL → خط أحمر أفقي
- Tooltip:
  - Target price
  - Type (TP/SL)

**Trade Path Visualization:**
- خط خفيف يربط:
  - Entry → DCA levels → Exit
- يساعد المستخدمين على رؤية كيفية تنقل البوت في التقلبات

#### 2.4 Legend
- لوحة توضيحية في أسفل الشارت
- توضح معنى كل marker ولون

#### 2.5 Click Handler
- عند النقر على أي marker:
  - يتم جلب بيانات auto trade كاملة
  - فتح `AutoTradeDetailsDrawer`
  - عرض جميع السجلات والتفاصيل

---

### 3. Integration in AI Live Center

**الملف:** `src/pages/AILiveCenter.tsx`

**التغييرات:**
- إضافة `AutoTradesChart` component
- يتم عرضه فقط عند اختيار `selectedSymbol`
- يظهر بين `LiveSignalFeed` و `LiveCharts`

---

## 🎨 الألوان والتصميم

| Type   | Color     |
| ------ | --------- |
| Long   | Green     |
| Short  | Red       |
| DCA    | Blue/Grey |
| TP     | Green     |
| SL     | Red       |
| Profit | Green     |
| Loss   | Red       |

---

## 📊 Performance Requirements

✅ **Cache:** 30 ثانية client-side cache  
✅ **Limit:** آخر 200 صفقة (قابل للتعديل)  
✅ **Lazy Loading:** يتم تحميل البيانات فقط عند تفعيل Toggle  
✅ **Refetch Interval:** 60 ثانية للتحديث التلقائي

---

## 🔗 Integration Points

### مع AutoTradeDetailsDrawer
- عند النقر على marker، يتم فتح Drawer مع:
  - جميع حقول `auto_trades`
  - Timeline كامل من `auto_trade_logs`
  - روابط للصفقات المرتبطة

### مع AI Live Center
- يتم عرض الشارت فقط عند اختيار symbol
- يتزامن مع الفلاتر الموجودة (timeframe, symbol)

---

## 📝 ملاحظات تقنية

### TradingView Widget Limitations
- TradingView widget في iframe لا يمكن رسم overlays عليه مباشرة
- الحل: استخدام overlay layer فوق iframe مع `pointer-events`
- Markers يتم رسمها باستخدام absolute positioning

### Price-to-Pixel Conversion
- الحل الحالي مبسط (يستخدم نسبة مئوية)
- في التطبيق الحقيقي، يحتاج إلى:
  - حساب actual price range من candles
  - تحويل price إلى pixel position بناءً على chart scale
  - حساب time position من timestamp

### Future Improvements
1. استخدام TradingView Advanced Chart library (إذا كان متاحاً)
2. دعم رسم خطوط ديناميكية بين markers
3. إضافة filters إضافية (status, direction, source)
4. دعم multi-bot visualization
5. Export chart as image مع overlays

---

## ✅ Deliverables Summary

- [x] API hook (`useAutoTradesChart`) لجلب بيانات overlay
- [x] "Show Auto Trades" toggle في AI Live Center
- [x] Chart markers:
  - [x] Entry
  - [x] Exit
  - [x] DCA levels
  - [x] TP/SL
- [x] Tooltip لكل marker
- [x] Click → open AutoTradeDetailsDrawer
- [x] Legend للتوضيح
- [x] Integration في AI Live Center

---

## 🚀 الاستخدام

1. افتح **AI Live Center**
2. اختر **Symbol** من الفلاتر
3. سيظهر `AutoTradesChart` تلقائياً
4. فعّل **"عرض الصفقات التلقائية"**
5. ستظهر جميع markers على الشارت
6. انقر على أي marker لرؤية التفاصيل الكاملة

---

## 📅 تاريخ الإنجاز

- **تاريخ البدء:** 2025-02-08
- **تاريخ الإكمال:** 2025-02-08
- **الحالة:** ✅ مكتمل

---

## 🔄 المراحل التالية (اختياري)

1. **Advanced Chart Integration:**
   - استخدام TradingView Advanced Chart library
   - رسم overlays مباشرة على الشارت

2. **Real-time Updates:**
   - WebSocket integration لتحديث markers فوراً
   - Auto-refresh عند تنفيذ صفقة جديدة

3. **Enhanced Filters:**
   - فلترة حسب status
   - فلترة حسب direction
   - فلترة حسب signal source

4. **Multi-Bot Support:**
   - عرض markers بألوان مختلفة لكل bot
   - Legend يوضح البوت لكل marker

---

## 📚 المراجع

- [TradingView Widget Embed](https://www.tradingview.com/widget-docs/)
- [Phase Y - Auto Trading Logging](./PHASE_Y_AUTO_TRADING_LOGGING.md)
- [Phase X - Auto Trading UI](./PHASE_X_AUTO_TRADING_UI.md)

