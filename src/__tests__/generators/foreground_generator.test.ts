/**
 * Tests for foreground generator.
 *
 * Tests SVG, text, and image foreground generation.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ForegroundConfig } from '../../types'
import { resetMocks } from '../setup'

// Hoisted mock for fs readFile
const mockReadFile = vi.hoisted(() => vi.fn())

// Mock node:fs/promises
vi.mock('node:fs/promises', () => ({
	readFile: mockReadFile,
}))

// Mock font loader
vi.mock('../../utils/font_loader', () => ({
	loadGoogleFont: vi.fn().mockResolvedValue(Buffer.from('mock-font-data')),
	loadSystemFont: vi.fn().mockResolvedValue(null),
}))

describe('ForegroundGenerator', () => {
	beforeEach(() => {
		resetMocks()
		vi.resetModules()
	})

	describe('generateForeground', () => {
		describe('SVG foregrounds', () => {
			it('should generate SVG foreground', async () => {
				// GIVEN an SVG file with content
				const svgContent =
					'<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="#FF0000"/></svg>'
				mockReadFile.mockResolvedValue(svgContent)
				const sharp = (await import('sharp')).default as any

				const { generateForeground } = await import(
					'../../generators/foreground_generator'
				)
				const config: ForegroundConfig = {
					type: 'svg',
					svgPath: '/path/to/icon.svg',
				}

				// WHEN generating the foreground
				const buffer = await generateForeground(config, 100, 100)

				// THEN buffer should be returned
				expect(buffer).toBeInstanceOf(Buffer)
				expect(sharp).toHaveBeenCalled()
			})

			it('should apply color override to SVG', async () => {
				// GIVEN an SVG with multiple fill colors
				const svgContent =
					'<svg><circle fill="#FF0000"/><rect fill="#00FF00"/></svg>'
				mockReadFile.mockResolvedValue(svgContent)
				const sharp = (await import('sharp')).default as any

				const { generateForeground } = await import(
					'../../generators/foreground_generator'
				)
				const config: ForegroundConfig = {
					type: 'svg',
					svgPath: '/path/to/icon.svg',
					color: '#0000FF',
				}

				// WHEN generating the foreground with color override
				await generateForeground(config, 100, 100)

				// THEN all fills should be replaced with override color
				const svgBuffer = sharp.lastInput as Buffer
				const modifiedSvg = svgBuffer.toString()
				expect(modifiedSvg).toContain('fill="#0000FF"')
				expect(modifiedSvg).not.toContain('fill="#FF0000"')
				expect(modifiedSvg).not.toContain('fill="#00FF00"')
			})

			it('should not modify SVG when no color override', async () => {
				// GIVEN an SVG with original fill color
				const svgContent = '<svg><circle fill="#FF0000"/></svg>'
				mockReadFile.mockResolvedValue(svgContent)
				const sharp = (await import('sharp')).default as any

				const { generateForeground } = await import(
					'../../generators/foreground_generator'
				)
				const config: ForegroundConfig = {
					type: 'svg',
					svgPath: '/path/to/icon.svg',
				}

				// WHEN generating the foreground without color override
				await generateForeground(config, 100, 100)

				// THEN original fill color should be preserved
				const svgBuffer = sharp.lastInput as Buffer
				const modifiedSvg = svgBuffer.toString()
				expect(modifiedSvg).toContain('fill="#FF0000"')
			})

			it('should resize with contain fit mode', async () => {
				// GIVEN an SVG file
				const svgContent = '<svg width="100" height="100"></svg>'
				mockReadFile.mockResolvedValue(svgContent)
				const sharp = (await import('sharp')).default as any

				const { generateForeground } = await import(
					'../../generators/foreground_generator'
				)
				const config: ForegroundConfig = {
					type: 'svg',
					svgPath: '/path/to/icon.svg',
				}

				// WHEN generating the foreground at specific dimensions
				await generateForeground(config, 200, 100)

				// THEN image should be resized with contain fit and transparent background
				expect(sharp.mockInstance.resize).toHaveBeenCalledWith(200, 100, {
					fit: 'contain',
					background: { r: 0, g: 0, b: 0, alpha: 0 },
				})
			})
		})

		describe('text foregrounds', () => {
			it('should generate text foreground with Google Font', async () => {
				// GIVEN a text config with Google font
				const sharp = (await import('sharp')).default as any

				const { generateForeground } = await import(
					'../../generators/foreground_generator'
				)
				const config: ForegroundConfig = {
					type: 'text',
					text: 'A',
					fontFamily: 'Roboto',
					fontSource: 'google',
					color: '#FFFFFF',
				}

				// WHEN generating the foreground
				const buffer = await generateForeground(config, 100, 100)

				// THEN SVG with text path should be created
				expect(buffer).toBeInstanceOf(Buffer)
				const svgBuffer = sharp.lastInput as Buffer
				const svgContent = svgBuffer.toString()
				expect(svgContent).toContain('<path')
				expect(svgContent).toContain('fill="#FFFFFF"')
			})

			it('should calculate default font size as 60% of height', async () => {
				// GIVEN a text config without fontSize specified
				const _sharp = (await import('sharp')).default as any
				const opentype = (await import('opentype.js')).default

				const { generateForeground } = await import(
					'../../generators/foreground_generator'
				)
				const config: ForegroundConfig = {
					type: 'text',
					text: 'A',
					fontFamily: 'Roboto',
					fontSource: 'google',
					color: '#FFFFFF',
				}

				// WHEN generating at 100x100
				await generateForeground(config, 100, 100)

				// THEN font size should default to 60% of height (60)
				expect(opentype.parse).toHaveBeenCalled()
				const mockFont = opentype.parse(new ArrayBuffer(0))
				expect(mockFont.getPath).toHaveBeenCalledWith('A', 0, 0, 60)
			})

			it('should use custom font size when provided', async () => {
				// GIVEN a text config with custom fontSize
				const opentype = (await import('opentype.js')).default

				const { generateForeground } = await import(
					'../../generators/foreground_generator'
				)
				const config: ForegroundConfig = {
					type: 'text',
					text: 'A',
					fontFamily: 'Roboto',
					fontSource: 'google',
					color: '#FFFFFF',
					fontSize: 48,
				}

				// WHEN generating the foreground
				await generateForeground(config, 100, 100)

				// THEN custom font size should be used
				const mockFont = opentype.parse(new ArrayBuffer(0))
				expect(mockFont.getPath).toHaveBeenCalledWith('A', 0, 0, 48)
			})

			it('should handle system fonts with fallback', async () => {
				// GIVEN a system font that returns null
				const sharp = (await import('sharp')).default as any

				const { generateForeground } = await import(
					'../../generators/foreground_generator'
				)
				const config: ForegroundConfig = {
					type: 'text',
					text: 'A',
					fontFamily: 'Arial',
					fontSource: 'system',
					color: '#000000',
				}

				// WHEN generating the foreground
				const buffer = await generateForeground(config, 100, 100)

				// THEN placeholder rect should be rendered
				expect(buffer).toBeInstanceOf(Buffer)
				const svgBuffer = sharp.lastInput as Buffer
				const svgContent = svgBuffer.toString()
				expect(svgContent).toContain('<rect')
			})

			it('should load custom font from path', async () => {
				// GIVEN a custom font config with path
				mockReadFile.mockResolvedValue(Buffer.from('font-data'))

				const { generateForeground } = await import(
					'../../generators/foreground_generator'
				)
				const config: ForegroundConfig = {
					type: 'text',
					text: 'A',
					fontFamily: 'CustomFont',
					fontSource: 'custom',
					fontPath: '/path/to/font.ttf',
					color: '#FFFFFF',
				}

				// WHEN generating the foreground
				const buffer = await generateForeground(config, 100, 100)

				// THEN font should be loaded from specified path
				expect(buffer).toBeInstanceOf(Buffer)
				expect(mockReadFile).toHaveBeenCalledWith('/path/to/font.ttf')
			})

			it('should throw when custom font path is missing', async () => {
				// GIVEN a custom font config without fontPath
				const { generateForeground } = await import(
					'../../generators/foreground_generator'
				)
				const config: ForegroundConfig = {
					type: 'text',
					text: 'A',
					fontFamily: 'CustomFont',
					fontSource: 'custom',
					color: '#FFFFFF',
				}

				// WHEN generating the foreground
				// THEN it should throw font path required error
				await expect(generateForeground(config, 100, 100)).rejects.toThrow(
					'Font path is required for custom fonts',
				)
			})

			it('should center text path on canvas', async () => {
				// GIVEN a text config
				const sharp = (await import('sharp')).default as any

				const { generateForeground } = await import(
					'../../generators/foreground_generator'
				)
				const config: ForegroundConfig = {
					type: 'text',
					text: 'A',
					fontFamily: 'Roboto',
					fontSource: 'google',
					color: '#FFFFFF',
				}

				// WHEN generating the foreground
				await generateForeground(config, 200, 200)

				// THEN SVG should have centering transform
				const svgBuffer = sharp.lastInput as Buffer
				const svgContent = svgBuffer.toString()
				expect(svgContent).toContain('transform="translate(')
			})
		})

		describe('image foregrounds', () => {
			it('should generate image foreground', async () => {
				// GIVEN an image foreground config with path
				const sharp = (await import('sharp')).default as any

				const { generateForeground } = await import(
					'../../generators/foreground_generator'
				)
				const config: ForegroundConfig = {
					type: 'image',
					imagePath: '/path/to/logo.png',
				}

				// WHEN generating the foreground
				const buffer = await generateForeground(config, 100, 100)

				// THEN image should be loaded from path
				expect(buffer).toBeInstanceOf(Buffer)
				expect(sharp).toHaveBeenCalledWith('/path/to/logo.png')
			})

			it('should resize with contain fit mode and transparent background', async () => {
				// GIVEN an image foreground config
				const sharp = (await import('sharp')).default as any

				const { generateForeground } = await import(
					'../../generators/foreground_generator'
				)
				const config: ForegroundConfig = {
					type: 'image',
					imagePath: '/path/to/logo.png',
				}

				// WHEN generating the foreground at specific dimensions
				await generateForeground(config, 200, 100)

				// THEN image should be resized with contain fit and transparent background
				expect(sharp.mockInstance.resize).toHaveBeenCalledWith(200, 100, {
					fit: 'contain',
					background: { r: 0, g: 0, b: 0, alpha: 0 },
				})
			})
		})

		describe('unknown foreground type', () => {
			it('should throw for unknown type', async () => {
				// GIVEN an unknown foreground type
				const { generateForeground } = await import(
					'../../generators/foreground_generator'
				)
				const config = {
					type: 'unknown',
				} as any

				// WHEN generating the foreground
				// THEN it should throw unknown type error
				await expect(generateForeground(config, 100, 100)).rejects.toThrow(
					'Unknown foreground type',
				)
			})
		})

		describe('output format', () => {
			it('should output PNG format', async () => {
				// GIVEN a valid foreground config
				const svgContent = '<svg></svg>'
				mockReadFile.mockResolvedValue(svgContent)
				const sharp = (await import('sharp')).default as any

				const { generateForeground } = await import(
					'../../generators/foreground_generator'
				)
				const config: ForegroundConfig = {
					type: 'svg',
					svgPath: '/path/to/icon.svg',
				}

				// WHEN generating the foreground
				await generateForeground(config, 100, 100)

				// THEN output should be PNG format
				expect(sharp.mockInstance.png).toHaveBeenCalled()
				expect(sharp.mockInstance.toBuffer).toHaveBeenCalled()
			})
		})
	})

	describe('font source handling', () => {
		it('should use loadGoogleFont for google source', async () => {
			// GIVEN a text config with google font source
			const { loadGoogleFont } = await import('../../utils/font_loader')

			const { generateForeground } = await import(
				'../../generators/foreground_generator'
			)
			const config: ForegroundConfig = {
				type: 'text',
				text: 'A',
				fontFamily: 'Roboto',
				fontSource: 'google',
				color: '#FFFFFF',
			}

			// WHEN generating the foreground
			await generateForeground(config, 100, 100)

			// THEN loadGoogleFont should be called with font family
			expect(loadGoogleFont).toHaveBeenCalledWith('Roboto')
		})

		it('should use loadSystemFont for system source', async () => {
			// GIVEN a text config with system font source
			const { loadSystemFont } = await import('../../utils/font_loader')

			const { generateForeground } = await import(
				'../../generators/foreground_generator'
			)
			const config: ForegroundConfig = {
				type: 'text',
				text: 'A',
				fontFamily: 'Arial',
				fontSource: 'system',
				color: '#FFFFFF',
			}

			// WHEN generating the foreground
			await generateForeground(config, 100, 100)

			// THEN loadSystemFont should be called with font family
			expect(loadSystemFont).toHaveBeenCalledWith('Arial')
		})

		it('should throw for unknown font source', async () => {
			// GIVEN a text config with unknown font source
			const { generateForeground } = await import(
				'../../generators/foreground_generator'
			)
			const config = {
				type: 'text',
				text: 'A',
				fontFamily: 'Test',
				fontSource: 'unknown',
				color: '#FFFFFF',
			} as any

			// WHEN generating the foreground
			// THEN it should throw unknown font source error
			await expect(generateForeground(config, 100, 100)).rejects.toThrow(
				'Unknown font source',
			)
		})
	})

	describe('SVG path generation for text', () => {
		it('should include path data in SVG', async () => {
			// GIVEN a text config
			const sharp = (await import('sharp')).default as any

			const { generateForeground } = await import(
				'../../generators/foreground_generator'
			)
			const config: ForegroundConfig = {
				type: 'text',
				text: 'AB',
				fontFamily: 'Roboto',
				fontSource: 'google',
				color: '#FF0000',
			}

			// WHEN generating the foreground
			await generateForeground(config, 100, 100)

			// THEN SVG should contain path data from mock
			const svgBuffer = sharp.lastInput as Buffer
			const svgContent = svgBuffer.toString()
			expect(svgContent).toContain('d="M0 0 L100 0 L100 50 L0 50 Z"')
		})

		it('should include canvas dimensions in SVG', async () => {
			// GIVEN a text config
			const sharp = (await import('sharp')).default as any

			const { generateForeground } = await import(
				'../../generators/foreground_generator'
			)
			const config: ForegroundConfig = {
				type: 'text',
				text: 'A',
				fontFamily: 'Roboto',
				fontSource: 'google',
				color: '#FFFFFF',
			}

			// WHEN generating the foreground at 256x256
			await generateForeground(config, 256, 256)

			// THEN SVG should have matching dimensions
			const svgBuffer = sharp.lastInput as Buffer
			const svgContent = svgBuffer.toString()
			expect(svgContent).toContain('width="256"')
			expect(svgContent).toContain('height="256"')
		})
	})
})
