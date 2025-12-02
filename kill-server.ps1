# Quick script to kill the server on port 5000
$port = 5000
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($process) {
    Write-Host "Killing process $process on port $port..." -ForegroundColor Yellow
    Stop-Process -Id $process -Force
    Write-Host "✅ Server killed!" -ForegroundColor Green
} else {
    Write-Host "No process found on port $port" -ForegroundColor Gray
}



