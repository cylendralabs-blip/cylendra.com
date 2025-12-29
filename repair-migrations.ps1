# Migration Repair Script
# This script repairs the migration history to match remote database

Write-Host "Starting migration repair process..." -ForegroundColor Cyan

# Revert old migrations that don't exist locally
$revertMigrations = @(
    "20250604013902",
    "20250604024219",
    "20250604024757",
    "20250604035523",
    "20250604064125",
    "20250605095944",
    "20250605102206",
    "20250607111637",
    "20251015052743",
    "20251015052754",
    "20251015052834",
    "20251117111553"
)

Write-Host "`nReverting old migrations..." -ForegroundColor Yellow
foreach ($migration in $revertMigrations) {
    Write-Host "  Reverting $migration..." -NoNewline
    supabase migration repair --status reverted $migration 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✓" -ForegroundColor Green
    } else {
        Write-Host " ✗" -ForegroundColor Red
    }
}

Write-Host "`nMigration repair completed!" -ForegroundColor Green
Write-Host "`nNow you can run: supabase db push" -ForegroundColor Cyan
