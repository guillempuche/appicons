# appicons - Agent Reference

Reference documentation for AI agents working with this codebase.

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/guillempuche/appicons/main/scripts/install.sh | bash
```

## Architecture

```
src/
├── cli.ts                      # Effect-based CLI entry point
├── index.tsx                   # OpenTUI interactive TUI entry
├── types.ts                    # Core type definitions
├── assets/
│   └── asset_specs.ts          # Platform-specific asset specifications
├── generators/
│   ├── asset_generator.ts      # Main generation orchestrator
│   ├── background_generator.ts # Background layer generation
│   └── foreground_generator.ts # Foreground layer generation
├── components/
│   ├── app.tsx                 # Root TUI component
│   ├── config_screen.tsx       # Configuration form screen
│   ├── preview_screen.tsx      # Asset preview screen
│   ├── live_preview.tsx        # Real-time preview component
│   ├── image_preview.tsx       # Terminal image preview
│   └── autocomplete_input.tsx  # Google Fonts autocomplete
└── utils/
    ├── google_fonts.ts         # Google Fonts catalog
    ├── google_fonts_api.ts     # Google Fonts API client
    ├── font_loader.ts          # Font loading utilities
    └── instructions.ts         # Integration instructions generator
```

## Key Types

### AssetGeneratorConfig

Main configuration object for asset generation:

| Field | Type | Description |
|-------|------|-------------|
| `appName` | `string` | Application name |
| `platforms` | `('ios' \| 'android' \| 'web')[]` | Target platforms |
| `assetTypes` | `('icon' \| 'splash' \| 'adaptive' \| 'favicon')[]` | Asset types |
| `background` | `BackgroundConfig` | Background layer configuration |
| `foreground` | `ForegroundConfig` | Foreground layer configuration |
| `outputDir` | `string` | Output directory path |
| `iconScale` | `number?` | Icon foreground scale (0.1-1.5, default 0.7) |
| `splashScale` | `number?` | Splash foreground scale (0.05-1.0, default 0.25) |
| `faviconScale` | `number?` | Favicon foreground scale (0.5-1.0, default 0.85) |
| `generateDarkMode` | `boolean?` | Generate dark mode variants |
| `darkBackground` | `BackgroundConfig?` | Dark mode background |

### BackgroundConfig

| Type | Properties |
|------|------------|
| `color` | `color: { type: 'solid', color: string }` |
| `gradient` | `gradient: { type: 'linear' \| 'radial', colors: string[], angle?: number }` |
| `image` | `imagePath: string` |

### ForegroundConfig

| Type | Properties |
|------|------------|
| `text` | `text`, `fontFamily`, `color`, `fontSource`, `fontSize?`, `fontPath?` |
| `svg` | `svgPath`, `color?` |
| `image` | `imagePath` |

## Generation Pipeline

1. **Determine Asset Specs**: `determineAssetSpecs()` - Creates list of assets to generate based on platforms/types
2. **Generate Background**: `generateBackground()` - Creates background layer (color/gradient/image)
3. **Generate Foreground**: `generateForeground()` - Creates foreground layer (text/svg/image)
4. **Composite**: Sharp composites foreground onto background with scaling
5. **Write**: Saves to `outputDir` with platform-specific subdirectories

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Run CLI in development mode |
| `bun run dev generate --help` | Show generate command options |
| `bun run tui` | Launch interactive TUI |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run lint` | Run Biome linting |
| `bun run test` | Run tests with vitest |

## Output Structure

Generated assets are organized by platform:

```
assets/generated_YYYY-MM-DD_HH-MM-SS/
├── ios/
│   ├── icon-1024.png
│   └── splash-*.png
├── android/
│   ├── mipmap-*/
│   │   └── ic_launcher.png
│   └── drawable-*/
│       └── splash.png
├── web/
│   ├── icon-*.png
│   └── favicon.ico
└── README.md
```

## Dependencies

- **Sharp**: Image processing and composition
- **OpenType.js**: Font file parsing
- **Effect**: Functional effects for CLI
- **OpenTUI**: Terminal UI framework
