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
    ├── instructions.ts         # Integration instructions generator
    └── safe_zone_validation.ts # Scale validation for platform safe zones
```

## Key Types

### Platform

Target platforms for asset generation:

```typescript
type Platform = 'ios' | 'android' | 'web' | 'watchos' | 'tvos' | 'visionos'
```

### AssetType

Types of assets that can be generated:

```typescript
type AssetType = 'icon' | 'splash' | 'adaptive' | 'favicon' | 'store'
```

### AssetGeneratorConfig

Main configuration object for asset generation:

| Field | Type | Description |
|-------|------|-------------|
| `appName` | `string` | Application name |
| `platforms` | `Platform[]` | Target platforms |
| `assetTypes` | `AssetType[]` | Asset types |
| `background` | `BackgroundConfig` | Background layer configuration |
| `foreground` | `ForegroundConfig` | Foreground layer configuration |
| `outputDir` | `string` | Output directory path |
| `iconScale` | `number?` | Icon foreground scale (0.1-1.5, default 0.7) |
| `splashScale` | `number?` | Splash foreground scale (0.05-1.0, default 0.25) |
| `faviconScale` | `number?` | Favicon foreground scale (0.5-1.0, default 0.85) |
| `storeScale` | `number?` | Store listing foreground scale (0.3-0.8, default 0.5) |
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
5. **Generate Configs**: Creates platform-specific config files (Contents.json, ic_launcher.xml)
6. **Write**: Saves to `outputDir` with platform-specific subdirectories

## Safe Zone Validation

Platform-specific safe zones for icon content:

| Platform | Max Scale | Recommended | Notes |
|----------|-----------|-------------|-------|
| Android adaptive | 0.61 | 0.6 | 66dp of 108dp canvas |
| Web maskable | 0.80 | 0.7 | W3C PWA safe zone |
| watchOS/visionOS | 0.80 | 0.7 | Circular mask |

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Run CLI in development mode |
| `bun run dev generate --help` | Show generate command options |
| `bun run tui` | Launch interactive TUI |
| `bun run build` | Build CLI for Node.js |
| `bun run build:release` | Build minified CLI for Bun |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run lint` | Run Biome linting with auto-fix |
| `bun run lint:check` | Run Biome linting (check only) |
| `bun run test` | Run tests with vitest |
| `bun run test:watch` | Run tests in watch mode |
| `bun run test:coverage` | Run tests with coverage |
| `bun run release` | Build and create a release |

## Output Structure

Generated assets are organized by platform:

```
assets/generated_YYYY-MM-DD_HH-MM-SS/
├── ios/
│   ├── AppIcon.appiconset/
│   │   └── Contents.json          # Xcode asset catalog
│   ├── icon-*.png
│   ├── dark/icon-*.png            # iOS 18 dark mode
│   ├── tinted/icon-*.png          # iOS 18 tinted
│   └── splash-*.png
├── android/
│   ├── mipmap-anydpi-v26/
│   │   ├── ic_launcher.xml        # Adaptive icon config
│   │   └── ic_launcher_round.xml
│   ├── mipmap-*/
│   │   └── ic_launcher*.png
│   ├── values/
│   │   └── colors.xml             # Background color (if solid)
│   └── drawable-*/splash.png
├── web/
│   ├── icon-*.png
│   ├── favicon.ico
│   └── site.webmanifest
├── watchos/
│   └── icon-*.png                 # Circular icons (9 sizes)
├── tvos/
│   ├── icon-back*.png             # Background layer
│   ├── icon-front*.png            # Foreground layer
│   └── top-shelf*.png             # Top shelf banners
├── visionos/
│   ├── icon-1024.png              # Main icon
│   ├── icon-back.png              # Background layer
│   └── icon-front.png             # Foreground layer
├── store/
│   ├── android/
│   │   ├── play-store-icon.png    # 512x512
│   │   ├── feature-graphic.png    # 1024x500
│   │   └── tv-banner.png          # 1280x720
│   └── ios/
│       └── app-store-icon.png     # 1024x1024
└── README.md
```

## Dependencies

- **Sharp**: Image processing and composition
- **OpenType.js**: Font file parsing
- **Effect**: Functional effects for CLI
- **OpenTUI**: Terminal UI framework
