Write-Host "Launching API and Web servers..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api; title API Server; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd web; title Web Server; npm run dev"
