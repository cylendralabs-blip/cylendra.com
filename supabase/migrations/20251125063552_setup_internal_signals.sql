-- ============================================
-- إعداد نظام الإشارات الداخلية
-- Internal Signals System Setup
-- ============================================
-- 
-- هذا السكربت يقوم بـ:
-- 1. تفعيل البوت للمستخدمين الموجودين
-- 2. إضافة رموز افتراضية إلى Watchlist
-- 3. التحقق من الجداول المطلوبة
-- ============================================

-- ============================================
-- الخطوة 1: تفعيل البوت لجميع المستخدمين الموجودين
-- ============================================
-- هذا سينشئ أو يحدث bot_settings لجميع المستخدمين

DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- إنشاء أو تحديث bot_settings لجميع المستخدمين
  FOR user_record IN 
    SELECT id FROM auth.users
  LOOP
    -- التحقق من وجود إعدادات البوت
    IF NOT EXISTS (
      SELECT 1 FROM bot_settings WHERE user_id = user_record.id
    ) THEN
      -- إنشاء إعدادات افتراضية للبوت
      INSERT INTO bot_settings (
        user_id,
        is_active,
        bot_name,
        default_platform,
        market_type,
        strategy_type,
        total_capital,
        risk_percentage,
        initial_order_percentage,
        max_active_trades,
        dca_levels,
        take_profit_percentage,
        stop_loss_percentage,
        risk_reward_ratio,
        leverage,
        leverage_strategy,
        auto_leverage,
        max_leverage_increase,
        order_type,
        default_trade_direction,
        allow_long_trades,
        allow_short_trades,
        profit_taking_strategy,
        created_at,
        updated_at
      ) VALUES (
        user_record.id,
        true,                    -- ✅ تفعيل البوت
        'Smart Trading Bot',
        'binance',
        'futures',
        'basic_dca',
        1000.0,                  -- رأس مال افتراضي
        2.0,                     -- نسبة المخاطرة 2%
        25.0,                    -- 25% من رأس المال للصفقة الأولى
        5,                        -- أقصى 5 صفقات نشطة
        5,                        -- 5 مستويات DCA
        3.0,                     -- Take Profit 3%
        2.0,                     -- Stop Loss 2%
        2.0,                     -- Risk/Reward Ratio 2:1
        5,                        -- رافعة مالية 5x
        'none',
        false,
        1,
        'market',
        'long',
        true,
        false,
        'partial',
        now(),
        now()
      );
      
      RAISE NOTICE '✅ تم إنشاء إعدادات البوت للمستخدم: %', user_record.id;
    ELSE
      -- تحديث إعدادات البوت الموجودة لتفعيلها
      UPDATE bot_settings
      SET 
        is_active = true,         -- ✅ تفعيل البوت
        updated_at = now()
      WHERE user_id = user_record.id;
      
      RAISE NOTICE '✅ تم تفعيل البوت للمستخدم: %', user_record.id;
    END IF;
  END LOOP;
  
  RAISE NOTICE '🎉 تم تفعيل البوت لجميع المستخدمين!';
END $$;

-- ============================================
-- الخطوة 2: إضافة رموز افتراضية إلى Watchlist
-- ============================================
-- هذا سيضيف رموز شائعة إلى watchlist لكل مستخدم

DO $$
DECLARE
  user_record RECORD;
  default_symbols TEXT[] := ARRAY['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'MATIC/USDT'];
  symbol_text TEXT;
  display_order INTEGER := 1;
BEGIN
  FOR user_record IN 
    SELECT id FROM auth.users
  LOOP
    display_order := 1;
    
    FOREACH symbol_text IN ARRAY default_symbols
    LOOP
      -- التحقق من عدم وجود الرمز في watchlist
      IF NOT EXISTS (
        SELECT 1 FROM price_watchlist 
        WHERE user_id = user_record.id AND symbol = symbol_text
      ) THEN
        INSERT INTO price_watchlist (
          user_id,
          symbol,
          display_order,
          created_at
        ) VALUES (
          user_record.id,
          symbol_text,
          display_order,
          now()
        );
        
        display_order := display_order + 1;
      END IF;
    END LOOP;
    
    RAISE NOTICE '✅ تم إضافة الرموز إلى Watchlist للمستخدم: %', user_record.id;
  END LOOP;
  
  RAISE NOTICE '🎉 تم إضافة الرموز الافتراضية لجميع المستخدمين!';
END $$;

-- ============================================
-- الخطوة 3: التحقق من الجداول المطلوبة
-- ============================================

DO $$
BEGIN
  -- التحقق من وجود جدول tradingview_signals
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tradingview_signals'
  ) THEN
    RAISE NOTICE '⚠️ تحذير: جدول tradingview_signals غير موجود. يرجى تشغيل migration 20250626122717';
  ELSE
    RAISE NOTICE '✅ جدول tradingview_signals موجود';
  END IF;
  
  -- التحقق من وجود جدول bot_settings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'bot_settings'
  ) THEN
    RAISE NOTICE '⚠️ تحذير: جدول bot_settings غير موجود';
  ELSE
    RAISE NOTICE '✅ جدول bot_settings موجود';
  END IF;
  
  -- التحقق من وجود جدول price_watchlist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'price_watchlist'
  ) THEN
    RAISE NOTICE '⚠️ تحذير: جدول price_watchlist غير موجود';
  ELSE
    RAISE NOTICE '✅ جدول price_watchlist موجود';
  END IF;
END $$;

