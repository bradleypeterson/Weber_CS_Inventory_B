Write-Host "Starting Weber CS Tech Inventory Tracker Setup..." -ForegroundColor Cyan

# 1. Check for Strict Node v22 Requirement
$nodeVersion = node -v
if ($nodeVersion -notmatch "^v22") {
    Write-Host "ERROR: Node v22 is strictly required. You are currently running $nodeVersion." -ForegroundColor Red
    exit
}
# 2. Clean Install Dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
cd @types; npm ci; cd ..
cd api; npm ci; cd ..
cd web; npm ci; cd ..
# 3. Environment Variable Scaffolding
if (-not (Test-Path "web\.env")) {
    Set-Content -Path "web\.env" -Value "VITE_API_URL=http://localhost:8080"
}
if (-not (Test-Path "api\.env")) {
    Write-Host "`nWARNING: api/.env not found! Create it manually before running dbinit." -ForegroundColor Red
}
Write-Host "`nSetup complete!" -ForegroundColor Cyan
