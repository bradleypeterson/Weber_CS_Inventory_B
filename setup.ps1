Write-Host "Starting Weber CS Tech Inventory Tracker Setup..." -ForegroundColor Cyan

# 1. Check for Strict Node v22 Requirement
$nodeVersion = node -v
if ($nodeVersion -notmatch "^v22") {
    Write-Host "ERROR: Node v22 is strictly required. You are currently running $nodeVersion." -ForegroundColor Red
    exit
}
