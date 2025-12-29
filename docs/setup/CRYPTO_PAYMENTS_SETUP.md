# Crypto Payments Integration Setup Guide

## Phase Crypto Payments: NOWPayments Integration

This guide explains how to set up crypto payments using NOWPayments in Orbitra AI.

---

## Prerequisites

1. **NOWPayments Account**
   - Sign up at [NOWPayments.io](https://nowpayments.io)
   - Complete KYC verification
   - Get your API key and IPN secret

2. **Supabase Project**
   - Edge Functions enabled
   - Database migrations applied

---

## Environment Variables

### Required Edge Function Secrets

Set these in **Supabase Dashboard → Edge Functions → Settings → Secrets**:

#### `NOWPAYMENTS_API_KEY`
- **Description**: Your NOWPayments API key
- **Source**: NOWPayments Dashboard → API Settings
- **Required**: ✅ Yes
- **Example**: `abc123def456...`

#### `NOWPAYMENTS_IPN_SECRET` (Optional but Recommended)
- **Description**: IPN (Instant Payment Notification) secret for webhook signature verification
- **Source**: NOWPayments Dashboard → IPN Settings
- **Required**: ⚠️ Recommended for production
- **Example**: `your-secret-key-here`

#### `NOWPAYMENTS_BASE_URL` (Optional)
- **Description**: NOWPayments API base URL
- **Default**: `https://api.nowpayments.io/v1`
- **Required**: ❌ No (uses default if not set)
- **Note**: Only change if using a different endpoint

#### `CRYPTO_DEFAULT_CURRENCY` (Optional)
- **Description**: Default cryptocurrency for payments
- **Default**: `USDTTRC20`
- **Required**: ❌ No
- **Examples**: `USDTTRC20`, `USDC`, `BTC`, `ETH`

---

## Setup Steps

### 1. Configure NOWPayments

1. Log in to [NOWPayments Dashboard](https://nowpayments.io/dashboard)
2. Go to **API Settings**
3. Copy your **API Key**
4. Go to **IPN Settings**
5. Set **IPN Callback URL** to:
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/crypto-payment-webhook
   ```
   Replace `YOUR_PROJECT_REF` with your Supabase project reference.
6. Copy your **IPN Secret** (if available)

### 2. Set Supabase Secrets

1. Go to **Supabase Dashboard → Edge Functions → Settings**
2. Click **Secrets**
3. Add the following secrets:

   ```
   NOWPAYMENTS_API_KEY=your-api-key-here
   NOWPAYMENTS_IPN_SECRET=your-ipn-secret-here
   NOWPAYMENTS_BASE_URL=https://api.nowpayments.io/v1
   CRYPTO_DEFAULT_CURRENCY=USDTTRC20
   ```

### 3. Deploy Edge Functions

Deploy the crypto payment Edge Functions:

```bash
# Deploy payment creation function
supabase functions deploy crypto-payment-create

# Deploy webhook handler
supabase functions deploy crypto-payment-webhook
```

### 4. Run Database Migrations

Apply the crypto payments database schema:

```bash
# The migration file is:
# supabase/migrations/20250207000005_create_crypto_payments_tables.sql

# Apply via Supabase Dashboard or CLI
supabase db push
```

---

## Testing

### Test Payment Flow

1. **Create a Test Payment**
   - Go to `/pricing` page
   - Click "الدفع بالعملات المشفرة" (Pay with Crypto) on any plan
   - You should be redirected to NOWPayments payment page

2. **Test Webhook** (Development)
   - Use NOWPayments test mode if available
   - Or manually trigger webhook with test data

3. **Verify Payment Status**
   - Check `payments` table in Supabase
   - Check `payment_events` table for audit trail
   - Verify subscription activation in `user_plans` table

---

## Payment Status Flow

```
pending → confirming → finished ✅
         ↓
      failed ❌
      expired ⏰
      refunded 💰
```

### Status Mapping

| NOWPayments Status | Internal Status | Description |
|-------------------|-----------------|-------------|
| `waiting` | `pending` | Payment created, waiting for user |
| `confirming` | `confirming` | Payment sent, waiting for blockchain confirmation |
| `finished` | `finished` | Payment confirmed, subscription activated |
| `failed` | `failed` | Payment failed |
| `expired` | `expired` | Payment expired |
| `refunded` | `refunded` | Payment refunded |

---

## Security

### Webhook Signature Verification

The webhook handler verifies NOWPayments signatures using HMAC-SHA512:

1. NOWPayments sends `x-nowpayments-sig` header
2. We calculate HMAC-SHA512 of request body using `NOWPAYMENTS_IPN_SECRET`
3. Compare signatures - reject if mismatch

**Important**: Always set `NOWPAYMENTS_IPN_SECRET` in production!

### API Key Security

- ✅ Never expose `NOWPAYMENTS_API_KEY` in frontend code
- ✅ Only use in Edge Functions (server-side)
- ✅ Store in Supabase Secrets (not in `.env` files)

---

## Troubleshooting

### Payment Creation Fails

**Error**: `NOWPayments API key not configured`

**Solution**:
1. Check Supabase Secrets are set correctly
2. Verify API key is valid in NOWPayments dashboard
3. Check Edge Function logs in Supabase Dashboard

### Webhook Not Received

**Error**: Webhook never called

**Solution**:
1. Verify IPN Callback URL in NOWPayments dashboard
2. Check webhook URL is accessible (not behind firewall)
3. Check Edge Function logs for errors
4. Test webhook manually using NOWPayments test tools

### Signature Verification Fails

**Error**: `Invalid signature`

**Solution**:
1. Verify `NOWPAYMENTS_IPN_SECRET` matches NOWPayments dashboard
2. Check webhook payload format matches expected format
3. Review Edge Function logs for detailed error

### Subscription Not Activated

**Error**: Payment finished but subscription not activated

**Solution**:
1. Check `payment_events` table for `plan_activated` event
2. Verify `user_plans` table has correct entry
3. Check Edge Function logs for activation errors
4. Verify plan exists in `plans` table

---

## Admin Features

### View Payment History

1. Go to **Admin → Billing**
2. Click on any user
3. Open **"سجل الدفع"** (Payment History) tab
4. View all payments with:
   - Date
   - Plan
   - Amount (USD)
   - Currency
   - Status
   - Payment method
   - Provider

### Payment Events

All payment lifecycle events are logged in `payment_events` table:
- `created` - Payment created
- `webhook_received` - Webhook received from NOWPayments
- `plan_activated` - Subscription activated
- `error` - Error occurred

---

## Supported Cryptocurrencies

NOWPayments supports many cryptocurrencies. Common ones:

- **USDT** (TRC20, ERC20, BEP20)
- **USDC** (ERC20, BEP20)
- **BTC** (Bitcoin)
- **ETH** (Ethereum)
- **BNB** (Binance Coin)
- And many more...

Check NOWPayments documentation for full list.

---

## API Reference

### Create Payment

**Endpoint**: `POST /functions/v1/crypto-payment-create`

**Request**:
```json
{
  "userId": "user-uuid",
  "planCode": "PRO",
  "currency": "USDTTRC20"
}
```

**Response**:
```json
{
  "payment": {
    "id": "payment-uuid",
    "payment_url": "https://nowpayments.io/payment/...",
    "status": "pending",
    ...
  },
  "payment_url": "https://nowpayments.io/payment/..."
}
```

### Webhook Handler

**Endpoint**: `POST /functions/v1/crypto-payment-webhook`

**Headers**:
- `x-nowpayments-sig`: HMAC-SHA512 signature

**Payload**: NOWPayments webhook payload

---

## Next Steps

1. **Stripe Integration**: Add Stripe as alternative payment method
2. **Payment Analytics**: Add revenue analytics for crypto payments
3. **Multi-currency Support**: Support multiple fiat currencies
4. **Payment Retry**: Automatic retry for failed payments
5. **Refund Management**: Admin tools for refunds

---

## Support

For issues or questions:
1. Check Edge Function logs in Supabase Dashboard
2. Review `payment_events` table for detailed logs
3. Check NOWPayments dashboard for payment status
4. Contact NOWPayments support if payment issues persist

---

**Last Updated**: 2025-02-07  
**Version**: 1.0

