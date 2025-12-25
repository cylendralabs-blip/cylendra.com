-- ============================================
-- Add Binance Demo Trading Platform Support
-- ============================================
-- Migration to add binance-demo platform (replaces binance-futures-demo)
-- Created: 2025-02-11
-- Purpose: Support new Binance Demo Trading (demo.binance.com)

-- ===================================
-- PART 1: UPDATE EXISTING DATA
-- ===================================

-- Step 1: Update existing binance-futures-demo to binance-demo
-- (binance-futures-demo is deprecated, binance-demo supports both Spot + Futures)
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.api_keys
  SET platform = 'binance-demo'
  WHERE platform = 'binance-futures-demo';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count > 0 THEN
    RAISE NOTICE 'Updated % rows from binance-futures-demo to binance-demo', updated_count;
  ELSE
    RAISE NOTICE 'No rows found with binance-futures-demo platform';
  END IF;
END $$;

-- ===================================
-- PART 2: UPDATE PLATFORM CONSTRAINTS
-- ===================================

-- Step 2: Drop existing platform constraint
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

-- Step 3: Add updated platform constraint with Demo platforms
ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_platform_check 
  CHECK (platform IN (
    'binance',                    -- Live Spot + Futures
    'binance-futures-testnet',   -- Old Futures Testnet (deprecated, kept for compatibility)
    'binance-spot-testnet',      -- Old Spot Testnet (testnet.binance.vision)
    'binance-demo',              -- New Demo Trading (Spot + Futures)
    'okx',
    'okx-demo',
    'bybit',
    'bybit-testnet',
    'kucoin'
  ));

-- Step 4: Update validation function to include demo platforms
CREATE OR REPLACE FUNCTION public.validate_platform_testnet()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure testnet flag matches platform name
  IF (NEW.platform LIKE '%-testnet' OR NEW.platform LIKE '%-demo') AND NEW.testnet = false THEN
    RAISE EXCEPTION 'Platform % must have testnet=true', NEW.platform;
  END IF;
  
  -- Ensure live platforms have testnet=false
  IF (NEW.platform NOT LIKE '%-testnet' AND NEW.platform NOT LIKE '%-demo') AND NEW.testnet = true THEN
    RAISE EXCEPTION 'Platform % must have testnet=false', NEW.platform;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Update platform statistics view
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

-- ===================================
-- PART 2: DOCUMENTATION
-- ===================================

COMMENT ON COLUMN public.api_keys.platform IS 
  'Exchange platform: binance (Live), binance-demo (Demo Trading - Spot + Futures), binance-spot-testnet (Spot Testnet), binance-futures-testnet (Old Futures Testnet), okx, okx-demo, bybit, bybit-testnet, kucoin';

-- ===================================
-- PART 3: VERIFICATION
-- ===================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Binance Demo Trading Migration Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'New Supported Platforms:';
  RAISE NOTICE '  - binance-demo (Demo Trading - Spot + Futures)';
  RAISE NOTICE '  - binance-spot-testnet (Spot Testnet - testnet.binance.vision)';
  RAISE NOTICE '';
  RAISE NOTICE 'All Supported Platforms:';
  RAISE NOTICE '  - binance (Live)';
  RAISE NOTICE '  - binance-demo (Demo Trading - Spot + Futures)';
  RAISE NOTICE '  - binance-spot-testnet (Spot Testnet)';
  RAISE NOTICE '  - binance-futures-testnet (Old Futures Testnet - deprecated)';
  RAISE NOTICE '  - okx (Live)';
  RAISE NOTICE '  - okx-demo (Demo)';
  RAISE NOTICE '  - bybit (Live)';
  RAISE NOTICE '  - bybit-testnet (Testnet)';
  RAISE NOTICE '  - kucoin';
  RAISE NOTICE '========================================';
END $$;

