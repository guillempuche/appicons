# Contributing

Thank you for your interest in contributing to appicons!

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) runtime
- [Nix](https://nixos.org/) (recommended for reproducible environment)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/guillempuche/appicons.git
cd appicons

# Enter Nix environment (recommended)
nix develop

# Install dependencies
bun install
```

### Running Locally

```bash
# Run TUI in development
bun run tui

# Run CLI in development
bun run dev

# Run CLI with arguments
bun run dev generate --help
```

### Code Quality

```bash
# Type checking
bun run typecheck

# Lint and format
bun run lint
```

## How to Contribute

### Reporting Issues

- Search existing issues before creating a new one
- Include reproduction steps, expected behavior, and actual behavior
- Include your environment (OS, Bun version, Node version)

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run `bun run typecheck` and `bun run lint`
5. Commit with a descriptive message
6. Push to your fork and open a PR

### Code Style

- TypeScript with strict mode
- Use existing patterns in the codebase
- Keep functions small and focused
- Add JSDoc comments for public APIs
