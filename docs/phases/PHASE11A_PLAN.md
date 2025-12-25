# 📌 **📍 Phase 11A — Cylendra Influence Economy**

**(Referral + Loyalty + Token + CPU System)**

**Phase 11A Plan - Ready for Implementation**

---

## 🎯 **Objectives**

Build a comprehensive influence economy system that combines:

1. **Referral System** - CPA + Revenue Share
2. **LP System** - Loyalty Points
3. **Influence Weight (W)** - Power ranking
4. **CPU Units** - Profit sharing
5. **Token Integration** - Future token rewards
6. **Gamification** - Missions & achievements
7. **Leaderboard** - Monthly rankings
8. **Anti-Fraud** - Fraud detection
9. **Affiliate Dashboard** - Complete UI

---

## ✅ **Progress**

### Completed ✅
- [x] Task 1: Database Schema (12 tables)
- [ ] Task 2: Core Services
- [ ] Task 3: Anti-Fraud System
- [ ] Task 4: API Endpoints
- [ ] Task 5: Affiliate Dashboard UI
- [ ] Task 6: Leaderboard Component
- [ ] Task 7: Missions & Gamification
- [ ] Task 8: Integration

---

## 📊 **System Components**

### 1. Referral System
- **CPA**: $3-10 per active user
- **Revenue Share**: 10-30% of subscription
- **Hybrid**: CPA + RS combined

### 2. LP (Loyalty Points)
- Earned from: referrals, subscriptions, bot activity, volume, missions
- Spent on: discounts, subscriptions, services, tokens, CPU

### 3. Influence Weight (W)
Formula:
```
W = (Users_active × 3) +
    (Users_registered × 1) +
    (Bot_active_users × 5) +
    (Volume_generated × factor) +
    (Backtest_users × factor)
```

### 4. CPU Units
- Profit sharing units
- Allocated based on weight
- Annual distribution from company profits

### 5. Token Integration
- Airdrop based on weight
- Staking bonuses
- Farming rewards

### 6. Gamification
- Weekly missions
- Monthly challenges
- Achievement badges
- Rewards: LP, Weight, Tokens, CPU

### 7. Leaderboard
- Monthly rankings
- Top 50 affiliates
- Top 10 rewards: $1000, $500, $250 + tokens

### 8. Anti-Fraud
- IP tracking
- Device fingerprinting
- Activity verification
- Quality scoring

---

## 📁 **File Structure**

```
src/services/affiliate/
  ├── referralService.ts
  ├── lpService.ts
  ├── weightCalculator.ts
  ├── cpuAllocator.ts
  ├── fraudDetector.ts
  └── missionService.ts

src/components/affiliate/
  ├── AffiliateDashboard.tsx
  ├── ReferralLinks.tsx
  ├── EarningsCard.tsx
  ├── CPUUnitsCard.tsx
  ├── LPCard.tsx
  ├── WeightCard.tsx
  ├── MissionsPanel.tsx
  ├── Leaderboard.tsx
  └── CampaignManager.tsx

supabase/functions/affiliate/
  ├── register.ts
  ├── dashboard.ts
  ├── track.ts
  ├── claim.ts
  └── leaderboard.ts
```

---

## 🔒 **Safety & Fraud Prevention**

- IP validation
- Device fingerprinting
- Activity verification
- Quality scoring
- Duplicate detection
- VPN blocking
- Bot detection

---

**Last Updated:** 2025-01-23

