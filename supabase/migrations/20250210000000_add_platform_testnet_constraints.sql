-- Migration: Add constraints to ensure platform and testnet consistency
-- Phase EX-2: OKX & Bybit Integration Completion

-- Add check constraint to ensure okx-demo and bybit-testnet always have testnet = true
ALTER TABLE api_keys
ADD CONSTRAINT check_platform_testnet_consistency
CHECK (
  -- If platform is okx-demo, testnet must be true
  (platform != 'okx-demo' OR testnet = true) AND
  -- If platform is bybit-testnet, testnet must be true
  (platform != 'bybit-testnet' OR testnet = true) AND
  -- If platform is binance-futures-testnet, testnet must be true
  (platform != 'binance-futures-testnet' OR testnet = true)
);

-- Add comment to document the constraint
COMMENT ON CONSTRAINT check_platform_testnet_consistency ON api_keys IS 
  'Ensures that demo/testnet platforms (okx-demo, bybit-testnet, binance-futures-testnet) always have testnet = true';

-- Create index on platform and testnet for faster queries
CREATE INDEX IF NOT EXISTS idx_api_keys_platform_testnet 
ON api_keys(platform, testnet);

-- Add comment to the index
COMMENT ON INDEX idx_api_keys_platform_testnet IS 
  'Index for faster queries filtering by platform and testnet status';

