-- ============================================================================
-- Orbitra AI - Seed Strategy Templates
-- ============================================================================
-- Initial strategy templates for the system
-- ============================================================================

-- ============================================================================
-- DCA STRATEGIES
-- ============================================================================

-- DCA Basic
insert into public.strategy_templates (key, name, category, description, icon, risk_level, supports_spot, supports_futures, supports_leverage, schema, default_config)
values (
  'dca_basic',
  'DCA الأساسية',
  'DCA',
  'استراتيجية متوسط سعر التكلفة الكلاسيكية - آمنة ومناسبة للمبتدئين',
  'Target',
  'low',
  true,
  false,
  false,
  '{
    "fields": [
      {"key": "maxInvestment", "type": "number", "label": "الحد الأقصى للاستثمار", "min": 10, "required": true},
      {"key": "numberOfLevels", "type": "number", "label": "عدد المستويات", "min": 1, "max": 10, "required": true},
      {"key": "priceDropPercentages", "type": "array", "label": "نسب انخفاض السعر (%)", "required": true},
      {"key": "investmentPercentages", "type": "array", "label": "نسب الاستثمار (%)", "required": true},
      {"key": "takeProfitPercentage", "type": "number", "label": "جني الأرباح (%)", "min": 0.1, "required": true},
      {"key": "stopLossPercentage", "type": "number", "label": "وقف الخسائر (%)", "min": 0.1, "required": true},
      {"key": "cooldownPeriod", "type": "number", "label": "فترة الانتظار (ساعات)", "min": 0, "required": true},
      {"key": "maxActiveDeals", "type": "number", "label": "الحد الأقصى للصفقات النشطة", "min": 1, "required": true}
    ]
  }'::jsonb,
  '{
    "maxInvestment": 1000,
    "numberOfLevels": 5,
    "priceDropPercentages": [2, 4, 6, 8, 10],
    "investmentPercentages": [20, 20, 20, 20, 20],
    "takeProfitPercentage": 3,
    "stopLossPercentage": 15,
    "cooldownPeriod": 24,
    "maxActiveDeals": 3,
    "riskRewardRatio": 2,
    "enableSmartEntry": false,
    "enableDynamicTP": false,
    "enableTrailingStop": false,
    "minVolumeThreshold": 1000000
  }'::jsonb
) on conflict (key) do nothing;

-- DCA Advanced
insert into public.strategy_templates (key, name, category, description, icon, risk_level, supports_spot, supports_futures, supports_leverage, schema, default_config)
values (
  'dca_advanced',
  'DCA المتقدمة',
  'DCA',
  'استراتيجية DCA مع مميزات متقدمة - دخول ذكي وجني أرباح ديناميكي',
  'TrendingUp',
  'medium',
  true,
  true,
  false,
  '{
    "fields": [
      {"key": "maxInvestment", "type": "number", "label": "الحد الأقصى للاستثمار", "min": 10, "required": true},
      {"key": "numberOfLevels", "type": "number", "label": "عدد المستويات", "min": 1, "max": 15, "required": true},
      {"key": "priceDropPercentages", "type": "array", "label": "نسب انخفاض السعر (%)", "required": true},
      {"key": "investmentPercentages", "type": "array", "label": "نسب الاستثمار (%)", "required": true},
      {"key": "takeProfitPercentage", "type": "number", "label": "جني الأرباح (%)", "min": 0.1, "required": true},
      {"key": "stopLossPercentage", "type": "number", "label": "وقف الخسائر (%)", "min": 0.1, "required": true},
      {"key": "enableSmartEntry", "type": "boolean", "label": "تفعيل الدخول الذكي"},
      {"key": "enableDynamicTP", "type": "boolean", "label": "تفعيل جني الأرباح الديناميكي"},
      {"key": "enableTrailingStop", "type": "boolean", "label": "تفعيل وقف الخسائر المتحرك"}
    ]
  }'::jsonb,
  '{
    "maxInvestment": 1000,
    "numberOfLevels": 7,
    "priceDropPercentages": [1.5, 3, 5, 7, 10, 15, 20],
    "investmentPercentages": [15, 15, 15, 15, 15, 15, 10],
    "takeProfitPercentage": 2.5,
    "stopLossPercentage": 12,
    "cooldownPeriod": 12,
    "maxActiveDeals": 5,
    "riskRewardRatio": 2.5,
    "enableSmartEntry": true,
    "enableDynamicTP": true,
    "enableTrailingStop": false,
    "minVolumeThreshold": 2000000
  }'::jsonb
) on conflict (key) do nothing;

