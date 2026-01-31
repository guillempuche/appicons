/**
 * Tests for background generator.
 *
 * Tests solid color, gradient, and image background generation.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BackgroundConfig } from '../../types'
import { resetMocks } from '../setup'

describe('BackgroundGenerator', () => {
	beforeEach(() => {
		resetMocks()
		vi.resetModules()
	})

	describe('generateBackground', () => {
		describe('solid color backgrounds', () => {
			it('should generate solid color background', async () => {
				// GIVEN a solid color background config
				const sharp = (await import('sharp')).default as any

				const { generateBackground } = await import(
					'../../generators/background_generator'
				)
				const config: BackgroundConfig = {
					type: 'color',
					color: { type: 'solid', color: '#FF5500' },
				}

				// WHEN generating the background
				const buffer = await generateBackground(config, 100, 100)

				// THEN buffer should be returned with correct dimensions
				expect(buffer).toBeInstanceOf(Buffer)
				expect(sharp).toHaveBeenCalled()
				const lastInput = sharp.lastInput
				expect(lastInput).toHaveProperty('create')
				expect(lastInput.create.width).toBe(100)
				expect(lastInput.create.height).toBe(100)
			})

			it('should use white as default color', async () => {
				// GIVEN a color background config without color specified
				const sharp = (await import('sharp')).default as any

				const { generateBackground } = await import(
					'../../generators/background_generator'
				)
				const config: BackgroundConfig = {
					type: 'color',
				}

				// WHEN generating the background
				await generateBackground(config, 100, 100)

				// THEN background should default to white
				const lastInput = sharp.lastInput
				expect(lastInput.create.background).toEqual({
					r: 255,
					g: 255,
					b: 255,
					alpha: 1,
				})
			})

			it('should parse hex color without hash', async () => {
				// GIVEN a hex color without leading hash
				const sharp = (await import('sharp')).default as any

				const { generateBackground } = await import(
					'../../generators/background_generator'
				)
				const config: BackgroundConfig = {
					type: 'color',
					color: { type: 'solid', color: 'FF5500' },
				}

				// WHEN generating the background
				await generateBackground(config, 100, 100)

				// THEN color should be parsed correctly
				const lastInput = sharp.lastInput
				expect(lastInput.create.background.r).toBe(255)
				expect(lastInput.create.background.g).toBe(85)
				expect(lastInput.create.background.b).toBe(0)
			})

			it('should parse lowercase hex color', async () => {
				// GIVEN a lowercase hex color
				const sharp = (await import('sharp')).default as any

				const { generateBackground } = await import(
					'../../generators/background_generator'
				)
				const config: BackgroundConfig = {
					type: 'color',
					color: { type: 'solid', color: '#aabbcc' },
				}

				// WHEN generating the background
				await generateBackground(config, 100, 100)

				// THEN color should be parsed correctly
				const lastInput = sharp.lastInput
				expect(lastInput.create.background.r).toBe(170)
				expect(lastInput.create.background.g).toBe(187)
				expect(lastInput.create.background.b).toBe(204)
			})

			it('should throw on invalid hex color', async () => {
				// GIVEN an invalid hex color string
				const { generateBackground } = await import(
					'../../generators/background_generator'
				)
				const config: BackgroundConfig = {
					type: 'color',
					color: { type: 'solid', color: 'invalid' },
				}

				// WHEN generating the background
				// THEN it should throw invalid hex color error
				await expect(generateBackground(config, 100, 100)).rejects.toThrow(
					'Invalid hex color',
				)
			})

			it('should throw on 3-digit hex color (not supported)', async () => {
				// GIVEN a 3-digit shorthand hex color
				const { generateBackground } = await import(
					'../../generators/background_generator'
				)
				const config: BackgroundConfig = {
					type: 'color',
					color: { type: 'solid', color: '#FFF' },
				}

				// WHEN generating the background
				// THEN it should throw invalid hex color error
				await expect(generateBackground(config, 100, 100)).rejects.toThrow(
					'Invalid hex color',
				)
			})
		})

		describe('gradient backgrounds', () => {
			it('should generate linear gradient background', async () => {
				// GIVEN a linear gradient config with two colors
				const sharp = (await import('sharp')).default as any

				const { generateBackground } = await import(
					'../../generators/background_generator'
				)
				const config: BackgroundConfig = {
					type: 'gradient',
					gradient: {
						type: 'linear',
						colors: ['#FF0000', '#0000FF'],
						angle: 45,
					},
				}

				// WHEN generating the background
				const buffer = await generateBackground(config, 100, 100)

				// THEN buffer should be returned via SVG conversion
				expect(buffer).toBeInstanceOf(Buffer)
				expect(sharp).toHaveBeenCalledWith(expect.any(Buffer))
			})

			it('should generate radial gradient background', async () => {
				// GIVEN a radial gradient config
				const sharp = (await import('sharp')).default as any

				const { generateBackground } = await import(
					'../../generators/background_generator'
				)
				const config: BackgroundConfig = {
					type: 'gradient',
					gradient: {
						type: 'radial',
						colors: ['#FFFFFF', '#000000'],
					},
				}

				// WHEN generating the background
				const buffer = await generateBackground(config, 100, 100)

				// THEN buffer should be returned
				expect(buffer).toBeInstanceOf(Buffer)
				expect(sharp).toHaveBeenCalled()
			})

			it('should default to 0 angle for linear gradient', async () => {
				// GIVEN a linear gradient without angle specified
				const sharp = (await import('sharp')).default as any

				const { generateBackground } = await import(
					'../../generators/background_generator'
				)
				const config: BackgroundConfig = {
					type: 'gradient',
					gradient: {
						type: 'linear',
						colors: ['#FF0000', '#0000FF'],
					},
				}

				// WHEN generating the background
				await generateBackground(config, 100, 100)

				// THEN SVG with linearGradient should be generated
				const lastInput = sharp.lastInput
				expect(Buffer.isBuffer(lastInput)).toBe(true)
				const svgContent = lastInput.toString()
				expect(svgContent).toContain('linearGradient')
			})

			it('should handle multi-color gradients', async () => {
				// GIVEN a gradient with three colors
				const sharp = (await import('sharp')).default as any

				const { generateBackground } = await import(
					'../../generators/background_generator'
				)
				const config: BackgroundConfig = {
					type: 'gradient',
					gradient: {
						type: 'linear',
						colors: ['#FF0000', '#00FF00', '#0000FF'],
						angle: 0,
					},
				}

				// WHEN generating the background
				await generateBackground(config, 100, 100)

				// THEN SVG should have 3 color stops at correct offsets
				const svgContent = (sharp.lastInput as Buffer).toString()
				expect(svgContent).toContain('offset="0%"')
				expect(svgContent).toContain('offset="50%"')
				expect(svgContent).toContain('offset="100%"')
			})

			it('should throw when gradient config is missing', async () => {
				// GIVEN a gradient type without gradient configuration
				const { generateBackground } = await import(
					'../../generators/background_generator'
				)
				const config: BackgroundConfig = {
					type: 'gradient',
				}

				// WHEN generating the background
				// THEN it should throw configuration required error
				await expect(generateBackground(config, 100, 100)).rejects.toThrow(
					'Gradient configuration is required',
				)
			})
		})

		describe('image backgrounds', () => {
			it('should generate image background', async () => {
				// GIVEN an image background config with path
				const sharp = (await import('sharp')).default as any

				const { generateBackground } = await import(
					'../../generators/background_generator'
				)
				const config: BackgroundConfig = {
					type: 'image',
					imagePath: '/path/to/image.png',
				}

				// WHEN generating the background
				const buffer = await generateBackground(config, 100, 100)

				// THEN image should be loaded from path
				expect(buffer).toBeInstanceOf(Buffer)
				expect(sharp).toHaveBeenCalledWith('/path/to/image.png')
			})

			it('should resize with cover fit mode', async () => {
				// GIVEN an image background config
				const sharp = (await import('sharp')).default as any

				const { generateBackground } = await import(
					'../../generators/background_generator'
				)
				const config: BackgroundConfig = {
					type: 'image',
					imagePath: '/path/to/image.png',
				}

				// WHEN generating the background at specific dimensions
				await generateBackground(config, 200, 100)

				// THEN image should be resized with cover fit
				expect(sharp.mockInstance.resize).toHaveBeenCalledWith(200, 100, {
					fit: 'cover',
					position: 'center',
				})
			})

			it('should throw when image path is missing', async () => {
				// GIVEN an image type without imagePath
				const { generateBackground } = await import(
					'../../generators/background_generator'
				)
				const config: BackgroundConfig = {
					type: 'image',
				}

				// WHEN generating the background
				// THEN it should throw image path required error
				await expect(generateBackground(config, 100, 100)).rejects.toThrow(
					'Image path is required',
				)
			})
		})

		describe('unknown background type', () => {
			it('should throw for unknown type', async () => {
				// GIVEN an unknown background type
				const { generateBackground } = await import(
					'../../generators/background_generator'
				)
				const config = {
					type: 'unknown',
				} as any

				// WHEN generating the background
				// THEN it should throw unknown type error
				await expect(generateBackground(config, 100, 100)).rejects.toThrow(
					'Unknown background type',
				)
			})
		})

		describe('output format', () => {
			it('should output PNG format', async () => {
				// GIVEN a valid background config
				const sharp = (await import('sharp')).default as any

				const { generateBackground } = await import(
					'../../generators/background_generator'
				)
				const config: BackgroundConfig = {
					type: 'color',
					color: { type: 'solid', color: '#FFFFFF' },
				}

				// WHEN generating the background
				await generateBackground(config, 100, 100)

				// THEN output should be PNG format
				expect(sharp.mockInstance.png).toHaveBeenCalled()
				expect(sharp.mockInstance.toBuffer).toHaveBeenCalled()
			})
		})
	})

	describe('hexToRgb (internal function tested via generateBackground)', () => {
		const testCases = [
			{ hex: '#000000', expected: { r: 0, g: 0, b: 0 } },
			{ hex: '#FFFFFF', expected: { r: 255, g: 255, b: 255 } },
			{ hex: '#FF0000', expected: { r: 255, g: 0, b: 0 } },
			{ hex: '#00FF00', expected: { r: 0, g: 255, b: 0 } },
			{ hex: '#0000FF', expected: { r: 0, g: 0, b: 255 } },
			{ hex: '#1A2B3C', expected: { r: 26, g: 43, b: 60 } },
		]

		for (const { hex, expected } of testCases) {
			it(`should parse ${hex} correctly`, async () => {
				// GIVEN a hex color value
				const sharp = (await import('sharp')).default as any

				const { generateBackground } = await import(
					'../../generators/background_generator'
				)
				const config: BackgroundConfig = {
					type: 'color',
					color: { type: 'solid', color: hex },
				}

				// WHEN generating the background
				await generateBackground(config, 100, 100)

				// THEN RGB values should match expected
				const lastInput = sharp.lastInput
				expect(lastInput.create.background.r).toBe(expected.r)
				expect(lastInput.create.background.g).toBe(expected.g)
				expect(lastInput.create.background.b).toBe(expected.b)
			})
		}
	})

	describe('gradient angle calculations', () => {
		const angleTestCases = [
			{ angle: 0, description: 'top to bottom' },
			{ angle: 90, description: 'left to right' },
			{ angle: 180, description: 'bottom to top' },
			{ angle: 270, description: 'right to left' },
			{ angle: 45, description: 'top-left to bottom-right' },
		]

		for (const { angle, description } of angleTestCases) {
			it(`should handle ${angle}deg angle (${description})`, async () => {
				// GIVEN a linear gradient with specific angle
				const sharp = (await import('sharp')).default as any

				const { generateBackground } = await import(
					'../../generators/background_generator'
				)
				const config: BackgroundConfig = {
					type: 'gradient',
					gradient: {
						type: 'linear',
						colors: ['#FF0000', '#0000FF'],
						angle,
					},
				}

				// WHEN generating the background
				await generateBackground(config, 100, 100)

				// THEN SVG should have gradient with coordinate attributes
				const svgContent = (sharp.lastInput as Buffer).toString()
				expect(svgContent).toContain('linearGradient')
				expect(svgContent).toMatch(/x1="\d+%"/)
				expect(svgContent).toMatch(/y1="\d+%"/)
				expect(svgContent).toMatch(/x2="\d+%"/)
				expect(svgContent).toMatch(/y2="\d+%"/)
			})
		}
	})
})
