# Phase 11A - Integration Guide

## Integration Points

### 1. User Signup/Login
When a user signs up or logs in, link their referral:

```typescript
import { linkReferralToUser } from '@/hooks/useReferralTracking';

// After successful signup/login
await linkReferralToUser(user.id);
```

### 2. Bot Activation
When user activates bot, award LP:

```typescript
import { awardLPForBotActivation } from '@/services/affiliate/integration';

// After bot activation
await awardLPForBotActivation(userId, affiliateId);
```

### 3. Trading Volume
When user trades, award LP based on volume:

```typescript
import { awardLPForVolume } from '@/services/affiliate/integration';

// After trade execution
await awardLPForVolume(userId, tradeVolume, affiliateId);
```

### 4. Subscription
When user subscribes, process revenue share:

```typescript
import { processRevenueShare } from '@/hooks/useReferralTracking';

// After subscription payment
await processRevenueShare(affiliateUserId, subscriptionAmount, 'monthly');
```

### 5. Weight Updates
Update affiliate weight periodically:

```typescript
import { updateAffiliateWeight } from '@/services/affiliate/integration';

// In cron job or after significant activity
await updateAffiliateWeight(affiliateId);
```

## Routes Added

- `/dashboard/affiliate` - Affiliate Dashboard

## Components to Use

```typescript
import { AffiliateDashboard } from '@/components/affiliate';
```

## Hooks to Use

```typescript
import { useReferralTracking } from '@/hooks/useReferralTracking';
```

## Services to Use

```typescript
import {
  calculateInfluenceWeight,
  allocateCPUUnits,
  calculateLPEarned,
  calculateCPAReward,
  calculateRevenueShare,
} from '@/services/affiliate';
```

