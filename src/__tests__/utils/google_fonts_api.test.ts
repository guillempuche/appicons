/**
 * Tests for Google Fonts API integration.
 *
 * Tests Levenshtein distance calculation, font suggestions, and autocomplete.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockGoogleFontsApiResponse, resetMocks } from '../setup'

describe('GoogleFontsApi', () => {
	beforeEach(() => {
		resetMocks()
		vi.resetModules()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('fetchAllGoogleFonts', () => {
		it('should fetch fonts from Google Fonts API', async () => {
			// GIVEN a mock Google Fonts API response
			const mockResponse = createMockGoogleFontsApiResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN fetching all fonts
			const { fetchAllGoogleFonts } = await import(
				'../../utils/google_fonts_api'
			)
			const fonts = await fetchAllGoogleFonts()

			// THEN fonts should be fetched from webfonts API
			expect(mockFetch).toHaveBeenCalledWith(
				'https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity',
			)
			expect(fonts).toHaveLength(4)
			expect(fonts).toContain('Roboto')
		})

		it('should cache results for 24 hours', async () => {
			// GIVEN a mock Google Fonts API response
			const mockResponse = createMockGoogleFontsApiResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { fetchAllGoogleFonts } = await import(
				'../../utils/google_fonts_api'
			)

			// WHEN fetching fonts twice
			await fetchAllGoogleFonts()
			await fetchAllGoogleFonts()

			// THEN API should only be called once (cached)
			expect(mockFetch).toHaveBeenCalledTimes(1)
		})

		it('should return empty array on API error', async () => {
			// GIVEN a failing API response
			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 403,
				statusText: 'Forbidden',
			})
			vi.stubGlobal('fetch', mockFetch)
			vi.spyOn(console, 'error').mockImplementation(() => {})

			// WHEN fetching fonts
			const { fetchAllGoogleFonts } = await import(
				'../../utils/google_fonts_api'
			)
			const fonts = await fetchAllGoogleFonts()

			// THEN empty array should be returned
			expect(fonts).toEqual([])
		})

		it('should return empty array on network error', async () => {
			// GIVEN a network error
			const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
			vi.stubGlobal('fetch', mockFetch)
			vi.spyOn(console, 'error').mockImplementation(() => {})

			// WHEN fetching fonts
			const { fetchAllGoogleFonts } = await import(
				'../../utils/google_fonts_api'
			)
			const fonts = await fetchAllGoogleFonts()

			// THEN empty array should be returned
			expect(fonts).toEqual([])
		})

		it('should sort fonts alphabetically', async () => {
			// GIVEN fonts in non-alphabetical order
			const mockResponse = {
				kind: 'webfonts#webfontList',
				items: [
					{
						family: 'Zilla Slab',
						variants: [],
						subsets: [],
						version: 'v1',
						lastModified: '',
						category: 'serif',
					},
					{
						family: 'Abel',
						variants: [],
						subsets: [],
						version: 'v1',
						lastModified: '',
						category: 'sans-serif',
					},
					{
						family: 'Montserrat',
						variants: [],
						subsets: [],
						version: 'v1',
						lastModified: '',
						category: 'sans-serif',
					},
				],
			}
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN fetching fonts
			const { fetchAllGoogleFonts } = await import(
				'../../utils/google_fonts_api'
			)
			const fonts = await fetchAllGoogleFonts()

			// THEN fonts should be sorted alphabetically
			expect(fonts[0]).toBe('Abel')
			expect(fonts[1]).toBe('Montserrat')
			expect(fonts[2]).toBe('Zilla Slab')
		})
	})

	describe('isValidGoogleFont', () => {
		it('should return true for existing fonts', async () => {
			// GIVEN a mock Google Fonts API response
			const mockResponse = createMockGoogleFontsApiResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { isValidGoogleFont } = await import('../../utils/google_fonts_api')

			// WHEN checking existing font (case-insensitive)
			// THEN true should be returned
			expect(await isValidGoogleFont('Roboto')).toBe(true)
			expect(await isValidGoogleFont('roboto')).toBe(true)
			expect(await isValidGoogleFont('ROBOTO')).toBe(true)
		})

		it('should return false for non-existing fonts', async () => {
			// GIVEN a mock that returns 400 for non-existent fonts (CSS endpoint validation)
			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 400,
			})
			vi.stubGlobal('fetch', mockFetch)

			const { isValidGoogleFont } = await import('../../utils/google_fonts_api')

			// WHEN checking non-existent font
			// THEN false should be returned
			expect(await isValidGoogleFont('NonExistentFont')).toBe(false)
		})
	})

	describe('suggestSimilarFonts (Levenshtein distance)', () => {
		it('should suggest fonts for typos', async () => {
			// GIVEN a mock Google Fonts API response
			const mockResponse = createMockGoogleFontsApiResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN suggesting for exact font name
			const { suggestSimilarFonts } = await import(
				'../../utils/google_fonts_api'
			)
			const suggestions = await suggestSimilarFonts('Roboto')

			// THEN exact match should be included
			expect(suggestions).toContain('Roboto')
		})

		it('should find close matches for misspellings', async () => {
			// GIVEN a mock Google Fonts API response
			const mockResponse = createMockGoogleFontsApiResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN suggesting for misspelled font name
			const { suggestSimilarFonts } = await import(
				'../../utils/google_fonts_api'
			)
			const suggestions = await suggestSimilarFonts('Robota')

			// THEN correct font should be suggested
			expect(suggestions).toContain('Roboto')
		})

		it('should respect maxDistance parameter', async () => {
			// GIVEN a mock Google Fonts API response
			const mockResponse = createMockGoogleFontsApiResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { suggestSimilarFonts } = await import(
				'../../utils/google_fonts_api'
			)

			// WHEN using strict distance (0)
			const strictSuggestions = await suggestSimilarFonts('Roboto', 0)
			// THEN only exact match should be found
			expect(strictSuggestions).toContain('Roboto')

			// WHEN using looser distance (3)
			const looseSuggestions = await suggestSimilarFonts('Robota', 3)
			// THEN close matches should be found
			expect(looseSuggestions).toContain('Roboto')
		})

		it('should return top 5 suggestions sorted by distance', async () => {
			// GIVEN a mock Google Fonts API response
			const mockResponse = createMockGoogleFontsApiResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN suggesting for a font name
			const { suggestSimilarFonts } = await import(
				'../../utils/google_fonts_api'
			)
			const suggestions = await suggestSimilarFonts('Inter', 5)

			// THEN at most 5 results should be returned with exact match first
			expect(suggestions.length).toBeLessThanOrEqual(5)
			expect(suggestions[0]).toBe('Inter')
		})

		it('should return empty array for no close matches', async () => {
			// GIVEN a mock Google Fonts API response
			const mockResponse = createMockGoogleFontsApiResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN suggesting for unrelated string
			const { suggestSimilarFonts } = await import(
				'../../utils/google_fonts_api'
			)
			const suggestions = await suggestSimilarFonts('xyz123longstring', 2)

			// THEN empty array should be returned
			expect(suggestions).toEqual([])
		})
	})

	describe('autocompleteGoogleFonts', () => {
		it('should return fonts starting with prefix', async () => {
			// GIVEN a mock Google Fonts API response
			const mockResponse = createMockGoogleFontsApiResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN autocompleting with prefix
			const { autocompleteGoogleFonts } = await import(
				'../../utils/google_fonts_api'
			)
			const results = await autocompleteGoogleFonts('Ro')

			// THEN all results should start with prefix
			expect(results.every(f => f.toLowerCase().startsWith('ro'))).toBe(true)
			expect(results).toContain('Roboto')
		})

		it('should be case-insensitive', async () => {
			// GIVEN a mock Google Fonts API response
			const mockResponse = createMockGoogleFontsApiResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			const { autocompleteGoogleFonts } = await import(
				'../../utils/google_fonts_api'
			)

			// WHEN autocompleting with different cases
			const lower = await autocompleteGoogleFonts('ro')
			const upper = await autocompleteGoogleFonts('RO')

			// THEN same results should be returned
			expect(lower).toEqual(upper)
		})

		it('should respect limit parameter', async () => {
			// GIVEN a mock Google Fonts API response
			const mockResponse = createMockGoogleFontsApiResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN autocompleting with limit of 2
			const { autocompleteGoogleFonts } = await import(
				'../../utils/google_fonts_api'
			)
			const results = await autocompleteGoogleFonts('', 2)

			// THEN at most 2 results should be returned
			expect(results.length).toBeLessThanOrEqual(2)
		})

		it('should default to 20 results', async () => {
			// GIVEN response with 30 fonts
			const items = Array.from({ length: 30 }, (_, i) => ({
				family: `Font${String(i).padStart(2, '0')}`,
				variants: [],
				subsets: [],
				version: 'v1',
				lastModified: '',
				category: 'sans-serif',
			}))
			const mockResponse = { kind: 'webfonts#webfontList', items }
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN autocompleting without explicit limit
			const { autocompleteGoogleFonts } = await import(
				'../../utils/google_fonts_api'
			)
			const results = await autocompleteGoogleFonts('Font')

			// THEN at most 20 results should be returned
			expect(results.length).toBeLessThanOrEqual(20)
		})

		it('should return empty array for no matches', async () => {
			// GIVEN a mock Google Fonts API response
			const mockResponse = createMockGoogleFontsApiResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN autocompleting with unmatched prefix
			const { autocompleteGoogleFonts } = await import(
				'../../utils/google_fonts_api'
			)
			const results = await autocompleteGoogleFonts('xyz123')

			// THEN empty array should be returned
			expect(results).toEqual([])
		})
	})

	describe('Levenshtein distance algorithm verification', () => {
		it('should recognize identical strings (distance 0)', async () => {
			// GIVEN a mock Google Fonts API response
			const mockResponse = createMockGoogleFontsApiResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN searching for exact match with distance 0
			const { suggestSimilarFonts } = await import(
				'../../utils/google_fonts_api'
			)
			const suggestions = await suggestSimilarFonts('Roboto', 0)

			// THEN identical string should be found
			expect(suggestions).toContain('Roboto')
		})

		it('should detect single character substitution (distance 1)', async () => {
			// GIVEN a mock Google Fonts API response
			const mockResponse = createMockGoogleFontsApiResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN searching with 1 substitution ("Robota" -> "Roboto")
			const { suggestSimilarFonts } = await import(
				'../../utils/google_fonts_api'
			)
			const suggestions = await suggestSimilarFonts('Robota', 1)

			// THEN correct font should be found
			expect(suggestions).toContain('Roboto')
		})

		it('should detect single character insertion (distance 1)', async () => {
			// GIVEN a mock Google Fonts API response
			const mockResponse = createMockGoogleFontsApiResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN searching with 1 extra character ("Robotoo" -> "Roboto")
			const { suggestSimilarFonts } = await import(
				'../../utils/google_fonts_api'
			)
			const suggestions = await suggestSimilarFonts('Robotoo', 1)

			// THEN correct font should be found
			expect(suggestions).toContain('Roboto')
		})

		it('should detect single character deletion (distance 1)', async () => {
			// GIVEN a mock Google Fonts API response
			const mockResponse = createMockGoogleFontsApiResponse()
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN searching with 1 missing character ("Rooto" -> "Roboto")
			const { suggestSimilarFonts } = await import(
				'../../utils/google_fonts_api'
			)
			const suggestions = await suggestSimilarFonts('Rooto', 1)

			// THEN correct font should be found
			expect(suggestions).toContain('Roboto')
		})
	})
})
