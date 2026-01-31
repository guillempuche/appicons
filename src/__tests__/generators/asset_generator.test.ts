/**
 * Tests for main asset generator.
 *
 * Tests full generation pipeline, preview icons, and color modes.
 */

import * as fs from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AssetGeneratorConfig } from '../../types'
import { resetMocks } from '../setup'

// Mock fs/promises for file writing
vi.mock('node:fs/promises', async () => {
	const actual = await vi.importActual('node:fs/promises')
	return {
		...actual,
		mkdir: vi.fn().mockResolvedValue(undefined),
		writeFile: vi.fn().mockResolvedValue(undefined),
	}
})

// Mock background and foreground generators
vi.mock('../../generators/background_generator', () => ({
	generateBackground: vi.fn().mockResolvedValue(Buffer.from('bg-data')),
}))

vi.mock('../../generators/foreground_generator', () => ({
	generateForeground: vi.fn().mockResolvedValue(Buffer.from('fg-data')),
}))

// Mock instructions
vi.mock('../../utils/instructions', () => ({
	generateInstructions: vi.fn().mockReturnValue({
		summary: 'Test summary',
		steps: [],
		notes: [],
	}),
	formatInstructionsText: vi.fn().mockReturnValue('# Instructions'),
}))

// Mock sharp-ico for favicon.ico generation
vi.mock('sharp-ico', () => ({
	encode: vi.fn().mockReturnValue(Buffer.from('ico-data')),
}))

// Mock history to avoid file system operations during tests
vi.mock('../../utils/history', () => ({
	saveToHistory: vi.fn().mockResolvedValue({ id: 'test-id' }),
}))

