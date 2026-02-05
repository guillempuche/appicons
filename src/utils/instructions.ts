/**
 * Post-generation instructions for users and AI agents.
 *
 * Provides clear guidance on how to integrate generated assets
 * into an Expo project.
 */

import type {
	AssetGeneratorConfig,
	AssetType,
	BackgroundConfig,
	ForegroundConfig,
	Platform,
} from '../types'

export interface GenerationContext {
	outputDir: string
	platforms: Platform[]
	assetTypes: AssetType[]
	zipPath?: string | undefined
	config?: AssetGeneratorConfig
}

export interface InstructionStep {
	step: number
	title: string
	description: string
	command?: string
	files?: string[]
}

export interface Instructions {
	summary: string
	generationConfig?: string | undefined
	steps: InstructionStep[]
	expoConfigChanges?: string
	notes: string[]
}

/**
 * Generate human-readable instructions for integrating assets into Expo.
 */
export function generateInstructions(context: GenerationContext): Instructions {
	const { outputDir, platforms, assetTypes } = context
	const steps: InstructionStep[] = []
	let stepNum = 1

	// Step 1: Copy main icon
	if (assetTypes.includes('icon')) {
		steps.push({
			step: stepNum++,
			title: 'Copy app icon',
			description: 'Copy the main icon to your Expo assets directory',
			command: `cp ${outputDir}/ios/icon-1024.png ../expo/assets/images/icon.png`,
			files: [`${outputDir}/ios/icon-1024.png`],
		})
	}

	// Step 2: Copy adaptive icon (Android)
	if (platforms.includes('android') && assetTypes.includes('adaptive')) {
		steps.push({
			step: stepNum++,
			title: 'Copy Android adaptive icon',
			description: 'Copy the adaptive icon foreground for Android',
			command: `cp ${outputDir}/android/mipmap-xxxhdpi/ic_launcher_foreground.png ../expo/assets/images/adaptive-icon.png`,
			files: [`${outputDir}/android/mipmap-xxxhdpi/ic_launcher_foreground.png`],
		})
	}

	// Step 3: Copy splash screen
	if (assetTypes.includes('splash')) {
		steps.push({
			step: stepNum++,
			title: 'Copy splash screen',
			description:
				'Copy a splash screen image (choose appropriate size for your needs)',
			command: `cp ${outputDir}/ios/splash-1170x2532.png ../expo/assets/images/splash.png`,
			files: [
				`${outputDir}/ios/splash-*.png`,
				`${outputDir}/android/drawable-*/splash.png`,
			],
		})
	}

	// Step 4: Copy favicon (Web)
	if (platforms.includes('web') && assetTypes.includes('favicon')) {
		steps.push({
			step: stepNum++,
			title: 'Copy web favicon',
			description:
				'Copy favicon.ico to public root and PNG favicons for web builds',
			command: `cp ${outputDir}/web/favicon.ico ../public/ && cp ${outputDir}/web/favicon-*.png ../public/`,
			files: [`${outputDir}/web/favicon.ico`, `${outputDir}/web/favicon-*.png`],
		})
	}

	// Step 5: Configure iOS 18 icon variants (dark, tinted, clear)
	if (platforms.includes('ios') && assetTypes.includes('icon')) {
		steps.push({
			step: stepNum++,
			title: 'Configure iOS 18 icon variants (Xcode)',
			description:
				'Copy ios/dark/, ios/tinted/, ios/clear-light/, ios/clear-dark/ folders to your Xcode asset catalog for iOS 18+ icon appearances',
			files: [
				`${outputDir}/ios/dark/`,
				`${outputDir}/ios/tinted/`,
				`${outputDir}/ios/clear-light/`,
				`${outputDir}/ios/clear-dark/`,
			],
		})
	}

	// Step 6: Configure Android monochrome icons
	if (platforms.includes('android') && assetTypes.includes('adaptive')) {
		steps.push({
			step: stepNum++,
			title: 'Configure Android 13+ monochrome icons',
			description:
				'Add monochrome layer to your adaptive-icon XML for Material You themed icons',
			files: [`${outputDir}/android/mipmap-*/ic_launcher_monochrome.png`],
		})
	}

	// Step 7: Copy web manifest and PWA icons
	if (platforms.includes('web') && assetTypes.includes('favicon')) {
		steps.push({
			step: stepNum++,
			title: 'Copy web manifest and PWA icons',
			description:
				'Copy site.webmanifest and PWA icons (including maskable) to your web public folder',
			files: [
				`${outputDir}/web/site.webmanifest`,
				`${outputDir}/web/icon-*.png`,
			],
		})
	}

	// Step: Use auto-generated iOS Contents.json
	if (platforms.includes('ios') && assetTypes.includes('icon')) {
		steps.push({
			step: stepNum++,
			title: 'Use auto-generated iOS Contents.json',
			description:
				'Copy ios/AppIcon.appiconset/Contents.json to your Xcode asset catalog for automatic icon configuration',
			files: [`${outputDir}/ios/AppIcon.appiconset/Contents.json`],
		})
	}

	// Step: Use auto-generated Android XML
	if (platforms.includes('android') && assetTypes.includes('adaptive')) {
		steps.push({
			step: stepNum++,
			title: 'Use auto-generated Android adaptive icon XML',
			description:
				'Copy android/mipmap-anydpi-v26/*.xml to your Android res folder for adaptive icon configuration',
			files: [
				`${outputDir}/android/mipmap-anydpi-v26/ic_launcher.xml`,
				`${outputDir}/android/mipmap-anydpi-v26/ic_launcher_round.xml`,
			],
		})
	}

	// Step: Upload store listing assets
	if (assetTypes.includes('store')) {
		steps.push({
			step: stepNum++,
			title: 'Upload store listing assets',
			description:
				'Upload store assets to App Store Connect and Google Play Console',
			files: [
				`${outputDir}/store/android/play-store-icon.png`,
				`${outputDir}/store/android/feature-graphic.png`,
				`${outputDir}/store/android/tv-banner.png`,
				`${outputDir}/store/ios/app-store-icon.png`,
			],
		})
	}

	// Step: Configure watchOS icons
	if (platforms.includes('watchos') && assetTypes.includes('icon')) {
		steps.push({
			step: stepNum++,
			title: 'Configure watchOS icons',
			description:
				'Copy watchos/ folder to your Xcode asset catalog for Apple Watch icons',
			files: [`${outputDir}/watchos/`],
		})
	}

	// Step: Configure tvOS icons
	if (platforms.includes('tvos') && assetTypes.includes('icon')) {
		steps.push({
			step: stepNum++,
			title: 'Configure tvOS icons',
			description:
				'Copy tvos/ folder to your Xcode asset catalog. Configure layered image stack with icon-back and icon-front layers for parallax effect.',
			files: [
				`${outputDir}/tvos/icon-back*.png`,
				`${outputDir}/tvos/icon-front*.png`,
				`${outputDir}/tvos/top-shelf*.png`,
			],
		})
	}

	// Step: Configure visionOS icons
	if (platforms.includes('visionos') && assetTypes.includes('icon')) {
		steps.push({
			step: stepNum++,
			title: 'Configure visionOS icons',
			description:
				'Copy visionos/ folder to your Xcode asset catalog. Configure 3D layered icon with icon-back and icon-front layers.',
			files: [
				`${outputDir}/visionos/icon-1024.png`,
				`${outputDir}/visionos/icon-back.png`,
				`${outputDir}/visionos/icon-front.png`,
			],
		})
	}

	// Step: Rebuild native projects
	steps.push({
		step: stepNum++,
		title: 'Rebuild native projects',
		description: 'Regenerate native iOS/Android projects with new assets',
		command: 'cd ../expo && npx expo prebuild --clean',
	})

	// Generate expo config example
	const expoConfigChanges = generateExpoConfigExample(platforms, assetTypes)

	// Notes
	const notes: string[] = [
		'The 1024x1024 icon is used as source; Expo generates all required sizes',
		'For production, ensure icon has no transparency (iOS requirement)',
		'Android adaptive icons should have content within the safe zone (66% center)',
	]

	// iOS 18 notes
	if (platforms.includes('ios') && assetTypes.includes('icon')) {
		notes.push(
			'iOS 18+ supports 5 icon appearances: default, dark, tinted, clear-light, clear-dark',
		)
		notes.push(
			'Tinted icons use white foreground; system applies wallpaper tint color',
		)
		notes.push(
			'Clear icons have semi-transparent backgrounds for light/dark modes',
		)
	}

	// Android 13+ notes
	if (platforms.includes('android') && assetTypes.includes('adaptive')) {
		notes.push(
			'Android 13+ themed icons require a monochrome layer in adaptive-icon XML',
		)
		notes.push(
			'ic_launcher.xml and ic_launcher_round.xml are auto-generated with monochrome layer',
		)
	}

	// watchOS notes
	if (platforms.includes('watchos') && assetTypes.includes('icon')) {
		notes.push('watchOS icons use circular mask with 80% safe zone')
		notes.push('watchOS icons are generated at @2x scale for all sizes')
	}

	// tvOS notes
	if (platforms.includes('tvos') && assetTypes.includes('icon')) {
		notes.push(
			'tvOS uses layered icons (back/front) for parallax effect on Apple TV',
		)
		notes.push('Top shelf images are shown when app is focused on home screen')
	}

	// visionOS notes
	if (platforms.includes('visionos') && assetTypes.includes('icon')) {
		notes.push('visionOS icons use circular mask with 80% safe zone')
		notes.push('visionOS supports optional 3D layered icons (back/front)')
	}

	// Store listing notes
	if (assetTypes.includes('store')) {
		notes.push('Play Store icon: 512x512 PNG, required for Google Play')
		notes.push(
			'Feature graphic: 1024x500 PNG, displayed on Play Store app page',
		)
		notes.push('TV banner: 1280x720 PNG, for Android TV apps on Play Store')
	}

	if (context.zipPath) {
		notes.push(`Full asset archive available at: ${context.zipPath}`)
	}

	// Generate config summary if available
	const generationConfig = context.config
		? formatGenerationConfig(context.config)
		: undefined

	return {
		summary: `Generated assets for ${platforms.join(', ')} (${assetTypes.join(', ')})`,
		generationConfig,
		steps,
		expoConfigChanges,
		notes,
	}
}

