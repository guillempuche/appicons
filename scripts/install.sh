#!/bin/bash
# appicons installer
# Usage: curl -fsSL https://raw.githubusercontent.com/guillempuche/appicons/main/scripts/install.sh | bash

set -euo pipefail

REPO="guillempuche/appicons"
INSTALL_DIR="$HOME/.appicons"
MIN_BUN_VERSION="1.0.0"

# Colors for output (disabled if not a terminal)
if [[ -t 1 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED='' GREEN='' YELLOW='' BLUE='' NC=''
fi

info() { echo -e "${GREEN}==>${NC} $1"; }
warn() { echo -e "${YELLOW}Warning:${NC} $1"; }
error() { echo -e "${RED}Error:${NC} $1" >&2; exit 1; }

# Check for required commands
check_requirements() {
    local missing=()

    command -v curl &>/dev/null || missing+=("curl")
    command -v tar &>/dev/null || missing+=("tar")

    if [[ ${#missing[@]} -gt 0 ]]; then
        error "Missing required commands: ${missing[*]}"
    fi
}

# Detect OS and architecture
detect_platform() {
    local os arch

    case "$(uname -s)" in
        Darwin) os="darwin" ;;
        Linux)
            os="linux"
            # Check for musl libc (Alpine Linux) - not supported due to native modules
            if ldd --version 2>&1 | grep -qi musl; then
                error "Alpine Linux (musl libc) is not supported due to native module dependencies"
            fi
            ;;
        MINGW*|MSYS*|CYGWIN*)
            error "Windows detected. Run in PowerShell: irm https://raw.githubusercontent.com/guillempuche/appicons/main/scripts/install.ps1 | iex"
            ;;
        *) error "Unsupported operating system: $(uname -s)" ;;
    esac

    case "$(uname -m)" in
        x86_64|amd64) arch="x64" ;;
        arm64|aarch64) arch="arm64" ;;
        *) error "Unsupported architecture: $(uname -m)" ;;
    esac

    # Check if this platform has a release
    local platform="${os}-${arch}"
    if [[ "$platform" == "linux-arm64" ]]; then
        warn "Linux ARM64 support is experimental"
    fi

    echo "$platform"
}

# Compare semver versions (returns 0 if $1 >= $2)
version_gte() {
    local v1="$1" v2="$2"
    # Use sort -V if available, otherwise simple string compare
    if printf '%s\n%s' "$v2" "$v1" | sort -V 2>/dev/null | head -n1 | grep -qx "$v2"; then
        return 0
    fi
    # Fallback: assume version is sufficient if sort -V fails
    return 0
}

# Check if Bun is installed with minimum version
ensure_bun() {
    if command -v bun &>/dev/null; then
        local version
        version=$(bun --version 2>/dev/null || echo "0.0.0")
        if version_gte "$version" "$MIN_BUN_VERSION"; then
            info "Bun is already installed: $version"
            return 0
        else
            warn "Bun version $version is below minimum $MIN_BUN_VERSION, upgrading..."
        fi
    fi

    info "Installing Bun runtime..."
    if ! curl -fsSL https://bun.sh/install | bash; then
        error "Failed to install Bun. Please install manually: https://bun.sh"
    fi

    # Source the updated PATH
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"

    if ! command -v bun &>/dev/null; then
        error "Failed to install Bun. Please install manually: https://bun.sh"
    fi

    info "Bun installed successfully: $(bun --version)"
}

# Get latest release version from GitHub
get_latest_version() {
    local response version http_code

    # Use a temp file to capture both body and http code
    local tmp_file
    tmp_file=$(mktemp)
    trap "rm -f '$tmp_file'" RETURN

    http_code=$(curl -fsSL -w "%{http_code}" -o "$tmp_file" \
        "https://api.github.com/repos/${REPO}/releases/latest" 2>/dev/null) || true

    if [[ "$http_code" == "403" ]]; then
        error "GitHub API rate limit exceeded. Try again later or set GITHUB_TOKEN environment variable"
    elif [[ "$http_code" != "200" ]]; then
        error "Failed to fetch latest version from GitHub (HTTP $http_code)"
    fi

    version=$(grep '"tag_name"' "$tmp_file" | sed -E 's/.*"([^"]+)".*/\1/' | head -1)

    if [[ -z "$version" ]]; then
        error "Failed to parse version from GitHub response"
    fi

    echo "$version"
}

