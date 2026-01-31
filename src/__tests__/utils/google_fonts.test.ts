/**
 * Tests for Google Fonts utilities.
 *
 * Tests font fetching, caching, search, and normalization functions.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockGoogleFontsMetadataResponse, resetMocks } from '../setup'

// We need to test internal module state, so we'll use dynamic imports
// to get fresh module state for each test group

describe('GoogleFonts', () => {
	beforeEach(() => {
		resetMocks()
		vi.resetModules()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('fetchGoogleFonts', () => {
		it('should fetch fonts from Google metadata endpoint', async () => {
			// GIVEN a mock Google Fonts API response
			const mockResponse = createMockGoogleFontsMetadataResponse()
			const jsonpResponse = `)]}'${JSON.stringify(mockResponse)}`
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(jsonpResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN fetching Google fonts
			const { fetchGoogleFonts } = await import('../../utils/google_fonts')
			const fonts = await fetchGoogleFonts()

			// THEN fonts should be fetched from metadata endpoint
			expect(mockFetch).toHaveBeenCalledWith(
				'https://fonts.google.com/metadata/fonts',
			)
			expect(fonts).toHaveLength(10)
			expect(fonts[0]).toHaveProperty('family')
			expect(fonts[0]).toHaveProperty('category')
		})

		it('should cache fonts after first fetch', async () => {
			// GIVEN a mock Google Fonts API response
			const mockResponse = createMockGoogleFontsMetadataResponse()
			const jsonpResponse = `)]}'${JSON.stringify(mockResponse)}`
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(jsonpResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { fetchGoogleFonts } = await import('../../utils/google_fonts')

			// WHEN fetching fonts twice
			await fetchGoogleFonts()
			await fetchGoogleFonts()

			// THEN API should only be called once (cached)
			expect(mockFetch).toHaveBeenCalledTimes(1)
		})

		it('should return fallback fonts on fetch failure', async () => {
			// GIVEN a failing API response
			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
			})
			vi.stubGlobal('fetch', mockFetch)
			vi.spyOn(console, 'error').mockImplementation(() => {})

			// WHEN fetching Google fonts
			const { fetchGoogleFonts } = await import('../../utils/google_fonts')
			const fonts = await fetchGoogleFonts()

			// THEN fallback fonts should be returned
			expect(fonts.length).toBeGreaterThan(0)
			expect(fonts.some(f => f.family === 'Roboto')).toBe(true)
		})

		it('should return fallback fonts on network error', async () => {
			// GIVEN a network error
			const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
			vi.stubGlobal('fetch', mockFetch)
			vi.spyOn(console, 'error').mockImplementation(() => {})

			// WHEN fetching Google fonts
			const { fetchGoogleFonts } = await import('../../utils/google_fonts')
			const fonts = await fetchGoogleFonts()

			// THEN fallback fonts should be returned
			expect(fonts.length).toBeGreaterThan(0)
		})

		it('should sort fonts alphabetically', async () => {
			// GIVEN fonts in non-alphabetical order
			const mockResponse = {
				familyMetadataList: [
					{ family: 'Zilla Slab', category: 'SERIF' },
					{ family: 'Abel', category: 'SANS_SERIF' },
					{ family: 'Montserrat', category: 'SANS_SERIF' },
				],
			}
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(`)]}'${JSON.stringify(mockResponse)}`),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN fetching Google fonts
			const { fetchGoogleFonts } = await import('../../utils/google_fonts')
			const fonts = await fetchGoogleFonts()

			// THEN fonts should be sorted alphabetically
			expect(fonts[0]?.family).toBe('Abel')
			expect(fonts[1]?.family).toBe('Montserrat')
			expect(fonts[2]?.family).toBe('Zilla Slab')
		})

		it('should normalize category to lowercase', async () => {
			// GIVEN fonts with uppercase categories
			const mockResponse = {
				familyMetadataList: [
					{ family: 'Roboto', category: 'SANS_SERIF' },
					{ family: 'Lora', category: 'SERIF' },
				],
			}
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(`)]}'${JSON.stringify(mockResponse)}`),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN fetching Google fonts
			const { fetchGoogleFonts } = await import('../../utils/google_fonts')
			const fonts = await fetchGoogleFonts()

			// THEN categories should be lowercase
			expect(fonts.find(f => f.family === 'Lora')?.category).toBe('serif')
			expect(fonts.find(f => f.family === 'Roboto')?.category).toBe(
				'sans_serif',
			)
		})
	})

	describe('getFontFamilies', () => {
		it('should return font family names as strings', async () => {
			// GIVEN fonts are fetched
			const mockResponse = createMockGoogleFontsMetadataResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(`)]}'${JSON.stringify(mockResponse)}`),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { fetchGoogleFonts, getFontFamilies } = await import(
				'../../utils/google_fonts'
			)
			await fetchGoogleFonts()

			// WHEN getting font families
			const families = getFontFamilies()

			// THEN array of string family names should be returned
			expect(Array.isArray(families)).toBe(true)
			expect(families.every(f => typeof f === 'string')).toBe(true)
			expect(families).toContain('Roboto')
		})

		it('should return fallback families when cache is empty', async () => {
			// GIVEN cache is empty (fresh module)
			const { getFontFamilies } = await import('../../utils/google_fonts')

			// WHEN getting font families
			const families = getFontFamilies()

			// THEN fallback families should be returned
			expect(families.length).toBeGreaterThan(0)
			expect(families).toContain('Roboto')
		})
	})

	describe('searchFonts', () => {
		it('should return matching fonts for partial query', async () => {
			// GIVEN fetched fonts
			const mockResponse = createMockGoogleFontsMetadataResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(`)]}'${JSON.stringify(mockResponse)}`),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { fetchGoogleFonts, searchFonts } = await import(
				'../../utils/google_fonts'
			)
			await fetchGoogleFonts()

			// WHEN searching with partial query
			const results = searchFonts('rob')

			// THEN matching fonts should be returned
			expect(results.some(f => f.family === 'Roboto')).toBe(true)
		})

		it('should be case-insensitive', async () => {
			// GIVEN fetched fonts
			const mockResponse = createMockGoogleFontsMetadataResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(`)]}'${JSON.stringify(mockResponse)}`),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { fetchGoogleFonts, searchFonts } = await import(
				'../../utils/google_fonts'
			)
			await fetchGoogleFonts()

			// WHEN searching with different cases
			const resultsLower = searchFonts('roboto')
			const resultsUpper = searchFonts('ROBOTO')
			const resultsMixed = searchFonts('RoBoTo')

			// THEN all searches should return same results
			expect(resultsLower).toEqual(resultsUpper)
			expect(resultsLower).toEqual(resultsMixed)
		})

		it('should respect limit parameter', async () => {
			// GIVEN fetched fonts
			const mockResponse = createMockGoogleFontsMetadataResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(`)]}'${JSON.stringify(mockResponse)}`),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { fetchGoogleFonts, searchFonts } = await import(
				'../../utils/google_fonts'
			)
			await fetchGoogleFonts()

			// WHEN searching with limit of 2
			const results = searchFonts('o', 2)

			// THEN at most 2 results should be returned
			expect(results.length).toBeLessThanOrEqual(2)
		})

		it('should return all matches when limit is 0', async () => {
			// GIVEN fetched fonts
			const mockResponse = createMockGoogleFontsMetadataResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(`)]}'${JSON.stringify(mockResponse)}`),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { fetchGoogleFonts, searchFonts } = await import(
				'../../utils/google_fonts'
			)
			await fetchGoogleFonts()

			// WHEN searching with limit of 0 (unlimited)
			const results = searchFonts('o', 0)

			// THEN all matches should be returned
			expect(results.length).toBeGreaterThan(2)
		})

		it('should return empty array for no matches', async () => {
			// GIVEN fetched fonts
			const mockResponse = createMockGoogleFontsMetadataResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(`)]}'${JSON.stringify(mockResponse)}`),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { fetchGoogleFonts, searchFonts } = await import(
				'../../utils/google_fonts'
			)
			await fetchGoogleFonts()

			// WHEN searching for non-existent font
			const results = searchFonts('xyz123nonexistent')

			// THEN empty array should be returned
			expect(results).toEqual([])
		})
	})

	describe('normalizeFontFamily', () => {
		it('should return correctly-cased font name', async () => {
			// GIVEN fetched fonts
			const mockResponse = createMockGoogleFontsMetadataResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(`)]}'${JSON.stringify(mockResponse)}`),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { fetchGoogleFonts, normalizeFontFamily } = await import(
				'../../utils/google_fonts'
			)
			await fetchGoogleFonts()

			// WHEN normalizing font family names
			// THEN correct casing should be returned
			expect(normalizeFontFamily('roboto')).toBe('Roboto')
			expect(normalizeFontFamily('ROBOTO')).toBe('Roboto')
			expect(normalizeFontFamily('playfair display')).toBe('Playfair Display')
		})

		it('should return original if font not found', async () => {
			// GIVEN fetched fonts
			const mockResponse = createMockGoogleFontsMetadataResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(`)]}'${JSON.stringify(mockResponse)}`),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { fetchGoogleFonts, normalizeFontFamily } = await import(
				'../../utils/google_fonts'
			)
			await fetchGoogleFonts()

			// WHEN normalizing non-existent font
			// THEN original input should be returned
			expect(normalizeFontFamily('NonExistentFont')).toBe('NonExistentFont')
		})
	})

	describe('fontExists', () => {
		it('should return true for existing fonts', async () => {
			// GIVEN fetched fonts
			const mockResponse = createMockGoogleFontsMetadataResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(`)]}'${JSON.stringify(mockResponse)}`),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { fetchGoogleFonts, fontExists } = await import(
				'../../utils/google_fonts'
			)
			await fetchGoogleFonts()

			// WHEN checking existing font (case-insensitive)
			// THEN true should be returned
			expect(fontExists('Roboto')).toBe(true)
			expect(fontExists('roboto')).toBe(true)
			expect(fontExists('ROBOTO')).toBe(true)
		})

		it('should return false for non-existing fonts', async () => {
			// GIVEN fetched fonts
			const mockResponse = createMockGoogleFontsMetadataResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(`)]}'${JSON.stringify(mockResponse)}`),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { fetchGoogleFonts, fontExists } = await import(
				'../../utils/google_fonts'
			)
			await fetchGoogleFonts()

			// WHEN checking non-existent font
			// THEN false should be returned
			expect(fontExists('NonExistentFont')).toBe(false)
		})
	})

	describe('getFontByFamily', () => {
		it('should return font object for valid family', async () => {
			// GIVEN fetched fonts
			const mockResponse = createMockGoogleFontsMetadataResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(`)]}'${JSON.stringify(mockResponse)}`),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { fetchGoogleFonts, getFontByFamily } = await import(
				'../../utils/google_fonts'
			)
			await fetchGoogleFonts()

			// WHEN getting font by family name
			const font = getFontByFamily('Roboto')

			// THEN font object with properties should be returned
			expect(font).toBeDefined()
			expect(font?.family).toBe('Roboto')
			expect(font?.category).toBe('sans_serif')
		})

		it('should return undefined for invalid family', async () => {
			// GIVEN fetched fonts
			const mockResponse = createMockGoogleFontsMetadataResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(`)]}'${JSON.stringify(mockResponse)}`),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { fetchGoogleFonts, getFontByFamily } = await import(
				'../../utils/google_fonts'
			)
			await fetchGoogleFonts()

			// WHEN getting non-existent font by family
			const font = getFontByFamily('NonExistentFont')

			// THEN undefined should be returned
			expect(font).toBeUndefined()
		})
	})

	describe('getFontsByCategory', () => {
		it('should return fonts filtered by category', async () => {
			// GIVEN fetched fonts
			const mockResponse = createMockGoogleFontsMetadataResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(`)]}'${JSON.stringify(mockResponse)}`),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { fetchGoogleFonts, getFontsByCategory } = await import(
				'../../utils/google_fonts'
			)
			await fetchGoogleFonts()

			// WHEN filtering by serif category
			const serifFonts = getFontsByCategory('serif')

			// THEN only serif fonts should be returned
			expect(serifFonts.every(f => f.category === 'serif')).toBe(true)
			expect(serifFonts.some(f => f.family === 'Lora')).toBe(true)
		})

		it('should be case-insensitive for category', async () => {
			// GIVEN fetched fonts
			const mockResponse = createMockGoogleFontsMetadataResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(`)]}'${JSON.stringify(mockResponse)}`),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { fetchGoogleFonts, getFontsByCategory } = await import(
				'../../utils/google_fonts'
			)
			await fetchGoogleFonts()

			// WHEN filtering with different case
			const lower = getFontsByCategory('serif')
			const upper = getFontsByCategory('SERIF')

			// THEN same results should be returned
			expect(lower).toEqual(upper)
		})
	})

	describe('getGoogleFontsUrl', () => {
		it('should generate specimen URL for valid font', async () => {
			// GIVEN fetched fonts
			const mockResponse = createMockGoogleFontsMetadataResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(`)]}'${JSON.stringify(mockResponse)}`),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { fetchGoogleFonts, getGoogleFontsUrl } = await import(
				'../../utils/google_fonts'
			)
			await fetchGoogleFonts()

			// WHEN generating URL for specific font
			const url = getGoogleFontsUrl('Roboto', 'Hello World')

			// THEN specimen URL with preview text should be returned
			expect(url).toContain('fonts.google.com/specimen/Roboto')
			expect(url).toContain('preview.text=Hello%20World')
		})

		it('should generate browse URL when font is null', async () => {
			// GIVEN no specific font
			const { getGoogleFontsUrl } = await import('../../utils/google_fonts')

			// WHEN generating URL with null font
			const url = getGoogleFontsUrl(null, 'Test')

			// THEN browse URL without specimen should be returned
			expect(url).toContain('fonts.google.com/?preview.text=')
			expect(url).not.toContain('specimen')
		})

		it('should URL-encode preview text', async () => {
			// GIVEN preview text with special characters
			const { getGoogleFontsUrl } = await import('../../utils/google_fonts')

			// WHEN generating URL
			const url = getGoogleFontsUrl(null, 'Hello & World!')

			// THEN special characters should be encoded
			expect(url).toContain(encodeURIComponent('Hello & World!'))
		})
	})
})
