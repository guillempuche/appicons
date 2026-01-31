# appicons

**App Icon Generator CLI** — Generate icons, splash screens, and favicons for iOS, Android & Web

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![iOS 18 Ready](https://img.shields.io/badge/iOS_18-Ready-blue.svg)](https://developer.apple.com/design/human-interface-guidelines/app-icons)
[![Android 13+ Ready](https://img.shields.io/badge/Android_13+-Ready-green.svg)](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)

A CLI tool that generates **100+ app assets** from a single command. Create app icons, launch screens, adaptive icons, and PWA assets for React Native, Expo, Flutter, native iOS/Android, and web apps.

- **iOS 18 ready**: Dark mode, tinted, and clear icon appearances
- **Android 13+ ready**: Material You themed monochrome icons
- **PWA compliant**: Maskable and monochrome icons with auto-generated `site.webmanifest`
- **Google Fonts**: Use any font from fonts.google.com for text-based icons

## Examples

Three example outputs are included in [`assets/`](assets/) showcasing different foreground types:

<table>
<tr>
<td align="center"><strong>Text</strong></td>
<td align="center"><strong>SVG Icon</strong></td>
<td align="center"><strong>Image</strong></td>
</tr>
<tr>
<td align="center"><img src="assets/example_text/ios/icon-1024.png" width="180" alt="Text example"></td>
<td align="center"><img src="assets/example_svg/ios/icon-1024.png" width="180" alt="SVG example"></td>
<td align="center"><img src="assets/example_image/ios/icon-1024.png" width="180" alt="Image example"></td>
</tr>
<tr>
<td align="center"><a href="assets/example_text/">example_text/</a></td>
<td align="center"><a href="assets/example_svg/">example_svg/</a></td>
<td align="center"><a href="assets/example_image/">example_image/</a></td>
</tr>
</table>

### Text + Solid Color

```bash
appicons generate --fg-text "N" --fg-color "#FFFFFF" --bg-color "#FF6B6B"
```

### SVG Icon + Gradient

```bash
appicons generate --fg-type svg --fg-svg ./icon.svg \
  --bg-type gradient --bg-gradient-colors "#667eea,#764ba2"
```

### Image + Gradient

```bash
appicons generate --fg-type image --fg-image ./logo.png \
  --bg-type gradient --bg-gradient-colors "#E0E7FF,#C7D2FE"
```

## Features

- **Complete Asset Coverage**: Generate 100+ assets for all platforms
  - iOS: App icons (20px - 1024px), Splash screens (iPhone, iPad)
  - Android: Icons, Adaptive icons (foreground + background), Splash screens
  - Web: Favicons, Apple touch icons, PWA icons

- **iOS 18+ Icon Appearances**: All 5 icon variants generated automatically
  - Default: Standard light appearance
  - Dark: Dark mode variant
  - Tinted: Monochrome icons with system wallpaper tint
  - Clear Light: Translucent background for light mode
  - Clear Dark: Translucent background for dark mode

- **Android 13+ Themed Icons**: Material You support
  - Monochrome icons for dynamic theming
  - Proper 66dp safe zone compliance
  - Auto-generated for all density buckets

- **PWA & Web Manifest (W3C Standard)**:
  - Standard icons (purpose: "any")
  - Maskable icons with 80% safe zone (purpose: "maskable")
  - Monochrome icons for themed display (purpose: "monochrome")
  - Auto-generated `site.webmanifest` with all icon entries

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

## Usage

### Interactive Mode (Recommended)

```bash
appicons
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
appicons [command] [options]

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
appicons generate

# Customize text and color
appicons generate \
  --fg-text "X" \
  --fg-color "#004C6E" \
  --bg-color "#FFFFFF"

# Full configuration with Google Font
appicons generate \
  --name "MyApp" \
  --fg-text "M" \
  --fg-font "Inter" \
  --fg-font-source google \
  --fg-color "#000000" \
  --bg-color "#FFFFFF" \
  --platforms "ios,android,web"

# Gradient background
appicons generate \
  --bg-type gradient \
  --bg-gradient-colors "#667eea,#764ba2" \
  --bg-gradient-angle 135 \
  --fg-text "o" \
  --fg-color "#FFFFFF"

# SVG icon
appicons generate \
  --bg-color "#FFFFFF" \
  --fg-type svg \
  --fg-svg ./logo.svg \
  --fg-svg-color "#000000"

# Dry-run (validate without generating)
appicons generate --dry-run

# JSON output for AI agents
appicons generate --format json
```

#### Other Commands

```bash
# List available Google Fonts
appicons list-fonts

# Show platform specifications
appicons list-platforms

# Validate configuration
appicons validate --fg-font "Inter" --fg-font-source google

# Show integration instructions
appicons instructions --platforms ios,android

# Generate shell completion script
appicons completion >> ~/.bashrc  # bash
appicons completion >> ~/.zshrc   # zsh
```

## Quick Start

```bash
# Install
curl -fsSL https://raw.githubusercontent.com/guillempuche/appicons/main/scripts/install.sh | bash

# Generate icons with letter "A" on indigo background
appicons generate --fg-text "A" --fg-color "#FFFFFF" --bg-color "#6366F1"

# Or launch interactive mode
appicons
```

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/guillempuche/appicons/main/scripts/install.sh | bash
```

This installs:
- Bun runtime (if not already installed)
- appicons binary to `~/.appicons`
- Symlink to `/usr/local/bin/appicons`

### Uninstall

```bash
curl -fsSL https://raw.githubusercontent.com/guillempuche/appicons/main/scripts/uninstall.sh | bash
```

## Output Structure

Each generation creates 96 assets across all platforms:

```
assets/<output-folder>/
├── ios/
│   ├── icon-{20,29,40,60,76,83.5,1024}{,@2x,@3x}.png
│   ├── dark/icon-*.png                # iOS 18 dark mode
│   ├── tinted/icon-*.png              # iOS 18 tinted (monochrome)
│   ├── clear-light/icon-*.png         # iOS 18 clear (light bg)
│   ├── clear-dark/icon-*.png          # iOS 18 clear (dark bg)
│   └── splash-*.png                   # 13 splash screen sizes
├── android/
│   ├── mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/
│   │   ├── ic_launcher.png
│   │   ├── ic_launcher_foreground.png
│   │   ├── ic_launcher_background.png
│   │   └── ic_launcher_monochrome.png # Android 13+ themed
│   ├── drawable-{mdpi→xxxhdpi}/splash.png
│   └── drawable-night-{mdpi→xxxhdpi}/splash.png
├── web/
│   ├── favicon-{16,32,48}x{16,32,48}.png
│   ├── apple-touch-icon-*.png         # 9 sizes (57-180px)
│   ├── icon-{192,512}x{192,512}.png   # PWA (any)
│   ├── icon-maskable-*.png            # PWA maskable
│   ├── icon-monochrome-*.png          # PWA monochrome
│   └── site.webmanifest               # W3C Web App Manifest
└── README.md                          # Config & integration guide
```

## Platform Specifications

### iOS

- **Icons**: 13 sizes from 20px to 1024px (including @2x, @3x variants)
- **iOS 18 Appearances**: All 5 icon variants
  - Default, Dark, Tinted, Clear Light, Clear Dark
  - Ready for Xcode asset catalog configuration
- **Splash Screens**: 13 sizes covering all iPhone and iPad models
- **Format**: PNG (no transparency for default app icons)

### Android

- **Icons**: 5 density buckets (mdpi through xxxhdpi)
- **Adaptive Icons**: Separate foreground and background layers
  - Foreground: Transparent PNG with icon centered in safe zone
  - Background: Color or image covering full canvas
  - Monochrome: White-on-transparent for Android 13+ themed icons
- **Splash Screens**: 5 density buckets (light and dark variants)
- **Format**: PNG

### Web

- **Favicons**: Standard sizes (16x16, 32x32, 48x48)
- **Apple Touch Icons**: iOS home screen icons (57px - 180px)
- **PWA Icons**: Full W3C manifest support
  - Standard icons (any): 192x192, 512x512
  - Maskable icons: Safe zone aware for adaptive display
  - Monochrome icons: For themed/tinted display
- **Web Manifest**: Auto-generated `site.webmanifest` with all icon purposes
- **Format**: PNG

## Tips

1. **Icon Design**: Keep your foreground simple and centered. Test at small sizes (20px) to ensure visibility.

2. **Adaptive Icons**: Android crops icons to various shapes (circle, square, rounded square). The safe zone is the inner 66x66 dp (about 60% of canvas).

3. **Splash Screens**: The foreground is automatically sized to 25% of screen width/height for visibility.

4. **Color Contrast**: Ensure sufficient contrast between foreground and background (WCAG AA minimum: 4.5:1).

5. **Font Selection**:
   - **Serif fonts** (Playfair Display, Merriweather, Lora): Editorial style
   - **Sans-serif fonts** (Roboto, Montserrat, Inter): Modern, clean
   - **Display fonts** (Bebas Neue, Anton, Oswald): Bold, attention-grabbing

6. **Google Fonts**: All fonts are loaded from Google Fonts API. Any font from fonts.google.com can be used.

## Use Cases

- **React Native / Expo apps**: Generate all icons and splash screens, copy to `assets/` folder
- **Flutter apps**: Generate Android adaptive icons and iOS app icons
- **Native iOS apps**: Full iOS 18 icon set with dark/tinted/clear variants for Xcode
- **Native Android apps**: Adaptive icons with monochrome layer for Material You theming
- **PWA / Web apps**: Favicons, Apple touch icons, and maskable icons with manifest
- **Prototypes**: Quickly generate placeholder icons with text and colors
- **CI/CD pipelines**: Automate asset generation with `--format json` for scripting

## Why appicons?

| Feature | appicons | app-icon | pwa-asset-generator |
|---------|----------|----------|---------------------|
| iOS 18 dark/tinted icons | Yes | No | No |
| Android 13+ monochrome | Yes | No | No |
| PWA maskable icons | Yes | No | Yes |
| Google Fonts support | Yes | No | No |
| Interactive TUI | Yes | No | No |
| Single binary install | Yes | No | No |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## Related

- [iOS Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [iOS 18 Icon Appearances](https://developer.apple.com/documentation/xcode/configuring-your-app-icon)
- [Android Adaptive Icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)
- [Android 13 Themed Icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive#themed)
- [Google Fonts](https://fonts.google.com/)

## License

MIT