describe('AssetGenerator', () => {
	let mockConfig: AssetGeneratorConfig

	beforeEach(async () => {
		resetMocks()
		vi.clearAllMocks()

		// Reset mock implementations (vi.clearAllMocks only clears call history)
		const { generateBackground } = await import(
			'../../generators/background_generator'
		)
		const { generateForeground } = await import(
			'../../generators/foreground_generator'
		)
		;(generateBackground as any).mockResolvedValue(Buffer.from('bg-data'))
		;(generateForeground as any).mockResolvedValue(Buffer.from('fg-data'))

		mockConfig = {
			appName: 'TestApp',
			platforms: ['ios'],
			assetTypes: ['icon'],
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
	})

	describe('generateAssets', () => {
		it('should generate assets for configured platforms', async () => {
			// GIVEN a config with iOS platform and icon type
			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			const result = await generateAssets(mockConfig)

			// THEN assets should be generated successfully
			expect(result.success).toBe(true)
			expect(result.assets.length).toBeGreaterThan(0)
			expect(result.outputDir).toBe('/output')
		})

		it('should generate assets for multiple platforms', async () => {
			// GIVEN a config with multiple platforms and asset types
			mockConfig.platforms = ['ios', 'android']
			mockConfig.assetTypes = ['icon', 'splash']

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			const result = await generateAssets(mockConfig)

			// THEN assets for all platforms and types should be generated
			expect(result.success).toBe(true)
			expect(result.assets.length).toBeGreaterThan(10)
		})

		it('should write assets to disk', async () => {
			// GIVEN a valid config
			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			await generateAssets(mockConfig)

			// THEN files should be written to disk
			expect(fs.mkdir).toHaveBeenCalled()
			expect(fs.writeFile).toHaveBeenCalled()
		})

		it('should generate README.md instructions', async () => {
			// GIVEN a valid config
			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)
			const { formatInstructionsText } = await import(
				'../../utils/instructions'
			)

			// WHEN generating assets
			const result = await generateAssets(mockConfig)

			// THEN instructions should be generated
			expect(formatInstructionsText).toHaveBeenCalled()
			expect(result.instructionsPath).toBe('/output/README.md')
		})

		it('should collect errors for failed assets without stopping', async () => {
			// GIVEN a generator that fails on the second call
			const { generateBackground } = await import(
				'../../generators/background_generator'
			)
			let callCount = 0
			;(generateBackground as any).mockImplementation(() => {
				callCount++
				if (callCount === 2) {
					throw new Error('Test error')
				}
				return Promise.resolve(Buffer.from('bg-data'))
			})

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			const result = await generateAssets(mockConfig)

			// THEN errors should be collected but other assets still generated
			expect(result.errors?.length).toBeGreaterThan(0)
			expect(result.assets.length).toBeGreaterThan(0)
		})

		it('should return success false when all assets fail', async () => {
			// GIVEN a generator that always fails
			const { generateBackground } = await import(
				'../../generators/background_generator'
			)
			;(generateBackground as any).mockRejectedValue(new Error('Always fails'))

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			const result = await generateAssets(mockConfig)

			// THEN success should be false with errors
			expect(result.success).toBe(false)
			expect(result.errors?.length).toBeGreaterThan(0)
		})
	})

	describe('generatePreviewIcon', () => {
		it('should generate preview icon at specified size', async () => {
			// GIVEN background and foreground configs
			const { generatePreviewIcon } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating preview icon at 256px
			const buffer = await generatePreviewIcon(
				{
					background: mockConfig.background,
					foreground: mockConfig.foreground,
				},
				256,
			)

			// THEN buffer should be returned
			expect(buffer).toBeInstanceOf(Buffer)
		})

		it('should use default icon scale of 0.7', async () => {
			// GIVEN no custom scale specified
			const { generateForeground } = await import(
				'../../generators/foreground_generator'
			)
			const { generatePreviewIcon } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating preview icon at 100px
			await generatePreviewIcon(
				{
					background: mockConfig.background,
					foreground: mockConfig.foreground,
				},
				100,
			)

			// THEN foreground should be generated at 70px (100 * 0.7)
			expect(generateForeground).toHaveBeenCalledWith(expect.anything(), 70, 70)
		})

		it('should use custom icon scale when provided', async () => {
			// GIVEN custom scale of 0.5
			const { generateForeground } = await import(
				'../../generators/foreground_generator'
			)
			const { generatePreviewIcon } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating preview icon with custom scale
			await generatePreviewIcon(
				{
					background: mockConfig.background,
					foreground: mockConfig.foreground,
					iconScale: 0.5,
				},
				100,
			)

			// THEN foreground should be generated at 50px (100 * 0.5)
			expect(generateForeground).toHaveBeenCalledWith(expect.anything(), 50, 50)
		})
	})

	describe('PREVIEW_SIZES', () => {
		it('should export preview size constants', async () => {
			// WHEN importing PREVIEW_SIZES
			const { PREVIEW_SIZES } = await import('../../generators/asset_generator')

			// THEN size constants should be defined
			expect(PREVIEW_SIZES.large).toBe(256)
			expect(PREVIEW_SIZES.small).toBe(64)
		})
	})

	describe('asset generation by type', () => {
		it('should generate icons with icon scale', async () => {
			// GIVEN config with icon asset type
			const { generateForeground } = await import(
				'../../generators/foreground_generator'
			)
			mockConfig.assetTypes = ['icon']

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			await generateAssets(mockConfig)

			// THEN foreground should be generated with scaled size
			expect(generateForeground).toHaveBeenCalled()
		})

		it('should generate splash screens', async () => {
			// GIVEN config with iOS platform and splash type
			mockConfig.platforms = ['ios']
			mockConfig.assetTypes = ['splash']

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			const result = await generateAssets(mockConfig)

			// THEN all generated assets should be splash type
			expect(result.success).toBe(true)
			expect(result.assets.length).toBeGreaterThan(0)
			for (const asset of result.assets) {
				expect(asset.spec.type).toBe('splash')
			}
		})

		it('should generate adaptive icons for Android', async () => {
			// GIVEN config with Android platform and adaptive type
			mockConfig.platforms = ['android']
			mockConfig.assetTypes = ['adaptive']

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			const result = await generateAssets(mockConfig)

			// THEN all generated assets should be adaptive type
			expect(result.success).toBe(true)
			expect(result.assets.length).toBeGreaterThan(0)
			for (const asset of result.assets) {
				expect(asset.spec.type).toBe('adaptive')
			}
		})

		it('should generate web favicons', async () => {
			// GIVEN config with web platform and favicon type
			mockConfig.platforms = ['web']
			mockConfig.assetTypes = ['favicon']

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			const result = await generateAssets(mockConfig)

			// THEN all generated assets should be favicon type
			expect(result.success).toBe(true)
			expect(result.assets.length).toBeGreaterThan(0)
			for (const asset of result.assets) {
				expect(asset.spec.type).toBe('favicon')
			}
		})
	})

	describe('color mode variants', () => {
		it('should generate dark mode variants for iOS', async () => {
			// GIVEN config with iOS platform and icon type
			mockConfig.platforms = ['ios']
			mockConfig.assetTypes = ['icon']

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			const result = await generateAssets(mockConfig)

			// THEN dark mode variants should be included
			expect(result.assets.some(a => a.spec.name.includes('/dark/'))).toBe(true)
		})

		it('should generate tinted variants for iOS', async () => {
			// GIVEN config with iOS platform and icon type
			mockConfig.platforms = ['ios']
			mockConfig.assetTypes = ['icon']

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			const result = await generateAssets(mockConfig)

			// THEN tinted variants should be included
			expect(result.assets.some(a => a.spec.name.includes('/tinted/'))).toBe(
				true,
			)
		})

		it('should generate monochrome icons for Android', async () => {
			// GIVEN config with Android platform and adaptive type
			mockConfig.platforms = ['android']
			mockConfig.assetTypes = ['adaptive']

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			const result = await generateAssets(mockConfig)

			// THEN monochrome icons should be included
			expect(result.assets.some(a => a.spec.name.includes('monochrome'))).toBe(
				true,
			)
		})

		it('should generate night splash screens for Android', async () => {
			// GIVEN config with Android platform and splash type
			mockConfig.platforms = ['android']
			mockConfig.assetTypes = ['splash']

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			const result = await generateAssets(mockConfig)

			// THEN night mode splash screens should be included
			expect(result.assets.some(a => a.spec.name.includes('-night-'))).toBe(
				true,
			)
		})
	})

	describe('web manifest generation', () => {
		it('should generate web manifest for web platform with favicon', async () => {
			// GIVEN config with web platform and favicon type
			mockConfig.platforms = ['web']
			mockConfig.assetTypes = ['favicon']

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			await generateAssets(mockConfig)

			// THEN web manifest should be written
			expect(fs.writeFile).toHaveBeenCalledWith(
				expect.stringContaining('site.webmanifest'),
				expect.any(String),
			)
		})

		it('should include app name in manifest', async () => {
			// GIVEN config with app name TestApp
			mockConfig.platforms = ['web']
			mockConfig.assetTypes = ['favicon']

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			await generateAssets(mockConfig)

			// THEN manifest should include app name
			const writeFileCalls = (fs.writeFile as any).mock.calls
			const manifestCall = writeFileCalls.find((call: any[]) =>
				call[0].includes('site.webmanifest'),
			)

			expect(manifestCall).toBeDefined()
			const manifestContent = JSON.parse(manifestCall[1])
			expect(manifestContent.name).toBe('TestApp')
			expect(manifestContent.short_name).toBe('TestApp')
		})

		it('should include theme color from background config', async () => {
			// GIVEN config with specific background color
			mockConfig.platforms = ['web']
			mockConfig.assetTypes = ['favicon']
			mockConfig.background = {
				type: 'color',
				color: { type: 'solid', color: '#123456' },
			}

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			await generateAssets(mockConfig)

			// THEN manifest should include theme and background colors
			const writeFileCalls = (fs.writeFile as any).mock.calls
			const manifestCall = writeFileCalls.find((call: any[]) =>
				call[0].includes('site.webmanifest'),
			)

			const manifestContent = JSON.parse(manifestCall[1])
			expect(manifestContent.theme_color).toBe('#123456')
			expect(manifestContent.background_color).toBe('#123456')
		})
	})

	describe('directory structure', () => {
		it('should create directories for assets', async () => {
			// GIVEN config with iOS platform and icon type
			mockConfig.platforms = ['ios']
			mockConfig.assetTypes = ['icon']

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			await generateAssets(mockConfig)

			// THEN directories should be created with recursive option
			expect(fs.mkdir).toHaveBeenCalled()
			const mkdirCalls = (fs.mkdir as any).mock.calls
			for (const call of mkdirCalls) {
				expect(call[1]).toEqual({ recursive: true })
			}
		})

		it('should write files with correct paths', async () => {
			// GIVEN config with output directory
			mockConfig.platforms = ['ios']
			mockConfig.assetTypes = ['icon']

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			const result = await generateAssets(mockConfig)

			// THEN all asset paths should start with output directory
			for (const asset of result.assets) {
				expect(asset.path).toMatch(/^\/output\//)
			}
		})
	})

	describe('scale warnings and limits', () => {
		it('should cap Android adaptive icon scale at 0.66', async () => {
			// GIVEN config with scale higher than safe zone limit
			const { generateForeground } = await import(
				'../../generators/foreground_generator'
			)
			mockConfig.platforms = ['android']
			mockConfig.assetTypes = ['adaptive']
			mockConfig.iconScale = 0.9

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			await generateAssets(mockConfig)

			// THEN foreground size should be capped at 0.66 of canvas
			const calls = (generateForeground as any).mock.calls
			for (const call of calls) {
				const [, width, _height] = call
				// For 432px adaptive icon, max safe size is 432 * 0.66 ≈ 285
				if (width > 300) {
					expect(width).toBeLessThanOrEqual(432 * 0.66 + 1)
				}
			}
		})
	})

	describe('favicon scale', () => {
		it('should use default favicon scale of 0.85', async () => {
			// GIVEN config with web platform and favicon type, no custom scale
			const { generateForeground } = await import(
				'../../generators/foreground_generator'
			)
			mockConfig.platforms = ['web']
			mockConfig.assetTypes = ['favicon']
			// Ensure faviconScale is undefined to test default
			delete (mockConfig as any).faviconScale

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			await generateAssets(mockConfig)

			// THEN foreground should be generated at 85% of icon size
			// For 32px favicon, foreground should be 32 * 0.85 = 27px
			const calls = (generateForeground as any).mock.calls
			const favicon32Call = calls.find(
				(call: any[]) => call[1] === Math.floor(32 * 0.85),
			)
			expect(favicon32Call).toBeDefined()
		})

		it('should use custom favicon scale when provided', async () => {
			// GIVEN config with custom favicon scale of 0.6
			const { generateForeground } = await import(
				'../../generators/foreground_generator'
			)
			mockConfig.platforms = ['web']
			mockConfig.assetTypes = ['favicon']
			mockConfig.faviconScale = 0.6

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			await generateAssets(mockConfig)

			// THEN foreground should be generated at 60% of icon size
			// For 32px favicon, foreground should be 32 * 0.6 = 19px
			const calls = (generateForeground as any).mock.calls
			const favicon32Call = calls.find(
				(call: any[]) => call[1] === Math.floor(32 * 0.6),
			)
			expect(favicon32Call).toBeDefined()
		})

		it('should use favicon scale for favicon.ico generation', async () => {
			// GIVEN config with web platform, favicon type, and custom scale
			const { generateForeground } = await import(
				'../../generators/foreground_generator'
			)
			mockConfig.platforms = ['web']
			mockConfig.assetTypes = ['favicon']
			mockConfig.faviconScale = 0.7

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			await generateAssets(mockConfig)

			// THEN favicon.ico sizes (16, 32, 48) should use favicon scale
			// 16 * 0.7 = 11, 32 * 0.7 = 22, 48 * 0.7 = 33
			const calls = (generateForeground as any).mock.calls
			const sizes = calls.map((call: any[]) => call[1])
			expect(sizes).toContain(Math.floor(16 * 0.7))
			expect(sizes).toContain(Math.floor(32 * 0.7))
			expect(sizes).toContain(Math.floor(48 * 0.7))
		})

		it('should not affect icon scale when favicon scale is set', async () => {
			// GIVEN config with both icon and favicon types and different scales
			const { generateForeground } = await import(
				'../../generators/foreground_generator'
			)
			mockConfig.platforms = ['ios', 'web']
			mockConfig.assetTypes = ['icon', 'favicon']
			mockConfig.iconScale = 0.7
			mockConfig.faviconScale = 0.9

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			await generateAssets(mockConfig)

			// THEN both scales should be used independently
			const calls = (generateForeground as any).mock.calls
			// iOS icon at 1024px should use iconScale: 1024 * 0.7 = 716
			const iconCall = calls.find(
				(call: any[]) => call[1] === Math.floor(1024 * 0.7),
			)
			expect(iconCall).toBeDefined()
			// Favicon at 32px should use faviconScale: 32 * 0.9 = 28
			const faviconCall = calls.find(
				(call: any[]) => call[1] === Math.floor(32 * 0.9),
			)
			expect(faviconCall).toBeDefined()
		})
	})

	describe('error handling', () => {
		it('should handle pipeline setup errors', async () => {
			// GIVEN a mocked module that throws
			vi.doMock('../../assets/asset_specs', () => {
				throw new Error('Module error')
			})

			const { generateAssets } = await import(
				'../../generators/asset_generator'
			)

			// WHEN generating assets
			const result = await generateAssets(mockConfig)

			// THEN result object should still be returned
			expect(result).toHaveProperty('success')
			expect(result).toHaveProperty('outputDir')
		})
	})
})
