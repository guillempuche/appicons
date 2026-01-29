# appicons uninstaller for Windows

$ErrorActionPreference = "Stop"

$InstallDir = "$env:LOCALAPPDATA\appicons"

function Write-Info { param($msg) Write-Host "==> " -ForegroundColor Green -NoNewline; Write-Host $msg }
function Write-Warn { param($msg) Write-Host "Warning: " -ForegroundColor Yellow -NoNewline; Write-Host $msg }

function Main {
    Write-Host ""
    Write-Host "  appicons uninstaller"
    Write-Host ""

    $found = $false

    # Remove installation directory
    if (Test-Path $InstallDir) {
        Write-Info "Removing installation directory: $InstallDir"
        Remove-Item -Recurse -Force $InstallDir
        $found = $true
    }

    # Remove from PATH
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath -like "*$InstallDir*") {
        Write-Info "Removing from PATH..."
        $newPath = ($userPath -split ";" | Where-Object { $_ -ne $InstallDir }) -join ";"
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        $found = $true
    }

    Write-Host ""
    if ($found) {
        Write-Info "appicons has been uninstalled successfully."
    } else {
        Write-Warn "appicons was not found on this system."
    }

    Write-Host ""
    Write-Host "  Note: Bun runtime was not removed."
    Write-Host "  To remove Bun, delete: $env:USERPROFILE\.bun"
    Write-Host ""
}

Main
