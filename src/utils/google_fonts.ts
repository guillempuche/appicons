/**
 * Google Fonts Utilities
 *
 * Fetches the complete Google Fonts catalog (1,500+ fonts) from Google's
 * metadata endpoint. No API key required!
 *
 * The font list is cached in memory after first fetch for instant autocomplete.
 * Falls back to a curated list if the fetch fails.
 */

/**
 * Google Font definition with metadata.
 */
export interface GoogleFont {
	family: string
	category: string
}

/**
 * Cached font list (populated on first access).
 */
let cachedFonts: GoogleFont[] | null = null
let fetchPromise: Promise<GoogleFont[]> | null = null

/**
 * Fallback curated list of popular fonts (used if fetch fails).
 */
const FALLBACK_FONTS: GoogleFont[] = [
	{ family: 'Playfair Display', category: 'serif' },
	{ family: 'Merriweather', category: 'serif' },
	{ family: 'Lora', category: 'serif' },
	{ family: 'Roboto', category: 'sans-serif' },
	{ family: 'Open Sans', category: 'sans-serif' },
	{ family: 'Inter', category: 'sans-serif' },
	{ family: 'Montserrat', category: 'sans-serif' },
	{ family: 'Poppins', category: 'sans-serif' },
	{ family: 'Lato', category: 'sans-serif' },
	{ family: 'Bebas Neue', category: 'display' },
	{ family: 'Oswald', category: 'display' },
	{ family: 'Pacifico', category: 'handwriting' },
	{ family: 'Fira Code', category: 'monospace' },
	{ family: 'JetBrains Mono', category: 'monospace' },
]

/**
 * Fetch the complete Google Fonts catalog from Google's metadata endpoint.
 *
 * This endpoint provides all 1,500+ fonts without requiring an API key.
 * The response is cached for subsequent calls.
 *
 * @returns Array of all Google Fonts sorted alphabetically
 */
export async function fetchGoogleFonts(): Promise<GoogleFont[]> {
	// Return cached fonts if available
	if (cachedFonts) {
		return cachedFonts
	}

	// If a fetch is already in progress, wait for it
	if (fetchPromise) {
		return fetchPromise
	}

	// Start fetching
	fetchPromise = (async () => {
		try {
			const response = await fetch('https://fonts.google.com/metadata/fonts')

			if (!response.ok) {
				console.error(`Failed to fetch Google Fonts: ${response.status}`)
				return FALLBACK_FONTS
			}

			const text = await response.text()

			// The response starts with ")]}'" which needs to be stripped (JSONP protection)
			const jsonText = text.replace(/^\)\]\}'/, '').trim()
			const data = JSON.parse(jsonText)

			// Extract font families from the metadata
			// The structure is: { familyMetadataList: [{ family: "...", category: "..." }, ...] }
			const fonts: GoogleFont[] = data.familyMetadataList.map(
				(font: { family: string; category: string }) => ({
					family: font.family,
					category: font.category.toLowerCase(),
				}),
			)

			// Sort alphabetically
			fonts.sort((a, b) => a.family.localeCompare(b.family))

			// Cache for future use
			cachedFonts = fonts
			console.log(`Loaded ${fonts.length} Google Fonts`)

			return fonts
		} catch (error) {
			console.error('Error fetching Google Fonts:', error)
			return FALLBACK_FONTS
		} finally {
			fetchPromise = null
		}
	})()

	return fetchPromise
}

/**
 * Get all font families as a simple string array.
 *
 * This is synchronous and returns the cached list or fallback.
 * Call `fetchGoogleFonts()` first to populate the cache with all fonts.
 */
export function getFontFamilies(): string[] {
	if (cachedFonts) {
		return cachedFonts.map(font => font.family)
	}
	return FALLBACK_FONTS.map(font => font.family)
}

/**
 * Get all fonts (sync version using cache or fallback).
 */
export function getGoogleFonts(): GoogleFont[] {
	return cachedFonts || FALLBACK_FONTS
}

/**
 * Get font by family name.
 */
export function getFontByFamily(family: string): GoogleFont | undefined {
	const fonts = cachedFonts || FALLBACK_FONTS
	return fonts.find(font => font.family.toLowerCase() === family.toLowerCase())
}

/**
 * Get fonts by category.
 */
export function getFontsByCategory(category: string): GoogleFont[] {
	const fonts = cachedFonts || FALLBACK_FONTS
	return fonts.filter(font => font.category === category.toLowerCase())
}

/**
 * Search fonts by name (case-insensitive, partial match).
 *
 * @param query - Search query
 * @param limit - Maximum results (0 = unlimited)
 * @returns Matching fonts
 */
export function searchFonts(query: string, limit = 0): GoogleFont[] {
	const fonts = cachedFonts || FALLBACK_FONTS
	const queryLower = query.toLowerCase()

	const matches = fonts.filter(font =>
		font.family.toLowerCase().includes(queryLower),
	)

	if (limit > 0) {
		return matches.slice(0, limit)
	}
	return matches
}

/**
 * Initialize the font cache by fetching from Google.
 * Call this early in the app lifecycle for best UX.
 */
export async function initGoogleFonts(): Promise<void> {
	await fetchGoogleFonts()
}

/**
 * Normalize a font family name to its correct casing.
 *
 * Performs case-insensitive lookup and returns the properly-cased
 * font name from the Google Fonts catalog.
 *
 * @param fontFamily - User input (any casing)
 * @returns Correctly-cased font name, or original if not found
 */
export function normalizeFontFamily(fontFamily: string): string {
	const fonts = cachedFonts || FALLBACK_FONTS
	const lowerInput = fontFamily.toLowerCase()

	const match = fonts.find(f => f.family.toLowerCase() === lowerInput)
	return match ? match.family : fontFamily
}

/**
 * Check if a font family exists in the Google Fonts catalog.
 * Case-insensitive comparison.
 *
 * @param fontFamily - Font name to check
 * @returns True if font exists
 */
export function fontExists(fontFamily: string): boolean {
	const fonts = cachedFonts || FALLBACK_FONTS
	const lowerInput = fontFamily.toLowerCase()
	return fonts.some(f => f.family.toLowerCase() === lowerInput)
}

/**
 * Generate a Google Fonts preview URL.
 *
 * @param fontFamily - Font name (optional, for specimen page)
 * @param previewText - Text to preview
 * @returns Google Fonts URL with preview text
 */
export function getGoogleFontsUrl(
	fontFamily: string | null,
	previewText: string,
): string {
	const encodedText = encodeURIComponent(previewText)

	if (fontFamily && fontExists(fontFamily)) {
		// Specific font specimen page
		const normalizedFont = normalizeFontFamily(fontFamily)
		const encodedFont = normalizedFont.replace(/ /g, '+')
		return `https://fonts.google.com/specimen/${encodedFont}?preview.text=${encodedText}`
	}

	// Browse all fonts with preview text
	return `https://fonts.google.com/?preview.text=${encodedText}`
}
