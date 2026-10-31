<#
.SYNOPSIS
    Pulls the latest unified project files from Drive D: to the current laptop.
#>

param (
    [string]$TargetDrive = "D:",
    [string]$BackupDirName = "Hacktoberfest2026_GitLaunch"
)

$destDir = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$destDir\README.md")) {
    $destDir = (Get-Location).Path
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " 🚀 Pulling Latest Project from Drive D: -> Local Machine" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path "$TargetDrive\")) {
    if (Test-Path "E:\") {
        Write-Host "Notice: Drive $TargetDrive was not detected. Auto-routed to active external drive E:\" -ForegroundColor Yellow
        $TargetDrive = "E:"
    }
}
$sourceDir = Join-Path "$TargetDrive\" "$BackupDirName\current"

if (-not (Test-Path $sourceDir)) {
    Write-Host "❌ Error: Could not find project files in $sourceDir" -ForegroundColor Red
    exit 1
}

Write-Host "📂 Pulling from : $sourceDir" -ForegroundColor Yellow
Write-Host "💻 Target local : $destDir" -ForegroundColor Yellow

$excludeDirs = @("node_modules", ".venv", "venv", "__pycache__", ".git")
$robocopyArgs = @(
    $sourceDir,
    $destDir,
    "/MIR",
    "/R:1",
    "/W:1",
    "/NP",
    "/XD"
) + $excludeDirs

& robocopy.exe @robocopyArgs | Out-Null

Write-Host "✅ Local laptop updated with latest files from Drive D!" -ForegroundColor Green
