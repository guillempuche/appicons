/**
 * Type definitions for the App Asset Generator.
 *
 * This module defines the core types used throughout the asset generation
 * pipeline. These types ensure type safety across CLI parsing, configuration,
 * and asset generation.
 *
 * Key concepts:
 * - Platforms: Target platforms (iOS, Android, Web).
 * - Asset types: Categories of generated assets (icons, splash screens, etc.).
 * - Background/Foreground: The two layers composited to create each asset.
 */

// ─── Platform and Asset Type Enums ─────────────────────────────────────────

/** Target platform for asset generation. */
export type Platform = 'ios' | 'android' | 'web'

/** Category of asset to generate. */
export type AssetType = 'icon' | 'splash' | 'adaptive' | 'favicon'

/** Type of background layer. */
export type BackgroundType = 'color' | 'gradient' | 'image'

/** Type of foreground layer (the logo/icon content). */
export type ForegroundType = 'svg' | 'text' | 'image'

/**
 * Color mode for theming support.
 * - 'light': Standard light appearance.
 * - 'dark': Dark appearance (iOS 18+ dark icons, Android night drawables).
 * - 'any': Works in both modes (Android monochrome icons for Material You).
 */
export type ColorMode = 'light' | 'dark' | 'any'

// ─── Background Configuration ──────────────────────────────────────────────

/** Solid color configuration with hex value. */
export interface ColorConfig {
	type: 'solid'
	/** Hex color code (e.g., '#FF5500'). */
	color: string
}

/** Gradient configuration for linear or radial gradients. */
export interface GradientConfig {
	type: 'linear' | 'radial'
	/** Array of hex color stops (minimum 2). */
	colors: string[]
	/** Angle in degrees for linear gradients (0-360, where 0 is top-to-bottom). */
	angle?: number
}

/**
 * Background layer configuration.
 *
 * The background is the base layer of each asset, filling the entire canvas.
 * Only one of color, gradient, or imagePath should be set based on type.
 */
export interface BackgroundConfig {
	type: BackgroundType
	/** Solid color configuration (when type is 'color'). */
	color?: ColorConfig
	/** Gradient configuration (when type is 'gradient'). */
	gradient?: GradientConfig
	/** Path to background image file (when type is 'image'). */
	imagePath?: string
}

// ─── Foreground Configuration ──────────────────────────────────────────────

/**
 * Text-based foreground configuration.
 *
 * Renders text characters using a specified font. Ideal for icons that use
 * a single letter or symbol (e.g., "G" for Google, "f" for Facebook).
 */
export interface TextForegroundConfig {
	type: 'text'
	/** Character(s) to display (typically 1-2 characters). */
	text: string
	/** Font family name (e.g., 'Playfair Display', 'Inter'). */
	fontFamily: string
	/** Optional font size override (auto-calculated if omitted). */
	fontSize?: number
	/** Text color as hex code. */
	color: string
	/** Where to load the font from. */
	fontSource: 'google' | 'system' | 'custom'
	/** Path to custom font file (required when fontSource is 'custom'). */
	fontPath?: string
}

/**
 * SVG-based foreground configuration.
 *
 * Renders an SVG file as the icon content. Ideal for vector logos that
 * need to scale cleanly to any resolution.
 */
export interface SVGForegroundConfig {
	type: 'svg'
	/** Path to SVG file. */
	svgPath: string
	/** Optional color override (replaces all fill colors in the SVG). */
	color?: string
}

/**
 * Image-based foreground configuration.
 *
 * Uses a raster image (PNG, JPEG) as the icon content. The image is
 * scaled to fit within the foreground area while preserving aspect ratio.
 */
export interface ImageForegroundConfig {
	type: 'image'
	/** Path to image file (PNG, JPEG, WebP, etc.). */
	imagePath: string
}

/** Union type for all foreground configuration variants. */
export type ForegroundConfig =
	| TextForegroundConfig
	| SVGForegroundConfig
	| ImageForegroundConfig

// ─── Main Configuration ────────────────────────────────────────────────────

/**
 * Complete configuration for the asset generation pipeline.
 *
 * This interface represents all options needed to generate a complete set
 * of app assets across all requested platforms and asset types.
 */
export interface AssetGeneratorConfig {
	/** Application name (used for documentation). */
	appName: string

	/** Target platforms to generate assets for. */
	platforms: Platform[]

	/** Types of assets to generate. */
	assetTypes: AssetType[]

	/** Background layer configuration. */
	background: BackgroundConfig

	/** Foreground layer configuration (logo/icon content). */
	foreground: ForegroundConfig

	/** Output directory for generated assets. */
	outputDir: string

	/**
	 * Foreground scale for app icons (0.2 to 1.0).
	 *
	 * Controls how much of the icon canvas the logo fills.
	 * Default: 0.7 (70% of icon size).
	 *
	 * Best practices:
	 * - 0.6-0.7: Standard, good for text/logos with padding.
	 * - 0.8-0.9: Bold, fills most of the icon.
	 * - 0.5-0.6: Conservative, more background visible.
	 */
	iconScale?: number

	/**
	 * Foreground scale for splash screens (0.1 to 0.5).
	 *
	 * Controls how much of the screen height the logo fills.
	 * Default: 0.25 (25% of screen height).
	 *
	 * Best practices:
	 * - 0.2-0.3: Standard, centered branding.
	 * - 0.15-0.2: Minimal, subtle presence.
	 * - 0.3-0.4: Prominent, bold statement.
	 */
	splashScale?: number

	/**
	 * Generate dark mode variants for supported platforms.
	 *
	 * When enabled, generates additional assets:
	 * - iOS 18+: Dark and tinted app icons.
	 * - Android 13+: Night splash screens + monochrome adaptive icons.
	 */
	generateDarkMode?: boolean

	/** Dark mode background config (used when generateDarkMode is true). */
	darkBackground?: BackgroundConfig
}

// ─── Asset Specification and Results ───────────────────────────────────────

/**
 * Specification for a single asset to generate.
 *
 * Each AssetSpec describes one output file with its dimensions, platform,
 * type, and optional variants (scale, color mode).
 */
export interface AssetSpec {
	/** Output filename (may include subdirectory, e.g., 'mipmap-hdpi/icon.png'). */
	name: string

	/** Width in pixels. */
	width: number

	/** Height in pixels. */
	height: number

	/** Target platform. */
	platform: Platform

	/** Asset type category. */
	type: AssetType

	/** Display scale factor for @2x, @3x variants (iOS). */
	scale?: number

	/** Color mode for light/dark theme variants. */
	colorMode?: ColorMode
}

/**
 * A generated asset with its image data and output path.
 */
export interface GeneratedAsset {
	/** The specification this asset was generated from. */
	spec: AssetSpec

	/** PNG image data as a Buffer. */
	buffer: Buffer

	/** Full output path for the asset file. */
	path: string
}

/**
 * Result of the asset generation pipeline.
 *
 * Contains all generated assets, output location, and any errors that
 * occurred during generation.
 */
export interface GenerationResult {
	/** True if all assets generated successfully. */
	success: boolean

	/** Array of generated asset objects. */
	assets: GeneratedAsset[]

	/** Root output directory. */
	outputDir: string

	/** Path to the generated INSTRUCTIONS.md file. */
	instructionsPath?: string

	/** Array of error messages for failed assets. */
	errors?: string[]
}
