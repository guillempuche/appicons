#!/bin/bash
# appicons uninstaller
# Removes appicons installation and symlinks

set -euo pipefail

INSTALL_DIR="$HOME/.appicons"
BIN_DIR="/usr/local/bin"
SYMLINK_PATH="$BIN_DIR/appicons"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() { echo -e "${GREEN}==>${NC} $1"; }
warn() { echo -e "${YELLOW}Warning:${NC} $1"; }
error() { echo -e "${RED}Error:${NC} $1" >&2; exit 1; }

main() {
    echo ""
    echo "  appicons uninstaller"
    echo ""

    local found=false

    # Remove symlink
    if [[ -L "$SYMLINK_PATH" ]] || [[ -f "$SYMLINK_PATH" ]]; then
        info "Removing symlink: $SYMLINK_PATH"
        if [[ -w "$BIN_DIR" ]]; then
            rm -f "$SYMLINK_PATH"
        else
            sudo rm -f "$SYMLINK_PATH"
        fi
        found=true
    fi

    # Remove installation directory
    if [[ -d "$INSTALL_DIR" ]]; then
        info "Removing installation directory: $INSTALL_DIR"
        rm -rf "$INSTALL_DIR"
        found=true
    fi

    echo ""
    if $found; then
        info "appicons has been uninstalled successfully."
    else
        warn "appicons was not found on this system."
    fi

    echo ""
    echo "  Note: Bun runtime was not removed."
    echo "  To remove Bun, run: rm -rf ~/.bun"
    echo ""
}

main "$@"
