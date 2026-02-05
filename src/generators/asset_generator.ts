/**
 * Main asset generator that orchestrates the complete asset generation pipeline.
 *
 * This module is the entry point for generating app icons, splash screens, and
 * other platform-specific assets. It coordinates the background and foreground
 * generators to produce composite images at all required sizes.
 *
 * Generation pipeline:
 * 1. Determine asset specs based on target platforms and asset types.
 * 2. For each spec, generate background and foreground layers.
 * 3. Composite layers with appropriate sizing/positioning.
 * 4. Write files to platform-organized folders + README.md.
 *
 * Platform support:
 * - iOS: App icons (@1x, @2x, @3x), launch images, dark icons (iOS 18+).
 * - Android: Adaptive icons (foreground/background/monochrome), night splash.
 * - Web: Favicons, PWA icons, Open Graph images.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import sharp from 'sharp'
import { encode as encodeIco } from 'sharp-ico'

import {
	getAssetsByPlatform,
	getAssetsByType,
	getVariantAssetsByPlatform,
	getVariantAssetsByType,
} from '../assets/asset_specs'
import type {
	AssetGeneratorConfig,
	AssetSpec,
	GeneratedAsset,
	GenerationResult,
} from '../types'
import { saveToHistory } from '../utils/history'
import {
	formatInstructionsText,
	generateInstructions,
} from '../utils/instructions'
import { generateBackground } from './background_generator'
import { generateForeground } from './foreground_generator'

/**
 * Generates all assets based on the provided configuration.
 *
 * This is the main entry point for asset generation. It handles:
 * - Asset specification resolution from platforms/types (including dark mode).
 * - Individual asset generation with error isolation.
 * - File output organized by platform folders.
 * - Integration instructions file (README.md).
 *
 * Errors are collected rather than thrown, allowing partial success
 * when some assets fail (e.g., due to invalid source images).
 */
export async function generateAssets(
	config: AssetGeneratorConfig,
): Promise<GenerationResult> {
	const errors: string[] = []
	const assets: GeneratedAsset[] = []

	try {
		// Resolve which assets to generate based on platforms and asset types.
		const specs = determineAssetSpecs(config)
		console.log(`\nGenerating ${specs.length} assets...`)

		// Generate assets sequentially to avoid memory pressure from parallel Sharp operations.
		// Sharp holds image buffers in memory, and parallel execution can cause OOM on large assets.
		for (const spec of specs) {
			try {
				const asset = await generateAsset(config, spec)
				assets.push(asset)
				console.log(`✓ Generated ${spec.name}`)
			} catch (error) {
				const message = `Failed to generate ${spec.name}: ${(error as Error).message}`
				errors.push(message)
				console.error(`✗ ${message}`)
			}
		}

		// Persist generated assets to disk (organized by platform folders).
		await writeAssetsToDisk(assets, config.outputDir)

		// Generate web manifest and favicon.ico if web platform is included
		if (
			config.platforms.includes('web') &&
			config.assetTypes.includes('favicon')
		) {
			await generateWebManifest(config, config.outputDir)
			console.log(`✓ Generated web/site.webmanifest`)
			await generateFaviconIco(config, config.outputDir)
			console.log(`✓ Generated web/favicon.ico`)
		}

		// Generate iOS Contents.json if iOS platform with icons is included
		if (
			config.platforms.includes('ios') &&
			config.assetTypes.includes('icon')
		) {
			await generateContentsJson(config, config.outputDir)
			console.log(`✓ Generated ios/AppIcon.appiconset/Contents.json`)
		}

		// Generate Android adaptive icon XML files if Android with adaptive is included
		if (
			config.platforms.includes('android') &&
			config.assetTypes.includes('adaptive')
		) {
			await generateAdaptiveIconXml(config, config.outputDir)
			console.log(`✓ Generated android/mipmap-anydpi-v26/ic_launcher.xml`)
			console.log(`✓ Generated android/mipmap-anydpi-v26/ic_launcher_round.xml`)

			// Generate colors.xml only for solid color backgrounds
			if (config.background.type === 'color' && config.background.color) {
				await generateColorsXml(config, config.outputDir)
				console.log(`✓ Generated android/values/colors.xml`)
			}
		}

		// Generate integration instructions file.
		const instructions = generateInstructions({
			outputDir: config.outputDir,
			platforms: config.platforms,
			assetTypes: config.assetTypes,
			config,
		})
		const instructionsPath = join(config.outputDir, 'README.md')
		await writeFile(instructionsPath, formatInstructionsText(instructions))
		console.log(`✓ Generated README.md`)

		// Report generation summary.
		console.log(`\n✓ Generated ${assets.length} assets`)
		if (errors.length > 0) {
			console.log(`✗ Failed ${errors.length} assets`)
		}

		// Save to history on successful generation
		if (errors.length === 0) {
			try {
				await saveToHistory(config, config.outputDir)
			} catch (_historyError) {
				// Don't fail generation if history save fails
				console.warn('Warning: Failed to save to history')
			}
		}

		return {
			success: errors.length === 0,
			assets,
			outputDir: config.outputDir,
			instructionsPath,
			errors,
		}
	} catch (error) {
		// Catch-all for unexpected errors during pipeline setup.
		return {
			success: false,
			assets: [],
			outputDir: config.outputDir,
			errors: [(error as Error).message],
		}
	}
}

