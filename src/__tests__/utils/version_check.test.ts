/**
 * Tests for version checking utilities.
 *
 * Tests version comparison, cache lifecycle, and update detection.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockGitHubReleaseResponse, resetMocks } from '../setup'

// Hoisted mock functions that persist across module resets
const mockFs = vi.hoisted(() => ({
	existsSync: vi.fn().mockReturnValue(false),
	mkdirSync: vi.fn(),
	writeFileSync: vi.fn(),
	readFileSync: vi.fn().mockReturnValue('{}'),
}))

const mockOs = vi.hoisted(() => ({
	homedir: vi.fn().mockReturnValue('/mock/home'),
}))

// Mock node:fs module
vi.mock('node:fs', () => mockFs)

// Mock node:os module
vi.mock('node:os', () => mockOs)

describe('VersionCheck', () => {
	beforeEach(() => {
		resetMocks()
		vi.resetModules()
		// Re-set default mock implementations after clearAllMocks
		mockFs.existsSync.mockReturnValue(false)
		mockFs.readFileSync.mockReturnValue('{}')
		mockOs.homedir.mockReturnValue('/mock/home')
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('getCurrentVersion', () => {
		it('should return version from package.json', async () => {
			// WHEN getting current version
			const { getCurrentVersion } = await import('../../utils/version_check')
			const version = getCurrentVersion()

			// THEN version should be in calver format
			expect(version).toBeDefined()
			expect(typeof version).toBe('string')
			expect(version).toMatch(/^\d{4}\.\d+\.\d+$/)
		})
	})

	describe('getLatestVersion', () => {
		it('should fetch latest version from GitHub', async () => {
			// GIVEN a mock GitHub API response
			const mockResponse = createMockGitHubReleaseResponse('2026.1.10')
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN fetching latest version
			const { getLatestVersion } = await import('../../utils/version_check')
			const version = await getLatestVersion()

			// THEN version should be fetched from GitHub
			expect(mockFetch).toHaveBeenCalled()
			expect(version).toBe('2026.1.10')
		})

		it('should strip v prefix from tag name', async () => {
			// GIVEN a version with v prefix
			const mockResponse = { tag_name: 'v2026.1.10' }
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN fetching latest version
			const { getLatestVersion } = await import('../../utils/version_check')
			const version = await getLatestVersion()

			// THEN v prefix should be stripped
			expect(version).toBe('2026.1.10')
		})

		it('should return null on API error', async () => {
			// GIVEN a failing API response
			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN fetching latest version
			const { getLatestVersion } = await import('../../utils/version_check')
			const version = await getLatestVersion()

			// THEN null should be returned
			expect(version).toBeNull()
		})

		it('should return null on network error', async () => {
			// GIVEN a network error
			const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
			vi.stubGlobal('fetch', mockFetch)

			// WHEN fetching latest version
			const { getLatestVersion } = await import('../../utils/version_check')
			const version = await getLatestVersion()

			// THEN null should be returned
			expect(version).toBeNull()
		})

		it('should return null when tag_name is missing', async () => {
			// GIVEN a response without tag_name
			const mockResponse = { name: 'Release' }
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN fetching latest version
			const { getLatestVersion } = await import('../../utils/version_check')
			const version = await getLatestVersion()

			// THEN null should be returned
			expect(version).toBeNull()
		})
	})

	describe('checkForUpdates', () => {
		it('should return VersionInfo with outdated status', async () => {
			// GIVEN no cache exists
			mockFs.existsSync.mockReturnValue(false)

			// AND a newer version is available
			const mockResponse = createMockGitHubReleaseResponse('2099.1.0')
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN checking for updates
			const { checkForUpdates } = await import('../../utils/version_check')
			const info = await checkForUpdates()

			// THEN outdated status should be returned
			expect(info).not.toBeNull()
			expect(info?.isOutdated).toBe(true)
			expect(info?.latest).toBe('2099.1.0')
			expect(info?.releaseUrl).toContain('github.com')
		})

		it('should return not outdated when versions match', async () => {
			// GIVEN no cache exists
			mockFs.existsSync.mockReturnValue(false)

			// AND latest version matches current
			const { getCurrentVersion } = await import('../../utils/version_check')
			const currentVersion = getCurrentVersion()

			const mockResponse = createMockGitHubReleaseResponse(currentVersion)
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			vi.resetModules()

			// WHEN checking for updates
			const { checkForUpdates: checkForUpdates2 } = await import(
				'../../utils/version_check'
			)
			const info = await checkForUpdates2()

			// THEN not outdated status should be returned
			expect(info).not.toBeNull()
			expect(info?.isOutdated).toBe(false)
		})

		it('should use cached version if available and valid', async () => {
			// GIVEN valid cache exists
			const cachedData = JSON.stringify({
				latest: '2099.1.0',
				checkedAt: Date.now(),
			})
			mockFs.existsSync.mockReturnValue(true)
			mockFs.readFileSync.mockReturnValue(cachedData)

			const mockFetch = vi.fn()
			vi.stubGlobal('fetch', mockFetch)

			// WHEN checking for updates
			const { checkForUpdates } = await import('../../utils/version_check')
			const info = await checkForUpdates()

			// THEN cache should be used without network request
			expect(mockFetch).not.toHaveBeenCalled()
			expect(info?.latest).toBe('2099.1.0')
		})

		it('should fetch fresh when cache is expired', async () => {
			// GIVEN expired cache (25 hours old)
			const expiredData = JSON.stringify({
				latest: '2099.0.0',
				checkedAt: Date.now() - 25 * 60 * 60 * 1000,
			})
			mockFs.existsSync.mockReturnValue(true)
			mockFs.readFileSync.mockReturnValue(expiredData)

			const mockResponse = createMockGitHubReleaseResponse('2099.1.0')
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN checking for updates
			const { checkForUpdates } = await import('../../utils/version_check')
			const info = await checkForUpdates()

			// THEN fresh data should be fetched
			expect(mockFetch).toHaveBeenCalled()
			expect(info?.latest).toBe('2099.1.0')
		})

		it('should return null when fetch fails and no cache', async () => {
			// GIVEN no cache exists and network fails
			mockFs.existsSync.mockReturnValue(false)
			const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
			vi.stubGlobal('fetch', mockFetch)

			// WHEN checking for updates
			const { checkForUpdates } = await import('../../utils/version_check')
			const info = await checkForUpdates()

			// THEN null should be returned
			expect(info).toBeNull()
		})
	})

	describe('getCachedVersionInfo', () => {
		it('should return cached info without network request', async () => {
			// GIVEN valid cache exists
			const cachedData = JSON.stringify({
				latest: '2099.1.0',
				checkedAt: Date.now(),
			})
			mockFs.existsSync.mockReturnValue(true)
			mockFs.readFileSync.mockReturnValue(cachedData)

			const mockFetch = vi.fn()
			vi.stubGlobal('fetch', mockFetch)

			// WHEN getting cached version info
			const { getCachedVersionInfo } = await import('../../utils/version_check')
			const info = getCachedVersionInfo()

			// THEN cached info should be returned without network request
			expect(mockFetch).not.toHaveBeenCalled()
			expect(info?.latest).toBe('2099.1.0')
			expect(info?.isOutdated).toBe(true)
		})

		it('should return null when no cache exists', async () => {
			// GIVEN no cache exists
			mockFs.existsSync.mockReturnValue(false)

			// WHEN getting cached version info
			const { getCachedVersionInfo } = await import('../../utils/version_check')
			const info = getCachedVersionInfo()

			// THEN null should be returned
			expect(info).toBeNull()
		})

		it('should return null when cache is expired', async () => {
			// GIVEN expired cache
			const expiredData = JSON.stringify({
				latest: '2099.1.0',
				checkedAt: Date.now() - 25 * 60 * 60 * 1000,
			})
			mockFs.existsSync.mockReturnValue(true)
			mockFs.readFileSync.mockReturnValue(expiredData)

			// WHEN getting cached version info
			const { getCachedVersionInfo } = await import('../../utils/version_check')
			const info = getCachedVersionInfo()

			// THEN null should be returned
			expect(info).toBeNull()
		})
	})

	describe('isVersionOutdated (version comparison)', () => {
		it('should detect when current is behind latest (major)', async () => {
			// GIVEN no cache and a much newer version available
			mockFs.existsSync.mockReturnValue(false)

			const mockResponse = createMockGitHubReleaseResponse('2099.1.0')
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN checking for updates
			const { checkForUpdates } = await import('../../utils/version_check')
			const info = await checkForUpdates()

			// THEN should be detected as outdated
			expect(info?.isOutdated).toBe(true)
		})

		it('should handle calver format correctly', async () => {
			// GIVEN no cache and a slightly newer patch version
			mockFs.existsSync.mockReturnValue(false)

			const mockResponse = createMockGitHubReleaseResponse('2026.1.9')
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN checking for updates
			const { checkForUpdates } = await import('../../utils/version_check')
			const info = await checkForUpdates()

			// THEN calver comparison should detect as outdated
			expect(info?.isOutdated).toBe(true)
		})

		it('should not be outdated when current is ahead', async () => {
			// GIVEN no cache and an older version on GitHub
			mockFs.existsSync.mockReturnValue(false)

			const mockResponse = createMockGitHubReleaseResponse('2020.1.0')
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN checking for updates
			const { checkForUpdates } = await import('../../utils/version_check')
			const info = await checkForUpdates()

			// THEN should not be detected as outdated
			expect(info?.isOutdated).toBe(false)
		})
	})

	describe('cache file operations', () => {
		it('should create cache directory if not exists', async () => {
			// GIVEN cache directory doesn't exist
			mockFs.existsSync.mockReturnValue(false)

			const mockResponse = createMockGitHubReleaseResponse('2099.1.0')
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN checking for updates
			const { checkForUpdates } = await import('../../utils/version_check')
			await checkForUpdates()

			// THEN cache directory should be created
			expect(mockFs.mkdirSync).toHaveBeenCalledWith(
				expect.stringContaining('.appicons'),
				{ recursive: true },
			)
		})

		it('should write cache after successful fetch', async () => {
			// GIVEN no cache exists
			mockFs.existsSync.mockReturnValue(false)

			const mockResponse = createMockGitHubReleaseResponse('2099.1.0')
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(mockResponse),
			})
			vi.stubGlobal('fetch', mockFetch)

			// WHEN checking for updates
			const { checkForUpdates } = await import('../../utils/version_check')
			await checkForUpdates()

			// THEN version cache should be written
			expect(mockFs.writeFileSync).toHaveBeenCalledWith(
				expect.stringContaining('.version-cache.json'),
				expect.stringContaining('2099.1.0'),
			)
		})
	})

	describe('printUpdateNoticeIfCached', () => {
		it('should print update notice when outdated', async () => {
			// GIVEN valid cache with newer version
			const cachedData = JSON.stringify({
				latest: '2099.1.0',
				checkedAt: Date.now(),
			})
			mockFs.existsSync.mockReturnValue(true)
			mockFs.readFileSync.mockReturnValue(cachedData)
			const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

			// WHEN printing update notice
			const { printUpdateNoticeIfCached } = await import(
				'../../utils/version_check'
			)
			printUpdateNoticeIfCached()

			// THEN update notice should be printed
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Update available'),
			)
		})

		it('should not print when not outdated', async () => {
			// GIVEN cache with current version
			const { getCurrentVersion } = await import('../../utils/version_check')
			const currentVersion = getCurrentVersion()

			const cachedData = JSON.stringify({
				latest: currentVersion,
				checkedAt: Date.now(),
			})
			mockFs.existsSync.mockReturnValue(true)
			mockFs.readFileSync.mockReturnValue(cachedData)
			const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

			vi.resetModules()

			// WHEN printing update notice
			const { printUpdateNoticeIfCached: printUpdateNoticeIfCached2 } =
				await import('../../utils/version_check')
			printUpdateNoticeIfCached2()

			// THEN update notice should not be printed
			expect(consoleSpy).not.toHaveBeenCalledWith(
				expect.stringContaining('Update available'),
			)
		})
	})
})
