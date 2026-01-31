#!/usr/bin/env node

/**
 * Effect-based CLI entry point for App Asset Generator.
 *
 * This module provides the command-line interface for generating app assets
 * across iOS, Android, and Web platforms. Uses Effect CLI for argument parsing.
 *
 * Subcommands:
 * - generate: Generate assets from command-line options.
 * - validate: Validate configuration without generating.
 * - list-fonts: List available Google Fonts.
 * - list-platforms: Show platform specifications.
 * - instructions: Show integration instructions.
 *
 * No subcommand: Launch interactive OpenTUI interface.
 *
 * Output formats:
 * - text (default): Human-readable console output.
 * - json: Machine-readable output for AI agents and automation.
 */

import { Command, Options } from '@effect/cli'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Console, Effect, Option } from 'effect'

import packageJson from '../package.json'
import { runInteractiveMenu } from './index'
import type { AssetGeneratorConfig } from './types'
import {
	fetchGoogleFonts,
	type GoogleFont,
	getGoogleFonts,
} from './utils/google_fonts'
import {
	isValidGoogleFont,
	suggestSimilarFonts,
} from './utils/google_fonts_api'
import {
	deleteHistoryEntry,
	formatHistoryDate,
	getEntrySummary,
	getHistoryEntry,
	listHistory,
	renameHistoryEntry,
} from './utils/history'
import {
	formatInstructionsJson,
	formatInstructionsText,
	type GenerationContext,
	generateInstructions,
} from './utils/instructions'
import { resolvePath } from './utils/path_utils'
import {
	checkForUpdatesNoCache,
	printUpdateNoticeIfCached,
	runUpdateScript,
	scheduleBackgroundVersionCheck,
} from './utils/version_check'

// ─── Scale Warnings (Platform Guidelines) ──────────────────────────────────

/**
 * Get warning for icon scale based on platform guidelines.
 * - Android: Safe zone is 66dp/108dp ≈ 61% (Material Design guidelines)
 * - iOS: No strict limit, but content should be visible at small sizes
 */
function getIconScaleWarning(scale: number): string | null {
	if (scale > 0.66) {
		return 'Warning: Icon scale >66% may clip on Android (safe zone is 66dp of 108dp canvas)'
	}
	if (scale < 0.4) {
		return 'Info: Icon may be hard to see at small sizes (20px)'
	}
	return null
}

/**
 * Get warning for splash scale based on platform guidelines.
 * - iOS HIG: Splash should be simple, centered branding
 * - Android: Splash icon recommended at 200dp max
 */
function getSplashScaleWarning(scale: number): string | null {
	if (scale > 0.5) {
		return 'Info: Large splash (>50%) may feel overwhelming on smaller devices'
	}
	if (scale < 0.1) {
		return 'Info: Very small splash (<10%) may be hard to see'
	}
	return null
}

/**
 * Generate datetime-based output directory.
 * Format: ./assets/generated_YYYY-MM-DD_HH-MM-SS
 */
function getOutputDir(): string {
	const now = new Date()
	const date = now.toISOString().slice(0, 10) // YYYY-MM-DD
	const time = now.toISOString().slice(11, 19).replace(/:/g, '-') // HH-MM-SS
	return `./assets/generated_${date}_${time}`
}

// ─── Global Options ────────────────────────────────────────────────────────
// These options are available across multiple subcommands.

/** Output format: 'text' for humans, 'json' for AI agents. */
const formatOpt = Options.text('format').pipe(Options.withDefault('text'))

/** Suppress non-essential output for scripting. */
const quietOpt = Options.boolean('quiet').pipe(Options.withDefault(false))

// ─── Generate Command ──────────────────────────────────────────────────────
// The main asset generation command with all configuration options.

// Application metadata options.
const nameOpt = Options.text('name').pipe(Options.withDefault('MyApp'))
const platformsOpt = Options.text('platforms').pipe(
	Options.withDefault('ios,android,web'),
)
const typesOpt = Options.text('types').pipe(
	Options.withDefault('icon,splash,adaptive,favicon'),
)

// Background appearance options.
const bgTypeOpt = Options.text('bg-type').pipe(Options.withDefault('color'))
const bgColorOpt = Options.text('bg-color').pipe(Options.withDefault('#F7F5F0'))
const bgGradientTypeOpt = Options.text('bg-gradient-type').pipe(
	Options.withDefault('linear'),
)
const bgGradientColorsOpt = Options.text('bg-gradient-colors').pipe(
	Options.withDefault('#B3D9E8,#004C6E'),
)
const bgGradientAngleOpt = Options.integer('bg-gradient-angle').pipe(
	Options.withDefault(180),
)
const bgImageOpt = Options.text('bg-image').pipe(Options.optional)