/**
 * Resolves which asset specifications to generate based on config.
 *
 * Uses set intersection to find specs matching both the requested
 * platforms AND asset types. For example, if platforms=['ios'] and
 * assetTypes=['icon'], only iOS icon specs are returned.
 *
 * Always includes all appearance variants (dark, tinted, clear, monochrome):
 * - iOS 18+: Dark, tinted (monochrome with wallpaper tint), clear light/dark
 * - Android 13+: Night splash screens + monochrome icons for Material You
 *
 * Deduplication ensures each unique asset is generated only once,
 * even if it appears in multiple platform/type combinations.
 */
export function determineAssetSpecs(config: AssetGeneratorConfig): AssetSpec[] {
	const specs: AssetSpec[] = []

	for (const platform of config.platforms) {
		for (const assetType of config.assetTypes) {
			// Light mode assets (always included)
			const platformSpecs = getAssetsByPlatform(platform)
			const typeSpecs = getAssetsByType(assetType)

			// Intersection: specs that match both platform AND type.
			const matching = platformSpecs.filter(ps =>
				typeSpecs.some(ts => ts.name === ps.name),
			)
			specs.push(...matching)

			// Variant assets (dark, tinted, clear, monochrome) - always included
			const variantPlatformSpecs = getVariantAssetsByPlatform(platform)
			const variantTypeSpecs = getVariantAssetsByType(assetType)

			const variantMatching = variantPlatformSpecs.filter(ps =>
				variantTypeSpecs.some(ts => ts.name === ps.name),
			)
			specs.push(...variantMatching)
		}
	}

	// Deduplicate by name using Map (preserves last occurrence).
	return Array.from(new Map(specs.map(s => [s.name, s])).values())
}

/**
 * Generates a single asset by compositing background and foreground layers.
 *
 * The compositing process:
 * 1. Generate full-size background (solid, gradient, or image).
 * 2. Generate scaled foreground (logo/icon) with transparency.
 * 3. Center foreground on background using sharp's composite.
 *
 * Foreground scaling rationale:
 * - Icons (70%): Logo should fill most of the icon for visibility at small sizes.
 * - Splash screens (25%): Logo should be proportionally smaller on large screens.
 *
 * Color mode handling:
 * - 'light' (default): Normal background and foreground
 * - 'dark': Auto-computed dark background (inverted/darkened)
 * - 'tinted': White foreground on transparent (iOS 18 wallpaper tint)
 * - 'clear-light': Normal foreground on semi-transparent white (50% opacity)
 * - 'clear-dark': Normal foreground on semi-transparent black (50% opacity)
 * - 'any' (monochrome): White foreground on transparent (Android Material You)
 *
 * Android adaptive icons are handled separately due to their layer architecture.
 */
