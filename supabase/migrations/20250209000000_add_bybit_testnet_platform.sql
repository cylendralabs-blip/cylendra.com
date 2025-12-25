-- ============================================
-- Add Platform Support to API Keys and Auto Trades
-- ============================================
-- Migration to add platform column and related constraints
-- Created: 2025-12-09
-- Purpose: Enable multi-exchange support (Bybit, OKX, etc.)

-- ===================================
-- PART 1: API KEYS TABLE
-- ===================================

-- Step 1: Add platform column to api_keys if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'api_keys' 
    AND column_name = 'platform'
  ) THEN
    ALTER TABLE public.api_keys 
    ADD COLUMN platform TEXT NOT NULL DEFAULT 'binance';
    
    RAISE NOTICE 'Added platform column to api_keys table';
  ELSE
    RAISE NOTICE 'Platform column already exists in api_keys';
  END IF;
END $$;

-- Step 2: Drop existing platform constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'api_keys_platform_check'
  ) THEN
    ALTER TABLE public.api_keys DROP CONSTRAINT api_keys_platform_check;
    RAISE NOTICE 'Dropped existing platform constraint';
  END IF;
END $$;

-- Step 3: Add comprehensive platform validation constraint
ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_platform_check 
  CHECK (platform IN (
    'binance',
    'binance-futures-testnet',
    'okx',
    'okx-demo',
    'bybit',
    'bybit-testnet',
    'kucoin'
  ));

-- Step 4: Create performance indexes on api_keys
CREATE INDEX IF NOT EXISTS idx_api_keys_platform_active 
  ON public.api_keys(platform, is_active, testnet)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_api_keys_user_platform 
  ON public.api_keys(user_id, platform, is_active);

CREATE INDEX IF NOT EXISTS idx_api_keys_testnet 
  ON public.api_keys(testnet, is_active)
  WHERE testnet = true;

-- ===================================
-- PART 2: AUTO_TRADES TABLE
-- ===================================

-- Step 5: Add platform column to auto_trades if table exists
DO $$
BEGIN
  -- Check if auto_trades table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'auto_trades'
  ) THEN
    -- Check if platform column exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'auto_trades' 
      AND column_name = 'platform'
    ) THEN
      -- Add platform column
      ALTER TABLE public.auto_trades 
      ADD COLUMN platform TEXT NOT NULL DEFAULT 'binance';
      
      RAISE NOTICE 'Added platform column to auto_trades table';
    ELSE
      RAISE NOTICE 'Platform column already exists in auto_trades';
    END IF;
    
    -- Create indexes on auto_trades
    CREATE INDEX IF NOT EXISTS idx_auto_trades_platform 
      ON public.auto_trades(platform, status);

    CREATE INDEX IF NOT EXISTS idx_auto_trades_user_platform 
      ON public.auto_trades(user_id, platform, created_at DESC);
      
    RAISE NOTICE 'Created indexes on auto_trades table';
  ELSE
    RAISE NOTICE 'auto_trades table does not exist, skipping';
  END IF;
END $$;

-- ===================================
-- PART 3: DOCUMENTATION & VALIDATION
-- ===================================

-- Step 6: Add documentation comments
COMMENT ON COLUMN public.api_keys.platform IS 
  'Exchange platform: binance, binance-futures-testnet, okx, okx-demo, bybit, bybit-testnet, kucoin';

COMMENT ON COLUMN public.api_keys.testnet IS 
  'Paper trading flag: true for testnet/demo, false for live trading';

-- Step 7: Add validation function
CREATE OR REPLACE FUNCTION public.validate_platform_testnet()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure testnet flag matches platform name
  IF (NEW.platform LIKE '%-testnet' OR NEW.platform LIKE '%-demo') AND NEW.testnet = false THEN
    RAISE EXCEPTION 'Platform % must have testnet=true', NEW.platform;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create validation trigger
DROP TRIGGER IF EXISTS trigger_validate_platform_testnet ON public.api_keys;
CREATE TRIGGER trigger_validate_platform_testnet
  BEFORE INSERT OR UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_platform_testnet();

-- Step 9: Create platform statistics view
CREATE OR REPLACE VIEW public.platform_statistics AS
SELECT 
  platform,
  testnet,
  COUNT(*) as total_keys,
  COUNT(*) FILTER (WHERE is_active = true) as active_keys,
  COUNT(DISTINCT user_id) as unique_users
FROM public.api_keys
GROUP BY platform, testnet
ORDER BY platform, testnet;

GRANT SELECT ON public.platform_statistics TO authenticated;

-- ===================================
-- PART 4: VERIFICATION
-- ===================================

DO $$
DECLARE
  api_keys_has_platform BOOLEAN;
  auto_trades_has_platform BOOLEAN;
BEGIN
  -- Check api_keys platform column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'api_keys' 
    AND column_name = 'platform'
  ) INTO api_keys_has_platform;
  
  -- Check auto_trades platform column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'auto_trades' 
    AND column_name = 'platform'
  ) INTO auto_trades_has_platform;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Platform Support Migration Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'api_keys.platform: %', CASE WHEN api_keys_has_platform THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE 'auto_trades.platform: %', CASE WHEN auto_trades_has_platform THEN 'EXISTS' ELSE 'N/A' END;
  RAISE NOTICE '';
  RAISE NOTICE 'Supported Platforms:';
  RAISE NOTICE '  - binance (Live)';
  RAISE NOTICE '  - binance-futures-testnet (Testnet)';
  RAISE NOTICE '  - okx (Live)';
  RAISE NOTICE '  - okx-demo (Demo)';
  RAISE NOTICE '  - bybit (Live)';
  RAISE NOTICE '  - bybit-testnet (Testnet)';
  RAISE NOTICE '  - kucoin (Future)';
  RAISE NOTICE '========================================';
END $$;