// Foreground (logo/icon) appearance options.
const fgTypeOpt = Options.text('fg-type').pipe(Options.withDefault('text'))
const fgTextOpt = Options.text('fg-text').pipe(Options.withDefault('"'))
const fgColorOpt = Options.text('fg-color').pipe(Options.withDefault('#1A1A1A'))
const fgFontOpt = Options.text('fg-font').pipe(
	Options.withDefault('Playfair Display'),
)
const fgFontSourceOpt = Options.text('fg-font-source').pipe(
	Options.withDefault('google'),
)
const fgFontSizeOpt = Options.integer('fg-font-size').pipe(Options.optional)
const fgSvgOpt = Options.text('fg-svg').pipe(Options.optional)
const fgSvgColorOpt = Options.text('fg-svg-color').pipe(Options.optional)
const fgImageOpt = Options.text('fg-image').pipe(Options.optional)

// Foreground scaling options (controls how much of the canvas the logo fills).
const iconScaleOpt = Options.text('icon-scale').pipe(Options.withDefault('0.7'))
const splashScaleOpt = Options.text('splash-scale').pipe(
	Options.withDefault('0.25'),
)

// Output behavior options.
const outputOpt = Options.text('output').pipe(
	Options.withAlias('o'),
	Options.withDescription(
		'Output directory path (default: ./assets/generated_<timestamp>)',
	),
	Options.optional,
)
const dryRunOpt = Options.boolean('dry-run').pipe(Options.withDefault(false))
const noZipOpt = Options.boolean('no-zip').pipe(Options.withDefault(false))

// History options.
const fromHistoryOpt = Options.text('from-history').pipe(
	Options.withDescription('Load config from history entry ID'),
	Options.optional,
)

/**
 * The 'generate' subcommand creates app assets from CLI options.
 *
 * This is the main workhorse command that:
 * 1. Parses and validates all configuration options.
 * 2. Builds background and foreground layer configurations.
 * 3. Invokes the asset generator pipeline.
 * 4. Outputs results in text or JSON format.
 */
