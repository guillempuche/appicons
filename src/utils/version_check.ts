/**
 * Version checking utilities for CLI update notifications.
 *
 * Provides non-blocking version checks against GitHub releases,
 * with 24-hour caching to minimize API calls.
 */

import { spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import packageJson from '../../package.json'

const GITHUB_REPO = 'guillempuche/appicons'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const NETWORK_TIMEOUT_MS = 3000

export interface VersionInfo {
	current: string
	latest: string
	isOutdated: boolean
	releaseUrl: string
}

interface VersionCache {
	latest: string
	checkedAt: number
}

/**
 * Get the cache directory path (~/.appicons/).
 */
function getCacheDir(): string {
	return path.join(os.homedir(), '.appicons')
}

/**
 * Get the cache file path (~/.appicons/.version-cache.json).
 */
function getCacheFilePath(): string {
	return path.join(getCacheDir(), '.version-cache.json')
}

/**
 * Ensure the cache directory exists.
 */
function ensureCacheDir(): void {
	const cacheDir = getCacheDir()
	if (!fs.existsSync(cacheDir)) {
		fs.mkdirSync(cacheDir, { recursive: true })
	}
}

/**
 * Read cached version info if valid (within TTL).
 */
function readCache(): VersionCache | null {
	try {
		const cacheFile = getCacheFilePath()
		if (!fs.existsSync(cacheFile)) {
			return null
		}

		const data = fs.readFileSync(cacheFile, 'utf-8')
		const cache: VersionCache = JSON.parse(data)

		// Check if cache is still valid
		const now = Date.now()
		if (now - cache.checkedAt > CACHE_TTL_MS) {
			return null
		}

		return cache
	} catch {
		return null
	}
}

/**
 * Write version info to cache.
 */
function writeCache(latest: string): void {
	try {
		ensureCacheDir()
		const cache: VersionCache = {
			latest,
			checkedAt: Date.now(),
		}
		fs.writeFileSync(getCacheFilePath(), JSON.stringify(cache, null, 2))
	} catch {
		// Silently fail - cache is optional
	}
}

/**
 * Fetch the latest version from GitHub releases.
 * Returns null on any error (network, timeout, rate limit).
 */
export async function getLatestVersion(): Promise<string | null> {
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS)

	try {
		const response = await fetch(
			`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
			{
				headers: {
					Accept: 'application/vnd.github.v3+json',
					'User-Agent': 'appicons-cli',
				},
				signal: controller.signal,
			},
		)

		clearTimeout(timeoutId)

		if (!response.ok) {
			return null
		}

		const data = (await response.json()) as { tag_name?: string }
		const tagName = data.tag_name

		if (!tagName) {
			return null
		}

		// Remove 'v' prefix if present (e.g., 'v2026.1.6' -> '2026.1.6')
		return tagName.replace(/^v/, '')
	} catch {
		clearTimeout(timeoutId)
		return null
	}
}

/**
 * Get current version from package.json.
 */
export function getCurrentVersion(): string {
	return packageJson.version
}

/**
 * Check for updates (uses cache if available).
 * Returns null if check fails or is unavailable.
 */
export async function checkForUpdates(): Promise<VersionInfo | null> {
	const current = getCurrentVersion()

	// Try cache first
	const cached = readCache()
	if (cached) {
		return {
			current,
			latest: cached.latest,
			isOutdated: isVersionOutdated(current, cached.latest),
			releaseUrl: `https://github.com/${GITHUB_REPO}/releases/latest`,
		}
	}

	// Fetch fresh version
	const latest = await getLatestVersion()
	if (!latest) {
		return null
	}

	// Update cache
	writeCache(latest)

	return {
		current,
		latest,
		isOutdated: isVersionOutdated(current, latest),
		releaseUrl: `https://github.com/${GITHUB_REPO}/releases/latest`,
	}
}

/**
 * Check for updates bypassing cache (always fetches from GitHub).
 * Use this for explicit update commands where fresh data is needed.
 * Returns null if check fails or is unavailable.
 */
export async function checkForUpdatesNoCache(): Promise<VersionInfo | null> {
	const current = getCurrentVersion()

	// Always fetch fresh version
	const latest = await getLatestVersion()
	if (!latest) {
		return null
	}

	// Update cache with fresh data
	writeCache(latest)

	return {
		current,
		latest,
		isOutdated: isVersionOutdated(current, latest),
		releaseUrl: `https://github.com/${GITHUB_REPO}/releases/latest`,
	}
}

/**
 * Read version info from cache only (no network).
 * Used for non-blocking update notice display.
 */
export function getCachedVersionInfo(): VersionInfo | null {
	const current = getCurrentVersion()
	const cached = readCache()

	if (!cached) {
		return null
	}

	return {
		current,
		latest: cached.latest,
		isOutdated: isVersionOutdated(current, cached.latest),
		releaseUrl: `https://github.com/${GITHUB_REPO}/releases/latest`,
	}
}

/**
 * Compare versions to determine if current is outdated.
 * Handles calver format (YYYY.M.patch) and semver.
 */
function isVersionOutdated(current: string, latest: string): boolean {
	if (current === latest) {
		return false
	}

	const currentParts = current.split('.').map(Number)
	const latestParts = latest.split('.').map(Number)

	for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
		const curr = currentParts[i] || 0
		const lat = latestParts[i] || 0

		if (lat > curr) {
			return true
		}
		if (curr > lat) {
			return false
		}
	}

	return false
}

/**
 * Schedule a background version check (updates cache for next run).
 * This is truly non-blocking and doesn't affect current command execution.
 */
export function scheduleBackgroundVersionCheck(): void {
	// Use setImmediate to defer the check to after the current event loop
	setImmediate(async () => {
		try {
			const latest = await getLatestVersion()
			if (latest) {
				writeCache(latest)
			}
		} catch {
			// Silently ignore errors
		}
	})
}

/**
 * Print update notice if cached version shows outdated.
 * Only reads from cache (instant, no network).
 */
export function printUpdateNoticeIfCached(): void {
	const info = getCachedVersionInfo()

	if (info?.isOutdated) {
		console.log()
		console.log(`Update available: ${info.current} -> ${info.latest}`)
		console.log(`Run 'appicons update' to upgrade`)
	}
}

/**
 * Run the appropriate install script for the current platform.
 * Returns a promise that resolves when the update completes.
 */
export function runUpdateScript(): Promise<void> {
	return new Promise((resolve, reject) => {
		const isWindows = process.platform === 'win32'

		if (isWindows) {
			// PowerShell: irm ... | iex
			const child = spawn(
				'powershell',
				[
					'-Command',
					`irm https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/install.ps1 | iex`,
				],
				{ stdio: 'inherit' },
			)

			child.on('close', code => {
				if (code === 0) {
					resolve()
				} else {
					reject(new Error(`Update failed with exit code ${code}`))
				}
			})

			child.on('error', reject)
		} else {
			// Bash: curl ... | bash
			const child = spawn(
				'bash',
				[
					'-c',
					`curl -fsSL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/install.sh | bash`,
				],
				{ stdio: 'inherit' },
			)

			child.on('close', code => {
				if (code === 0) {
					resolve()
				} else {
					reject(new Error(`Update failed with exit code ${code}`))
				}
			})

			child.on('error', reject)
		}
	})
}
