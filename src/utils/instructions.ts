/**
 * Post-generation instructions for users and AI agents.
 *
 * Provides clear guidance on how to integrate generated assets
 * into an Expo project.
 */

import type { AssetType, Platform } from '../types'

export interface GenerationContext {
	outputDir: string
	platforms: Platform[]
	assetTypes: AssetType[]
	zipPath?: string | undefined
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
			description: 'Copy favicon for web builds',
			command: `cp ${outputDir}/web/favicon-32x32.png ../expo/assets/images/favicon.png`,
			files: [`${outputDir}/web/favicon-*.png`],
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

	// Step 7: Rebuild native projects
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
			'Add <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/> to ic_launcher.xml',
		)
	}

	if (context.zipPath) {
		notes.push(`Full asset archive available at: ${context.zipPath}`)
	}

	return {
		summary: `Generated assets for ${platforms.join(', ')} (${assetTypes.join(', ')})`,
		steps,
		expoConfigChanges,
		notes,
	}
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
	lines.push('  NEXT STEPS')
	lines.push('═══════════════════════════════════════════════════════════════')
	lines.push('')
	lines.push(instructions.summary)
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
