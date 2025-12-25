# ============================================
# اختبار OKX API مباشرة
# Test OKX API Directly
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "اختبار OKX API مباشرة" -ForegroundColor Cyan
Write-Host "Testing OKX API Directly" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ملاحظة: هذا يتطلب بيانات API Key من قاعدة البيانات
Write-Host "⚠️ هذا السكربت يحتاج إلى:" -ForegroundColor Yellow
Write-Host "   1. API Key من قاعدة البيانات" -ForegroundColor White
Write-Host "   2. Secret Key" -ForegroundColor White
Write-Host "   3. Passphrase" -ForegroundColor White
Write-Host ""
Write-Host "💡 الأفضل: فحص Edge Functions Logs في Supabase Dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 خطوات فحص Edge Functions Logs:" -ForegroundColor Yellow
Write-Host "   1. افتح: https://supabase.com/dashboard/project/pjgfrhgjbbsqsmwfljpg" -ForegroundColor White
Write-Host "   2. اذهب إلى: Edge Functions > exchange-portfolio > Logs" -ForegroundColor White
Write-Host "   3. ابحث عن آخر استدعاء لـ OKX" -ForegroundColor White
Write-Host "   4. ابحث عن:" -ForegroundColor White
Write-Host "      - '🔍 Starting OKX balance fetch...'" -ForegroundColor Gray
Write-Host "      - '📋 OKX API response structure:'" -ForegroundColor Gray
Write-Host "      - '🔍 Full OKX API response (for debugging):'" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan

