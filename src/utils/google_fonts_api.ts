/**
 * Google Fonts API Integration
 *
 * Fetches the complete list of Google Fonts from the API for autocomplete
 * and validation purposes. Uses the public API endpoint without authentication.
 */

/**
 * Google Font item from API response.
 */
export interface GoogleFontItem {
	family: string
	variants: string[]
	subsets: string[]
	version: string
	lastModified: string
	category: string
}

/**
 * API response structure.
 */
interface GoogleFontsApiResponse {
	kind: string
	items: GoogleFontItem[]
}

/**
 * Cache for font list to avoid repeated API calls.
 */
let cachedFonts: string[] | null = null
let cacheTimestamp: number | null = null
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Fetch all Google Fonts from the public API.
 *
 * Uses a public endpoint that doesn't require authentication.
 * Results are cached for 24 hours to minimize API calls.
 *
 * @returns Array of font family names
 */
export async function fetchAllGoogleFonts(): Promise<string[]> {
	// Check cache
	if (
		cachedFonts &&
		cacheTimestamp &&
		Date.now() - cacheTimestamp < CACHE_DURATION
	) {
		return cachedFonts
	}

	try {
		// Use public Google Fonts API endpoint
		// Note: This endpoint is rate-limited but doesn't require authentication
		const response = await fetch(
			'https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity',
		)

		if (!response.ok) {
			// Fallback to empty array on API error
			console.error(
				`Google Fonts API error: ${response.status} ${response.statusText}`,
			)
			return []
		}

		const data = (await response.json()) as GoogleFontsApiResponse
		const fonts = data.items.map(item => item.family).sort()

		// Update cache
		cachedFonts = fonts
		cacheTimestamp = Date.now()

		return fonts
	} catch (error) {
		console.error('Failed to fetch Google Fonts:', error)
		return []
	}
}

/**
 * Find similar font names using Levenshtein distance.
 *
 * Suggests fonts that might match a typo or misspelling.
 *
 * @param input - The input font name (potentially misspelled)
 * @param maxDistance - Maximum edit distance to consider (default: 3)
 * @returns Array of suggested font names
 */
export async function suggestSimilarFonts(
	input: string,
	maxDistance: number = 3,
): Promise<string[]> {
	const allFonts = await fetchAllGoogleFonts()
	const inputLower = input.toLowerCase()

	// Calculate Levenshtein distance for each font
	const candidates: Array<{ font: string; distance: number }> = []

	for (const font of allFonts) {
		const distance = levenshteinDistance(inputLower, font.toLowerCase())
		if (distance <= maxDistance) {
			candidates.push({ font, distance })
		}
	}

	// Sort by distance (closest matches first)
	candidates.sort((a, b) => a.distance - b.distance)

	// Return top 5 suggestions
	return candidates.slice(0, 5).map(c => c.font)
}

/**
 * Check if a font exists in Google Fonts.
 *
 * @param fontName - Font family name to check
 * @returns true if font exists, false otherwise
 */
export async function isValidGoogleFont(fontName: string): Promise<boolean> {
	const allFonts = await fetchAllGoogleFonts()
	return allFonts.some(font => font.toLowerCase() === fontName.toLowerCase())
}

/**
 * Calculate Levenshtein distance between two strings.
 *
 * Measures the minimum number of single-character edits (insertions,
 * deletions, or substitutions) required to change one string into another.
 *
 * @param a - First string
 * @param b - Second string
 * @returns Edit distance
 */
function levenshteinDistance(a: string, b: string): number {
	const matrix: number[][] = []

	// Initialize matrix
	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i]
	}

	const firstRow = matrix[0]
	if (firstRow) {
		for (let j = 0; j <= a.length; j++) {
			firstRow[j] = j
		}
	}

	// Fill matrix
	for (let i = 1; i <= b.length; i++) {
		const currentRow = matrix[i]
		const prevRow = matrix[i - 1]
		if (!currentRow || !prevRow) continue

		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				currentRow[j] = prevRow[j - 1] ?? 0
			} else {
				currentRow[j] = Math.min(
					(prevRow[j - 1] ?? 0) + 1, // substitution
					(currentRow[j - 1] ?? 0) + 1, // insertion
					(prevRow[j] ?? 0) + 1, // deletion
				)
			}
		}
	}

	return matrix[b.length]?.[a.length] ?? 0
}

/**
 * Filter fonts by prefix for autocomplete.
 *
 * Returns fonts that start with the given prefix (case-insensitive).
 *
 * @param prefix - The prefix to match
 * @param limit - Maximum number of results (default: 20)
 * @returns Array of matching font names
 */
export async function autocompleteGoogleFonts(
	prefix: string,
	limit: number = 20,
): Promise<string[]> {
	const allFonts = await fetchAllGoogleFonts()
	const prefixLower = prefix.toLowerCase()

	return allFonts
		.filter(font => font.toLowerCase().startsWith(prefixLower))
		.slice(0, limit)
}