const generate = Command.make(
	'generate',
	{
		name: nameOpt,
		platforms: platformsOpt,
		types: typesOpt,
		bgType: bgTypeOpt,
		bgColor: bgColorOpt,
		bgGradientType: bgGradientTypeOpt,
		bgGradientColors: bgGradientColorsOpt,
		bgGradientAngle: bgGradientAngleOpt,
		bgImage: bgImageOpt,
		fgType: fgTypeOpt,
		fgText: fgTextOpt,
		fgColor: fgColorOpt,
		fgFont: fgFontOpt,
		fgFontSource: fgFontSourceOpt,
		fgFontSize: fgFontSizeOpt,
		fgSvg: fgSvgOpt,
		fgSvgColor: fgSvgColorOpt,
		fgImage: fgImageOpt,
		iconScale: iconScaleOpt,
		splashScale: splashScaleOpt,
		output: outputOpt,
		format: formatOpt,
		quiet: quietOpt,
		dryRun: dryRunOpt,
		noZip: noZipOpt,
		fromHistory: fromHistoryOpt,
	},
	opts =>
		Effect.promise(async () => {
			const startTime = Date.now()

			// If --from-history is provided, load config from history entry
			if (Option.isSome(opts.fromHistory)) {
				const historyId = opts.fromHistory.value
				const entry = await getHistoryEntry(historyId)

				if (!entry) {
					console.error(`Error: History entry "${historyId}" not found`)
					console.error('\nUse "appicons history" to list available entries')
					process.exit(2)
				}

				// Use config from history, but allow overrides from CLI options
				const historyConfig = entry.config

				// Override with CLI options if explicitly provided
				const outputDir = Option.isSome(opts.output)
					? resolvePath(opts.output.value)
					: getOutputDir()

				// Parse platforms/types if different from defaults
				const platforms =
					opts.platforms !== 'ios,android,web'
						? (opts.platforms.split(',') as ('ios' | 'android' | 'web')[])
						: historyConfig.platforms

				const assetTypes =
					opts.types !== 'icon,splash,adaptive,favicon'
						? (opts.types.split(',') as (
								| 'icon'
								| 'splash'
								| 'adaptive'
								| 'favicon'
							)[])
						: historyConfig.assetTypes

				const config: AssetGeneratorConfig = {
					...historyConfig,
					platforms,
					assetTypes,
					outputDir,
				}

				if (!opts.quiet) {
					console.log(
						`\nLoading config from history: ${entry.name || formatHistoryDate(entry.createdAt)}`,
					)
					console.log(`Output directory: ${outputDir}`)
				}

				// Execute asset generation pipeline.
				const { generateAssets } = await import('./generators/asset_generator')
				const result = await generateAssets(config)

				const duration = Date.now() - startTime

				// Generate post-generation integration instructions.
				const instructionContext: GenerationContext = {
					outputDir,
					platforms: config.platforms,
					assetTypes: config.assetTypes,
				}
				const instructions = generateInstructions(instructionContext)

				// Format and output results based on requested format.
				if (opts.format === 'json') {
					const output = {
						success: result.success,
						fromHistory: historyId,
						config: {
							appName: config.appName,
							platforms: config.platforms,
							assetTypes: config.assetTypes,
						},
						assets: result.assets.map(asset => ({
							name: asset.spec.name,
							path: asset.path,
							width: asset.spec.width,
							height: asset.spec.height,
							platform: asset.spec.platform,
							type: asset.spec.type,
							size: asset.buffer.length,
						})),
						summary: {
							totalAssets: result.assets.length,
							outputDir: result.outputDir,
							instructionsPath: result.instructionsPath,
						},
						instructions: formatInstructionsJson(instructions),
						errors: result.errors || [],
						duration,
					}
					console.log(JSON.stringify(output, null, 2))
				} else {
					if (result.success) {
						console.log(
							`\n✓ Successfully generated ${result.assets.length} assets`,
						)
						console.log(`  Output directory: ${result.outputDir}`)
						console.log(`  Duration: ${duration}ms`)
					} else {
						console.error(`\n✗ Generation failed`)
						if (result.errors && result.errors.length > 0) {
							for (const error of result.errors) {
								console.error(`  - ${error}`)
							}
						}
						process.exit(1)
					}
				}
				return
			}

			const outputDir = Option.isSome(opts.output)
				? resolvePath(opts.output.value)
				: getOutputDir()

			// Build background configuration based on the selected type.
			const bgType = opts.bgType as 'color' | 'gradient' | 'image'
			const background: any = { type: bgType }

			if (bgType === 'color') {
				background.color = { type: 'solid', color: opts.bgColor }
			} else if (bgType === 'gradient') {
				background.gradient = {
					type: opts.bgGradientType,
					colors: opts.bgGradientColors.split(','),
					angle: opts.bgGradientAngle,
				}
			} else if (bgType === 'image') {
				if (!Option.isSome(opts.bgImage)) {
					console.error(
						'Error: --bg-image is required when --bg-type is "image"',
					)
					process.exit(2)
				}
				background.imagePath = opts.bgImage.value
			}

			// Build foreground configuration based on the selected type.
			const fgType = opts.fgType as 'text' | 'svg' | 'image'
			const foreground: any = { type: fgType }

			if (fgType === 'text') {
				foreground.text = opts.fgText
				foreground.fontFamily = opts.fgFont
				foreground.color = opts.fgColor
				foreground.fontSource = opts.fgFontSource
				if (Option.isSome(opts.fgFontSize)) {
					foreground.fontSize = opts.fgFontSize.value
				}

				// Validate Google Font if specified
				if (opts.fgFontSource === 'google') {
					if (!opts.quiet) {
						console.log(`Validating Google Font: ${opts.fgFont}`)
					}
					const isValid = await isValidGoogleFont(opts.fgFont)
					if (!isValid) {
						console.error(
							`\nError: Font "${opts.fgFont}" not found in Google Fonts`,
						)
						const suggestions = await suggestSimilarFonts(opts.fgFont)
						if (suggestions.length > 0) {
							console.error('\nDid you mean:')
							for (const suggestion of suggestions) {
								console.error(`  - ${suggestion}`)
							}
						}
						console.error('\nBrowse all fonts: https://fonts.google.com/')
						console.error('Or use: appicons list-fonts')
						process.exit(2)
					}
				}
			} else if (fgType === 'svg') {
				if (!Option.isSome(opts.fgSvg)) {
					console.error('Error: --fg-svg is required when --fg-type is "svg"')
					process.exit(2)
				}
				foreground.svgPath = opts.fgSvg.value
				if (Option.isSome(opts.fgSvgColor)) {
					foreground.color = opts.fgSvgColor.value
				}
			} else if (fgType === 'image') {
				if (!Option.isSome(opts.fgImage)) {
					console.error(
						'Error: --fg-image is required when --fg-type is "image"',
					)
					process.exit(2)
				}
				foreground.imagePath = opts.fgImage.value
			}

			// Parse and validate scale options.
			// Scales control how much of the canvas the foreground fills.
			const iconScale = parseFloat(opts.iconScale)
			const splashScale = parseFloat(opts.splashScale)

			if (iconScale < 0.1 || iconScale > 1.5) {
				console.error('Error: --icon-scale must be between 0.1 and 1.5')
				process.exit(2)
			}
			if (splashScale < 0.05 || splashScale > 1.0) {
				console.error('Error: --splash-scale must be between 0.05 and 1.0')
				process.exit(2)
			}

			// Show scale warnings based on platform guidelines
			const iconWarning = getIconScaleWarning(iconScale)
			const splashWarning = getSplashScaleWarning(splashScale)
			if (iconWarning) console.warn(`\x1b[33m${iconWarning}\x1b[0m`)
			if (splashWarning) console.warn(`\x1b[33m${splashWarning}\x1b[0m`)

			// Assemble the complete asset generator configuration.
			const config: AssetGeneratorConfig = {
				appName: opts.name,
				platforms: opts.platforms.split(',') as ('ios' | 'android' | 'web')[],
				assetTypes: opts.types.split(',') as (
					| 'icon'
					| 'splash'
					| 'adaptive'
					| 'favicon'
				)[],
				background,
				foreground,
				outputDir,
				iconScale,
				splashScale,
			}

			// Dry-run mode: show config without generating assets.
			if (opts.dryRun) {
				if (opts.format === 'json') {
					console.log(JSON.stringify({ dryRun: true, config }, null, 2))
				} else {
					console.log('\n=== DRY RUN ===')
					console.log('Configuration:', JSON.stringify(config, null, 2))
					console.log('\nNo assets will be generated in dry-run mode.')
				}
				return
			}

			// Execute asset generation pipeline.
			if (!opts.quiet) {
				console.log('\nGenerating assets...')
				console.log(`Output directory: ${outputDir}`)
			}

			const { generateAssets } = await import('./generators/asset_generator')
			const result = await generateAssets(config)

			const duration = Date.now() - startTime

			// Generate post-generation integration instructions.
			const instructionContext: GenerationContext = {
				outputDir,
				platforms: config.platforms,
				assetTypes: config.assetTypes,
			}
			const instructions = generateInstructions(instructionContext)

			// Format and output results based on requested format.
			if (opts.format === 'json') {
				// Structured JSON output for AI agents and automation.
				const output = {
					success: result.success,
					config: {
						appName: config.appName,
						platforms: config.platforms,
						assetTypes: config.assetTypes,
					},
					assets: result.assets.map(asset => ({
						name: asset.spec.name,
						path: asset.path,
						width: asset.spec.width,
						height: asset.spec.height,
						platform: asset.spec.platform,
						type: asset.spec.type,
						size: asset.buffer.length,
					})),
					summary: {
						totalAssets: result.assets.length,
						byPlatform: result.assets.reduce(
							(acc, asset) => {
								acc[asset.spec.platform] = (acc[asset.spec.platform] || 0) + 1
								return acc
							},
							{} as Record<string, number>,
						),
						byType: result.assets.reduce(
							(acc, asset) => {
								acc[asset.spec.type] = (acc[asset.spec.type] || 0) + 1
								return acc
							},
							{} as Record<string, number>,
						),
						totalSize: result.assets.reduce(
							(sum, asset) => sum + asset.buffer.length,
							0,
						),
						outputDir: result.outputDir,
						instructionsPath: result.instructionsPath,
					},
					instructions: formatInstructionsJson(instructions),
					errors: result.errors || [],
					warnings: [],
					duration,
				}
				console.log(JSON.stringify(output, null, 2))
			} else {
				// Human-readable console output.
				if (result.success) {
					console.log(
						`\n✓ Successfully generated ${result.assets.length} assets`,
					)
					console.log(`  Output directory: ${result.outputDir}`)
					if (result.instructionsPath) {
						console.log(`  Instructions: ${result.instructionsPath}`)
					}
					console.log(`  Duration: ${duration}ms`)

					if (!opts.quiet) {
						console.log(formatInstructionsText(instructions))
					}
				} else {
					console.error(`\n✗ Generation failed`)
					if (result.errors && result.errors.length > 0) {
						console.error('\nErrors:')
						for (const error of result.errors) {
							console.error(`  - ${error}`)
						}
					}
					process.exit(1)
				}
			}
		}),
)

