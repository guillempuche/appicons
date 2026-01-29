#!/bin/bash
# appicons installer
# Usage: curl -fsSL https://raw.githubusercontent.com/guillempuche/appicons/main/scripts/install.sh | bash

set -euo pipefail

REPO="guillempuche/appicons"
INSTALL_DIR="$HOME/.appicons"
BIN_DIR="/usr/local/bin"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() { echo -e "${GREEN}==>${NC} $1"; }
warn() { echo -e "${YELLOW}Warning:${NC} $1"; }
error() { echo -e "${RED}Error:${NC} $1" >&2; exit 1; }

# Detect OS and architecture
detect_platform() {
    local os arch

    case "$(uname -s)" in
        Darwin) os="darwin" ;;
        Linux)  os="linux" ;;
        MINGW*|MSYS*|CYGWIN*) error "Windows detected. Run in PowerShell: irm https://raw.githubusercontent.com/guillempuche/appicons/main/scripts/install.ps1 | iex" ;;
        *) error "Unsupported operating system: $(uname -s)" ;;
    esac

    case "$(uname -m)" in
        x86_64|amd64) arch="x64" ;;
        arm64|aarch64) arch="arm64" ;;
        *) error "Unsupported architecture: $(uname -m)" ;;
    esac

    echo "${os}-${arch}"
}

# Check if Bun is installed, install if missing
ensure_bun() {
    if command -v bun &> /dev/null; then
        info "Bun is already installed: $(bun --version)"
        return 0
    fi

    info "Installing Bun runtime..."
    curl -fsSL https://bun.sh/install | bash

    # Source the updated PATH
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"

    if ! command -v bun &> /dev/null; then
        error "Failed to install Bun. Please install manually: https://bun.sh"
    fi

    info "Bun installed successfully: $(bun --version)"
}

# Get latest release version from GitHub
get_latest_version() {
    local version
    version=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')

    if [[ -z "$version" ]]; then
        error "Failed to fetch latest version from GitHub"
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
        error "Failed to download release from: $download_url"
    fi

    # Remove existing installation
    if [[ -d "$INSTALL_DIR" ]]; then
        info "Removing existing installation..."
        rm -rf "$INSTALL_DIR"
    fi

    # Create install directory and extract
    mkdir -p "$INSTALL_DIR"
    tar -xzf "$tmp_dir/$archive_name" -C "$INSTALL_DIR"

    info "Extracted to $INSTALL_DIR"
}

# Create wrapper script that runs with Bun
create_wrapper() {
    local wrapper_path="$INSTALL_DIR/appicons"

    cat > "$wrapper_path" << 'WRAPPER'
#!/bin/bash
# appicons wrapper - runs the JS bundle with Bun

# Find Bun
if command -v bun &> /dev/null; then
    BUN_PATH="bun"
elif [[ -f "$HOME/.bun/bin/bun" ]]; then
    BUN_PATH="$HOME/.bun/bin/bun"
else
    echo "Error: Bun is not installed. Please run: curl -fsSL https://bun.sh/install | bash" >&2
    exit 1
fi

# Get the directory where this script is located (resolving symlinks)
SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do
    DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
    SOURCE="$(readlink "$SOURCE")"
    # If SOURCE is relative, resolve it relative to the symlink's directory
    [[ "$SOURCE" != /* ]] && SOURCE="$DIR/$SOURCE"
done
SCRIPT_DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"

# Run the CLI with Bun
exec "$BUN_PATH" "$SCRIPT_DIR/appicons.js" "$@"
WRAPPER

    chmod +x "$wrapper_path"
    info "Created wrapper script"
}

# Create symlink in /usr/local/bin
create_symlink() {
    local wrapper_path="$INSTALL_DIR/appicons"
    local symlink_path="$BIN_DIR/appicons"

    if [[ ! -d "$BIN_DIR" ]]; then
        warn "$BIN_DIR does not exist, creating it..."
        sudo mkdir -p "$BIN_DIR"
    fi

    # Remove existing symlink
    if [[ -L "$symlink_path" ]] || [[ -f "$symlink_path" ]]; then
        info "Removing existing symlink..."
        sudo rm -f "$symlink_path"
    fi

    # Create new symlink
    if [[ -w "$BIN_DIR" ]]; then
        ln -s "$wrapper_path" "$symlink_path"
    else
        info "Creating symlink (requires sudo)..."
        sudo ln -s "$wrapper_path" "$symlink_path"
    fi

    info "Created symlink: $symlink_path -> $wrapper_path"
}

# Verify installation
verify_installation() {
    if ! command -v appicons &> /dev/null; then
        warn "appicons is not in PATH. You may need to restart your terminal."
        warn "Or add $BIN_DIR to your PATH."
        return 1
    fi

    info "Verifying installation..."
    appicons --version
}

main() {
    echo ""
    echo "  appicons installer"
    echo "  Generate app icons, splash screens, and adaptive icons"
    echo ""

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
        echo "  export PATH=\"$BIN_DIR:\$PATH\""
        echo ""
    fi
}

main "$@"
