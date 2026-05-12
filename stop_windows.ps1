# Wi-Fi Fingerprinting System - Windows Stop Script (PowerShell)

Write-Host ""
Write-Host "🛑 Stopping Wi-Fi Fingerprinting System..." -ForegroundColor Yellow
Write-Host ""

# Kill processes on ports
Write-Host "Stopping processes on port 5001..." -ForegroundColor Cyan
Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "Killing process $($_.OwningProcess)..." -ForegroundColor Gray
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

Write-Host "Stopping processes on port 8080..." -ForegroundColor Cyan
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "Killing process $($_.OwningProcess)..." -ForegroundColor Gray
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

# Kill from PID files
if (Test-Path "logs\backend.pid") {
    $pid = Get-Content "logs\backend.pid"
    Write-Host "Killing backend from PID file: $pid" -ForegroundColor Gray
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Remove-Item "logs\backend.pid" -ErrorAction SilentlyContinue
}

if (Test-Path "logs\frontend.pid") {
    $pid = Get-Content "logs\frontend.pid"
    Write-Host "Killing frontend from PID file: $pid" -ForegroundColor Gray
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Remove-Item "logs\frontend.pid" -ErrorAction SilentlyContinue
}

# Stop background jobs
Get-Job | Stop-Job -ErrorAction SilentlyContinue
Get-Job | Remove-Job -ErrorAction SilentlyContinue

# Kill all Python processes (fallback)
Write-Host "Stopping all Python processes..." -ForegroundColor Cyan
Get-Process python* -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ System stopped successfully" -ForegroundColor Green
Write-Host ""