/**
 * Format background configuration for display.
 */
function formatBackgroundConfig(bg: BackgroundConfig): string[] {
	const lines: string[] = []

	if (bg.type === 'color' && bg.color) {
		lines.push(`Type:  Solid color`)
		lines.push(`Color: ${bg.color.color}`)
	} else if (bg.type === 'gradient' && bg.gradient) {
		lines.push(`Type:   ${bg.gradient.type} gradient`)
		lines.push(`Colors: ${bg.gradient.colors.join(' → ')}`)
		if (bg.gradient.angle !== undefined) {
			lines.push(`Angle:  ${bg.gradient.angle}°`)
		}
	} else if (bg.type === 'image' && bg.imagePath) {
		lines.push(`Type:  Image`)
		lines.push(`Path:  ${bg.imagePath}`)
	}

	return lines
}

/**
 * Format foreground configuration for display.
 */
function formatForegroundConfig(fg: ForegroundConfig): string[] {
	const lines: string[] = []

	if (fg.type === 'text') {
		lines.push(`Type:        Text`)
		lines.push(`Text:        "${fg.text}"`)
		lines.push(`Font:        ${fg.fontFamily}`)
		lines.push(`Font source: ${fg.fontSource}`)
		lines.push(`Color:       ${fg.color}`)
		if (fg.fontSize) {
			lines.push(`Font size:   ${fg.fontSize}px`)
		}
	} else if (fg.type === 'svg') {
		lines.push(`Type: SVG`)
		lines.push(`Path: ${fg.svgPath}`)
		if (fg.color) {
			lines.push(`Color override: ${fg.color}`)
		}
	} else if (fg.type === 'image') {
		lines.push(`Type: Image`)
		lines.push(`Path: ${fg.imagePath}`)
	}

	return lines
}