// ─── Validate Command ──────────────────────────────────────────────────────

/**
 * The 'validate' subcommand checks configuration without generating assets.
 *
 * Useful for CI/CD pipelines or pre-flight checks before running expensive
 * asset generation. Validates file paths, font availability, and config.
 */
const validate = Command.make(
	'validate',
	{
		bgType: bgTypeOpt,
		bgImage: bgImageOpt,
		fgType: fgTypeOpt,
		fgSvg: fgSvgOpt,
		fgImage: fgImageOpt,
		fgFont: fgFontOpt,
		fgFontSource: fgFontSourceOpt,
		format: formatOpt,
	},
	opts =>
		Effect.promise(async () => {
			const errors: string[] = []
			const warnings: string[] = []

			// Validate background image path
			if (opts.bgType === 'image' && !Option.isSome(opts.bgImage)) {
				errors.push('--bg-image is required when --bg-type is "image"')
			}

			// Validate foreground paths
			if (opts.fgType === 'svg' && !Option.isSome(opts.fgSvg)) {
				errors.push('--fg-svg is required when --fg-type is "svg"')
			}
			if (opts.fgType === 'image' && !Option.isSome(opts.fgImage)) {
				errors.push('--fg-image is required when --fg-type is "image"')
			}

			// Validate Google Font if specified
			if (opts.fgType === 'text' && opts.fgFontSource === 'google') {
				const isValid = await isValidGoogleFont(opts.fgFont)
				if (!isValid) {
					const suggestions = await suggestSimilarFonts(opts.fgFont)
					if (suggestions.length > 0) {
						warnings.push(
							`Font "${opts.fgFont}" not found. Did you mean: ${suggestions.slice(0, 3).join(', ')}?`,
						)
					} else {
						warnings.push(`Font "${opts.fgFont}" not found in Google Fonts`)
					}
				}
			}

			const isValid = errors.length === 0

			if (opts.format === 'json') {
				console.log(
					JSON.stringify({ valid: isValid, errors, warnings }, null, 2),
				)
			} else {
				if (isValid) {
					console.log('✓ Configuration is valid')
					if (warnings.length > 0) {
						console.log('\nWarnings:')
						for (const warning of warnings) {
							console.log(`  ⚠ ${warning}`)
						}
					}
				} else {
					console.log('✗ Configuration is invalid')
					console.log('\nErrors:')
					for (const error of errors) {
						console.log(`  - ${error}`)
					}
					if (warnings.length > 0) {
						console.log('\nWarnings:')
						for (const warning of warnings) {
							console.log(`  ⚠ ${warning}`)
						}
					}
				}
			}

			if (!isValid) {
				process.exit(2)
			}
		}),
)

