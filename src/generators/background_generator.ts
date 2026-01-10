/**
 * Background generation for app assets.
 *
 * This module generates background layers for icons and splash screens.
 * Three background types are supported:
 * - Solid color: Simple hex color fill.
 * - Gradient: Linear or radial gradients via SVG rendering.
 * - Image: Existing image scaled to fit (cover mode).
 *
 * Implementation note: Sharp doesn't natively support gradients, so we
 * generate SVG markup and render it through Sharp's SVG pipeline.
 */

import sharp from 'sharp'

import type { BackgroundConfig } from '../types'

/**
 * Generates a background image buffer based on configuration.
 *
 * Returns a PNG buffer at the specified dimensions. All background types
 * produce fully opaque images (no transparency).
 */
export async function generateBackground(
	config: BackgroundConfig,
	width: number,
	height: number,
): Promise<Buffer> {
	switch (config.type) {
		case 'color':
			return generateSolidBackground(
				config.color?.color || '#FFFFFF',
				width,
				height,
			)

		case 'gradient':
			if (!config.gradient) {
				throw new Error('Gradient configuration is required')
			}
			return generateGradientBackground(config.gradient, width, height)

		case 'image':
			if (!config.imagePath) {
				throw new Error('Image path is required for image background')
			}
			return generateImageBackground(config.imagePath, width, height)

		default:
			throw new Error(`Unknown background type: ${config.type}`)
	}
}

/**
 * Creates a solid color background using Sharp's raw image creation.
 * This is the most efficient method for single-color fills.
 */
async function generateSolidBackground(
	color: string,
	width: number,
	height: number,
): Promise<Buffer> {
	const rgb = hexToRgb(color)

	return sharp({
		create: {
			width,
			height,
			channels: 4,
			background: { r: rgb.r, g: rgb.g, b: rgb.b, alpha: 1 },
		},
	})
		.png()
		.toBuffer()
}

/**
 * Creates a gradient background by rendering SVG through Sharp.
 *
 * Sharp lacks native gradient support, but has excellent SVG rendering.
 * We generate SVG markup with the gradient definition and render it to PNG.
 * This approach produces smooth gradients at any resolution.
 */
async function generateGradientBackground(
	gradient: { type: 'linear' | 'radial'; colors: string[]; angle?: number },
	width: number,
	height: number,
): Promise<Buffer> {
	const svg =
		gradient.type === 'linear'
			? createLinearGradientSVG(
					gradient.colors,
					width,
					height,
					gradient.angle || 0,
				)
			: createRadialGradientSVG(gradient.colors, width, height)

	return sharp(Buffer.from(svg)).png().toBuffer()
}

/**
 * Generates SVG markup for a linear gradient.
 *
 * Angle conversion algorithm:
 * SVG linearGradient uses (x1,y1) to (x2,y2) coordinates as percentages.
 * CSS-style angles (0deg = up, clockwise) are converted to SVG coordinates
 * using trigonometry. The gradient line passes through the center (50,50).
 *
 * Example angles:
 * - 0deg: Top to bottom (y1=0, y2=100).
 * - 90deg: Left to right (x1=0, x2=100).
 * - 45deg: Top-left to bottom-right.
 */
function createLinearGradientSVG(
	colors: string[],
	width: number,
	height: number,
	angle: number,
): string {
	// Convert CSS angle to SVG gradient coordinates.
	const rad = (angle * Math.PI) / 180
	const x1 = Math.round(50 + Math.sin(rad) * 50)
	const y1 = Math.round(50 - Math.cos(rad) * 50)
	const x2 = Math.round(50 + Math.sin(rad + Math.PI) * 50)
	const y2 = Math.round(50 - Math.cos(rad + Math.PI) * 50)

	// Distribute color stops evenly across the gradient.
	const stops = colors
		.map((color, i) => {
			const offset = (i / (colors.length - 1)) * 100
			return `<stop offset="${offset}%" stop-color="${color}" />`
		})
		.join('\n      ')

	return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
      ${stops}
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grad)" />
</svg>
  `.trim()
}

/**
 * Generates SVG markup for a radial gradient.
 *
 * The gradient radiates from the center (50%, 50%) outward.
 * Colors are distributed evenly from center (first color) to edge (last color).
 */
function createRadialGradientSVG(
	colors: string[],
	width: number,
	height: number,
): string {
	const stops = colors
		.map((color, i) => {
			const offset = (i / (colors.length - 1)) * 100
			return `<stop offset="${offset}%" stop-color="${color}" />`
		})
		.join('\n      ')

	return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="grad" cx="50%" cy="50%" r="50%">
      ${stops}
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grad)" />
</svg>
  `.trim()
}

/**
 * Generates a background from an existing image file.
 *
 * Uses 'cover' fit mode to fill the entire canvas, cropping edges if the
 * source aspect ratio differs from the target. The crop is center-weighted
 * to preserve the focal point of most images.
 *
 * This differs from foreground image handling which uses 'contain' mode.
 * Backgrounds should fill edge-to-edge without letterboxing, while
 * foregrounds should preserve their full content with transparency padding.
 */
async function generateImageBackground(
	imagePath: string,
	width: number,
	height: number,
): Promise<Buffer> {
	return sharp(imagePath)
		.resize(width, height, {
			fit: 'cover',
			position: 'center',
		})
		.png()
		.toBuffer()
}

/**
 * Converts a hex color string to an RGB object.
 *
 * Accepts hex colors with or without the leading '#' symbol.
 * Only supports 6-digit hex format (RRGGBB), not 3-digit shorthand.
 *
 * Examples:
 * - "#FF5500" -> { r: 255, g: 85, b: 0 }
 * - "1A1A1A" -> { r: 26, g: 26, b: 26 }
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

	if (!result) {
		throw new Error(`Invalid hex color: ${hex}`)
	}

	return {
		r: Number.parseInt(result[1] ?? '0', 16),
		g: Number.parseInt(result[2] ?? '0', 16),
		b: Number.parseInt(result[3] ?? '0', 16),
	}
}
