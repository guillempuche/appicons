/**
 * Foreground generation for app assets.
 *
 * This module generates the foreground layer (logo, icon, or text) that sits
 * atop the background in composite assets. All foreground types produce
 * transparent PNG buffers suitable for layering.
 *
 * Supported foreground types:
 * - SVG: Vector icons with optional color override for theming.
 * - Text: Custom typography using Google Fonts, system fonts, or custom TTF/OTF.
 * - Image: Raster images (PNG, JPG) with transparency preservation.
 *
 * All foregrounds use 'contain' fit mode to preserve aspect ratio, centered
 * on a transparent canvas of the requested dimensions.
 *
 * Text Rendering Strategy:
 * Uses opentype.js to convert text to SVG paths. This bypasses librsvg's
 * font limitations - embedded base64 fonts don't work in Sharp/librsvg,
 * but vector paths render perfectly at any resolution.
 */

import { readFile } from 'node:fs/promises'
import opentype from 'opentype.js'
import sharp from 'sharp'

import type { ForegroundConfig } from '../types'
import { loadGoogleFont, loadSystemFont } from '../utils/font_loader'

/**
 * Generates a foreground image buffer based on configuration.
 *
 * This is the main entry point for foreground generation. It dispatches to
 * the appropriate generator based on the foreground type and returns a
 * transparent PNG buffer at the specified dimensions.
 *
 * The returned buffer is suitable for compositing onto a background layer
 * using Sharp's composite operation.
 */
export async function generateForeground(
	config: ForegroundConfig,
	width: number,
	height: number,
): Promise<Buffer> {
	switch (config.type) {
		case 'svg':
			return generateSVGForeground(config.svgPath, width, height, config.color)

		case 'text':
			return generateTextForeground(config, width, height)

		case 'image':
			return generateImageForeground(config.imagePath, width, height)

		default:
			throw new Error(`Unknown foreground type: ${(config as any).type}`)
	}
}

/**
 * Generates foreground from an SVG file.
 *
 * SVG is the preferred format for icons because it scales cleanly to any
 * resolution without quality loss. The optional color override enables
 * theming by replacing all fill attributes with a single color.
 *
 * Color override limitation: This uses a simple regex replacement that
 * only handles fill="..." attributes. SVGs with inline styles, CSS classes,
 * or currentColor will not be fully recolored.
 */
async function generateSVGForeground(
	svgPath: string,
	width: number,
	height: number,
	colorOverride?: string,
): Promise<Buffer> {
	let svgContent = await readFile(svgPath, 'utf-8')

	// Apply color override by replacing all fill attributes.
	if (colorOverride) {
		svgContent = svgContent.replace(/fill="[^"]*"/g, `fill="${colorOverride}"`)
	}

	// Resize SVG to fit within dimensions while maintaining aspect ratio.
	return sharp(Buffer.from(svgContent))
		.resize(width, height, {
			fit: 'contain',
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		})
		.png()
		.toBuffer()
}

/**
 * Generates foreground from text using a custom font.
 *
 * Text foregrounds are useful for app icons that use typography as the
 * primary visual element (e.g., "Fb" for Facebook, "G" for Google).
 *
 * Font loading strategy:
 * - Google Fonts: Downloaded from the Google Fonts API on demand.
 * - System fonts: Resolved from the operating system's font directories.
 * - Custom fonts: Loaded directly from the provided file path.
 *
 * Rendering approach:
 * Uses opentype.js to convert text to SVG paths. This bypasses librsvg's
 * font limitations - embedded base64 fonts don't work, but vector paths
 * render perfectly at any resolution.
 *
 * Font size auto-calculation: If no fontSize is provided, the text is
 * sized to 60% of the canvas height for optimal visual balance.
 */
async function generateTextForeground(
	config: {
		text: string
		fontFamily: string
		fontSize?: number
		color: string
		fontSource: 'google' | 'system' | 'custom'
		fontPath?: string
	},
	width: number,
	height: number,
): Promise<Buffer> {
	// Load font based on source (may be null for system fonts).
	const fontBuffer = await loadFont(config)

	// Default to 60% of canvas height for balanced visual weight.
	const fontSize = config.fontSize || Math.floor(height * 0.6)

	const svg = createTextPathSVG(
		config.text,
		fontSize,
		config.color,
		width,
		height,
		fontBuffer,
	)

	return sharp(Buffer.from(svg))
		.resize(width, height, {
			fit: 'contain',
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		})
		.png()
		.toBuffer()
}