// ─── List Fonts Command ────────────────────────────────────────────────────

/**
 * The 'list-fonts' subcommand displays all available Google Fonts.
 *
 * Fetches the complete Google Fonts catalog (1,500+ fonts) and displays
 * them grouped by category. Useful for exploring font options.
 */
const listFontsCmd = Command.make(
	'list-fonts',
	{ format: formatOpt },
	({ format }) =>
		Effect.gen(function* () {
			// Fetch all Google Fonts (1,500+)
			yield* Effect.promise(() => fetchGoogleFonts())
			const fonts = getGoogleFonts()

			if (format === 'json') {
				yield* Console.log(
					JSON.stringify(
						{
							note: `Complete Google Fonts catalog (${fonts.length} fonts)`,
							fonts,
						},
						null,
						2,
					),
				)
				return
			}

			console.log(`\nGoogle Fonts Catalog (${fonts.length} fonts):\n`)

			const byCategory: Record<string, GoogleFont[]> = {}
			for (const font of fonts) {
				const cat = font.category || 'other'
				if (!byCategory[cat]) byCategory[cat] = []
				byCategory[cat].push(font)
			}

			// Show count per category
			for (const [category, categoryFonts] of Object.entries(byCategory)) {
				console.log(
					`  ${category.toUpperCase()}: ${categoryFonts.length} fonts`,
				)
			}
			console.log()

			// Show first 10 of each category as examples
			for (const [category, categoryFonts] of Object.entries(byCategory)) {
				console.log(`  ${category.toUpperCase()} (examples):`)
				for (const font of categoryFonts.slice(0, 10)) {
					console.log(`    - ${font.family}`)
				}
				if (categoryFonts.length > 10) {
					console.log(`    ... and ${categoryFonts.length - 10} more`)
				}
				console.log()
			}

			console.log(
				`Use with: appicons generate --fg-font "Font Name" --fg-font-source google`,
			)
			console.log(`Browse all fonts: https://fonts.google.com/`)
		}),
)