-- DCA Smart (AI-Powered)
insert into public.strategy_templates (key, name, category, description, icon, risk_level, supports_spot, supports_futures, supports_leverage, schema, default_config)
values (
  'dca_smart',
  'DCA الذكية',
  'DCA',
  'استراتيجية DCA مدعومة بالذكاء الاصطناعي - تحليل متقدم ووقف خسائر متحرك',
  'Zap',
  'medium',
  true,
  true,
  false,
  '{
    "fields": [
      {"key": "maxInvestment", "type": "number", "label": "الحد الأقصى للاستثمار", "min": 10, "required": true},
      {"key": "numberOfLevels", "type": "number", "label": "عدد المستويات", "min": 1, "max": 20, "required": true},
      {"key": "priceDropPercentages", "type": "array", "label": "نسب انخفاض السعر (%)", "required": true},
      {"key": "investmentPercentages", "type": "array", "label": "نسب الاستثمار (%)", "required": true},
      {"key": "takeProfitPercentage", "type": "number", "label": "جني الأرباح (%)", "min": 0.1, "required": true},
      {"key": "stopLossPercentage", "type": "number", "label": "وقف الخسائر (%)", "min": 0.1, "required": true},
      {"key": "enableSmartEntry", "type": "boolean", "label": "تفعيل الدخول الذكي بالـ AI"},
      {"key": "enableDynamicTP", "type": "boolean", "label": "تفعيل جني الأرباح الديناميكي"},
      {"key": "enableTrailingStop", "type": "boolean", "label": "تفعيل وقف الخسائر المتحرك"}
    ]
  }'::jsonb,
  '{
    "maxInvestment": 1000,
    "numberOfLevels": 10,
    "priceDropPercentages": [1, 2, 3, 5, 7, 10, 15, 20, 25, 30],
    "investmentPercentages": [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
    "takeProfitPercentage": 2,
    "stopLossPercentage": 10,
    "cooldownPeriod": 6,
    "maxActiveDeals": 5,
    "riskRewardRatio": 3,
    "enableSmartEntry": true,
    "enableDynamicTP": true,
    "enableTrailingStop": true,
    "minVolumeThreshold": 5000000
  }'::jsonb
) on conflict (key) do nothing;

-- ============================================================================
-- GRID STRATEGIES
-- ============================================================================

-- Grid Classic
insert into public.strategy_templates (key, name, category, description, icon, risk_level, supports_spot, supports_futures, supports_leverage, schema, default_config)
values (
  'grid_classic',
  'Grid Trading الكلاسيكي',
  'GRID',
  'استراتيجية الشبكة التقليدية - مثالية للأسواق الجانبية',
  'Grid3x3',
  'medium',
  true,
  false,
  false,
  '{
    "fields": [
      {"key": "upperPrice", "type": "number", "label": "السعر الأعلى", "min": 0, "required": true},
      {"key": "lowerPrice", "type": "number", "label": "السعر الأدنى", "min": 0, "required": true},
      {"key": "gridNumber", "type": "number", "label": "عدد الشبكات", "min": 2, "max": 100, "required": true},
      {"key": "investmentPerGrid", "type": "number", "label": "الاستثمار لكل شبكة", "min": 1, "required": true},
      {"key": "profitPerGrid", "type": "number", "label": "الربح لكل شبكة (%)", "min": 0.1, "required": true},
      {"key": "stopLossPercentage", "type": "number", "label": "وقف الخسائر (%)", "min": 0},
      {"key": "enableInfiniteGrid", "type": "boolean", "label": "تفعيل الشبكة اللانهائية"},
      {"key": "dynamicGridAdjustment", "type": "boolean", "label": "تعديل الشبكة الديناميكي"}
    ]
  }'::jsonb,
  '{
    "upperPrice": 0,
    "lowerPrice": 0,
    "gridNumber": 20,
    "investmentPerGrid": 50,
    "profitPerGrid": 1,
    "enableInfiniteGrid": false,
    "enableFuturesMode": false,
    "leverage": 1,
    "hedgingEnabled": false,
    "rebalanceThreshold": 5,
    "stopLossPercentage": 10,
    "dynamicGridAdjustment": false,
    "volatilityBasedSpacing": false
  }'::jsonb
) on conflict (key) do nothing;

