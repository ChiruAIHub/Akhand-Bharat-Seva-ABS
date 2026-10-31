param (
    [string]$TargetDrive = "D:",
    [string]$ProjectName = "Hacktoberfest2026_GitLaunch"
)

# Project root directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceDir = Split-Path -Parent $scriptDir
if (-not (Test-Path "$sourceDir\README.md")) {
    $sourceDir = "C:\Users\Techcho\.gemini\antigravity\scratch\gitlaunch-contribution-finder"
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " GitLaunch Team Sync -> External Hard Drive ($TargetDrive)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verify Drive D: is connected
if (-not (Test-Path "$TargetDrive\")) {
    Write-Host "Notice: External Drive $TargetDrive is not currently mounted on this machine." -ForegroundColor Yellow
    Write-Host "(Your teammate may currently have Drive D: plugged into the second laptop)." -ForegroundColor Gray
    Write-Host "A self-contained portable zip is also ready at: dist\Hacktoberfest2026_Full_Track1_Track2_Latest.zip" -ForegroundColor Green
    Write-Host "Plug in Drive D: and rerun this script anytime to auto-mirror." -ForegroundColor Yellow
    exit 0
}

$destBase = Join-Path "$TargetDrive\" $ProjectName
$destCurrent = Join-Path $destBase "current"
$destSnapshots = Join-Path $destBase "snapshots"

New-Item -ItemType Directory -Path $destCurrent -Force | Out-Null
New-Item -ItemType Directory -Path $destSnapshots -Force | Out-Null

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$snapshotZip = Join-Path $destSnapshots "backup_$timestamp.zip"

Write-Host "Source Directory: $sourceDir" -ForegroundColor Gray
Write-Host "Target Directory: $destCurrent" -ForegroundColor Gray
Write-Host "Syncing code files to Drive D..." -ForegroundColor Yellow

# Copy files using robocopy
$exclude = @("node_modules", ".venv", "venv", "__pycache__", ".git", ".next", "dist", "build")
robocopy $sourceDir $destCurrent /MIR /R:1 /W:1 /NP /XD $exclude /XF *.pyc *.log *.tmp | Out-Null

# Create a timestamped zip archive
Write-Host "Creating timestamped backup: backup_$timestamp.zip..." -ForegroundColor Yellow
try {
    Compress-Archive -Path "$destCurrent\*" -DestinationPath $snapshotZip -Force
    Write-Host "Snapshot zip created: $snapshotZip" -ForegroundColor Green
} catch {
    Write-Host "Note: Zip snapshot skipped, files are copied." -ForegroundColor Yellow
}

$fileCount = (Get-ChildItem -Path $destCurrent -Recurse -File).Count
$totalSizeMB = [math]::Round(((Get-ChildItem -Path $destCurrent -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB), 2)

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " SYNC COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host " - Synced Files: $fileCount files ($totalSizeMB MB)" -ForegroundColor Green
Write-Host " - Target Folder: $destCurrent" -ForegroundColor Green
Write-Host " - Snapshot Zip : $snapshotZip" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
