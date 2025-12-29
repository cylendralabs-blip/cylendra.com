-- Order Lifecycle Tracking
-- Migration for Phase 2: Task 5 - Order Storage & Lifecycle

-- Table for detailed order tracking
CREATE TABLE IF NOT EXISTS public.trade_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Order identification
  order_type TEXT NOT NULL, -- 'ENTRY', 'DCA', 'STOP_LOSS', 'TAKE_PROFIT'
  order_level INTEGER, -- DCA level or -1 for SL, -2 for TP
  
  -- Exchange information
  platform TEXT NOT NULL,
  platform_order_id TEXT,
  client_order_id TEXT, -- For idempotency
  exchange_order_id TEXT, -- Exchange-specific order ID
  
  -- Order details
  symbol TEXT NOT NULL,
  side TEXT NOT NULL, -- 'BUY' or 'SELL'
  order_side TEXT NOT NULL, -- 'buy' or 'sell' (lowercase for consistency)
  order_status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED', 'FAILED', 'EXPIRED'
  
  -- Pricing
  requested_price NUMERIC,
  requested_quantity NUMERIC NOT NULL,
  filled_price NUMERIC,
  filled_quantity NUMERIC DEFAULT 0,
  average_fill_price NUMERIC,
  
  -- Fees
  fees NUMERIC DEFAULT 0,
  fee_asset TEXT,
  
  -- Order type
  order_type_exchange TEXT, -- 'MARKET', 'LIMIT', 'STOP_MARKET', 'TAKE_PROFIT_MARKET', etc.
  time_in_force TEXT, -- 'GTC', 'IOC', 'FOK'
  
  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  filled_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional data
  exchange_response JSONB, -- Full response from exchange
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Constraints
  UNIQUE(platform, platform_order_id, client_order_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trade_orders_trade_id ON public.trade_orders(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_orders_user_id ON public.trade_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_orders_platform_order_id ON public.trade_orders(platform, platform_order_id);
CREATE INDEX IF NOT EXISTS idx_trade_orders_client_order_id ON public.trade_orders(client_order_id);
CREATE INDEX IF NOT EXISTS idx_trade_orders_status ON public.trade_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_trade_orders_created_at ON public.trade_orders(created_at DESC);

-- Table for order lifecycle events
CREATE TABLE IF NOT EXISTS public.order_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_order_id UUID REFERENCES public.trade_orders(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Event details
  event_type TEXT NOT NULL, -- 'CREATED', 'SUBMITTED', 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED', 'FAILED', 'EXPIRED', 'UPDATED'
  event_status TEXT NOT NULL, -- 'SUCCESS', 'FAILURE', 'PENDING'
  
  -- Event data
  previous_status TEXT,
  new_status TEXT,
  event_data JSONB, -- Additional event-specific data
  
  -- Pricing snapshot
  price_at_event NUMERIC,
  quantity_at_event NUMERIC,
  filled_quantity_at_event NUMERIC,
  
  -- Message
  message TEXT,
  error_message TEXT,
  
  -- Source
  source TEXT DEFAULT 'SYSTEM', -- 'SYSTEM', 'EXCHANGE', 'USER', 'RETRY', 'MONITOR'
  
  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for order events
CREATE INDEX IF NOT EXISTS idx_order_events_trade_order_id ON public.order_events(trade_order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_trade_id ON public.order_events(trade_id);
CREATE INDEX IF NOT EXISTS idx_order_events_user_id ON public.order_events(user_id);
CREATE INDEX IF NOT EXISTS idx_order_events_event_type ON public.order_events(event_type);
CREATE INDEX IF NOT EXISTS idx_order_events_created_at ON public.order_events(created_at DESC);

-- Add client_order_id to trades table if not exists
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS client_order_id TEXT;

-- Add index for client_order_id
CREATE INDEX IF NOT EXISTS idx_trades_client_order_id ON public.trades(client_order_id);

-- Enable RLS
ALTER TABLE public.trade_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trade_orders
CREATE POLICY "Users can view their own trade orders"
  ON public.trade_orders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trade orders"
  ON public.trade_orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trade orders"
  ON public.trade_orders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trade orders"
  ON public.trade_orders
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for order_events
CREATE POLICY "Users can view their own order events"
  ON public.order_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own order events"
  ON public.order_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trade_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_trade_orders_updated_at_trigger
  BEFORE UPDATE ON public.trade_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_trade_orders_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.trade_orders IS 'Detailed tracking of all orders placed for trades';
COMMENT ON TABLE public.order_events IS 'Event log for order lifecycle changes';
COMMENT ON COLUMN public.trade_orders.order_type IS 'Type: ENTRY, DCA, STOP_LOSS, TAKE_PROFIT';
COMMENT ON COLUMN public.trade_orders.order_status IS 'Status: PENDING, FILLED, PARTIALLY_FILLED, CANCELLED, FAILED, EXPIRED';
COMMENT ON COLUMN public.order_events.event_type IS 'Event: CREATED, SUBMITTED, FILLED, PARTIALLY_FILLED, CANCELLED, FAILED, EXPIRED, UPDATED';


