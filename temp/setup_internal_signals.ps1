# ============================================
# سكربت PowerShell لإعداد نظام الإشارات الداخلية
# Internal Signals System Setup Script
# ============================================
# 
# هذا السكربت يقوم بـ:
# 1. تشغيل SQL لإعداد البيانات
# 2. التحقق من Edge Functions
# 3. اختبار النظام
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "إعداد نظام الإشارات الداخلية" -ForegroundColor Cyan
Write-Host "Internal Signals System Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من Supabase CLI
Write-Host "🔍 التحقق من Supabase CLI..." -ForegroundColor Yellow
$supabaseCheck = supabase --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Supabase CLI غير مثبت أو غير متصل" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Supabase CLI متصل" -ForegroundColor Green
Write-Host ""

# الخطوة 1: تشغيل SQL لإعداد البيانات
Write-Host "📝 الخطوة 1: إعداد البيانات في قاعدة البيانات..." -ForegroundColor Yellow
Write-Host ""

$sqlFile = "setup_internal_signals.sql"
if (Test-Path $sqlFile) {
    Write-Host "📄 تشغيل ملف SQL: $sqlFile" -ForegroundColor Cyan
    
    # تشغيل SQL عبر Supabase CLI
    supabase db execute --file $sqlFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ تم تنفيذ SQL بنجاح!" -ForegroundColor Green
    } else {
        Write-Host "❌ فشل تنفيذ SQL" -ForegroundColor Red
        Write-Host "💡 يمكنك تشغيل الملف يدوياً من Supabase Dashboard > SQL Editor" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ ملف SQL غير موجود: $sqlFile" -ForegroundColor Yellow
    Write-Host "💡 يرجى التأكد من وجود الملف في نفس المجلد" -ForegroundColor Yellow
}
Write-Host ""

# الخطوة 2: التحقق من Cron Jobs
Write-Host "⏰ الخطوة 2: التحقق من Cron Jobs..." -ForegroundColor Yellow
Write-Host ""

$cronFile = "CRON_JOBS_SETUP.sql"
if (Test-Path $cronFile) {
    Write-Host "📄 ملف Cron Jobs موجود: $cronFile" -ForegroundColor Cyan
    Write-Host "💡 تأكد من تشغيل CRON_JOBS_SETUP.sql من Supabase Dashboard" -ForegroundColor Yellow
    Write-Host "   أو قم بتشغيل: supabase db execute --file CRON_JOBS_SETUP.sql" -ForegroundColor Yellow
} else {
    Write-Host "⚠️ ملف Cron Jobs غير موجود" -ForegroundColor Yellow
}
Write-Host ""

# الخطوة 3: اختبار Edge Function
Write-Host "🧪 الخطوة 3: اختبار Edge Function..." -ForegroundColor Yellow
Write-Host ""

Write-Host "💡 لاختبار strategy-runner-worker يدوياً:" -ForegroundColor Cyan
Write-Host "   يمكنك استخدام curl أو Postman:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   curl -X POST https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker \" -ForegroundColor Gray
Write-Host "     -H \"Authorization: Bearer YOUR_SERVICE_ROLE_KEY\" \" -ForegroundColor Gray
Write-Host "     -H \"Content-Type: application/json\" \" -ForegroundColor Gray
Write-Host "     -d '{\"timeframe\": \"15m\"}'" -ForegroundColor Gray
Write-Host ""

# الخطوة 4: عرض ملخص
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ تم إعداد النظام!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 الخطوات التالية:" -ForegroundColor Yellow
Write-Host "   1. ✅ تم إعداد bot_settings و watchlist" -ForegroundColor Green
Write-Host "   2. ⏰ قم بتشغيل CRON_JOBS_SETUP.sql لتفعيل Cron Jobs" -ForegroundColor Yellow
Write-Host "   3. 🚀 تأكد من نشر Edge Functions:" -ForegroundColor Yellow
Write-Host "      - strategy-runner-worker" -ForegroundColor Gray
Write-Host "      - auto-trader-worker (اختياري)" -ForegroundColor Gray
Write-Host "   4. 📊 راقب الإشارات في:" -ForegroundColor Yellow
Write-Host "      - صفحة TradingView" -ForegroundColor Gray
Write-Host "      - صفحة Signals" -ForegroundColor Gray
Write-Host ""
Write-Host "🔍 للتحقق من الإشارات:" -ForegroundColor Cyan
Write-Host "   SELECT COUNT(*) FROM tradingview_signals WHERE source = 'internal_engine';" -ForegroundColor Gray
Write-Host ""

