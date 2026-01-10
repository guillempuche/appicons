# App Asset Generator

Generate all required app assets (icons, splash screens, adaptive icons, favicons) for iOS, Android, and Web platforms from a single configuration.

## Features

- **Complete Asset Coverage**: Generate 100+ assets for all platforms
  - iOS: App icons (20px - 1024px), Splash screens (iPhone, iPad)
  - Android: Icons, Adaptive icons (foreground + background), Splash screens
  - Web: Favicons, Apple touch icons, PWA icons

- **Flexible Backgrounds**:
  - Solid colors (hex)
  - Linear gradients (with angle control)
  - Radial gradients
  - Custom images

- **Flexible Foregrounds**:
  - Text/Characters with Google Fonts (any font from fonts.google.com)
  - System fonts (Arial, Times New Roman, etc.)
  - SVG icons with color override
  - PNG/JPG images

- **Interactive TUI**: OpenTUI-based terminal interface with image preview and font autocomplete
- **CLI Mode**: Command-line interface for automation and AI agents with shell completion
- **JSON Output**: Machine-readable output for programmatic usage
- **Smart Validation**: Typo detection with suggestions for Google Font names

## Installation

```bash
# Clone the repository
git clone https://github.com/guillempuche/app-asset-generator.git
cd app-asset-generator

# Enter Nix environment (recommended)
nix develop

# Install dependencies
bun install

# Run the TUI
bun run tui

# Or run CLI mode
bun run dev --help
```

## Usage

### Interactive Mode (Recommended)

```bash
bun run tui
```

The TUI will guide you through:
1. App name
2. Target platforms (iOS, Android, Web)
3. Asset types (icons, splash, adaptive, favicons)
4. Background configuration (color, gradient, image)
5. Foreground configuration (text with Google Fonts, SVG, image)

### Command-Line Mode

#### Available Commands

```bash
app-asset-generator [command] [options]

Commands:
  (no command)      Launch interactive OpenTUI interface (default)
  generate          Generate assets from command-line options
  validate          Validate configuration without generating
  list-fonts        List available Google Fonts
  list-platforms    Show platform specifications
  instructions      Show integration instructions
  completion        Output shell completion script
```

#### Generate Command

```bash
# Simple generation with defaults
bun run dev generate

# Customize text and color
bun run dev generate \
  --fg-text "X" \
  --fg-color "#004C6E" \
  --bg-color "#FFFFFF"

# Full configuration with Google Font
bun run dev generate \
  --name "MyApp" \
  --fg-text "M" \
  --fg-font "Inter" \
  --fg-font-source google \
  --fg-color "#000000" \
  --bg-color "#FFFFFF" \
  --platforms "ios,android,web"

# Gradient background
bun run dev generate \
  --bg-type gradient \
  --bg-gradient-colors "#667eea,#764ba2" \
  --bg-gradient-angle 135 \
  --fg-text "●" \
  --fg-color "#FFFFFF"

# SVG icon
bun run dev generate \
  --bg-color "#FFFFFF" \
  --fg-type svg \
  --fg-svg ./logo.svg \
  --fg-svg-color "#000000"

# Dry-run (validate without generating)
bun run dev generate --dry-run

# JSON output for AI agents
bun run dev generate --format json
```

#### Other Commands

```bash
# List available Google Fonts
bun run dev list-fonts

# Show platform specifications
bun run dev list-platforms

# Validate configuration
bun run dev validate --fg-font "Inter" --fg-font-source google

# Show integration instructions
bun run dev instructions --platforms ios,android

# Generate shell completion script
bun run dev completion >> ~/.bashrc  # bash
bun run dev completion >> ~/.zshrc   # zsh
```

## Output Structure

```
assets/generated-YYYYMMDD-HHMMSS/
├── ios/
│   ├── icon-20.png
│   ├── icon-20@2x.png
│   ├── icon-60@3x.png
│   ├── icon-1024.png
│   ├── splash-1170x2532.png
│   └── ...
├── android/
│   ├── mipmap-mdpi/
│   │   ├── ic_launcher.png
│   │   ├── ic_launcher_foreground.png
│   │   └── ic_launcher_background.png
│   ├── mipmap-hdpi/
│   ├── drawable-xhdpi/
│   │   └── splash.png
│   └── ...
├── web/
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon-180x180.png
│   ├── android-chrome-512x512.png
│   └── ...
└── INSTRUCTIONS.md  ← Integration guide
```

## Platform Specifications

### iOS

- **Icons**: 13 sizes from 20px to 1024px (including @2x, @3x variants)
- **Splash Screens**: 13 sizes covering all iPhone and iPad models
- **Format**: PNG (no transparency for app icons)

### Android

- **Icons**: 5 density buckets (mdpi through xxxhdpi)
- **Adaptive Icons**: Separate foreground and background layers
  - Foreground: Transparent PNG with icon centered in safe zone
  - Background: Color or image covering full canvas
- **Splash Screens**: 5 density buckets
- **Format**: PNG

### Web

- **Favicons**: Standard sizes (16x16, 32x32, 48x48)
- **Apple Touch Icons**: iOS home screen icons (57px - 180px)
- **PWA Icons**: Android Chrome icons (192x192, 512x512)
- **Format**: PNG

## Tips

1. **Icon Design**: Keep your foreground simple and centered. Test at small sizes (20px) to ensure visibility.

2. **Adaptive Icons**: Android crops icons to various shapes (circle, square, rounded square). The safe zone is the inner 66×66 dp (about 60% of canvas).

3. **Splash Screens**: The foreground is automatically sized to 25% of screen width/height for visibility.

4. **Color Contrast**: Ensure sufficient contrast between foreground and background (WCAG AA minimum: 4.5:1).

5. **Font Selection**:
   - **Serif fonts** (Playfair Display, Merriweather, Lora): Editorial style
   - **Sans-serif fonts** (Roboto, Montserrat, Inter): Modern, clean
   - **Display fonts** (Bebas Neue, Anton, Oswald): Bold, attention-grabbing

6. **Google Fonts**: All fonts are loaded from Google Fonts API. Any font from fonts.google.com can be used.

## Development

```bash
# Enter Nix environment
nix develop

# Install dependencies
bun install

# Run TUI in development
bun run tui

# Run CLI in development
bun run dev

# Type checking
bun run typecheck

# Lint and format
bun run lint
```

## Related

- [iOS Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android Adaptive Icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)
- [Google Fonts](https://fonts.google.com/)

## License

MIT
