#!/bin/bash

# Edge Functions Deployment Script
# Phase 5: Risk Management Engine - Complete Deployment

echo "🚀 Starting Edge Functions Deployment..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed!"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if linked to project
echo "📋 Checking Supabase project link..."
if ! supabase status &> /dev/null; then
    echo "⚠️  Not linked to Supabase project"
    echo "Run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

echo "✅ Project linked"
echo ""

# Deploy critical functions first
echo "🔴 Deploying CRITICAL functions..."
echo ""

echo "1️⃣  Deploying execute-trade..."
supabase functions deploy execute-trade
if [ $? -eq 0 ]; then
    echo "✅ execute-trade deployed successfully"
else
    echo "❌ execute-trade deployment failed"
    exit 1
fi
echo ""

echo "2️⃣  Deploying auto-trader-worker..."
supabase functions deploy auto-trader-worker
if [ $? -eq 0 ]; then
    echo "✅ auto-trader-worker deployed successfully"
else
    echo "❌ auto-trader-worker deployment failed"
    exit 1
fi
echo ""

# Deploy high priority functions
echo "🟡 Deploying HIGH priority functions..."
echo ""

echo "3️⃣  Deploying strategy-runner-worker..."
supabase functions deploy strategy-runner-worker
if [ $? -eq 0 ]; then
    echo "✅ strategy-runner-worker deployed successfully"
else
    echo "⚠️  strategy-runner-worker deployment failed (non-critical)"
fi
echo ""

echo "4️⃣  Deploying get-candles..."
supabase functions deploy get-candles
if [ $? -eq 0 ]; then
    echo "✅ get-candles deployed successfully"
else
    echo "⚠️  get-candles deployment failed (non-critical)"
fi
echo ""

echo "5️⃣  Deploying get-live-prices..."
supabase functions deploy get-live-prices
if [ $? -eq 0 ]; then
    echo "✅ get-live-prices deployed successfully"
else
    echo "⚠️  get-live-prices deployment failed (non-critical)"
fi
echo ""

echo "6️⃣  Deploying exchange-portfolio..."
supabase functions deploy exchange-portfolio
if [ $? -eq 0 ]; then
    echo "✅ exchange-portfolio deployed successfully"
else
    echo "⚠️  exchange-portfolio deployment failed (non-critical)"
fi
echo ""

# Deploy medium priority functions
echo "🟢 Deploying MEDIUM priority functions..."
echo ""

echo "7️⃣  Deploying tradingview-webhook..."
supabase functions deploy tradingview-webhook
if [ $? -eq 0 ]; then
    echo "✅ tradingview-webhook deployed successfully"
else
    echo "⚠️  tradingview-webhook deployment failed (non-critical)"
fi
echo ""

echo "8️⃣  Deploying get-trading-pairs..."
supabase functions deploy get-trading-pairs
if [ $? -eq 0 ]; then
    echo "✅ get-trading-pairs deployed successfully"
else
    echo "⚠️  get-trading-pairs deployment failed (non-critical)"
fi
echo ""

echo "9️⃣  Deploying sync-platform-trades..."
supabase functions deploy sync-platform-trades
if [ $? -eq 0 ]; then
    echo "✅ sync-platform-trades deployed successfully"
else
    echo "⚠️  sync-platform-trades deployment failed (non-critical)"
fi
echo ""

echo "🔟  Deploying admin-users..."
supabase functions deploy admin-users
if [ $? -eq 0 ]; then
    echo "✅ admin-users deployed successfully"
else
    echo "⚠️  admin-users deployment failed (non-critical)"
fi
echo ""

echo "🎉 Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Add Environment Variables in Supabase Dashboard"
echo "2. Set up Cron Jobs for auto-trader-worker and strategy-runner-worker"
echo "3. Test each function"
echo ""
echo "📚 See EDGE_FUNCTIONS_DEPLOYMENT_GUIDE.md for details"

