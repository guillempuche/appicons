/**
 * Global test setup for Vitest.
 *
 * Provides mocks for external dependencies:
 * - sharp: Image processing library
 * - fetch: Network requests (Google Fonts API, GitHub API)
 * - fs: File system operations (for cache files)
 */

import { vi } from 'vitest'

// Mock sharp for image processing tests
vi.mock('sharp', () => {
	const mockSharpInstance = {
		resize: vi.fn().mockReturnThis(),
		png: vi.fn().mockReturnThis(),
		composite: vi.fn().mockReturnThis(),
		toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-png-data')),
	}

	const mockSharp = vi.fn((input?: Buffer | string | { create: object }) => {
		// Store input for test assertions
		;(mockSharp as any).lastInput = input
		return mockSharpInstance
	})

	// Expose the instance for test assertions
	;(mockSharp as any).mockInstance = mockSharpInstance

	return {
		default: mockSharp,
	}
})

// Mock opentype.js for font parsing tests
vi.mock('opentype.js', () => {
	const mockPath = {
		getBoundingBox: vi.fn().mockReturnValue({
			x1: 0,
			y1: -50,
			x2: 100,
			y2: 0,
		}),
		toPathData: vi.fn().mockReturnValue('M0 0 L100 0 L100 50 L0 50 Z'),
	}

	const mockFont = {
		getPath: vi.fn().mockReturnValue(mockPath),
	}

	return {
		default: {
			parse: vi.fn().mockReturnValue(mockFont),
		},
	}
})

// Helper to reset mocks between tests
export function resetMocks() {
	vi.clearAllMocks()
}

// Helper to create a mock fetch response
export function createMockFetchResponse(
	data: unknown,
	options?: { ok?: boolean; status?: number },
) {
	const { ok = true, status = 200 } = options || {}
	return {
		ok,
		status,
		statusText: ok ? 'OK' : 'Error',
		json: vi.fn().mockResolvedValue(data),
		text: vi.fn().mockResolvedValue(JSON.stringify(data)),
	}
}

// Helper to create a mock Google Fonts metadata response
export function createMockGoogleFontsMetadataResponse() {
	return {
		familyMetadataList: [
			{ family: 'Roboto', category: 'SANS_SERIF' },
			{ family: 'Open Sans', category: 'SANS_SERIF' },
			{ family: 'Inter', category: 'SANS_SERIF' },
			{ family: 'Playfair Display', category: 'SERIF' },
			{ family: 'Merriweather', category: 'SERIF' },
			{ family: 'Lora', category: 'SERIF' },
			{ family: 'Fira Code', category: 'MONOSPACE' },
			{ family: 'JetBrains Mono', category: 'MONOSPACE' },
			{ family: 'Pacifico', category: 'HANDWRITING' },
			{ family: 'Bebas Neue', category: 'DISPLAY' },
		],
	}
}

// Helper to create a mock Google Fonts API response (for google_fonts_api.ts)
export function createMockGoogleFontsApiResponse() {
	return {
		kind: 'webfonts#webfontList',
		items: [
			{
				family: 'Roboto',
				variants: ['regular', 'bold'],
				subsets: ['latin'],
				version: 'v30',
				lastModified: '2023-01-01',
				category: 'sans-serif',
			},
			{
				family: 'Open Sans',
				variants: ['regular', 'bold'],
				subsets: ['latin'],
				version: 'v35',
				lastModified: '2023-01-01',
				category: 'sans-serif',
			},
			{
				family: 'Inter',
				variants: ['regular', 'bold'],
				subsets: ['latin'],
				version: 'v12',
				lastModified: '2023-01-01',
				category: 'sans-serif',
			},
			{
				family: 'Playfair Display',
				variants: ['regular', 'bold'],
				subsets: ['latin'],
				version: 'v28',
				lastModified: '2023-01-01',
				category: 'serif',
			},
		],
	}
}

// Helper to create mock version check response
export function createMockGitHubReleaseResponse(version: string) {
	return {
		tag_name: `v${version}`,
		name: `Release ${version}`,
		html_url: `https://github.com/guillempuche/appicons/releases/tag/v${version}`,
	}
}
