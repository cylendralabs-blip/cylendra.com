-- Check Latest OKX Demo Error
-- Run this to see the exact error message

SELECT 
  at.id,
  at.platform,
  at.status,
  at.created_at,
  atl.step,
  atl.message,
  atl.data
FROM auto_trades at
LEFT JOIN auto_trade_logs atl ON atl.auto_trade_id = at.id
WHERE at.platform = 'okx-demo'
ORDER BY at.created_at DESC, atl.created_at DESC
LIMIT 10;