/**
 * Format the complete generation configuration for display.
 */
function formatGenerationConfig(config: AssetGeneratorConfig): string {
	const lines: string[] = []

	lines.push(`App name:    ${config.appName}`)
	lines.push(`Platforms:   ${config.platforms.join(', ')}`)
	lines.push(`Asset types: ${config.assetTypes.join(', ')}`)
	lines.push(`Icon scale:  ${((config.iconScale ?? 0.7) * 100).toFixed(0)}%`)
	lines.push(
		`Splash scale: ${((config.splashScale ?? 0.25) * 100).toFixed(0)}%`,
	)
	lines.push('')
	lines.push('Background:')
	for (const line of formatBackgroundConfig(config.background)) {
		lines.push(`  ${line}`)
	}
	lines.push('')
	lines.push('Foreground:')
	for (const line of formatForegroundConfig(config.foreground)) {
		lines.push(`  ${line}`)
	}

	return lines.join('\n')
}

/**
 * Generate example app.config.ts changes.
 */
function generateExpoConfigExample(
	platforms: Platform[],
	assetTypes: AssetType[],
): string {
	const lines: string[] = ['// app.config.ts asset configuration example:', '']

	if (assetTypes.includes('icon')) {
		lines.push('// iOS icon (in expo.ios)')
		lines.push("icon: './assets/images/icon.png',")
		lines.push('')
	}

	if (platforms.includes('android') && assetTypes.includes('adaptive')) {
		lines.push('// Android adaptive icon (in expo.android)')
		lines.push('adaptiveIcon: {')
		lines.push("  foregroundImage: './assets/images/adaptive-icon.png',")
		lines.push(
			"  monochromeImage: './assets/images/adaptive-icon-monochrome.png', // Android 13+ themed icons",
		)
		lines.push("  backgroundColor: '#FFFFFF', // or your background color")
		lines.push('},')
		lines.push('')
	}

	if (assetTypes.includes('splash')) {
		lines.push('// Splash screen (in expo.plugins)')
		lines.push('[')
		lines.push("  'expo-splash-screen',")
		lines.push('  {')
		lines.push("    backgroundColor: '#FFFFFF',")
		lines.push("    image: './assets/images/splash.png',")
		lines.push('    imageWidth: 200,')
		lines.push('  },')
		lines.push('],')
		lines.push('')
	}

	if (platforms.includes('web') && assetTypes.includes('favicon')) {
		lines.push('// Web favicon (in expo.web)')
		lines.push("favicon: './assets/images/favicon.png',")
		lines.push('')
		lines.push(
			'// ─── Modern Favicon Setup (HTML head) ────────────────────────',
		)
		lines.push(
			'// Place favicon.ico in your public root (browsers check /favicon.ico automatically)',
		)
		lines.push('//')
		lines.push(
			'// <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
		)
		lines.push(
			'// <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
		)
		lines.push(
			'// <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png">',
		)
		lines.push('// <link rel="manifest" href="/site.webmanifest">')
		lines.push('')
	}

	// iOS 18 Xcode asset catalog configuration
	if (platforms.includes('ios') && assetTypes.includes('icon')) {
		lines.push('')
		lines.push(
			'// ─── iOS 18 Icon Variants (Xcode Asset Catalog) ───────────────',
		)
		lines.push(
			'// For native iOS projects, configure AppIcon.appiconset/Contents.json:',
		)
		lines.push('//')
		lines.push('// Add appearances for dark, tinted, and clear variants:')
		lines.push('// {')
		lines.push('//   "images": [')
		lines.push(
			'//     { "filename": "icon-60@2x.png", "idiom": "iphone", "scale": "2x", "size": "60x60" },',
		)
		lines.push(
			'//     { "appearances": [{ "appearance": "luminosity", "value": "dark" }],',
		)
		lines.push(
			'//       "filename": "dark/icon-60@2x.png", "idiom": "iphone", "scale": "2x", "size": "60x60" },',
		)
		lines.push(
			'//     { "appearances": [{ "appearance": "luminosity", "value": "tinted" }],',
		)
		lines.push(
			'//       "filename": "tinted/icon-60@2x.png", "idiom": "iphone", "scale": "2x", "size": "60x60" }',
		)
		lines.push('//   ]')
		lines.push('// }')
		lines.push('')
	}

	// Android monochrome icon configuration
	if (platforms.includes('android') && assetTypes.includes('adaptive')) {
		lines.push('')
		lines.push(
			'// ─── Android 13+ Themed Icons (Native) ────────────────────────',
		)
		lines.push(
			'// For native Android projects, update res/mipmap-anydpi-v26/ic_launcher.xml:',
		)
		lines.push('//')
		lines.push(
			'// <adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">',
		)
		lines.push(
			'//   <background android:drawable="@mipmap/ic_launcher_background"/>',
		)
		lines.push(
			'//   <foreground android:drawable="@mipmap/ic_launcher_foreground"/>',
		)
		lines.push(
			'//   <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>',
		)
		lines.push('// </adaptive-icon>')
		lines.push('')
	}

	return lines.join('\n')
}