# Download and extract release archive
download_release() {
    local platform="$1"
    local version="$2"
    local archive_name="appicons-${platform}.tar.gz"
    local download_url="https://github.com/${REPO}/releases/download/${version}/${archive_name}"

    info "Downloading appicons ${version} for ${platform}..."

    # Create temp directory
    local tmp_dir
    tmp_dir=$(mktemp -d)
    trap "rm -rf '$tmp_dir'" EXIT

    # Download archive
    if ! curl -fsSL "$download_url" -o "$tmp_dir/$archive_name"; then
        error "Failed to download release. Check if ${platform} is supported: $download_url"
    fi

    # Verify archive is valid
    if ! tar -tzf "$tmp_dir/$archive_name" &>/dev/null; then
        error "Downloaded archive is corrupted"
    fi

    # Remove existing installation
    if [[ -d "$INSTALL_DIR" ]]; then
        info "Removing existing installation..."
        rm -rf "$INSTALL_DIR"
    fi

    # Create install directory and extract
    mkdir -p "$INSTALL_DIR"
    tar -xzf "$tmp_dir/$archive_name" -C "$INSTALL_DIR"

    # Verify extraction
    if [[ ! -f "$INSTALL_DIR/appicons.js" ]]; then
        error "Installation failed: appicons.js not found after extraction"
    fi

    info "Extracted to $INSTALL_DIR"
}