/**
 * Loads a font file based on the source configuration.
 *
 * Returns the font as a Buffer for embedding in SVG or direct use with
 * text rendering libraries. Returns null for system fonts that don't
 * need explicit loading (the system handles font resolution).
 *
 * Note: The returned buffer is not currently used for SVG text rendering
 * because Sharp's SVG renderer relies on system fonts or CSS @import.
 * This function exists for future integration with libraries like opentype.js
 * that support direct font buffer rendering.
 */
async function loadFont(config: {
	fontFamily: string
	fontSource: 'google' | 'system' | 'custom'
	fontPath?: string
}): Promise<Buffer | null> {
	switch (config.fontSource) {
		case 'google':
			return loadGoogleFont(config.fontFamily)

		case 'system':
			return loadSystemFont(config.fontFamily)

		case 'custom':
			if (!config.fontPath) {
				throw new Error('Font path is required for custom fonts')
			}
			return readFile(config.fontPath)

		default:
			throw new Error(`Unknown font source: ${config.fontSource}`)
	}
}

/**
 * Creates SVG markup with text converted to paths using opentype.js.
 *
 * This approach bypasses librsvg's font rendering limitations by converting
 * text characters to vector paths. The paths are mathematically precise
 * representations of the glyphs that render perfectly at any resolution.
 *
 * Path centering:
 * 1. Get the bounding box of the rendered path
 * 2. Calculate offsets to center the path in the canvas
 * 3. Apply transform to position the path
 *
 * Fallback: When no fontBuffer is available, creates a simple rectangle
 * placeholder (system font fallback isn't possible with path approach).
 */
function createTextPathSVG(
	text: string,
	fontSize: number,
	color: string,
	width: number,
	height: number,
	fontBuffer: Buffer | null,
): string {
	if (!fontBuffer) {
		// Fallback: simple placeholder when font unavailable
		return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${width * 0.25}" y="${height * 0.25}" width="${width * 0.5}" height="${height * 0.5}" fill="${color}" opacity="0.3"/>
</svg>
    `.trim()
	}

	// Parse font from buffer using opentype.js
	// Note: Must convert Buffer to ArrayBuffer correctly - fontBuffer.buffer
	// returns the underlying ArrayBuffer which may have wrong offset/length
	// if the Buffer is a view. Create a proper ArrayBuffer from the Buffer data.
	const arrayBuffer = fontBuffer.buffer.slice(
		fontBuffer.byteOffset,
		fontBuffer.byteOffset + fontBuffer.byteLength,
	)
	const font = opentype.parse(arrayBuffer)

	// Create path from text at origin (0, 0)
	// opentype.js draws text with baseline at y=0, so we'll adjust later
	const path = font.getPath(text, 0, 0, fontSize)
	const bbox = path.getBoundingBox()

	// Calculate centering offsets
	// bbox gives us x1, y1, x2, y2 of the path bounding box
	const pathWidth = bbox.x2 - bbox.x1
	const pathHeight = bbox.y2 - bbox.y1

	// Center the path in the canvas
	const offsetX = (width - pathWidth) / 2 - bbox.x1
	const offsetY = (height - pathHeight) / 2 - bbox.y1

	// Get the SVG path data and apply transform for centering
	const pathData = path.toPathData(2) // 2 decimal places precision

	return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <path d="${pathData}" fill="${color}" transform="translate(${offsetX}, ${offsetY})"/>
</svg>
  `.trim()
}

/**
 * Generates foreground from a raster image file.
 *
 * Uses 'contain' fit mode to ensure the entire image is visible within the
 * target dimensions, letterboxing with transparency if aspect ratios differ.
 * This preserves the original image proportions without cropping.
 *
 * Supported formats: PNG, JPEG, WebP, TIFF, and other Sharp-compatible formats.
 * PNG source images with transparency will have their alpha channel preserved.
 */
async function generateImageForeground(
	imagePath: string,
	width: number,
	height: number,
): Promise<Buffer> {
	return sharp(imagePath)
		.resize(width, height, {
			fit: 'contain',
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		})
		.png()
		.toBuffer()
}
