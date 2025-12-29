-- Create watchlist table for storing user's selected cryptocurrencies
CREATE TABLE public.price_watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Enable Row Level Security
ALTER TABLE public.price_watchlist ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own watchlist" 
ON public.price_watchlist 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlist items" 
ON public.price_watchlist 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist" 
ON public.price_watchlist 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist items" 
ON public.price_watchlist 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_price_watchlist_user_id ON public.price_watchlist(user_id);

-- Insert default watchlist items for new users (trigger)
CREATE OR REPLACE FUNCTION public.create_default_watchlist()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.price_watchlist (user_id, symbol, display_order)
  VALUES 
    (NEW.id, 'BTC/USDT', 1),
    (NEW.id, 'ETH/USDT', 2),
    (NEW.id, 'BNB/USDT', 3),
    (NEW.id, 'SOL/USDT', 4),
    (NEW.id, 'XRP/USDT', 5);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_created_watchlist
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_watchlist();