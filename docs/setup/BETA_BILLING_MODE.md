# Beta Free Billing Mode Setup Guide

## Overview

Beta Free Billing Mode allows all users to try any plan (FREE / BASIC / PREMIUM / VIP) for free during the beta phase, without requiring real Stripe or Crypto payments.

---

## Configuration

### 1. Set Billing Mode in Supabase

Go to **Supabase Dashboard → Edge Functions → Settings → Secrets** and add:

```
BILLING_MODE=beta_free
```

Or for production/live mode:

```
BILLING_MODE=live
```

### 2. Optional: Set Beta Expiration Days

Default is 60 days. To change:

```
BETA_EXPIRATION_DAYS=60
```

---

## How It Works

### Beta Free Mode (`BILLING_MODE=beta_free`)

1. **User Experience:**
   - Banner appears on Pricing page: "Beta Mode – All plans are free to try"
   - Payment method selector shows "Activate for free (Beta)" option
   - No Stripe or Crypto payment required
   - Plans activate immediately for 60 days

2. **Backend Process:**
   - User clicks "Subscribe" → Opens payment selector
   - User selects "Activate for free (Beta)"
   - Calls `POST /functions/v1/beta-activate` with `planCode`
   - Creates payment record with:
     - `payment_method = 'beta_free'`
     - `provider = 'internal'`
     - `status = 'finished'`
   - Activates user plan for 60 days
   - Returns success

3. **Payment Record:**
   ```json
   {
     "payment_method": "beta_free",
     "provider": "internal",
     "status": "finished",
     "amount_usd": 79.99,  // Original plan price (for reference)
     "metadata": {
       "beta_mode": true,
       "original_price": 79.99
     }
   }
   ```

### Live Mode (`BILLING_MODE=live`)

- Normal payment flows (Stripe + Crypto)
- Beta activation endpoint returns 403
- Users must pay to activate plans

---

## Edge Functions

### 1. `billing-config`

**Endpoint:** `GET /functions/v1/billing-config`

**Response:**
```json
{
  "mode": "beta_free",
  "betaExpirationDays": 60,
  "features": {
    "stripe": false,
    "crypto": false,
    "betaFree": true
  }
}
```

### 2. `beta-activate`

**Endpoint:** `POST /functions/v1/beta-activate`

**Request:**
```json
{
  "planCode": "PRO"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Plan activated successfully (Beta Free Mode)",
  "payment": {
    "id": "payment-uuid",
    "plan_code": "PRO",
    "amount_usd": 79.99,
    "payment_method": "beta_free",
    "status": "finished"
  },
  "subscription": {
    "plan_code": "PRO",
    "plan_name": "Pro",
    "status": "active",
    "expires_at": "2025-04-07T00:00:00Z",
    "payment_method": "beta_free"
  }
}
```

---

## Frontend Integration

### Pricing Page

- Automatically detects billing mode
- Shows Beta banner if `beta_free`
- Payment selector shows Beta activation option

### Payment Method Selector

- Checks billing mode on open
- If `beta_free`: Shows "Activate for free (Beta)" as primary option
- If `live`: Shows Stripe/Crypto options (if configured)

### Admin Billing

- Shows `beta_free` payments with purple "Beta Free" badge
- Can filter by payment method
- Distinguishes between:
  - Real paid subscriptions
  - Free beta subscriptions

---

## Switching to Live Mode

When ready for production:

1. **Update Supabase Secret:**
   ```
   BILLING_MODE=live
   ```

2. **Beta endpoint will:**
   - Return 403 for new requests
   - Existing beta users keep their current `expires_at`

3. **When beta subscriptions expire:**
   - Users must use real payments (Stripe/Crypto)
   - Normal payment flows become active

---

## Benefits

✅ **Quick Onboarding:** Users can try all features immediately  
✅ **No Payment Friction:** No credit card or crypto required  
✅ **Collect Feedback:** Test all plans and features  
✅ **Ready for Production:** Architecture supports real payments  
✅ **Easy Transition:** Switch to live mode with one config change  

---

## Testing

1. Set `BILLING_MODE=beta_free` in Supabase Secrets
2. Go to `/pricing` page
3. Click "اشترك الآن" on any plan
4. Select "تفعيل مجاني (Beta)"
5. Plan should activate immediately
6. Check Admin Billing → Payment History → Should show "Beta Free" badge

---

## Notes

- Beta payments are stored in `payments` table for audit trail
- Original plan price is stored for reference
- Beta subscriptions expire after 60 days (configurable)
- Admin can see all beta activations in billing dashboard
- Easy to distinguish beta vs real payments

---

**Last Updated:** 2025-02-07  
**Version:** 1.0