-- Grid Infinity
insert into public.strategy_templates (key, name, category, description, icon, risk_level, supports_spot, supports_futures, supports_leverage, schema, default_config)
values (
  'grid_infinity',
  'Grid Trading اللانهائي',
  'GRID',
  'شبكة لانهائية تتكيف مع حركة السوق - للمتداولين المتقدمين',
  'Infinity',
  'high',
  true,
  true,
  false,
  '{
    "fields": [
      {"key": "gridNumber", "type": "number", "label": "عدد الشبكات", "min": 10, "max": 200, "required": true},
      {"key": "investmentPerGrid", "type": "number", "label": "الاستثمار لكل شبكة", "min": 1, "required": true},
      {"key": "profitPerGrid", "type": "number", "label": "الربح لكل شبكة (%)", "min": 0.1, "required": true},
      {"key": "volatilityBasedSpacing", "type": "boolean", "label": "مسافات بناءً على التقلبات"},
      {"key": "dynamicGridAdjustment", "type": "boolean", "label": "تعديل الشبكة الديناميكي"}
    ]
  }'::jsonb,
  '{
    "upperPrice": 0,
    "lowerPrice": 0,
    "gridNumber": 50,
    "investmentPerGrid": 20,
    "profitPerGrid": 0.5,
    "enableInfiniteGrid": true,
    "enableFuturesMode": false,
    "leverage": 1,
    "hedgingEnabled": false,
    "rebalanceThreshold": 3,
    "stopLossPercentage": 15,
    "dynamicGridAdjustment": true,
    "volatilityBasedSpacing": true
  }'::jsonb
) on conflict (key) do nothing;

-- ============================================================================
-- MOMENTUM STRATEGIES
-- ============================================================================

-- Momentum Breakout
insert into public.strategy_templates (key, name, category, description, icon, risk_level, supports_spot, supports_futures, supports_leverage, schema, default_config)
values (
  'momentum_breakout',
  'Momentum Breakout',
  'MOMENTUM',
  'استراتيجية كسر المقاومات - للأسواق الترندية القوية',
  'TrendingUp',
  'high',
  true,
  true,
  true,
  '{
    "fields": [
      {"key": "rsiPeriod", "type": "number", "label": "فترة RSI", "min": 5, "max": 50, "required": true},
      {"key": "rsiOverbought", "type": "number", "label": "RSI تشبع شرائي", "min": 50, "max": 100, "required": true},
      {"key": "rsiOversold", "type": "number", "label": "RSI تشبع بيعي", "min": 0, "max": 50, "required": true},
      {"key": "volumeThreshold", "type": "number", "label": "حد الحجم", "min": 0, "required": true},
      {"key": "breakoutThreshold", "type": "number", "label": "حد الكسر (%)", "min": 0.1, "required": true},
      {"key": "trailingStopPercentage", "type": "number", "label": "وقف الخسائر المتحرك (%)", "min": 0.1, "required": true}
    ]
  }'::jsonb,
  '{
    "rsiPeriod": 14,
    "rsiOverbought": 70,
    "rsiOversold": 30,
    "macdFastPeriod": 12,
    "macdSlowPeriod": 26,
    "macdSignalPeriod": 9,
    "volumeThreshold": 1.5,
    "breakoutThreshold": 2,
    "entryConfirmations": 2,
    "dynamicStopLoss": true,
    "trailingStopPercentage": 3,
    "partialTakeProfitLevels": [3, 5, 8],
    "timeframeConfirmation": ["15m", "1h"]
  }'::jsonb
) on conflict (key) do nothing;