// ─── Instructions Command ──────────────────────────────────────────────────

/**
 * The 'instructions' subcommand shows integration guidance.
 *
 * Outputs step-by-step instructions for integrating generated assets
 * into an Expo/React Native project, including example app.config.ts changes.
 */
const instructionsCmd = Command.make(
	'instructions',
	{
		platforms: platformsOpt,
		types: typesOpt,
		format: formatOpt,
	},
	opts =>
		Effect.sync(() => {
			const context: GenerationContext = {
				outputDir: getOutputDir(),
				platforms: opts.platforms.split(',') as ('ios' | 'android' | 'web')[],
				assetTypes: opts.types.split(',') as (
					| 'icon'
					| 'splash'
					| 'adaptive'
					| 'favicon'
				)[],
			}

			const instructions = generateInstructions(context)

			if (opts.format === 'json') {
				console.log(
					JSON.stringify(formatInstructionsJson(instructions), null, 2),
				)
			} else {
				console.log(formatInstructionsText(instructions))
			}
		}),
)

// ─── List Platforms Command ────────────────────────────────────────────────

/**
 * The 'list-platforms' subcommand shows supported platforms and asset types.
 *
 * Displays iOS, Android, and Web platform information including what
 * types of assets are generated for each and expected asset counts.
 */
const listPlatformsCmd = Command.make(
	'list-platforms',
	{ format: formatOpt },
	({ format }) => {
		const platforms = {
			ios: {
				name: 'iOS',
				icons: 'App icons for iPhone and iPad',
				splash: 'Launch screens for various device sizes',
				assetCount: { icon: 2, splash: 6 },
			},
			android: {
				name: 'Android',
				icons: 'Launcher icons and adaptive icons',
				adaptive: 'Foreground and background layers for adaptive icons',
				assetCount: { icon: 5, adaptive: 3, splash: 4 },
			},
			web: {
				name: 'Web',
				icons: 'PWA icons and favicons',
				favicon: 'Favicon in multiple formats',
				assetCount: { icon: 4, favicon: 4 },
			},
		}

		if (format === 'json') {
			return Console.log(JSON.stringify({ platforms }, null, 2))
		}

		return Effect.sync(() => {
			console.log('\nSupported Platforms:\n')
			for (const [id, info] of Object.entries(platforms)) {
				console.log(`  ${info.name.toUpperCase()} (${id})`)
				console.log(`    Icons: ${info.icons}`)
				if ('splash' in info) console.log(`    Splash: ${info.splash}`)
				if ('adaptive' in info) console.log(`    Adaptive: ${info.adaptive}`)
				if ('favicon' in info) console.log(`    Favicon: ${info.favicon}`)
				console.log(`    Asset count:`, JSON.stringify(info.assetCount))
				console.log()
			}
		})
	},
)

// ─── Completion Command ────────────────────────────────────────────────────

/**
 * The 'completion' subcommand outputs shell completion scripts.
 *
 * Provides bash/zsh completion for command names, options, and arguments.
 * Install by appending output to your shell's rc file.
 */
const completionCmd = Command.make('completion', {}, () =>
	Effect.promise(async () => {
		const fs = await import('node:fs/promises')
		const path = await import('node:path')
		const { fileURLToPath } = await import('node:url')

		try {
			const __dirname = path.dirname(fileURLToPath(import.meta.url))
			const completionPath = path.join(__dirname, '..', 'completions.sh')
			const completionScript = await fs.readFile(completionPath, 'utf-8')

			console.log(completionScript)
			console.log('\n# Installation instructions:')
			console.log('# bash: appicons completion >> ~/.bashrc')
			console.log('# zsh:  appicons completion >> ~/.zshrc')
		} catch (error) {
			console.error('Error reading completion script:', error)
			process.exit(1)
		}
	}),
)

// ─── Update Command ────────────────────────────────────────────────────────

/**
 * The 'update' subcommand updates appicons to the latest version.
 *
 * Fetches the latest version from GitHub releases and runs the
 * appropriate install script (bash for Unix, PowerShell for Windows).
 */