async function generateAsset(
	config: AssetGeneratorConfig,
	spec: AssetSpec,
): Promise<GeneratedAsset> {
	const { width, height } = spec

	// Android adaptive icons use a different generation path.
	if (spec.type === 'adaptive') {
		return generateAdaptiveIconLayer(config, spec)
	}

	// Web maskable icons: like Android adaptive, with safe zone
	if (spec.platform === 'web' && spec.name.includes('maskable')) {
		return generateMaskableIcon(config, spec)
	}

	// iOS tinted or web monochrome icons: white foreground on transparent background
	if (spec.colorMode === 'tinted') {
		return generateTintedIcon(config, spec)
	}

	// iOS clear icons: normal foreground on semi-transparent background
	if (spec.colorMode === 'clear-light' || spec.colorMode === 'clear-dark') {
		return generateClearIcon(config, spec)
	}

	// tvOS layered icons: foreground layers need transparent background
	if (spec.platform === 'tvos' && spec.name.includes('front')) {
		return generateTvOSForegroundLayer(config, spec)
	}

	// visionOS layered icons: foreground/back layers
	if (spec.platform === 'visionos' && spec.name.includes('front')) {
		return generateVisionOSForegroundLayer(config, spec)
	}

	if (spec.platform === 'visionos' && spec.name.includes('back')) {
		return generateVisionOSBackgroundLayer(config, spec)
	}

	// Step 1: Generate the background layer at full asset dimensions.
	// For dark mode, auto-compute a dark background from the original.
	let backgroundBuffer: Buffer
	if (spec.colorMode === 'dark') {
		backgroundBuffer = await generateDarkBackground(
			config.background,
			width,
			height,
		)
	} else {
		backgroundBuffer = await generateBackground(
			config.background,
			width,
			height,
		)
	}

	// Step 2: Calculate foreground size based on asset type and platform.
	// Separate scales for icons, splash screens, favicons, and store graphics (user configurable).
	let foregroundScale: number
	if (spec.type === 'splash') {
		foregroundScale = config.splashScale ?? 0.25 // Splash: 25% default
	} else if (spec.type === 'favicon') {
		foregroundScale = config.faviconScale ?? 0.85 // Favicons: 85% default
	} else if (spec.type === 'store') {
		foregroundScale = config.storeScale ?? 0.5 // Store: 50% default
	} else if (spec.platform === 'watchos' || spec.platform === 'visionos') {
		// Circular icons need to stay within 80% safe zone
		const maxSafeScale = 0.8
		const userScale = config.iconScale ?? 0.7
		foregroundScale = Math.min(userScale, maxSafeScale)
	} else if (spec.platform === 'tvos') {
		// tvOS uses 80% safe zone for layered icons
		const maxSafeScale = 0.8
		const userScale = config.iconScale ?? 0.7
		foregroundScale = Math.min(userScale, maxSafeScale)
	} else {
		foregroundScale = config.iconScale ?? 0.7 // Icons: 70% default
	}
	const foregroundSize = Math.floor(Math.min(width, height) * foregroundScale)

	const foregroundBuffer = await generateForeground(
		config.foreground,
		foregroundSize,
		foregroundSize,
	)

	// Step 3: Composite foreground centered on background.
	const buffer = await sharp(backgroundBuffer)
		.composite([
			{
				input: foregroundBuffer,
				top: Math.floor((height - foregroundSize) / 2),
				left: Math.floor((width - foregroundSize) / 2),
			},
		])
		.png()
		.toBuffer()

	return {
		spec,
		buffer,
		path: join(config.outputDir, spec.name),
	}
}

/**
 * Generates iOS 18 tinted icon (monochrome, system applies wallpaper color).
 * White foreground on transparent background.
 */
