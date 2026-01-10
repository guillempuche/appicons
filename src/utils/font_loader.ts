/**
 * Font loading utilities for Google Fonts and system fonts.
 *
 * This module provides functions to load fonts from various sources:
 * - Google Fonts: Downloaded on-demand via Google's CSS API.
 * - System fonts: Located in OS-specific font directories.
 * - Custom fonts: Loaded directly from user-specified paths.
 *
 * Font data is cached in memory to avoid repeated downloads/file reads.
 */

import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

// ─── Font Lists ────────────────────────────────────────────────────────────

/**
 * Popular Google Fonts that work well for app icons.
 * Curated for clarity at small sizes and visual impact.
 */
export const POPULAR_GOOGLE_FONTS = [
	'Roboto',
	'Open Sans',
	'Montserrat',
	'Poppins',
	'Inter',
	'Lato',
	'Raleway',
	'Playfair Display',
	'Bebas Neue',
	'Oswald',
]

/**
 * Xiroi brand fonts from the design system.
 * These fonts require manual installation.
 */
export const XIROI_FONTS = [
	'TT Satoshi',
	'TT Satoshi Medium',
	'TT Satoshi DemiBold',
]

// ─── Font Cache ────────────────────────────────────────────────────────────

/** In-memory cache for downloaded Google Fonts to avoid repeated downloads. */
const fontCache = new Map<string, Buffer>()

// ─── Google Fonts ──────────────────────────────────────────────────────────

/**
 * Load a Google Font by downloading it from Google Fonts API.
 *
 * Process:
 * 1. Fetch CSS from Google Fonts API (requesting TTF format)
 * 2. Parse CSS to extract font file URL
 * 3. Download the TTF file
 * 4. Cache and return the buffer
 *
 * Uses User-Agent header to request TTF format (Google Fonts serves
 * different formats based on browser detection).
 */
export async function loadGoogleFont(
	fontFamily: string,
): Promise<Buffer | null> {
	// Normalize to lowercase for cache lookup (Google Fonts API is case-insensitive)
	const cacheKey = fontFamily.toLowerCase()
	if (fontCache.has(cacheKey)) {
		return fontCache.get(cacheKey)!
	}

	try {
		// Use the font family as provided (Google Fonts API is case-insensitive)
		// The caller should normalize to proper casing if needed for display
		const encodedFamily = fontFamily.replace(/ /g, '+')
		const cssUrl = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@400&display=swap`

		// Fetch CSS with User-Agent that triggers TTF response
		const cssResponse = await fetch(cssUrl, {
			headers: {
				// Old Safari user-agent to get TTF instead of woff2
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.59.8',
			},
		})

		if (!cssResponse.ok) {
			console.error(`Failed to fetch Google Font CSS: ${cssResponse.status}`)
			return null
		}

		const css = await cssResponse.text()

		// Extract font URL from CSS (matches url(...) in src: declaration)
		const urlMatch = css.match(/src:\s*url\(([^)]+)\)/)
		if (!urlMatch || !urlMatch[1]) {
			console.error('Could not parse font URL from Google Fonts CSS')
			return null
		}

		const fontUrl = urlMatch[1]

		// Download the font file
		const fontResponse = await fetch(fontUrl)
		if (!fontResponse.ok) {
			console.error(`Failed to download font: ${fontResponse.status}`)
			return null
		}

		const fontBuffer = Buffer.from(await fontResponse.arrayBuffer())

		// Cache for future use
		fontCache.set(cacheKey, fontBuffer)

		return fontBuffer
	} catch (error) {
		console.error(`Error loading Google Font "${fontFamily}":`, error)
		return null
	}
}

// ─── System Fonts ──────────────────────────────────────────────────────────

/**
 * Load a system font by searching common OS font directories.
 *
 * Attempts to locate the font file in platform-specific directories.
 * Returns null if the font is not found in any search path.
 */
export async function loadSystemFont(
	fontFamily: string,
): Promise<Buffer | null> {
	const possiblePaths = getSystemFontPaths(fontFamily)

	for (const path of possiblePaths) {
		try {
			return await readFile(path)
		} catch {
			// Try next path
		}
	}

	return null
}

/**
 * Get possible system font paths based on the current platform.
 *
 * Generates a list of candidate paths for macOS, Linux, and Windows.
 * Font names are sanitized (spaces removed) to match common file naming.
 */
function getSystemFontPaths(fontFamily: string): string[] {
	const sanitized = fontFamily.replace(/ /g, '')
	const home = homedir()

	const paths: string[] = []

	// macOS
	paths.push(
		`/System/Library/Fonts/${sanitized}.ttf`,
		`/System/Library/Fonts/${sanitized}.ttc`,
		`/Library/Fonts/${sanitized}.ttf`,
		`/Library/Fonts/${sanitized}.ttc`,
		`${home}/Library/Fonts/${sanitized}.ttf`,
		`${home}/Library/Fonts/${sanitized}.ttc`,
	)

	// Linux
	paths.push(
		`/usr/share/fonts/truetype/${sanitized}.ttf`,
		`/usr/share/fonts/TTF/${sanitized}.ttf`,
		`/usr/local/share/fonts/${sanitized}.ttf`,
		`${home}/.fonts/${sanitized}.ttf`,
		`${home}/.local/share/fonts/${sanitized}.ttf`,
	)

	// Windows
	if (process.platform === 'win32') {
		paths.push(
			`C:\\Windows\\Fonts\\${sanitized}.ttf`,
			`C:\\Windows\\Fonts\\${sanitized}.ttc`,
		)
	}

	return paths
}

// ─── Font Choice Helpers ───────────────────────────────────────────────────

/**
 * Get popular Google Fonts formatted as select choices for CLI prompts.
 */
export function getGoogleFontChoices(): Array<{
	value: string
	label: string
}> {
	return POPULAR_GOOGLE_FONTS.map(font => ({
		value: font,
		label: font,
	}))
}

/**
 * Get Xiroi brand fonts as choices.
 */
export function getXiroiFontChoices(): Array<{
	value: string
	label: string
	hint?: string
}> {
	return [
		{ value: 'TT Satoshi', label: 'TT Satoshi', hint: 'Regular weight' },
		{
			value: 'TT Satoshi Medium',
			label: 'TT Satoshi Medium',
			hint: 'Medium weight',
		},
		{
			value: 'TT Satoshi DemiBold',
			label: 'TT Satoshi DemiBold',
			hint: 'Bold weight',
		},
	]
}
