# Phase X.3 - Real-Time Engine + Telegram + TTL

## نظرة عامة

نظام بث الإشارات اللحظية الذي يجعل Ultra Signals تصل إلى المستخدمين في الوقت الفعلي عبر:
- **Real-time Channel** (Supabase Realtime)
- **Telegram Broadcasting**
- **TTL Management** (إدارة العمر الزمني)
- **History Storage** (تخزين الإشارات طويلة المدى)

## المكونات

### 1. Realtime Dispatcher (`realtime.ts`)
- بث الإشارات عبر قناة `ultra_signals_live`
- الاشتراك في الإشارات الجديدة
- استخدام Supabase Realtime

### 2. Telegram Broadcaster (`telegram.ts`)
- إرسال الإشارات إلى Telegram Channel/Group
- تنسيق رسائل احترافية مع Markdown
- دعم Emojis و formatting

### 3. TTL Engine (`ttl.ts`)
- إدارة العمر الزمني للإشارات
- Buffer في الذاكرة للإشارات السريعة (1m-15m)
- حذف تلقائي بعد انتهاء TTL

### 4. History Storage (`history.ts`)
- حفظ الإشارات طويلة المدى (30m+) في قاعدة البيانات
- استرجاع الإشارات السابقة
- إحصائيات وتحليلات

## الاستخدام

### معالجة إشارة جديدة

```typescript
import { handleUltraSignal } from '@/ai-signals';

const signal: UltraSignal = {
  id: 'signal-123',
  symbol: 'BTCUSDT',
  timeframe: '5m',
  side: 'BUY',
  finalConfidence: 85,
  // ... rest of signal
};

const results = await handleUltraSignal(signal);
// results = { realtime: true, telegram: true, buffer: true, history: false }
```

### الاشتراك في الإشارات الحية

```typescript
import { subscribeToLiveSignals } from '@/ai-signals';

const unsubscribe = subscribeToLiveSignals((signal) => {
  console.log('New signal:', signal);
  // Update UI, show notification, etc.
});

// Later, when component unmounts:
unsubscribe();
```

### الحصول على الإشارات الحية من Buffer

```typescript
import { getLiveSignals, getLiveSignalsFiltered } from '@/ai-signals';

// Get all live signals
const allSignals = getLiveSignals();

// Get filtered signals
const btcSignals = getLiveSignalsFiltered({
  symbol: 'BTCUSDT',
  side: 'BUY',
  minConfidence: 70
});
```

### الحصول على الإشارات من التاريخ

```typescript
import { getSignalsFromHistory, getHistoryStats } from '@/ai-signals';

// Get historical signals
const history = await getSignalsFromHistory({
  symbol: 'BTCUSDT',
  timeframe: '1h',
  limit: 50
});

// Get statistics
const stats = await getHistoryStats({
  symbol: 'BTCUSDT',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

## إعدادات Telegram

أضف إلى `.env`:

```env
VITE_TELEGRAM_BOT_TOKEN=your_bot_token
VITE_TELEGRAM_CHAT_ID=your_chat_id
VITE_TELEGRAM_ENABLED=true
```

## TTL حسب Timeframe

- `1m`: 10 دقائق
- `3m`: 15 دقيقة
- `5m`: 20 دقيقة
- `15m`: 45 دقيقة
- `30m+`: 2+ ساعات (يُحفظ في DB)

## قاعدة البيانات

يحتاج جدول `ai_signals_history` (سيتم إنشاؤه في migration لاحق):

```sql
CREATE TABLE ai_signals_history (
  id UUID PRIMARY KEY,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  side TEXT NOT NULL,
  final_confidence NUMERIC NOT NULL,
  risk_level TEXT NOT NULL,
  entry_price NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  rr_ratio NUMERIC,
  ai_score NUMERIC,
  technical_score NUMERIC,
  volume_score NUMERIC,
  pattern_score NUMERIC,
  wave_score NUMERIC,
  sentiment_score NUMERIC,
  sources_used JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  result TEXT,
  profit_loss_percentage NUMERIC,
  closed_at TIMESTAMP WITH TIME ZONE
);
```

## الخطوة التالية

Phase X.4: UI - Live Ultra Signals + History Dashboard

