# Edge Functions Deployment Script (PowerShell)
# Phase 5: Risk Management Engine - Complete Deployment

Write-Host "🚀 Starting Edge Functions Deployment..." -ForegroundColor Green
Write-Host ""

# Check if Supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
} catch {
    Write-Host "❌ Supabase CLI is not installed!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if linked to project
Write-Host "📋 Checking Supabase project link..." -ForegroundColor Cyan
try {
    $null = supabase status 2>&1
    Write-Host "✅ Project linked" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Not linked to Supabase project" -ForegroundColor Yellow
    Write-Host "Run: supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Deploy critical functions first
Write-Host "🔴 Deploying CRITICAL functions..." -ForegroundColor Red
Write-Host ""

Write-Host "1️⃣  Deploying execute-trade..." -ForegroundColor Cyan
supabase functions deploy execute-trade
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ execute-trade deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ execute-trade deployment failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "2️⃣  Deploying auto-trader-worker..." -ForegroundColor Cyan
supabase functions deploy auto-trader-worker
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ auto-trader-worker deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ auto-trader-worker deployment failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Deploy high priority functions
Write-Host "🟡 Deploying HIGH priority functions..." -ForegroundColor Yellow
Write-Host ""

$highPriorityFunctions = @(
    "strategy-runner-worker",
    "get-candles",
    "get-live-prices",
    "exchange-portfolio"
)

foreach ($func in $highPriorityFunctions) {
    Write-Host "Deploying $func..." -ForegroundColor Cyan
    supabase functions deploy $func
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $func deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $func deployment failed (non-critical)" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Deploy medium priority functions
Write-Host "🟢 Deploying MEDIUM priority functions..." -ForegroundColor Green
Write-Host ""

$mediumPriorityFunctions = @(
    "tradingview-webhook",
    "get-trading-pairs",
    "sync-platform-trades",
    "admin-users"
)

foreach ($func in $mediumPriorityFunctions) {
    Write-Host "Deploying $func..." -ForegroundColor Cyan
    supabase functions deploy $func
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $func deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $func deployment failed (non-critical)" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Add Environment Variables in Supabase Dashboard"
Write-Host "2. Set up Cron Jobs for auto-trader-worker and strategy-runner-worker"
Write-Host "3. Test each function"
Write-Host ""
Write-Host "📚 See EDGE_FUNCTIONS_DEPLOYMENT_GUIDE.md for details" -ForegroundColor Cyan

