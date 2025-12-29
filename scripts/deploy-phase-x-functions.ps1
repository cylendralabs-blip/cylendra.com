# PowerShell Script to Deploy Phase X Edge Functions
# Phase X.5 and X.7 Edge Functions

Write-Host "🚀 Starting deployment of Phase X Edge Functions..." -ForegroundColor Cyan
Write-Host ""

# Check if supabase CLI is available
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if project is linked
Write-Host "📋 Checking Supabase project link..." -ForegroundColor Yellow
$linkCheck = supabase status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Project not linked. Please run: supabase link --project-ref <your-project-ref>" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Project is linked" -ForegroundColor Green
Write-Host ""

# Function to deploy an edge function
function Deploy-Function {
    param(
        [string]$FunctionName,
        [string]$Phase
    )
    
    Write-Host "📦 Deploying $FunctionName (Phase $Phase)..." -ForegroundColor Cyan
    
    $result = supabase functions deploy $FunctionName 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully deployed $FunctionName" -ForegroundColor Green
        Write-Host ""
        return $true
    } else {
        Write-Host "❌ Failed to deploy $FunctionName" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

# Deploy Phase X.5 - AI User Settings
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Phase X.5 - AI User Settings" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
$success1 = Deploy-Function -FunctionName "ai-user-settings" -Phase "X.5"

# Deploy Phase X.7 - AI Indicator Analytics
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Phase X.7 - AI Indicator Analytics" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
$success2 = Deploy-Function -FunctionName "ai-indicator-analytics" -Phase "X.7"

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Deployment Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($success1) {
    Write-Host "✅ ai-user-settings: Deployed" -ForegroundColor Green
} else {
    Write-Host "❌ ai-user-settings: Failed" -ForegroundColor Red
}

if ($success2) {
    Write-Host "✅ ai-indicator-analytics: Deployed" -ForegroundColor Green
} else {
    Write-Host "❌ ai-indicator-analytics: Failed" -ForegroundColor Red
}

Write-Host ""

if ($success1 -and $success2) {
    Write-Host "🎉 All Phase X Edge Functions deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Run migrations if not already done:" -ForegroundColor Yellow
    Write-Host "   supabase db push" -ForegroundColor White
    Write-Host "2. Test the functions in Supabase Dashboard" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Some functions failed to deploy. Please check the errors above." -ForegroundColor Yellow
}

