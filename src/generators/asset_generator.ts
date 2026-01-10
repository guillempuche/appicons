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
 * 4. Write files to platform-organized folders + INSTRUCTIONS.md.
 *
 * Platform support:
 * - iOS: App icons (@1x, @2x, @3x), launch images, dark icons (iOS 18+).
 * - Android: Adaptive icons (foreground/background/monochrome), night splash.
 * - Web: Favicons, PWA icons, Open Graph images.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

import {
	getAssetsByPlatform,
	getAssetsByType,
	getDarkAssetsByPlatform,
	getDarkAssetsByType,
} from '../assets/asset_specs'
import type {
	AssetGeneratorConfig,
	AssetSpec,
	GeneratedAsset,
	GenerationResult,
} from '../types'
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
 * - Integration instructions file (INSTRUCTIONS.md).
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

		// Generate integration instructions file.
		const instructions = generateInstructions({
			outputDir: config.outputDir,
			platforms: config.platforms,
			assetTypes: config.assetTypes,
		})
		const instructionsPath = join(config.outputDir, 'INSTRUCTIONS.md')
		await writeFile(instructionsPath, formatInstructionsText(instructions))
		console.log(`✓ Generated INSTRUCTIONS.md`)

		// Report generation summary.
		console.log(`\n✓ Generated ${assets.length} assets`)
		if (errors.length > 0) {
			console.log(`✗ Failed ${errors.length} assets`)
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
 * When generateDarkMode is enabled, also includes dark mode variants:
 * - iOS: Dark app icons
 * - Android: Night splash screens + monochrome icons
 *
 * Deduplication ensures each unique asset is generated only once,
 * even if it appears in multiple platform/type combinations.
 */
function determineAssetSpecs(config: AssetGeneratorConfig): AssetSpec[] {
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

			// Dark mode assets (only if enabled)
			if (config.generateDarkMode) {
				const darkPlatformSpecs = getDarkAssetsByPlatform(platform)
				const darkTypeSpecs = getDarkAssetsByType(assetType)

				const darkMatching = darkPlatformSpecs.filter(ps =>
					darkTypeSpecs.some(ts => ts.name === ps.name),
				)
				specs.push(...darkMatching)
			}
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
 * Dark mode handling:
 * - For colorMode: 'dark', uses darkBackground config if available
 * - For colorMode: 'any' (monochrome), generates white-on-transparent
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

	// Step 1: Generate the background layer at full asset dimensions.
	// Use dark background for dark mode assets if available.
	const backgroundConfig =
		spec.colorMode === 'dark' && config.darkBackground
			? config.darkBackground
			: config.background
	const backgroundBuffer = await generateBackground(
		backgroundConfig,
		width,
		height,
	)

	// Step 2: Calculate foreground size based on asset type.
	// Separate scales for icons vs splash screens (user configurable).
	const foregroundScale =
		spec.type === 'splash'
			? (config.splashScale ?? 0.25) // Splash: 25% default, range 0.1-0.5
			: (config.iconScale ?? 0.7) // Icons: 70% default, range 0.2-1.0
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