async function generateTintedIcon(
	config: AssetGeneratorConfig,
	spec: AssetSpec,
): Promise<GeneratedAsset> {
	const { width, height } = spec
	const foregroundScale = config.iconScale ?? 0.7
	const foregroundSize = Math.floor(Math.min(width, height) * foregroundScale)

	// Create monochrome foreground (force white color for text/SVG)
	const monochromeConfig = { ...config.foreground }
	if (monochromeConfig.type === 'text') {
		monochromeConfig.color = '#FFFFFF'
	} else if (monochromeConfig.type === 'svg') {
		monochromeConfig.color = '#FFFFFF'
	}

	const foregroundBuffer = await generateForeground(
		monochromeConfig,
		foregroundSize,
		foregroundSize,
	)

	// Create transparent canvas and center the icon.
	const buffer = await sharp({
		create: {
			width,
			height,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	})
		.composite([
			{
				input: foregroundBuffer,
				top: Math.floor((height - foregroundSize) / 2),
				left: Math.floor((width - foregroundSize) / 2),
			},
		])
		.png()
		.toBuffer()

	return {
		spec,
		buffer,
		path: join(config.outputDir, spec.name),
	}
}

/**
 * Generates iOS 18 clear icon (translucent background).
 * - clear-light: semi-transparent white background (50% opacity)
 * - clear-dark: semi-transparent black background (50% opacity)
 */
async function generateClearIcon(
	config: AssetGeneratorConfig,
	spec: AssetSpec,
): Promise<GeneratedAsset> {
	const { width, height } = spec
	const foregroundScale = config.iconScale ?? 0.7
	const foregroundSize = Math.floor(Math.min(width, height) * foregroundScale)

	// Create semi-transparent background based on colorMode
	const bgColor =
		spec.colorMode === 'clear-light'
			? { r: 255, g: 255, b: 255, alpha: 0.5 } // White 50% opacity
			: { r: 0, g: 0, b: 0, alpha: 0.5 } // Black 50% opacity

	const backgroundBuffer = await sharp({
		create: {
			width,
			height,
			channels: 4,
			background: bgColor,
		},
	})
		.png()
		.toBuffer()

	const foregroundBuffer = await generateForeground(
		config.foreground,
		foregroundSize,
		foregroundSize,
	)

	// Composite foreground on semi-transparent background
	const buffer = await sharp(backgroundBuffer)
		.composite([
			{
				input: foregroundBuffer,
				top: Math.floor((height - foregroundSize) / 2),
				left: Math.floor((width - foregroundSize) / 2),
			},
		])
		.png()
		.toBuffer()

	return {
		spec,
		buffer,
		path: join(config.outputDir, spec.name),
	}
}

/**
 * Generates an auto-computed dark background from the original.
 * - Solid colors: darkens the color by reducing lightness
 * - Gradients: inverts/darkens gradient colors
 * - Images: applies a dark overlay
 */
async function generateDarkBackground(
	bgConfig: AssetGeneratorConfig['background'],
	width: number,
	height: number,
): Promise<Buffer> {
	if (bgConfig.type === 'color' && bgConfig.color) {
		// Darken solid color by converting to dark variant
		const darkColor = darkenHexColor(bgConfig.color.color, 0.7)
		return sharp({
			create: {
				width,
				height,
				channels: 3,
				background: hexToRgb(darkColor),
			},
		})
			.png()
			.toBuffer()
	}

	if (bgConfig.type === 'gradient' && bgConfig.gradient) {
		// Darken gradient colors
		const darkColors = bgConfig.gradient.colors.map(c => darkenHexColor(c, 0.7))
		const darkGradientConfig = {
			...bgConfig,
			gradient: { ...bgConfig.gradient, colors: darkColors },
		}
		return generateBackground(darkGradientConfig, width, height)
	}

	// For images, generate normally (user should provide dark version if needed)
	return generateBackground(bgConfig, width, height)
}

/**
 * Darkens a hex color by a factor (0-1, where 0.7 = 70% darker).
 */
function darkenHexColor(hex: string, factor: number): string {
	const rgb = hexToRgb(hex)
	const darkenedR = Math.round(rgb.r * (1 - factor))
	const darkenedG = Math.round(rgb.g * (1 - factor))
	const darkenedB = Math.round(rgb.b * (1 - factor))
	return `#${darkenedR.toString(16).padStart(2, '0')}${darkenedG.toString(16).padStart(2, '0')}${darkenedB.toString(16).padStart(2, '0')}`
}

/**
 * Converts hex color to RGB object.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const cleanHex = hex.replace('#', '')
	return {
		r: parseInt(cleanHex.slice(0, 2), 16),
		g: parseInt(cleanHex.slice(2, 4), 16),
		b: parseInt(cleanHex.slice(4, 6), 16),
	}
}

/**
 * Generates PWA maskable icon (safe zone aware, like Android adaptive).
 * Uses 80% safe zone for maskable icons as per W3C recommendations.
 */
async function generateMaskableIcon(
	config: AssetGeneratorConfig,
	spec: AssetSpec,
): Promise<GeneratedAsset> {
	const { width, height } = spec

	// Maskable icons should have content in the safe zone (80% of canvas)
	// This is less restrictive than Android's 66% but still needed
	const safeZoneScale = 0.8
	const userScale = config.iconScale ?? 0.7
	const effectiveScale = Math.min(userScale * safeZoneScale, safeZoneScale)
	const foregroundSize = Math.floor(Math.min(width, height) * effectiveScale)

	// Generate full background (fills entire icon)
	const backgroundBuffer = await generateBackground(
		config.background,
		width,
		height,
	)

	// Generate foreground at safe zone size
	const foregroundBuffer = await generateForeground(
		config.foreground,
		foregroundSize,
		foregroundSize,
	)

	// Composite foreground centered on background
	const buffer = await sharp(backgroundBuffer)
		.composite([
			{
				input: foregroundBuffer,
				top: Math.floor((height - foregroundSize) / 2),
				left: Math.floor((width - foregroundSize) / 2),
			},
		])
		.png()
		.toBuffer()

	return {
		spec,
		buffer,
		path: join(config.outputDir, spec.name),
	}
}

/**
 * Generates Android adaptive icon layers.
 *
 * Android adaptive icons (API 26+) use a two-layer system:
 * - Background layer: Full 108×108 dp canvas with solid/gradient/image.
 * - Foreground layer: Transparent canvas with icon in the safe zone.
 *
 * Safe zone considerations:
 * The system may mask the icon to various shapes (circle, squircle, etc.)
 * and apply parallax effects. The visible area varies by device:
 * - Minimum visible: 66×66 dp (inner circle).
 * - Maximum canvas: 108×108 dp.
 * - Safe zone: ~60% of canvas to avoid clipping on any mask shape.
 *
 * Monochrome icons (colorMode: 'any') for Android 13+ themed icons:
 * - Generated as white (#FFFFFF) on transparent background
 * - System applies user's theme color at runtime
 *
 * We use 60% (not the theoretical 66/108 = 61%) for extra safety margin.
 */
async function generateAdaptiveIconLayer(
	config: AssetGeneratorConfig,
	spec: AssetSpec,
): Promise<GeneratedAsset> {
	const { width, height } = spec
	const isForeground = spec.name.includes('foreground')
	const isMonochrome = spec.name.includes('monochrome')

	let buffer: Buffer

	if (isMonochrome) {
		// Monochrome icons: white foreground on transparent for themed icons.
		// System applies user's Material You theme color at runtime.
		const maxSafeScale = 0.66
		const defaultSafeScale = 0.6
		const userScale = config.iconScale ?? defaultSafeScale
		const safeScale = Math.min(userScale, maxSafeScale)
		const safeSize = Math.floor(Math.min(width, height) * safeScale)

		// Create monochrome foreground (force white color for text/SVG)
		const monochromeConfig = { ...config.foreground }
		if (monochromeConfig.type === 'text') {
			monochromeConfig.color = '#FFFFFF'
		} else if (monochromeConfig.type === 'svg') {
			monochromeConfig.color = '#FFFFFF'
		}

		const foregroundBuffer = await generateForeground(
			monochromeConfig,
			safeSize,
			safeSize,
		)

		// Create transparent canvas and center the icon.
		buffer = await sharp({
			create: {
				width,
				height,
				channels: 4,
				background: { r: 0, g: 0, b: 0, alpha: 0 },
			},
		})
			.composite([
				{
					input: foregroundBuffer,
					top: Math.floor((height - safeSize) / 2),
					left: Math.floor((width - safeSize) / 2),
				},
			])
			.png()
			.toBuffer()
	} else if (isForeground) {
		// Size the icon to fit within the safe zone (default 60%).
		// User iconScale is applied but capped at 0.66 for Android safe zone.
		const maxSafeScale = 0.66 // 66/108 = 61%, use 66% as absolute max
		const defaultSafeScale = 0.6
		const userScale = config.iconScale ?? defaultSafeScale
		const safeScale = Math.min(userScale, maxSafeScale)
		const safeSize = Math.floor(Math.min(width, height) * safeScale)

		const foregroundBuffer = await generateForeground(
			config.foreground,
			safeSize,
			safeSize,
		)

		// Create transparent canvas and center the icon.
		buffer = await sharp({
			create: {
				width,
				height,
				channels: 4,
				background: { r: 0, g: 0, b: 0, alpha: 0 },
			},
		})
			.composite([
				{
					input: foregroundBuffer,
					top: Math.floor((height - safeSize) / 2),
					left: Math.floor((width - safeSize) / 2),
				},
			])
			.png()
			.toBuffer()
	} else {
		// Background layer fills the entire canvas.
		buffer = await generateBackground(config.background, width, height)
	}

	return {
		spec,
		buffer,
		path: join(config.outputDir, spec.name),
	}
}

// ─── tvOS and visionOS Layer Generators ────────────────────────────────────

/**
 * Generates tvOS foreground layer (transparent with icon).
 * Used for tvOS layered icon stack parallax effect.
 */
async function generateTvOSForegroundLayer(
	config: AssetGeneratorConfig,
	spec: AssetSpec,
): Promise<GeneratedAsset> {
	const { width, height } = spec

	// tvOS safe zone is 80% of canvas
	const maxSafeScale = 0.8
	const userScale = config.iconScale ?? 0.7
	const safeScale = Math.min(userScale, maxSafeScale)
	const safeSize = Math.floor(Math.min(width, height) * safeScale)

	const foregroundBuffer = await generateForeground(
		config.foreground,
		safeSize,
		safeSize,
	)

	// Create transparent canvas and center the icon
	const buffer = await sharp({
		create: {
			width,
			height,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	})
		.composite([
			{
				input: foregroundBuffer,
				top: Math.floor((height - safeSize) / 2),
				left: Math.floor((width - safeSize) / 2),
			},
		])
		.png()
		.toBuffer()

	return {
		spec,
		buffer,
		path: join(config.outputDir, spec.name),
	}
}

/**
 * Generates visionOS foreground layer (transparent with icon).
 * Used for visionOS 3D layered icon effect.
 */
async function generateVisionOSForegroundLayer(
	config: AssetGeneratorConfig,
	spec: AssetSpec,
): Promise<GeneratedAsset> {
	const { width, height } = spec

	// visionOS circular safe zone is 80% of canvas
	const maxSafeScale = 0.8
	const userScale = config.iconScale ?? 0.7
	const safeScale = Math.min(userScale, maxSafeScale)
	const safeSize = Math.floor(Math.min(width, height) * safeScale)

	const foregroundBuffer = await generateForeground(
		config.foreground,
		safeSize,
		safeSize,
	)

	// Create transparent canvas and center the icon
	const buffer = await sharp({
		create: {
			width,
			height,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	})
		.composite([
			{
				input: foregroundBuffer,
				top: Math.floor((height - safeSize) / 2),
				left: Math.floor((width - safeSize) / 2),
			},
		])
		.png()
		.toBuffer()

	return {
		spec,
		buffer,
		path: join(config.outputDir, spec.name),
	}
}

/**
 * Generates visionOS background layer (full background).
 * Used for visionOS 3D layered icon effect.
 */
async function generateVisionOSBackgroundLayer(
	config: AssetGeneratorConfig,
	spec: AssetSpec,
): Promise<GeneratedAsset> {
	const { width, height } = spec

	// Generate full background (fills entire canvas)
	const buffer = await generateBackground(config.background, width, height)

	return {
		spec,
		buffer,
		path: join(config.outputDir, spec.name),
	}
}

// ─── File System Operations ────────────────────────────────────────────────

/**
 * Persists all generated assets to the filesystem.
 *
 * Creates necessary directory structure automatically using recursive mkdir.
 * Asset paths may include subdirectories (e.g., 'android/mipmap-hdpi/icon.png').
 */
async function writeAssetsToDisk(
	assets: GeneratedAsset[],
	outputDir: string,
): Promise<void> {
	for (const asset of assets) {
		const fullPath = join(outputDir, asset.spec.name)

		await mkdir(dirname(fullPath), { recursive: true })
		await writeFile(fullPath, asset.buffer)
	}
}

/**
 * Web App Manifest (W3C standard) for PWA support.
 *
 * Generates a site.webmanifest file with proper icon entries including:
 * - Standard icons (purpose: "any")
 * - Maskable icons (purpose: "maskable") - safe zone aware for adaptive display
 * - Monochrome icons (purpose: "monochrome") - for themed/tinted display
 *
 * @see https://www.w3.org/TR/appmanifest/
 * @see https://web.dev/add-manifest/
 */
interface WebManifest {
	name: string
	short_name: string
	icons: Array<{
		src: string
		sizes: string
		type: string
		purpose?: string
	}>
	theme_color: string
	background_color: string
	display: string
	start_url: string
}

/**
 * Generates the site.webmanifest file for PWA support.
 */
async function generateWebManifest(
	config: AssetGeneratorConfig,
	outputDir: string,
): Promise<void> {
	// Get theme/background color from config
	let themeColor = '#FFFFFF'
	let backgroundColor = '#FFFFFF'

	if (config.background.type === 'color' && config.background.color) {
		backgroundColor = config.background.color.color
		themeColor = config.background.color.color
	}

	const manifest: WebManifest = {
		name: config.appName,
		short_name: config.appName,
		icons: [
			// Standard icons (any purpose)
			{
				src: 'icon-192x192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'any',
			},
			{
				src: 'icon-512x512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'any',
			},
			// Maskable icons (for adaptive display)
			{
				src: 'icon-maskable-192x192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'maskable',
			},
			{
				src: 'icon-maskable-512x512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable',
			},
			// Monochrome icons (for themed display)
			{
				src: 'icon-monochrome-192x192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'monochrome',
			},
			{
				src: 'icon-monochrome-512x512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'monochrome',
			},
		],
		theme_color: themeColor,
		background_color: backgroundColor,
		display: 'standalone',
		start_url: '/',
	}

	const webDir = join(outputDir, 'web')
	await mkdir(webDir, { recursive: true })
	await writeFile(
		join(webDir, 'site.webmanifest'),
		JSON.stringify(manifest, null, 2),
	)
}

/**
 * Generates favicon.ico containing multiple resolutions.
 *
 * Creates a multi-resolution ICO file with 16x16, 32x32, and 48x48 images.
 * Uses higher foreground scale (85%) for small sizes to improve visibility.
 *
 * @see https://en.wikipedia.org/wiki/ICO_(file_format)
 */
async function generateFaviconIco(
	config: AssetGeneratorConfig,
	outputDir: string,
): Promise<void> {
	const sizes = [16, 32, 48]
	const pngBuffers: Buffer[] = []

	for (const size of sizes) {
		// Use faviconScale for all favicon.ico sizes (default 85%)
		const scale = config.faviconScale ?? 0.85
		const foregroundSize = Math.floor(size * scale)

		// Generate background at target size
		const backgroundBuffer = await generateBackground(
			config.background,
			size,
			size,
		)

		// Generate foreground at scaled size
		const foregroundBuffer = await generateForeground(
			config.foreground,
			foregroundSize,
			foregroundSize,
		)

		// Composite foreground centered on background
		const buffer = await sharp(backgroundBuffer)
			.composite([
				{
					input: foregroundBuffer,
					top: Math.floor((size - foregroundSize) / 2),
					left: Math.floor((size - foregroundSize) / 2),
				},
			])
			.png()
			.toBuffer()

		pngBuffers.push(buffer)
	}

	// Convert PNG buffers to ICO format
	const icoBuffer = encodeIco(pngBuffers)

	// Write to web/favicon.ico
	const webDir = join(outputDir, 'web')
	await mkdir(webDir, { recursive: true })
	await writeFile(join(webDir, 'favicon.ico'), icoBuffer)
}

// ─── iOS Contents.json Generation ──────────────────────────────────────────

/**
 * iOS Contents.json structure for Xcode asset catalog.
 */
interface ContentsJsonImage {
	filename: string
	idiom: 'iphone' | 'ipad' | 'universal' | 'ios-marketing'
	scale: '1x' | '2x' | '3x'
	size: string
	appearances?: Array<{ appearance: string; value: string }>
}

interface ContentsJson {
	images: ContentsJsonImage[]
	info: { author: string; version: number }
}

/**
 * Generates iOS Contents.json for Xcode asset catalog.
 *
 * Creates a Contents.json file that Xcode uses to understand the icon set.
 * Includes entries for standard icons, dark variants, and tinted variants.
 */
async function generateContentsJson(
	_config: AssetGeneratorConfig,
	outputDir: string,
): Promise<void> {
	// Define iOS icon sizes with their idioms
	// Some sizes need entries for both iPhone and iPad
	const iconSizes: Array<{
		size: string
		scale: '1x' | '2x' | '3x'
		idiom: 'iphone' | 'ipad' | 'universal' | 'ios-marketing'
		filename: string
	}> = [
		// 20pt - iPhone/iPad Notification
		{ size: '20x20', scale: '1x', idiom: 'ipad', filename: 'icon-20.png' },
		{
			size: '20x20',
			scale: '2x',
			idiom: 'iphone',
			filename: 'icon-20@2x.png',
		},
		{ size: '20x20', scale: '2x', idiom: 'ipad', filename: 'icon-20@2x.png' },
		{
			size: '20x20',
			scale: '3x',
			idiom: 'iphone',
			filename: 'icon-20@3x.png',
		},
		// 29pt - iPhone/iPad Settings
		{ size: '29x29', scale: '1x', idiom: 'ipad', filename: 'icon-29.png' },
		{
			size: '29x29',
			scale: '2x',
			idiom: 'iphone',
			filename: 'icon-29@2x.png',
		},
		{ size: '29x29', scale: '2x', idiom: 'ipad', filename: 'icon-29@2x.png' },
		{
			size: '29x29',
			scale: '3x',
			idiom: 'iphone',
			filename: 'icon-29@3x.png',
		},
		// 40pt - iPhone/iPad Spotlight
		{ size: '40x40', scale: '1x', idiom: 'ipad', filename: 'icon-40.png' },
		{
			size: '40x40',
			scale: '2x',
			idiom: 'iphone',
			filename: 'icon-40@2x.png',
		},
		{ size: '40x40', scale: '2x', idiom: 'ipad', filename: 'icon-40@2x.png' },
		{
			size: '40x40',
			scale: '3x',
			idiom: 'iphone',
			filename: 'icon-40@3x.png',
		},
		// 60pt - iPhone App Icon
		{
			size: '60x60',
			scale: '2x',
			idiom: 'iphone',
			filename: 'icon-60@2x.png',
		},
		{
			size: '60x60',
			scale: '3x',
			idiom: 'iphone',
			filename: 'icon-60@3x.png',
		},
		// 76pt - iPad App Icon
		{ size: '76x76', scale: '1x', idiom: 'ipad', filename: 'icon-76.png' },
		{ size: '76x76', scale: '2x', idiom: 'ipad', filename: 'icon-76@2x.png' },
		// 83.5pt - iPad Pro
		{
			size: '83.5x83.5',
			scale: '2x',
			idiom: 'ipad',
			filename: 'icon-83.5@2x.png',
		},
		// 1024pt - App Store
		{
			size: '1024x1024',
			scale: '1x',
			idiom: 'ios-marketing',
			filename: 'icon-1024.png',
		},
	]

	const images: ContentsJsonImage[] = []

	// Add standard light mode icons
	for (const icon of iconSizes) {
		images.push({
			filename: icon.filename,
			idiom: icon.idiom,
			scale: icon.scale,
			size: icon.size,
		})
	}

	// Add dark appearance variants (iOS 18+)
	const darkSizes = ['60x60', '76x76', '83.5x83.5', '1024x1024']
	for (const icon of iconSizes) {
		if (darkSizes.includes(icon.size)) {
			images.push({
				filename: `dark/${icon.filename}`,
				idiom: icon.idiom,
				scale: icon.scale,
				size: icon.size,
				appearances: [{ appearance: 'luminosity', value: 'dark' }],
			})
		}
	}

	// Add tinted appearance variants (iOS 18+)
	for (const icon of iconSizes) {
		if (darkSizes.includes(icon.size)) {
			images.push({
				filename: `tinted/${icon.filename}`,
				idiom: icon.idiom,
				scale: icon.scale,
				size: icon.size,
				appearances: [{ appearance: 'luminosity', value: 'tinted' }],
			})
		}
	}

	const contentsJson: ContentsJson = {
		images,
		info: { author: 'appicons', version: 1 },
	}

	// Write to ios/AppIcon.appiconset/Contents.json
	const appiconsetDir = join(outputDir, 'ios', 'AppIcon.appiconset')
	await mkdir(appiconsetDir, { recursive: true })
	await writeFile(
		join(appiconsetDir, 'Contents.json'),
		JSON.stringify(contentsJson, null, 2),
	)
}

// ─── Android XML Generation ────────────────────────────────────────────────

/**
 * Generates Android adaptive icon XML files.
 *
 * Creates ic_launcher.xml and ic_launcher_round.xml that define
 * the adaptive icon structure with background, foreground, and monochrome layers.
 */
async function generateAdaptiveIconXml(
	_config: AssetGeneratorConfig,
	outputDir: string,
): Promise<void> {
	const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>
`

	// Write to android/mipmap-anydpi-v26/
	const xmlDir = join(outputDir, 'android', 'mipmap-anydpi-v26')
	await mkdir(xmlDir, { recursive: true })
	await writeFile(join(xmlDir, 'ic_launcher.xml'), xmlContent)
	await writeFile(join(xmlDir, 'ic_launcher_round.xml'), xmlContent)
}

/**
 * Generates Android colors.xml for solid color backgrounds.
 *
 * Creates a colors.xml file that can be used by Android adaptive icons
 * when a solid color background is preferred over an image.
 */
async function generateColorsXml(
	config: AssetGeneratorConfig,
	outputDir: string,
): Promise<void> {
	if (config.background.type !== 'color' || !config.background.color) {
		return
	}

	const bgColor = config.background.color.color.toUpperCase()
	const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${bgColor}</color>
</resources>
`

	// Write to android/values/
	const valuesDir = join(outputDir, 'android', 'values')
	await mkdir(valuesDir, { recursive: true })
	await writeFile(join(valuesDir, 'colors.xml'), xmlContent)
}

// ─── Preview ───────────────────────────────────────────────────────────────

/**
 * Preview icon sizes for live preview in TUI.
 */
export const PREVIEW_SIZES = {
	large: 256,
	small: 64,
} as const

/**
 * Generates a preview icon at the specified size.
 *
 * Used for live preview in the TUI config screen. Generates a single
 * composite icon without writing to disk, optimized for speed.
 *
 * @param config - Asset generator configuration (background, foreground, optional scale)
 * @param size - Icon size in pixels (square)
 * @returns PNG buffer of the preview icon
 */
export async function generatePreviewIcon(
	config: Pick<AssetGeneratorConfig, 'background' | 'foreground' | 'iconScale'>,
	size: number,
): Promise<Buffer> {
	// Generate background at target size
	const backgroundBuffer = await generateBackground(
		config.background,
		size,
		size,
	)

	// Scale foreground (user configurable, default 70% for icons)
	const foregroundScale = config.iconScale ?? 0.7
	const foregroundSize = Math.floor(size * foregroundScale)

	const foregroundBuffer = await generateForeground(
		config.foreground,
		foregroundSize,
		foregroundSize,
	)

	// Composite foreground centered on background
	const buffer = await sharp(backgroundBuffer)
		.composite([
			{
				input: foregroundBuffer,
				top: Math.floor((size - foregroundSize) / 2),
				left: Math.floor((size - foregroundSize) / 2),
			},
		])
		.png()
		.toBuffer()

	return buffer
}