const updateCmd = Command.make('update', {}, () =>
	Effect.promise(async () => {
		console.log('Checking for updates...\n')

		const info = await checkForUpdatesNoCache()

		if (!info) {
			console.error('Failed to check for updates. Please try again later.')
			process.exit(1)
		}

		console.log(`Current version: ${info.current}`)
		console.log(`Latest version:  ${info.latest}`)

		if (!info.isOutdated) {
			console.log('\n\u2713 Already on latest version')
			return
		}

		console.log('\nUpdating...')

		try {
			await runUpdateScript()
			console.log(`\n\u2713 Updated to ${info.latest}`)
		} catch (error) {
			console.error('\nUpdate failed:', error)
			console.error(`\nYou can update manually by visiting: ${info.releaseUrl}`)
			process.exit(1)
		}
	}),
)

// ─── History Command ────────────────────────────────────────────────────────

/** Limit option for history list command. */
const historyLimitOpt = Options.integer('limit').pipe(Options.withDefault(10))

/** Entry ID argument for history subcommands. */
const historyIdArg = Options.text('id').pipe(Options.optional)

/** Name argument for history rename subcommand. */
const historyNameArg = Options.text('name').pipe(Options.optional)

/**
 * The 'history' subcommand manages generation history.
 *
 * Subcommands:
 * - (default): List recent history entries
 * - show <id>: Show details of a specific entry
 * - delete <id>: Delete an entry
 * - rename <id> <name>: Rename an entry
 */
const historyListCmd = Command.make(
	'list',
	{ limit: historyLimitOpt, format: formatOpt },
	opts =>
		Effect.promise(async () => {
			const entries = await listHistory(opts.limit)

			if (opts.format === 'json') {
				console.log(
					JSON.stringify(
						{
							count: entries.length,
							entries: entries.map(e => ({
								id: e.id,
								createdAt: e.createdAt,
								name: e.name,
								summary: getEntrySummary(e),
								outputDir: e.outputDir,
								platforms: e.config.platforms,
								assetTypes: e.config.assetTypes,
							})),
						},
						null,
						2,
					),
				)
				return
			}

			if (entries.length === 0) {
				console.log('\nNo history entries found.')
				console.log('Generate assets to create your first entry.')
				return
			}

			console.log(`\nHistory (${entries.length} entries):\n`)
			for (const entry of entries) {
				const date = formatHistoryDate(entry.createdAt)
				const summary = getEntrySummary(entry)
				const name = entry.name ? ` "${entry.name}"` : ''
				console.log(`  ${entry.id}`)
				console.log(`    ${date} - ${summary}${name}`)
				console.log()
			}

			console.log(
				'Use "appicons generate --from-history <id>" to reuse a config',
			)
		}),
)

const historyShowCmd = Command.make(
	'show',
	{ id: historyIdArg, format: formatOpt },
	opts =>
		Effect.promise(async () => {
			if (!Option.isSome(opts.id)) {
				console.error('Error: Entry ID is required')
				console.error('Usage: appicons history show --id <id>')
				process.exit(2)
			}

			const entry = await getHistoryEntry(opts.id.value)

			if (!entry) {
				console.error(`Error: History entry "${opts.id.value}" not found`)
				process.exit(2)
			}

			if (opts.format === 'json') {
				console.log(JSON.stringify(entry, null, 2))
				return
			}

			console.log(`\nHistory Entry: ${entry.id}`)
			console.log(`────────────────────────────────────────────`)
			console.log(`Created: ${formatHistoryDate(entry.createdAt)}`)
			if (entry.name) {
				console.log(`Name: ${entry.name}`)
			}
			console.log(`Output: ${entry.outputDir}`)
			console.log()
			console.log('Configuration:')
			console.log(`  App Name: ${entry.config.appName}`)
			console.log(`  Platforms: ${entry.config.platforms.join(', ')}`)
			console.log(`  Asset Types: ${entry.config.assetTypes.join(', ')}`)
			console.log(`  Background: ${entry.config.background.type}`)
			console.log(`  Foreground: ${entry.config.foreground.type}`)
			if (entry.config.iconScale) {
				console.log(`  Icon Scale: ${entry.config.iconScale}`)
			}
			if (entry.config.splashScale) {
				console.log(`  Splash Scale: ${entry.config.splashScale}`)
			}
			console.log()
			console.log(`Use "appicons generate --from-history ${entry.id}" to reuse`)
		}),
)

const historyDeleteCmd = Command.make(
	'delete',
	{ id: historyIdArg, format: formatOpt },
	opts =>
		Effect.promise(async () => {
			if (!Option.isSome(opts.id)) {
				console.error('Error: Entry ID is required')
				console.error('Usage: appicons history delete --id <id>')
				process.exit(2)
			}

			const success = await deleteHistoryEntry(opts.id.value)

			if (opts.format === 'json') {
				console.log(JSON.stringify({ success, id: opts.id.value }))
				return
			}

			if (success) {
				console.log(`✓ Deleted history entry: ${opts.id.value}`)
			} else {
				console.error(`Error: History entry "${opts.id.value}" not found`)
				process.exit(2)
			}
		}),
)

