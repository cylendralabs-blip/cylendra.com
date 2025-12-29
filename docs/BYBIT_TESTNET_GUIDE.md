# Bybit Testnet Integration Guide

## Overview

This guide explains how to set up and use Bybit Testnet for paper trading with Orbitra AI's auto-trading system.

## What is Bybit Testnet?

Bybit Testnet is a **demo trading environment** that mirrors the real Bybit exchange but uses **fake money**. This allows you to:
- Test your trading strategies without risk
- Validate the auto-trading pipeline
- Learn how the system works before using real funds

## Step 1: Create Bybit Testnet Account

1. Visit [Bybit Testnet](https://testnet.bybit.com/)
2. Click **"Sign Up"** or **"Register"**
3. Complete registration with email/phone
4. Verify your account
5. Log in to Bybit Testnet

> **Note**: Bybit Testnet is separate from the main Bybit platform. You need a different account.

## Step 2: Get Testnet Funds

1. After logging in, go to **Assets** → **Spot Account**
2. Click **"Get Testnet Funds"** or similar button
3. Bybit will credit your account with fake USDT (usually 10,000 USDT)
4. You can request more funds if needed

## Step 3: Create API Keys

1. Go to **Account** → **API Management**
2. Click **"Create New Key"**
3. Configure the API key:
   - **API Key Name**: `Orbitra AI Trading Bot`
   - **Permissions**: Enable **"Spot Trading"** (Read + Write)
   - **IP Restriction**: Leave empty or add your IP for extra security
4. Click **"Submit"**
5. **IMPORTANT**: Copy and save:
   - API Key
   - Secret Key
   
   ⚠️ You won't be able to see the Secret Key again!

## Step 4: Add API Key to Orbitra AI

1. Log in to Orbitra AI
2. Go to **Settings** → **API Settings** (إعدادات API)
3. Click **"إضافة منصة جديدة"** (Add New Platform) tab
4. Fill in the form:
   - **Platform**: Select **"Bybit Testnet"**
   - **API Key**: Paste your Bybit API Key
   - **Secret Key**: Paste your Bybit Secret Key
5. Click **"إضافة مفتاح API"** (Add API Key)

The system will save your credentials (no connection test in this version).

## Step 5: Test Auto-Trading

### Option A: Using Internal Signals

1. Make sure you have a signal source configured
2. Wait for a signal to be generated
3. The auto-trader will automatically execute on Bybit Testnet

### Option B: Manual Test Signal

If you have database access, you can create a test signal:

```sql
INSERT INTO public.trading_signals (
  user_id,
  symbol,
  signal_type,
  entry_price,
  stop_loss,
  take_profit,
  confidence,
  source,
  status
) VALUES (
  'YOUR_USER_ID',  -- Replace with your user ID
  'BTCUSDT',
  'BUY',
  50000,
  48000,
  52000,
  0.85,
  'internal',
  'PENDING'
);
```

The auto-trader worker runs every minute and will pick up this signal.

## Step 6: Verify Execution

### In Orbitra AI:

1. Go to **Auto-Trade History** page
2. Look for your trade
3. Check the status:
   - `PENDING` → Signal received, waiting for execution
   - `ACCEPTED` → Trade accepted by system
   - `EXECUTED` → Order placed on Bybit
   - `FAILED` → Something went wrong (check logs)

### In Bybit Testnet:

1. Log in to [Bybit Testnet](https://testnet.bybit.com/)
2. Go to **Orders** → **Spot Orders**
3. Check **Order History**
4. You should see your market order with:
   - Symbol: BTCUSDT
   - Side: Buy
   - Type: Market
   - Status: Filled

## Troubleshooting

### Issue: "API key not found"

**Solution**: Make sure you selected **Bybit Testnet** platform when adding the key, not regular Bybit.

### Issue: "Insufficient balance"

**Solution**: 
1. Log in to Bybit Testnet
2. Request more testnet funds
3. Make sure you have USDT in your Spot account

### Issue: "Invalid symbol"

**Solution**: 
- Bybit Testnet may not support all trading pairs
- Try common pairs like BTCUSDT, ETHUSDT
- Check [Bybit Testnet Markets](https://testnet.bybit.com/trade/spot/BTC/USDT)

### Issue: "Order not appearing in Bybit"

**Solution**:
1. Check `auto_trade_logs` table for error details
2. Verify API key permissions include "Spot Trading"
3. Make sure API key is active
4. Check if you're looking at the correct market (Spot, not Futures)

### Issue: "API signature error"

**Solution**:
- Double-check that you copied the Secret Key correctly
- Make sure there are no extra spaces
- Try creating a new API key

## Checking Logs

To see detailed execution logs, query the database:

```sql
SELECT 
  at.id,
  at.symbol,
  at.status,
  at.platform,
  atl.step,
  atl.message,
  atl.data,
  atl.created_at
FROM auto_trades at
LEFT JOIN auto_trade_logs atl ON atl.auto_trade_id = at.id
WHERE at.user_id = 'YOUR_USER_ID'
ORDER BY at.created_at DESC, atl.created_at ASC
LIMIT 50;
```

Look for these log steps:
- `accepted_for_execution` - Trade accepted by system
- `calling_exchange` - About to call Bybit API
- `exchange_response` - Bybit API response
- `execution_failed` - Error occurred

## Current Limitations

This is a minimal implementation with the following limitations:

1. **Market Orders Only**: Limit orders not supported yet
2. **Spot Market Only**: Perpetuals/Futures not supported
3. **No Stop-Loss/Take-Profit**: Only entry orders in this version
4. **No DCA**: Dollar-cost averaging not implemented for Bybit yet
5. **No Connection Test**: API keys are saved without validation

These features will be added in future updates.

## Next Steps

Once you've successfully executed a test trade on Bybit Testnet:

1. ✅ You've validated the auto-trading pipeline works
2. ✅ You understand how signals are processed
3. ✅ You can monitor trades in the system

You're now ready to:
- Configure more advanced trading strategies
- Set up multiple bots (coming soon)
- Move to live trading when confident (use with caution!)

## Security Best Practices

- ✅ **Always start with testnet** before using real money
- ✅ **Never share your API keys** with anyone
- ✅ **Use IP restrictions** on API keys when possible
- ✅ **Regularly rotate API keys** (every 30-90 days)
- ✅ **Monitor your trades** regularly
- ✅ **Set up alerts** for unusual activity

## Support

If you encounter issues not covered in this guide:

1. Check the `auto_trade_logs` table for detailed error messages
2. Verify your Bybit Testnet account has sufficient funds
3. Ensure API key permissions are correct
4. Contact support with specific error messages

---

**Happy Paper Trading! 🚀**
