# ============================================
# فحص بيانات OKX من قاعدة البيانات
# Check OKX Data from Database
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "فحص بيانات OKX من قاعدة البيانات" -ForegroundColor Cyan
Write-Host "Checking OKX Data from Database" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من Supabase CLI
Write-Host "🔍 التحقق من Supabase CLI..." -ForegroundColor Yellow
$supabaseCheck = supabase --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Supabase CLI غير متصل" -ForegroundColor Red
    Write-Host "💡 يرجى فتح Supabase Dashboard > SQL Editor وتنفيذ ملف debug/DIAGNOSE_OKX_ISSUE.sql" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Supabase CLI متصل" -ForegroundColor Green
Write-Host ""

# عرض التعليمات
Write-Host "📋 التعليمات:" -ForegroundColor Cyan
Write-Host "1. افتح Supabase Dashboard: https://supabase.com/dashboard/project/pjgfrhgjbbsqsmwfljpg" -ForegroundColor White
Write-Host "2. اذهب إلى SQL Editor" -ForegroundColor White
Write-Host "3. انسخ محتوى ملف: debug/DIAGNOSE_OKX_ISSUE.sql" -ForegroundColor White
Write-Host "4. الصقه في SQL Editor واضغط Run" -ForegroundColor White
Write-Host ""

# محاولة فتح الملف
$sqlFile = "debug/DIAGNOSE_OKX_ISSUE.sql"
if (Test-Path $sqlFile) {
    Write-Host "📄 ملف SQL موجود: $sqlFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 يمكنك:" -ForegroundColor Yellow
    Write-Host "   - فتح الملف في محرر النصوص" -ForegroundColor White
    Write-Host "   - نسخ المحتوى" -ForegroundColor White
    Write-Host "   - لصقه في Supabase SQL Editor" -ForegroundColor White
    Write-Host ""
    
    # عرض أول 20 سطر من الملف
    Write-Host "📋 معاينة الملف (أول 20 سطر):" -ForegroundColor Cyan
    Get-Content $sqlFile -Head 20 | ForEach-Object {
        Write-Host $_ -ForegroundColor Gray
    }
    Write-Host "..."
    Write-Host ""
    
    # محاولة فتح الملف
    $openFile = Read-Host "هل تريد فتح الملف في محرر النصوص؟ (y/n)"
    if ($openFile -eq 'y' -or $openFile -eq 'Y') {
        notepad $sqlFile
    }
} else {
    Write-Host "❌ ملف SQL غير موجود: $sqlFile" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ انتهى" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

