# appicons installer for Windows
# Usage: irm https://raw.githubusercontent.com/guillempuche/appicons/main/scripts/install.ps1 | iex

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"  # Speed up downloads

$Repo = "guillempuche/appicons"
$InstallDir = "$env:LOCALAPPDATA\appicons"
$MinBunVersion = [version]"1.0.0"

function Write-Info { param($msg) Write-Host "==> " -ForegroundColor Green -NoNewline; Write-Host $msg }
function Write-Warn { param($msg) Write-Host "Warning: " -ForegroundColor Yellow -NoNewline; Write-Host $msg }
function Write-Err { param($msg) Write-Host "Error: " -ForegroundColor Red -NoNewline; Write-Host $msg; exit 1 }

function Get-Platform {
    $arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
    if ($arch -eq "x86") {
        Write-Err "32-bit Windows is not supported"
    }

    # Check for ARM64 Windows
    $cpuArch = $env:PROCESSOR_ARCHITECTURE
    if ($cpuArch -eq "ARM64") {
        Write-Warn "Windows ARM64 support is experimental"
        return "win32-arm64"
    }

    return "win32-x64"
}

function Test-BunVersion {
    param($CurrentVersion, $MinVersion)

    try {
        $current = [version]$CurrentVersion
        return $current -ge $MinVersion
    } catch {
        return $false
    }
}

function Install-Bun {
    $bunPath = Get-Command bun -ErrorAction SilentlyContinue

    if ($bunPath) {
        $version = (bun --version 2>$null) -replace '[^0-9.]', ''
        if (Test-BunVersion $version $MinBunVersion) {
            Write-Info "Bun is already installed: $version"
            return
        } else {
            Write-Warn "Bun version $version is below minimum $MinBunVersion, upgrading..."
        }
    }

    Write-Info "Installing Bun runtime..."

    try {
        irm bun.sh/install.ps1 | iex
    } catch {
        Write-Err "Failed to install Bun. Please install manually: https://bun.sh"
    }

    # Refresh PATH
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "User") + ";" + [Environment]::GetEnvironmentVariable("Path", "Machine")

    if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
        Write-Err "Failed to install Bun. Please install manually: https://bun.sh"
    }

    Write-Info "Bun installed successfully: $(bun --version)"
}

function Get-LatestVersion {
    try {
        $headers = @{}
        if ($env:GITHUB_TOKEN) {
            $headers["Authorization"] = "token $env:GITHUB_TOKEN"
        }

        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -Headers $headers
        return $release.tag_name
    } catch {
        if ($_.Exception.Response.StatusCode -eq 403) {
            Write-Err "GitHub API rate limit exceeded. Try again later or set GITHUB_TOKEN environment variable"
        }
        Write-Err "Failed to fetch latest version from GitHub: $($_.Exception.Message)"
    }
}

function Install-Release {
    param($Platform, $Version)

    $archiveName = "appicons-$Platform.zip"
    $downloadUrl = "https://github.com/$Repo/releases/download/$Version/$archiveName"

    Write-Info "Downloading appicons $Version for $Platform..."

    $tempDir = New-Item -ItemType Directory -Path "$env:TEMP\appicons-install-$(Get-Random)" -Force
    $archivePath = Join-Path $tempDir $archiveName

    try {
        try {
            Invoke-WebRequest -Uri $downloadUrl -OutFile $archivePath -UseBasicParsing
        } catch {
            Write-Err "Failed to download release. Check if $Platform is supported: $downloadUrl"
        }

        # Verify archive
        if (-not (Test-Path $archivePath) -or (Get-Item $archivePath).Length -eq 0) {
            Write-Err "Downloaded archive is empty or corrupted"
        }

        # Remove existing installation
        if (Test-Path $InstallDir) {
            Write-Info "Removing existing installation..."
            Remove-Item -Recurse -Force $InstallDir
        }

        # Extract
        New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
        Expand-Archive -Path $archivePath -DestinationPath $InstallDir -Force

        # Verify extraction
        $jsFile = Join-Path $InstallDir "appicons.js"
        if (-not (Test-Path $jsFile)) {
            Write-Err "Installation failed: appicons.js not found after extraction"
        }

        Write-Info "Extracted to $InstallDir"
    } finally {
        Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
    }
}

function New-Wrapper {
    $wrapperPath = Join-Path $InstallDir "appicons.cmd"

    @"
@echo off
setlocal EnableDelayedExpansion

rem Find Bun (prefer system bun, then user installation)
where bun >nul 2>&1
if %errorlevel% equ 0 (
    set "BUN_PATH=bun"
) else if exist "%USERPROFILE%\.bun\bin\bun.exe" (
    set "BUN_PATH=%USERPROFILE%\.bun\bin\bun.exe"
) else (
    echo Error: Bun is not installed. Please run: irm bun.sh/install.ps1 ^| iex >&2
    exit /b 1
)

rem Get script directory
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

rem Verify JS file exists
if not exist "%SCRIPT_DIR%\appicons.js" (
    echo Error: appicons.js not found in %SCRIPT_DIR% >&2
    echo Please reinstall: irm https://raw.githubusercontent.com/guillempuche/appicons/main/scripts/install.ps1 ^| iex >&2
    exit /b 1
)

%BUN_PATH% "%SCRIPT_DIR%\appicons.js" %*
"@ | Out-File -FilePath $wrapperPath -Encoding ASCII

    Write-Info "Created wrapper script"
}

function New-PathEntry {
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")

    if ($userPath -notlike "*$InstallDir*") {
        Write-Info "Adding $InstallDir to PATH..."
        $newPath = "$userPath;$InstallDir"
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        $env:Path = "$env:Path;$InstallDir"
        Write-Info "Added to PATH (restart terminal for changes to take effect)"
    } else {
        Write-Info "Already in PATH"
    }
}

function Test-Installation {
    Write-Info "Verifying installation..."

    # Refresh PATH
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "User") + ";" + [Environment]::GetEnvironmentVariable("Path", "Machine")

    try {
        $cmd = Join-Path $InstallDir "appicons.cmd"
        $result = & $cmd --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host $result
            return $true
        }
        return $false
    } catch {
        return $false
    }
}

function Main {
    Write-Host ""
    Write-Host "  appicons installer"
    Write-Host "  Generate app icons, splash screens, and adaptive icons"
    Write-Host ""

    # Check PowerShell version
    if ($PSVersionTable.PSVersion.Major -lt 5) {
        Write-Err "PowerShell 5.0 or later is required"
    }

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
