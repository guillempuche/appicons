/**
 * Tests for instruction generation utilities.
 *
 * Tests config formatting and instruction generation.
 */

import { describe, expect, it } from 'vitest'

import type { AssetGeneratorConfig, AssetType, Platform } from '../../types'
import {
	formatInstructionsJson,
	formatInstructionsText,
	type GenerationContext,
	generateInstructions,
} from '../../utils/instructions'

describe('Instructions', () => {
	const baseContext: GenerationContext = {
		outputDir: '/output/assets',
		platforms: ['ios', 'android'],
		assetTypes: ['icon', 'splash'],
	}

	const fullConfig: AssetGeneratorConfig = {
		appName: 'TestApp',
		platforms: ['ios', 'android', 'web'],
		assetTypes: ['icon', 'splash', 'adaptive', 'favicon'],
		background: {
			type: 'color',
			color: { type: 'solid', color: '#FF5500' },
		},
		foreground: {
			type: 'text',
			text: 'T',
			fontFamily: 'Roboto',
			fontSource: 'google',
			color: '#FFFFFF',
		},
		outputDir: '/output',
		iconScale: 0.7,
		splashScale: 0.25,
	}

	describe('generateInstructions', () => {
		it('should generate summary with platforms and asset types', () => {
			// GIVEN a context with iOS, Android platforms and icon, splash types
			const instructions = generateInstructions(baseContext)

			// THEN summary should contain all platforms and asset types
			expect(instructions.summary).toContain('ios')
			expect(instructions.summary).toContain('android')
			expect(instructions.summary).toContain('icon')
			expect(instructions.summary).toContain('splash')
		})

		it('should include copy icon step when icon is selected', () => {
			// GIVEN a context with icon asset type
			const context = { ...baseContext, assetTypes: ['icon'] as any }

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN steps should include icon copy step
			expect(instructions.steps.some(s => s.title.includes('icon'))).toBe(true)
		})

		it('should include copy adaptive icon step for Android', () => {
			// GIVEN a context with Android platform and adaptive asset type
			const context = {
				...baseContext,
				platforms: ['android'] as any,
				assetTypes: ['adaptive'] as any,
			}

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN steps should include adaptive icon step
			expect(instructions.steps.some(s => s.title.includes('adaptive'))).toBe(
				true,
			)
		})

		it('should include copy splash step when splash is selected', () => {
			// GIVEN a context with splash asset type
			const context = { ...baseContext, assetTypes: ['splash'] as any }

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN steps should include splash copy step
			expect(instructions.steps.some(s => s.title.includes('splash'))).toBe(
				true,
			)
		})

		it('should include favicon step for web platform', () => {
			// GIVEN a context with web platform and favicon asset type
			const context = {
				...baseContext,
				platforms: ['web'] as any,
				assetTypes: ['favicon'] as any,
			}

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN steps should include favicon step
			expect(instructions.steps.some(s => s.title.includes('favicon'))).toBe(
				true,
			)
		})

		it('should include iOS 18 icon variants step for iOS icons', () => {
			// GIVEN a context with iOS platform and icon asset type
			const context = {
				...baseContext,
				platforms: ['ios'] as any,
				assetTypes: ['icon'] as any,
			}

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN steps should include iOS 18 variants step
			expect(instructions.steps.some(s => s.title.includes('iOS 18'))).toBe(
				true,
			)
		})

		it('should include Android monochrome step for adaptive icons', () => {
			// GIVEN a context with Android platform and adaptive asset type
			const context = {
				...baseContext,
				platforms: ['android'] as any,
				assetTypes: ['adaptive'] as any,
			}

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN steps should include monochrome step
			expect(instructions.steps.some(s => s.title.includes('monochrome'))).toBe(
				true,
			)
		})

		it('should include web manifest step for web favicons', () => {
			// GIVEN a context with web platform and favicon asset type
			const context = {
				...baseContext,
				platforms: ['web'] as any,
				assetTypes: ['favicon'] as any,
			}

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN steps should include manifest step
			expect(instructions.steps.some(s => s.title.includes('manifest'))).toBe(
				true,
			)
		})

		it('should always include rebuild step', () => {
			// GIVEN any generation context
			// WHEN generating instructions
			const instructions = generateInstructions(baseContext)

			// THEN steps should always include rebuild step
			expect(instructions.steps.some(s => s.title.includes('Rebuild'))).toBe(
				true,
			)
		})

		it('should include commands in steps where applicable', () => {
			// GIVEN a context with icon asset type
			const context = { ...baseContext, assetTypes: ['icon'] as any }

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN copy step should have cp command defined
			const copyStep = instructions.steps.find(s =>
				s.title.includes('Copy app icon'),
			)
			expect(copyStep?.command).toBeDefined()
			expect(copyStep?.command).toContain('cp')
		})

		it('should include files in steps where applicable', () => {
			// GIVEN a context with icon asset type
			const context = { ...baseContext, assetTypes: ['icon'] as any }

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN copy step should have files list
			const copyStep = instructions.steps.find(s =>
				s.title.includes('Copy app icon'),
			)
			expect(copyStep?.files).toBeDefined()
			expect(copyStep?.files?.length).toBeGreaterThan(0)
		})

		it('should generate expo config example', () => {
			// GIVEN any generation context
			// WHEN generating instructions
			const instructions = generateInstructions(baseContext)

			// THEN expo config changes should be defined
			expect(instructions.expoConfigChanges).toBeDefined()
			expect(instructions.expoConfigChanges).toContain('app.config.ts')
		})

		it('should include iOS icon in expo config for iOS platform', () => {
			// GIVEN a context with iOS platform and icon asset type
			const context = {
				...baseContext,
				platforms: ['ios'] as any,
				assetTypes: ['icon'] as any,
			}

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN expo config should include icon property
			expect(instructions.expoConfigChanges).toContain('icon:')
		})

		it('should include adaptive icon in expo config for Android', () => {
			// GIVEN a context with Android platform and adaptive asset type
			const context = {
				...baseContext,
				platforms: ['android'] as any,
				assetTypes: ['adaptive'] as any,
			}

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN expo config should include adaptiveIcon and monochromeImage
			expect(instructions.expoConfigChanges).toContain('adaptiveIcon')
			expect(instructions.expoConfigChanges).toContain('monochromeImage')
		})

		it('should include splash config for splash type', () => {
			// GIVEN a context with splash asset type
			const context = { ...baseContext, assetTypes: ['splash'] as any }

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN expo config should include splash screen plugin
			expect(instructions.expoConfigChanges).toContain('expo-splash-screen')
		})

		it('should include favicon config for web', () => {
			// GIVEN a context with web platform and favicon asset type
			const context = {
				...baseContext,
				platforms: ['web'] as any,
				assetTypes: ['favicon'] as any,
			}

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN expo config should include favicon
			expect(instructions.expoConfigChanges).toContain('favicon')
		})

		it('should include notes array', () => {
			// GIVEN any generation context
			// WHEN generating instructions
			const instructions = generateInstructions(baseContext)

			// THEN notes should be a non-empty array
			expect(Array.isArray(instructions.notes)).toBe(true)
			expect(instructions.notes.length).toBeGreaterThan(0)
		})

		it('should include iOS 18 notes for iOS icons', () => {
			// GIVEN a context with iOS platform and icon asset type
			const context = {
				...baseContext,
				platforms: ['ios'] as any,
				assetTypes: ['icon'] as any,
			}

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN notes should mention iOS 18
			expect(instructions.notes.some(n => n.includes('iOS 18'))).toBe(true)
		})

		it('should include Android 13 notes for adaptive icons', () => {
			// GIVEN a context with Android platform and adaptive asset type
			const context = {
				...baseContext,
				platforms: ['android'] as any,
				assetTypes: ['adaptive'] as any,
			}

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN notes should mention Android 13
			expect(instructions.notes.some(n => n.includes('Android 13'))).toBe(true)
		})

		it('should include zip path in notes when provided', () => {
			// GIVEN a context with zip path specified
			const context = {
				...baseContext,
				zipPath: '/output/assets.zip',
			}

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN notes should include zip file reference
			expect(instructions.notes.some(n => n.includes('assets.zip'))).toBe(true)
		})

		it('should include generation config when provided', () => {
			// GIVEN a context with full config
			const context = {
				...baseContext,
				config: fullConfig,
			}

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN generation config should be defined with app name
			expect(instructions.generationConfig).toBeDefined()
			expect(instructions.generationConfig).toContain('TestApp')
		})
	})

	describe('formatInstructionsText', () => {
		it('should format instructions as human-readable text', () => {
			// GIVEN generated instructions
			const instructions = generateInstructions(baseContext)

			// WHEN formatting as text
			const text = formatInstructionsText(instructions)

			// THEN result should be a non-empty string
			expect(typeof text).toBe('string')
			expect(text.length).toBeGreaterThan(0)
		})

		it('should include summary section', () => {
			// GIVEN generated instructions
			const instructions = generateInstructions(baseContext)

			// WHEN formatting as text
			const text = formatInstructionsText(instructions)

			// THEN text should include generation info header and summary
			expect(text).toContain('GENERATION INFO')
			expect(text).toContain(instructions.summary)
		})

		it('should include configuration section when config provided', () => {
			// GIVEN a context with full config
			const context = { ...baseContext, config: fullConfig }
			const instructions = generateInstructions(context)

			// WHEN formatting as text
			const text = formatInstructionsText(instructions)

			// THEN text should include configuration section with app name
			expect(text).toContain('CONFIGURATION')
			expect(text).toContain('TestApp')
		})

		it('should include integration steps section', () => {
			// GIVEN generated instructions with steps
			const instructions = generateInstructions(baseContext)

			// WHEN formatting as text
			const text = formatInstructionsText(instructions)

			// THEN text should include integration steps header and all step titles
			expect(text).toContain('INTEGRATION STEPS')
			for (const step of instructions.steps) {
				expect(text).toContain(step.title)
			}
		})

		it('should include expo config section', () => {
			// GIVEN generated instructions
			const instructions = generateInstructions(baseContext)

			// WHEN formatting as text
			const text = formatInstructionsText(instructions)

			// THEN text should include expo config example section
			expect(text).toContain('EXPO CONFIG EXAMPLE')
		})

		it('should include notes section', () => {
			// GIVEN generated instructions with notes
			const instructions = generateInstructions(baseContext)

			// WHEN formatting as text
			const text = formatInstructionsText(instructions)

			// THEN text should include notes header and all notes
			expect(text).toContain('NOTES')
			for (const note of instructions.notes) {
				expect(text).toContain(note)
			}
		})

		it('should use decorative separators', () => {
			// GIVEN generated instructions
			const instructions = generateInstructions(baseContext)

			// WHEN formatting as text
			const text = formatInstructionsText(instructions)

			// THEN text should use box drawing characters
			expect(text).toContain('═')
			expect(text).toContain('─')
		})

		it('should include step numbers', () => {
			// GIVEN generated instructions
			const instructions = generateInstructions(baseContext)

			// WHEN formatting as text
			const text = formatInstructionsText(instructions)

			// THEN text should have numbered steps
			expect(text).toMatch(/\d+\./)
		})

		it('should include bullet points for notes', () => {
			// GIVEN generated instructions
			const instructions = generateInstructions(baseContext)

			// WHEN formatting as text
			const text = formatInstructionsText(instructions)

			// THEN text should use bullet points
			expect(text).toContain('•')
		})
	})

	describe('formatInstructionsJson', () => {
		it('should format instructions as JSON object', () => {
			// GIVEN generated instructions
			const instructions = generateInstructions(baseContext)

			// WHEN formatting as JSON
			const json = formatInstructionsJson(instructions)

			// THEN result should be an object
			expect(typeof json).toBe('object')
		})

		it('should include summary', () => {
			// GIVEN generated instructions
			const instructions = generateInstructions(baseContext)

			// WHEN formatting as JSON
			const json = formatInstructionsJson(instructions) as any

			// THEN JSON should include matching summary
			expect(json.summary).toBe(instructions.summary)
		})

		it('should include steps array', () => {
			// GIVEN generated instructions with steps
			const instructions = generateInstructions(baseContext)

			// WHEN formatting as JSON
			const json = formatInstructionsJson(instructions) as any

			// THEN JSON should include all steps
			expect(Array.isArray(json.steps)).toBe(true)
			expect(json.steps.length).toBe(instructions.steps.length)
		})

		it('should include expo config', () => {
			// GIVEN generated instructions
			const instructions = generateInstructions(baseContext)

			// WHEN formatting as JSON
			const json = formatInstructionsJson(instructions) as any

			// THEN JSON should include expo config
			expect(json.expoConfig).toBeDefined()
		})

		it('should include notes', () => {
			// GIVEN generated instructions
			const instructions = generateInstructions(baseContext)

			// WHEN formatting as JSON
			const json = formatInstructionsJson(instructions) as any

			// THEN JSON should include notes array
			expect(Array.isArray(json.notes)).toBe(true)
		})

		it('should include AI instructions', () => {
			// GIVEN generated instructions
			const instructions = generateInstructions(baseContext)

			// WHEN formatting as JSON
			const json = formatInstructionsJson(instructions) as any

			// THEN JSON should include non-empty AI instructions
			expect(Array.isArray(json.aiInstructions)).toBe(true)
			expect(json.aiInstructions.length).toBeGreaterThan(0)
		})

		it('should be JSON serializable', () => {
			// GIVEN generated instructions
			const instructions = generateInstructions(baseContext)

			// WHEN formatting as JSON
			const json = formatInstructionsJson(instructions)

			// THEN result should be serializable without errors
			expect(() => JSON.stringify(json)).not.toThrow()
		})
	})

	describe('config formatting', () => {
		it('should format solid color background', () => {
			// GIVEN a config with solid color background
			const context = { ...baseContext, config: fullConfig }

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN config should describe solid color with hex value
			expect(instructions.generationConfig).toContain('Solid color')
			expect(instructions.generationConfig).toContain('#FF5500')
		})

		it('should format gradient background', () => {
			// GIVEN a config with linear gradient background
			const config = {
				...fullConfig,
				background: {
					type: 'gradient' as any,
					gradient: {
						type: 'linear' as any,
						colors: ['#FF0000', '#0000FF'],
						angle: 45,
					},
				},
			}
			const context = { ...baseContext, config }

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN config should describe gradient type, colors, and angle
			expect(instructions.generationConfig).toContain('linear gradient')
			expect(instructions.generationConfig).toContain('#FF0000')
			expect(instructions.generationConfig).toContain('45°')
		})

		it('should format image background', () => {
			// GIVEN a config with image background
			const config = {
				...fullConfig,
				background: {
					type: 'image' as any,
					imagePath: '/path/to/bg.png',
				},
			}
			const context = { ...baseContext, config }

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN config should describe image type with path
			expect(instructions.generationConfig).toContain('Image')
			expect(instructions.generationConfig).toContain('/path/to/bg.png')
		})

		it('should format text foreground', () => {
			// GIVEN a config with text foreground
			const context = { ...baseContext, config: fullConfig }

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN config should describe text, font, and source
			expect(instructions.generationConfig).toContain('Text')
			expect(instructions.generationConfig).toContain('"T"')
			expect(instructions.generationConfig).toContain('Roboto')
			expect(instructions.generationConfig).toContain('google')
		})

		it('should format SVG foreground', () => {
			// GIVEN a config with SVG foreground
			const config = {
				...fullConfig,
				foreground: {
					type: 'svg' as any,
					svgPath: '/path/to/logo.svg',
					color: '#FFFFFF',
				},
			}
			const context = { ...baseContext, config }

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN config should describe SVG path and color
			expect(instructions.generationConfig).toContain('SVG')
			expect(instructions.generationConfig).toContain('/path/to/logo.svg')
			expect(instructions.generationConfig).toContain('#FFFFFF')
		})

		it('should format image foreground', () => {
			// GIVEN a config with image foreground
			const config = {
				...fullConfig,
				foreground: {
					type: 'image' as any,
					imagePath: '/path/to/logo.png',
				},
			}
			const context = { ...baseContext, config }

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN config should describe image type with path
			expect(instructions.generationConfig).toContain('Image')
			expect(instructions.generationConfig).toContain('/path/to/logo.png')
		})

		it('should format scale percentages', () => {
			// GIVEN a config with iconScale 0.7 and splashScale 0.25
			const context = { ...baseContext, config: fullConfig }

			// WHEN generating instructions
			const instructions = generateInstructions(context)

			// THEN config should show scales as percentages
			expect(instructions.generationConfig).toContain('70%') // iconScale
			expect(instructions.generationConfig).toContain('25%') // splashScale
		})
	})
})
