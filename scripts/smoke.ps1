# Быстрая проверка API после деплоя (PowerShell).
# Пример: .\scripts\smoke.ps1 -ApiUrl "https://jumysaq-api.onrender.com"
param(
    [Parameter(Mandatory = $true)]
    [string] $ApiUrl
)
$base = $ApiUrl.TrimEnd("/")
Write-Host "GET $base/api/health"
$h = Invoke-RestMethod -Uri "$base/api/health" -Method Get
if (-not $h.ok) { throw "Health check failed: $h" }
Write-Host "OK health:" ($h | ConvertTo-Json -Compress)

Write-Host "GET $base/api/jobs (first page)"
$jobs = Invoke-RestMethod -Uri "$base/api/jobs" -Method Get
$count = @($jobs).Count
Write-Host "OK jobs count: $count"
if ($count -lt 1) { Write-Warning "No jobs in DB — run: cd backend && python -m app.seed" }

Write-Host "Smoke finished successfully."