# Create wrapper script that runs with Bun
create_wrapper() {
    local wrapper_path="$INSTALL_DIR/appicons"

    cat > "$wrapper_path" << 'WRAPPER'
#!/bin/bash
# appicons wrapper - runs the JS bundle with Bun

set -euo pipefail

# Find Bun (prefer system bun, then user installation)
find_bun() {
    if command -v bun &>/dev/null; then
        command -v bun
    elif [[ -x "$HOME/.bun/bin/bun" ]]; then
        echo "$HOME/.bun/bin/bun"
    else
        echo "Error: Bun is not installed. Please run: curl -fsSL https://bun.sh/install | bash" >&2
        exit 1
    fi
}

BUN_PATH="$(find_bun)"

# Get the directory where this script is located (resolving symlinks)
# This handles: direct execution, symlinks, nested symlinks, relative symlinks
resolve_script_dir() {
    local source="${BASH_SOURCE[0]}"
    local dir

    # Resolve symlinks
    while [[ -L "$source" ]]; do
        dir="$(cd -P "$(dirname "$source")" && pwd)"
        source="$(readlink "$source")"
        # Handle relative symlinks
        [[ "$source" != /* ]] && source="$dir/$source"
    done

    cd -P "$(dirname "$source")" && pwd
}

SCRIPT_DIR="$(resolve_script_dir)"

# Verify the JS file exists
if [[ ! -f "$SCRIPT_DIR/appicons.js" ]]; then
    echo "Error: appicons.js not found in $SCRIPT_DIR" >&2
    echo "Please reinstall: curl -fsSL https://raw.githubusercontent.com/guillempuche/appicons/main/scripts/install.sh | bash" >&2
    exit 1
fi

# Run the CLI with Bun
exec "$BUN_PATH" "$SCRIPT_DIR/appicons.js" "$@"
WRAPPER

    chmod +x "$wrapper_path"
    info "Created wrapper script"
}

# Determine best bin directory
get_bin_dir() {
    # Prefer XDG_BIN_HOME if set
    if [[ -n "${XDG_BIN_HOME:-}" ]] && [[ -d "$XDG_BIN_HOME" ]]; then
        echo "$XDG_BIN_HOME"
        return
    fi

    # Prefer ~/.local/bin (create if needed, avoids sudo)
    if [[ -d "$HOME/.local/bin" ]] || mkdir -p "$HOME/.local/bin" 2>/dev/null; then
        echo "$HOME/.local/bin"
        return
    fi

    # Fall back to /usr/local/bin (requires sudo)
    echo "/usr/local/bin"
}

# Create symlink in bin directory
create_symlink() {
    local wrapper_path="$INSTALL_DIR/appicons"
    local bin_dir
    bin_dir=$(get_bin_dir)
    local symlink_path="$bin_dir/appicons"

    # Create bin directory if needed
    if [[ ! -d "$bin_dir" ]]; then
        if [[ "$bin_dir" == "$HOME"* ]]; then
            mkdir -p "$bin_dir"
        elif command -v sudo &>/dev/null && sudo -n true 2>/dev/null; then
            # sudo available without password
            warn "$bin_dir does not exist, creating it..."
            sudo mkdir -p "$bin_dir"
        else
            error "$bin_dir does not exist and cannot create without sudo. Please run: sudo mkdir -p $bin_dir"
        fi
    fi

    # Remove existing symlink/file
    if [[ -L "$symlink_path" ]] || [[ -f "$symlink_path" ]]; then
        info "Removing existing symlink..."
        if [[ -w "$bin_dir" ]]; then
            rm -f "$symlink_path"
        elif command -v sudo &>/dev/null && sudo -n true 2>/dev/null; then
            sudo rm -f "$symlink_path"
        else
            error "Cannot remove $symlink_path without sudo. Please run: sudo rm -f $symlink_path"
        fi
    fi

    # Create new symlink
    if [[ -w "$bin_dir" ]]; then
        ln -s "$wrapper_path" "$symlink_path"
    elif command -v sudo &>/dev/null && sudo -n true 2>/dev/null; then
        info "Creating symlink (using sudo)..."
        sudo ln -s "$wrapper_path" "$symlink_path"
    else
        error "Cannot create symlink in $bin_dir without sudo. Please run: sudo ln -s $wrapper_path $symlink_path"
    fi

    info "Created symlink: $symlink_path -> $wrapper_path"

    # Check if bin_dir is in PATH
    if [[ ":$PATH:" != *":$bin_dir:"* ]]; then
        warn "$bin_dir is not in your PATH"
        echo ""
        echo "  Add this to your ~/.bashrc or ~/.profile:"
        echo ""
        echo "    export PATH=\"$bin_dir:\$PATH\""
        echo ""
        echo "  Then run: source ~/.bashrc"
    fi
}

# Verify installation
verify_installation() {
    # Refresh PATH to include new symlink location
    local bin_dir
    bin_dir=$(get_bin_dir)
    export PATH="$bin_dir:$PATH"

    if ! command -v appicons &>/dev/null; then
        return 1
    fi

    info "Verifying installation..."
    if appicons --version 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

main() {
    echo ""
    echo "  appicons installer"
    echo "  Generate app icons, splash screens, and adaptive icons"
    echo ""

    check_requirements

    local platform version
    platform=$(detect_platform)
    info "Detected platform: $platform"

    ensure_bun

    version=$(get_latest_version)
    info "Latest version: $version"

    download_release "$platform" "$version"
    create_wrapper
    create_symlink

    echo ""
    if verify_installation; then
        echo ""
        info "Installation complete!"
        echo ""
        echo "  Run 'appicons' to launch the interactive TUI"
        echo "  Run 'appicons --help' for CLI options"
        echo ""
    else
        echo ""
        warn "Installation complete, but verification failed."
        echo "  Try restarting your terminal or running:"
        echo "  source ~/.bashrc  # or ~/.zshrc"
        echo ""
    fi
}

main "$@"
