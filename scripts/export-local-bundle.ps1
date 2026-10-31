# Export local bundle for cross-laptop sharing (Wi-Fi / Google Drive / USB)
$projectRoot = Split-Path -Parent $PSScriptRoot
$distDir = Join-Path $projectRoot "dist"
New-Item -ItemType Directory -Path $distDir -Force | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$zipPath = Join-Path $distDir "Hacktoberfest2026_Full_Track1_Track2_$timestamp.zip"
$latestZip = Join-Path $distDir "Hacktoberfest2026_Full_Track1_Track2_Latest.zip"

Write-Host "Creating offline portable project bundle (excluding node_modules)..." -ForegroundColor Cyan

$tempDir = Join-Path $distDir "temp_bundle"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copy folders while excluding heavy node_modules and .angular
$folders = @("backend", "data", "scripts", "templates")
foreach ($f in $folders) {
    $src = Join-Path $projectRoot $f
    if (Test-Path $src) {
        Copy-Item $src -Destination $tempDir -Recurse -Force
    }
}

# Clean any pycache or temp files in tempDir
Get-ChildItem -Path $tempDir -Include "__pycache__" -Recurse -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# For frontend, copy source and built dist but exclude node_modules and .angular
$frontendTemp = Join-Path $tempDir "frontend"
New-Item -ItemType Directory -Path $frontendTemp -Force | Out-Null
robocopy (Join-Path $projectRoot "frontend") $frontendTemp /E /XD node_modules .angular .git /XF *.log | Out-Null

Copy-Item (Join-Path $projectRoot "README.md") -Destination $tempDir -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $projectRoot "requirements.txt") -Destination $tempDir -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $projectRoot "municipal_auth.py") -Destination $tempDir -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $projectRoot "START_BACKEND_SERVER.bat") -Destination $tempDir -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $projectRoot "start_integrated_server.bat") -Destination $tempDir -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $projectRoot "run_15min_soak_test.bat") -Destination $tempDir -Force -ErrorAction SilentlyContinue

Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force
Copy-Item $zipPath $latestZip -Force
Remove-Item $tempDir -Recurse -Force

Write-Host "Portable bundle created successfully!" -ForegroundColor Green
Write-Host "Path: $latestZip" -ForegroundColor Green
