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

	// Step 5: Rebuild native projects
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
