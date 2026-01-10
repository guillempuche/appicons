# Releasing

This project uses [release-it](https://github.com/release-it/release-it) with [CalVer](https://calver.org/) versioning (`yyyy.mm.minor`).

## Setup (One-Time)

### NPM Authentication

```bash
# Login to NPM
npm login

# Set NPM automation token (bypasses 2FA for CI/CD)
npm config set //registry.npmjs.org/:_authToken YOUR_AUTOMATION_TOKEN
```

To create an automation token:
1. Go to [npmjs.com](https://www.npmjs.com/) → Access Tokens
2. Generate new token → Automation
3. Copy the token and use it in the command above

## Release Process

```bash
GITHUB_TOKEN=$(gh auth token) bun run release
```

This command will:

1. Run typecheck and lint
2. Build the project
3. Bump version (e.g., `2026.1.0` → `2026.1.1`)
4. Create git tag and commit
5. Publish to NPM
6. Create GitHub release

## Version Format

CalVer format: `YYYY.MM.PATCH`

- `YYYY` - Full year (e.g., 2026)
- `MM` - Month without zero-padding (e.g., 1, 12)
- `PATCH` - Incremental patch number within the month

Examples:
- `2026.1.0` - First release in January 2026
- `2026.1.1` - Second release in January 2026
- `2026.2.0` - First release in February 2026