/**
 * Format instructions for console output (human-readable).
 */
export function formatInstructionsText(instructions: Instructions): string {
	const lines: string[] = []

	lines.push('')
	lines.push('═══════════════════════════════════════════════════════════════')
	lines.push('  GENERATION INFO')
	lines.push('═══════════════════════════════════════════════════════════════')
	lines.push('')
	lines.push(instructions.summary)
	lines.push('')

	if (instructions.generationConfig) {
		lines.push(
			'───────────────────────────────────────────────────────────────',
		)
		lines.push('  CONFIGURATION')
		lines.push(
			'───────────────────────────────────────────────────────────────',
		)
		lines.push('')
		lines.push(instructions.generationConfig)
		lines.push('')
	}

	lines.push('───────────────────────────────────────────────────────────────')
	lines.push('  INTEGRATION STEPS')
	lines.push('───────────────────────────────────────────────────────────────')
	lines.push('')

	for (const step of instructions.steps) {
		lines.push(`  ${step.step}. ${step.title}`)
		lines.push(`     ${step.description}`)
		if (step.command) {
			lines.push(`     $ ${step.command}`)
		}
		lines.push('')
	}

	if (instructions.expoConfigChanges) {
		lines.push(
			'───────────────────────────────────────────────────────────────',
		)
		lines.push('  EXPO CONFIG EXAMPLE')
		lines.push(
			'───────────────────────────────────────────────────────────────',
		)
		lines.push('')
		lines.push(instructions.expoConfigChanges)
		lines.push('')
	}

	lines.push('───────────────────────────────────────────────────────────────')
	lines.push('  NOTES')
	lines.push('───────────────────────────────────────────────────────────────')
	lines.push('')
	for (const note of instructions.notes) {
		lines.push(`  • ${note}`)
	}
	lines.push('')
	lines.push('═══════════════════════════════════════════════════════════════')

	return lines.join('\n')
}

/**
 * Format instructions for JSON output (AI agents).
 */
export function formatInstructionsJson(instructions: Instructions): object {
	return {
		summary: instructions.summary,
		steps: instructions.steps,
		expoConfig: instructions.expoConfigChanges,
		notes: instructions.notes,
		aiInstructions: [
			'Copy the generated assets to the Expo project assets/images/ directory',
			'Use the largest resolution icons as source (Expo auto-generates sizes)',
			'Run "npx expo prebuild --clean" after updating assets',
			'Verify icons render correctly on both iOS and Android simulators',
		],
	}
}
