---
name: release
description: Create a new release with version bump, git tag, and GitHub release with binary builds. Use when releasing a new version.
---

# Release Skill

Create versioned releases with CalVer versioning and GitHub binary distribution.

## Quick Release

```bash
GITHUB_TOKEN=$(gh auth token) bun run release --ci
```

The `--ci` flag runs non-interactively (no prompts). This command:
1. Runs typecheck and lint checks
2. Builds the project
3. Bumps version (CalVer: `YYYY.MM.PATCH`)
4. Creates git tag and commit
5. Creates GitHub release (triggers binary builds)

## Version Format

CalVer format: `YYYY.MM.PATCH`

| Part | Description | Example |
|------|-------------|---------|
| `YYYY` | Full year | 2026 |
| `MM` | Month (no zero-padding) | 1, 12 |
| `PATCH` | Incremental within month | 0, 1, 2 |

Examples:
- `2026.1.0` - First release in January 2026
- `2026.1.1` - Second release in January 2026
- `2026.2.0` - First release in February 2026

## GitHub Actions Build

On tag push (`v*`), the release workflow automatically:

1. **Builds for all platforms:**
   - darwin-arm64 (Apple Silicon Mac)
   - darwin-x64 (Intel Mac)
   - linux-x64 (Linux)
   - win32-x64 (Windows)

2. **Packages each platform:**
   - Minified JS bundle
   - Sharp native modules
   - ~8MB compressed per platform

3. **Creates GitHub Release:**
   - Uploads all platform archives
   - Auto-generates release notes

## Manual Steps After Release

1. **Verify GitHub Actions completed:**
   ```bash
   gh run list --limit 5
   ```

2. **Check release assets:**
   ```bash
   gh release view v$(cat package.json | jq -r .version)
   ```

3. **Test installation:**
   ```bash
   curl -fsSL https://raw.githubusercontent.com/guillempuche/appicons/main/scripts/install.sh | bash
   appicons --version
   ```

## Troubleshooting

### Build Fails on a Platform

Check the specific job in GitHub Actions:
```bash
gh run view --log-failed
```

### Missing Release Assets

Re-run failed jobs:
```bash
gh run rerun <run-id> --failed
```

### Version Mismatch

If local version differs from remote:
```bash
git fetch --tags
git describe --tags --abbrev=0
```
