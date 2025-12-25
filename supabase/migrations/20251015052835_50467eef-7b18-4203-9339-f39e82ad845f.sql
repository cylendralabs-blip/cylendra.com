-- Fix search_path for existing functions
CREATE OR REPLACE FUNCTION public.calculate_trading_performance(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  total_trades_count INTEGER;
  winning_trades_count INTEGER;
  losing_trades_count INTEGER;
  total_profit_amount NUMERIC;
  total_loss_amount NUMERIC;
  win_rate_calc NUMERIC;
  profit_factor_calc NUMERIC;
  avg_win_calc NUMERIC;
  avg_loss_calc NUMERIC;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN realized_pnl > 0 THEN 1 END),
    COUNT(CASE WHEN realized_pnl < 0 THEN 1 END),
    COALESCE(SUM(CASE WHEN realized_pnl > 0 THEN realized_pnl END), 0),
    COALESCE(ABS(SUM(CASE WHEN realized_pnl < 0 THEN realized_pnl END)), 0)
  INTO 
    total_trades_count,
    winning_trades_count,
    losing_trades_count,
    total_profit_amount,
    total_loss_amount
  FROM public.trades 
  WHERE user_id = user_uuid AND status = 'CLOSED';

  win_rate_calc := CASE WHEN total_trades_count > 0 THEN (winning_trades_count::NUMERIC / total_trades_count::NUMERIC) * 100 ELSE 0 END;
  profit_factor_calc := CASE WHEN total_loss_amount > 0 THEN total_profit_amount / total_loss_amount ELSE 0 END;
  avg_win_calc := CASE WHEN winning_trades_count > 0 THEN total_profit_amount / winning_trades_count ELSE 0 END;
  avg_loss_calc := CASE WHEN losing_trades_count > 0 THEN total_loss_amount / losing_trades_count ELSE 0 END;

  INSERT INTO public.trading_performance (
    user_id,
    date,
    total_trades,
    winning_trades,
    losing_trades,
    total_profit,
    total_loss,
    net_profit,
    win_rate,
    profit_factor,
    roi_percentage,
    average_win,
    average_loss
  ) VALUES (
    user_uuid,
    CURRENT_DATE,
    total_trades_count,
    winning_trades_count,
    losing_trades_count,
    total_profit_amount,
    total_loss_amount,
    total_profit_amount - total_loss_amount,
    win_rate_calc,
    profit_factor_calc,
    CASE WHEN total_trades_count > 0 THEN ((total_profit_amount - total_loss_amount) / 10000) * 100 ELSE 0 END,
    avg_win_calc,
    avg_loss_calc
  )
  ON CONFLICT (user_id, date) 
  DO UPDATE SET
    total_trades = EXCLUDED.total_trades,
    winning_trades = EXCLUDED.winning_trades,
    losing_trades = EXCLUDED.losing_trades,
    total_profit = EXCLUDED.total_profit,
    total_loss = EXCLUDED.total_loss,
    net_profit = EXCLUDED.net_profit,
    win_rate = EXCLUDED.win_rate,
    profit_factor = EXCLUDED.profit_factor,
    roi_percentage = EXCLUDED.roi_percentage,
    average_win = EXCLUDED.average_win,
    average_loss = EXCLUDED.average_loss,
    updated_at = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.bot_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;