const historyRenameCmd = Command.make(
	'rename',
	{ id: historyIdArg, name: historyNameArg, format: formatOpt },
	opts =>
		Effect.promise(async () => {
			if (!Option.isSome(opts.id)) {
				console.error('Error: Entry ID is required')
				console.error(
					'Usage: appicons history rename --id <id> --name "My Config"',
				)
				process.exit(2)
			}

			const newName = Option.isSome(opts.name) ? opts.name.value : undefined
			const success = await renameHistoryEntry(opts.id.value, newName)

			if (opts.format === 'json') {
				console.log(
					JSON.stringify({ success, id: opts.id.value, name: newName }),
				)
				return
			}

			if (success) {
				if (newName) {
					console.log(`✓ Renamed history entry to: "${newName}"`)
				} else {
					console.log(`✓ Cleared name from history entry`)
				}
			} else {
				console.error(`Error: History entry "${opts.id.value}" not found`)
				process.exit(2)
			}
		}),
)

const historyCmd = Command.make(
	'history',
	{ limit: historyLimitOpt, format: formatOpt },
	opts =>
		Effect.promise(async () => {
			// Default behavior: list history
			const entries = await listHistory(opts.limit)

			if (opts.format === 'json') {
				console.log(
					JSON.stringify(
						{
							count: entries.length,
							entries: entries.map(e => ({
								id: e.id,
								createdAt: e.createdAt,
								name: e.name,
								summary: getEntrySummary(e),
								outputDir: e.outputDir,
								platforms: e.config.platforms,
								assetTypes: e.config.assetTypes,
							})),
						},
						null,
						2,
					),
				)
				return
			}

			if (entries.length === 0) {
				console.log('\nNo history entries found.')
				console.log('Generate assets to create your first entry.')
				return
			}

			console.log(`\nHistory (${entries.length} entries):\n`)
			for (const entry of entries) {
				const date = formatHistoryDate(entry.createdAt)
				const summary = getEntrySummary(entry)
				const name = entry.name ? ` "${entry.name}"` : ''
				console.log(`  ${entry.id}`)
				console.log(`    ${date} - ${summary}${name}`)
				console.log()
			}

			console.log('Commands:')
			console.log('  appicons history show --id <id>     Show entry details')
			console.log('  appicons history delete --id <id>   Delete an entry')
			console.log(
				'  appicons history rename --id <id> --name "Name"   Rename an entry',
			)
			console.log()
			console.log(
				'Use "appicons generate --from-history <id>" to reuse a config',
			)
		}),
).pipe(
	Command.withSubcommands([
		historyListCmd,
		historyShowCmd,
		historyDeleteCmd,
		historyRenameCmd,
	]),
)

// ─── Main Command (OpenTUI launcher) ───────────────────────────────────────

/**
 * The root command launches the interactive TUI when no subcommand is given.
 *
 * Uses OpenTUI to provide a visual configuration interface with live preview.
 * For non-interactive use, specify a subcommand like 'generate' or 'validate'.
 */
const assets = Command.make('appicons', {}, () =>
	Effect.promise(() => runInteractiveMenu()),
)

// ─── Assemble CLI ──────────────────────────────────────────────────────────
// Compose the root command with all subcommands.

const command = assets.pipe(
	Command.withSubcommands([
		generate,
		validate,
		historyCmd,
		instructionsCmd,
		listFontsCmd,
		listPlatformsCmd,
		completionCmd,
		updateCmd,
	]),
)

const cli = Command.run(command, {
	name: 'appicons',
	version: packageJson.version,
})

// ─── Version Check Setup ───────────────────────────────────────────────────
// Non-blocking version check: reads from cache at exit, updates cache in background.

// Schedule background fetch to update cache for next run (truly non-blocking)
scheduleBackgroundVersionCheck()

// Print update notice when CLI exits (reads from cache only, instant)
process.on('beforeExit', () => {
	// Skip update notice for the update command itself
	const isUpdateCommand = process.argv.includes('update')
	if (!isUpdateCommand) {
		printUpdateNoticeIfCached()
	}
})

// ─── Run ───────────────────────────────────────────────────────────────────
// Execute the CLI with Node.js platform context.

cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain)
