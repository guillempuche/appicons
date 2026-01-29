# appicons installer for Windows
# Usage: irm https://raw.githubusercontent.com/guillempuche/appicons/main/scripts/install.ps1 | iex

$ErrorActionPreference = "Stop"

$Repo = "guillempuche/appicons"
$InstallDir = "$env:LOCALAPPDATA\appicons"
$BinDir = "$env:LOCALAPPDATA\Microsoft\WindowsApps"

function Write-Info { param($msg) Write-Host "==> " -ForegroundColor Green -NoNewline; Write-Host $msg }
function Write-Warn { param($msg) Write-Host "Warning: " -ForegroundColor Yellow -NoNewline; Write-Host $msg }
function Write-Err { param($msg) Write-Host "Error: " -ForegroundColor Red -NoNewline; Write-Host $msg; exit 1 }

function Get-Platform {
    $arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
    if ($arch -eq "x86") {
        Write-Err "32-bit Windows is not supported"
    }
    return "win32-x64"
}

function Install-Bun {
    if (Get-Command bun -ErrorAction SilentlyContinue) {
        Write-Info "Bun is already installed: $(bun --version)"
        return
    }

    Write-Info "Installing Bun runtime..."
    irm bun.sh/install.ps1 | iex

    # Refresh PATH
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "User") + ";" + [Environment]::GetEnvironmentVariable("Path", "Machine")

    if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
        Write-Err "Failed to install Bun. Please install manually: https://bun.sh"
    }

    Write-Info "Bun installed successfully: $(bun --version)"
}

function Get-LatestVersion {
    try {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest"
        return $release.tag_name
    } catch {
        Write-Err "Failed to fetch latest version from GitHub"
    }
}

function Install-Release {
    param($Platform, $Version)

    $archiveName = "appicons-$Platform.zip"
    $downloadUrl = "https://github.com/$Repo/releases/download/$Version/$archiveName"

    Write-Info "Downloading appicons $Version for $Platform..."

    $tempDir = New-Item -ItemType Directory -Path "$env:TEMP\appicons-install-$(Get-Random)"
    $archivePath = Join-Path $tempDir $archiveName

    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $archivePath -UseBasicParsing

        # Remove existing installation
        if (Test-Path $InstallDir) {
            Write-Info "Removing existing installation..."
            Remove-Item -Recurse -Force $InstallDir
        }

        # Extract
        New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
        Expand-Archive -Path $archivePath -DestinationPath $InstallDir -Force

        Write-Info "Extracted to $InstallDir"
    } finally {
        Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
    }
}

function New-Wrapper {
    $wrapperPath = Join-Path $InstallDir "appicons.cmd"

    @"
@echo off
setlocal

where bun >nul 2>&1
if %errorlevel% equ 0 (
    set "BUN_PATH=bun"
) else if exist "%USERPROFILE%\.bun\bin\bun.exe" (
    set "BUN_PATH=%USERPROFILE%\.bun\bin\bun.exe"
) else (
    echo Error: Bun is not installed. Please run: irm bun.sh/install.ps1 ^| iex >&2
    exit /b 1
)

%BUN_PATH% "%~dp0appicons.js" %*
"@ | Out-File -FilePath $wrapperPath -Encoding ASCII

    Write-Info "Created wrapper script"
}

function New-PathEntry {
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")

    if ($userPath -notlike "*$InstallDir*") {
        Write-Info "Adding $InstallDir to PATH..."
        [Environment]::SetEnvironmentVariable("Path", "$userPath;$InstallDir", "User")
        $env:Path = "$env:Path;$InstallDir"
    }

    Write-Info "appicons is available in PATH"
}

function Test-Installation {
    Write-Info "Verifying installation..."

    # Refresh PATH
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "User") + ";" + [Environment]::GetEnvironmentVariable("Path", "Machine")

    try {
        $cmd = Join-Path $InstallDir "appicons.cmd"
        & $cmd --version
        return $true
    } catch {
        return $false
    }
}

function Main {
    Write-Host ""
    Write-Host "  appicons installer"
    Write-Host "  Generate app icons, splash screens, and adaptive icons"
    Write-Host ""

    $platform = Get-Platform
    Write-Info "Detected platform: $platform"

    Install-Bun

    $version = Get-LatestVersion
    Write-Info "Latest version: $version"

    Install-Release -Platform $platform -Version $version
    New-Wrapper
    New-PathEntry

    Write-Host ""
    if (Test-Installation) {
        Write-Host ""
        Write-Info "Installation complete!"
        Write-Host ""
        Write-Host "  Run 'appicons' to launch the interactive TUI"
        Write-Host "  Run 'appicons --help' for CLI options"
        Write-Host ""
        Write-Host "  Note: You may need to restart your terminal for PATH changes to take effect."
        Write-Host ""
    } else {
        Write-Host ""
        Write-Warn "Installation complete, but verification failed."
        Write-Host "  Try restarting your terminal."
        Write-Host ""
    }
}

Main
