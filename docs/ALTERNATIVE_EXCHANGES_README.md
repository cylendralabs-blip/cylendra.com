# Alternative Exchange Integration - README

## Overview

Orbitra AI now supports multiple cryptocurrency exchanges for automated trading:

- ✅ **Binance** (Live + Testnet)
- ✅ **Bybit** (Live + Testnet, Spot + Perpetuals)
- ✅ **OKX** (Live + Demo)
- 🔜 **KuCoin** (Coming soon)

## Quick Start

### 1. Add API Keys

Go to **Settings** → **API Settings** and add your exchange API keys.

### 2. Select Platform

Choose your preferred platform from the dropdown:
- `Binance` - Live trading
- `Binance Futures Testnet` - Paper trading
- `Bybit` - Live trading
- `Bybit Testnet` - Paper trading
- `OKX` - Live trading
- `OKX Demo Trading` - Paper trading

### 3. Start Trading

The auto-trader will use your selected platform for all trades.

## Platform Guides

- [Bybit Testnet Setup Guide](./BYBIT_TESTNET_GUIDE.md)
- [OKX Demo Setup Guide](./OKX_DEMO_GUIDE.md)

## Features by Platform

| Feature | Binance | Bybit | OKX |
|---------|---------|-------|-----|
| Spot Trading | ✅ | ✅ | ✅ |
| Perpetuals | ✅ | ✅ | ✅ |
| Market Orders | ✅ | ✅ | ✅ |
| Limit Orders | ✅ | ✅ | ✅ |
| Stop-Loss | ✅ | ✅ | ✅ |
| Take-Profit | ✅ | ✅ | ✅ |
| DCA Orders | ✅ | ✅ | ✅ |
| Leverage | ✅ | ✅ | ✅ |
| Testnet/Demo | ✅ | ✅ | ✅ |

## Architecture

### Backend
- **Execute-Trade Function**: Routes orders to correct exchange
- **Platform Modules**: Exchange-specific implementations
- **Strategy Executors**: Orchestrate complex trading strategies

### Database
- **api_keys**: Stores exchange credentials
- **auto_trades**: Records all trade executions
- **auto_trade_logs**: Detailed execution logs

### Frontend
- **API Settings**: Manage exchange API keys
- **Platform Selection**: Choose trading platform
- **Testnet Indicators**: Clear visual indicators for paper trading

## Development

### File Structure

```
supabase/functions/execute-trade/
├── platforms/
│   ├── bybit/          # Bybit implementation
│   ├── okx.ts          # OKX implementation
│   └── binance.ts      # Binance implementation
├── trade-executor.ts   # Platform routing
└── config.ts           # Configuration

docs/
├── BYBIT_TESTNET_GUIDE.md
└── OKX_DEMO_GUIDE.md
```

### Adding New Exchanges

1. Create platform module in `platforms/`
2. Implement exchange client
3. Add to `trade-executor.ts` routing
4. Update database migration
5. Add to UI dropdown
6. Create user guide

## Testing

### Manual Testing

1. Add testnet/demo API keys
2. Create test signal
3. Verify execution in exchange
4. Check logs in database

### Automated Testing

```bash
# Run tests
deno test supabase/functions/execute-trade/tests/
```

## Deployment

```bash
# Deploy edge functions
supabase functions deploy execute-trade

# Deploy database migrations
supabase db push

# Deploy frontend
npm run build
```

## Troubleshooting

### Common Issues

**Q: Order not executing**  
A: Check `auto_trade_logs` table for errors

**Q: API key validation fails**  
A: Verify platform matches (testnet vs live)

**Q: Wrong exchange used**  
A: Check bot settings platform selection

### Debug Queries

```sql
-- Check API keys
SELECT platform, testnet, is_active 
FROM api_keys 
WHERE user_id = 'YOUR_ID';

-- Check recent trades
SELECT * FROM auto_trades 
WHERE user_id = 'YOUR_ID' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check execution logs
SELECT * FROM auto_trade_logs 
WHERE auto_trade_id = 'TRADE_ID' 
ORDER BY created_at;
```

## Security

- ✅ API keys encrypted at rest
- ✅ Row Level Security (RLS) enabled
- ✅ Testnet/demo mode validation
- ✅ Platform-specific validation triggers

## Support

For issues or questions:
1. Check the relevant platform guide
2. Review `auto_trade_logs` for errors
3. Contact support with specific error messages

---

**Built with ❤️ for the Orbitra AI community**
