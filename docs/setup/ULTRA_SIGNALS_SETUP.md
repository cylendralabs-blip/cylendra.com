# Ultra Signal Engine – Final Setup

Use this guide to finish wiring the AI Ultra Signal Engine in production/staging.

## 1. Environment Variables

Add the following variables (local + Netlify/Supabase **Functions** + any worker host):

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Public Supabase URL (already used by the app) |
| `VITE_SUPABASE_ANON_KEY` | Public anon key (already used by the app) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** – required by the runner to insert into `ai_signals_history` and broadcast realtime events |
| `ULTRA_SIGNAL_SYMBOLS` | Comma‑separated fallback symbols (default `BTC/USDT,ETH/USDT`) |
| `ULTRA_SIGNAL_TIMEFRAMES` | Comma‑separated timeframes (default `15m,1h,4h`) |
| `ULTRA_SIGNAL_INTERVAL_MS` | Interval for watch mode (default `300000` ms = 5 min) |
| `ULTRA_SIGNAL_CANDLES_URL` | Optional override for the `get-candles` Edge Function. Defaults to `${SUPABASE_URL}/functions/v1/get-candles`. |
| `ULTRA_SIGNAL_CANDLE_LIMIT` | Number of candles to fetch (default `150`) |
| `ULTRA_SIGNAL_MIN_CANDLES` | Minimum candles required for analysis (default `120`) |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (server) |
| `TELEGRAM_CHAT_ID` | Target channel/group chat id |
| `TELEGRAM_ENABLED` | `true` to enable Telegram dispatch |
| `SENTIMENT_FNG_API_URL` | (Optional) Fear & Greed API endpoint – defaults to `https://api.alternative.me/fng/?limit=1&format=json` |
| `SENTIMENT_FUNDING_API_URL` | (Optional) Funding rate API endpoint – defaults to Binance `https://fapi.binance.com/fapi/v1/premiumIndex` |

> **Never** expose `SUPABASE_SERVICE_ROLE_KEY` or Telegram secrets in the browser. Keep them in backend/worker environments only.

## 2. Running the Ultra Signal Runner

A TypeScript runner (`scripts/ultra-signal-runner.ts`) now executes the full pipeline:

1. Fetches active bots + watchlists from Supabase.
2. Pulls candles through the `get-candles` function.
3. Runs `UltraSignalAnalyzer` (Phase X.1) + fusion (Phase X.2).
4. Dispatches through realtime/Telegram/TTL/history (`handleUltraSignal`) using the service-role client.

### Install dependencies

```bash
npm install
```

### Run once (manual trigger)

```bash
npm run ultra-signals:once
```

### Run continuously (watch/cron mode)

```bash
npm run ultra-signals:watch
```

> **Cron idea:** run `npm run ultra-signals:once` every 5 minutes on your server (PM2, systemd timer, GitHub Actions, etc.). For 24/7 streaming, keep `ultra-signals:watch` alive via PM2.

## 3. APIs / Integrations

- **Sentiment**
  - Fear & Greed: `https://api.alternative.me/fng/` (no key required). Override via `SENTIMENT_FNG_API_URL`.
  - Funding rate: Binance `fapi/v1/premiumIndex` (no key). Override via `SENTIMENT_FUNDING_API_URL`.
- **Telegram**
  - Create bot via `@BotFather`, obtain bot token.
  - Add bot to channel/group and grab `chat_id`.
  - Set `TELEGRAM_ENABLED=true`.

## 4. Manual QA Checklist

1. **Run the runner** (`ultra-signals:once`) and confirm logs show signals generated.
2. Check Supabase table `ai_signals_history` for new rows.
3. Open `/dashboard/ultra-signals-live` – realtime table should update instantly.
4. Open `/dashboard/ultra-signals-history` – statistics and filters should read the saved data.
5. Verify Telegram receives the formatted message (if enabled).

Once these steps are in place, Phases **X.1 → X.4** are fully operational, and the UI uses real data instead of placeholders. You can now move to the next project milestones.

