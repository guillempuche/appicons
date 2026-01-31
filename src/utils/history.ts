/**
 * History Storage Module
 *
 * Manages persistent storage of generation configurations for reuse.
 * History is stored at ~/.appicons/history.json with a maximum of 50 entries.
 *
 * Features:
 * - Auto-save after successful generation
 * - Load and reuse previous configurations
 * - Rename entries for easy identification
 * - Delete unwanted entries
 * - Graceful handling of corrupted files
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

import type { AssetGeneratorConfig, HistoryEntry, HistoryFile } from '../types'

// ─── Constants ──────────────────────────────────────────────────────────────

/** Maximum number of history entries to store. */
const MAX_HISTORY_ENTRIES = 50

/** Current history file schema version. */
const HISTORY_VERSION = 1

// ─── Path Helpers ───────────────────────────────────────────────────────────

/**
 * Get the path to the history file.
 *
 * @returns Path to ~/.appicons/history.json
 */
export function getHistoryPath(): string {
	return join(homedir(), '.appicons', 'history.json')
}

/**
 * Get the directory containing the history file.
 *
 * @returns Path to ~/.appicons/
 */
export function getHistoryDir(): string {
	return dirname(getHistoryPath())
}

// ─── File Operations ────────────────────────────────────────────────────────

/**
 * Load history from disk.
 *
 * Returns empty history if:
 * - File doesn't exist (first run)
 * - File is corrupted (backs up corrupted file)
 * - File has invalid schema
 *
 * @returns Promise resolving to HistoryFile
 */
export async function loadHistory(): Promise<HistoryFile> {
	const historyPath = getHistoryPath()

	try {
		const content = await readFile(historyPath, 'utf-8')
		const parsed = JSON.parse(content)

		// Validate schema
		if (
			typeof parsed !== 'object' ||
			parsed === null ||
			typeof parsed.version !== 'number' ||
			!Array.isArray(parsed.entries)
		) {
			console.warn('History file has invalid schema, creating backup')
			await backupCorruptedFile(historyPath)
			return createEmptyHistory()
		}

		return parsed as HistoryFile
	} catch (error) {
		// File doesn't exist or can't be read
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			return createEmptyHistory()
		}

		// JSON parse error - corrupted file
		if (error instanceof SyntaxError) {
			console.warn('History file corrupted, creating backup')
			await backupCorruptedFile(historyPath)
			return createEmptyHistory()
		}

		// Other errors - return empty history
		console.warn('Failed to load history:', error)
		return createEmptyHistory()
	}
}

/**
 * Save history to disk.
 *
 * Creates the ~/.appicons directory if it doesn't exist.
 *
 * @param history - HistoryFile to save
 */
async function saveHistory(history: HistoryFile): Promise<void> {
	const historyPath = getHistoryPath()
	const historyDir = getHistoryDir()

	// Ensure directory exists
	await mkdir(historyDir, { recursive: true })

	// Write atomically by writing to temp file first
	const tempPath = `${historyPath}.tmp`
	await writeFile(tempPath, JSON.stringify(history, null, 2))
	await rename(tempPath, historyPath)
}

/**
 * Create an empty history file.
 *
 * @returns Empty HistoryFile with current version
 */
function createEmptyHistory(): HistoryFile {
	return {
		version: HISTORY_VERSION,
		entries: [],
	}
}

/**
 * Backup a corrupted history file.
 *
 * Renames the file with a .corrupted.{timestamp} suffix.
 *
 * @param historyPath - Path to the corrupted file
 */
async function backupCorruptedFile(historyPath: string): Promise<void> {
	try {
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
		const backupPath = `${historyPath}.corrupted.${timestamp}`
		await rename(historyPath, backupPath)
	} catch {
		// Ignore backup failures
	}
}

// ─── Entry Operations ───────────────────────────────────────────────────────

/**
 * Generate a unique ID for a history entry.
 *
 * Uses timestamp with random suffix for uniqueness.
 *
 * @returns Unique identifier string
 */
function generateEntryId(): string {
	const timestamp = Date.now()
	const random = Math.random().toString(36).substring(2, 8)
	return `${timestamp}-${random}`
}

/**
 * Save a config to history after successful generation.
 *
 * Adds entry at the beginning of the list and trims to MAX_HISTORY_ENTRIES.
 *
 * @param config - The AssetGeneratorConfig that was used
 * @param outputDir - The output directory where assets were generated
 * @param name - Optional user-provided name for the entry
 * @returns Promise resolving to the created HistoryEntry
 */
export async function saveToHistory(
	config: AssetGeneratorConfig,
	outputDir: string,
	name?: string,
): Promise<HistoryEntry> {
	const history = await loadHistory()

	const entry: HistoryEntry = {
		id: generateEntryId(),
		createdAt: new Date().toISOString(),
		config,
		outputDir,
	}

	// Only set name if provided
	if (name !== undefined) {
		entry.name = name
	}

	// Add to beginning (newest first)
	history.entries.unshift(entry)

	// Trim to max entries
	if (history.entries.length > MAX_HISTORY_ENTRIES) {
		history.entries = history.entries.slice(0, MAX_HISTORY_ENTRIES)
	}

	await saveHistory(history)

	return entry
}

/**
 * Get a history entry by ID.
 *
 * @param id - The entry ID to find
 * @returns Promise resolving to HistoryEntry or undefined if not found
 */
export async function getHistoryEntry(
	id: string,
): Promise<HistoryEntry | undefined> {
	const history = await loadHistory()
	return history.entries.find(entry => entry.id === id)
}

/**
 * List history entries with optional limit.
 *
 * @param limit - Maximum number of entries to return (default: all)
 * @returns Promise resolving to array of HistoryEntry
 */
export async function listHistory(limit?: number): Promise<HistoryEntry[]> {
	const history = await loadHistory()

	if (limit !== undefined && limit > 0) {
		return history.entries.slice(0, limit)
	}

	return history.entries
}

/**
 * Delete a history entry by ID.
 *
 * @param id - The entry ID to delete
 * @returns Promise resolving to true if deleted, false if not found
 */
export async function deleteHistoryEntry(id: string): Promise<boolean> {
	const history = await loadHistory()
	const originalLength = history.entries.length

	history.entries = history.entries.filter(entry => entry.id !== id)

	if (history.entries.length < originalLength) {
		await saveHistory(history)
		return true
	}

	return false
}

/**
 * Rename a history entry.
 *
 * @param id - The entry ID to rename
 * @param name - The new name (or undefined to clear)
 * @returns Promise resolving to true if renamed, false if not found
 */
export async function renameHistoryEntry(
	id: string,
	name: string | undefined,
): Promise<boolean> {
	const history = await loadHistory()
	const entry = history.entries.find(e => e.id === id)

	if (!entry) {
		return false
	}

	if (name === undefined) {
		delete entry.name
	} else {
		entry.name = name
	}
	await saveHistory(history)
	return true
}

// ─── Display Helpers ────────────────────────────────────────────────────────

/**
 * Generate a summary string for a history entry.
 *
 * Format: "[platforms] [fg-type] [identifier]"
 * Example: "ios,android text 'A'" or "web svg icon.svg"
 *
 * @param entry - The history entry
 * @returns Human-readable summary string
 */
export function getEntrySummary(entry: HistoryEntry): string {
	const platforms = entry.config.platforms.join(',')
	const fg = entry.config.foreground

	let fgSummary: string
	if (fg.type === 'text') {
		fgSummary = `text "${fg.text}"`
	} else if (fg.type === 'svg') {
		const filename = fg.svgPath.split('/').pop() || 'svg'
		fgSummary = `svg ${filename}`
	} else {
		const filename = fg.imagePath.split('/').pop() || 'image'
		fgSummary = `image ${filename}`
	}

	return `${platforms} ${fgSummary}`
}

/**
 * Format a date for display in the TUI/CLI.
 *
 * @param isoDate - ISO 8601 date string
 * @returns Formatted date string like "Jan 31, 19:15"
 */
export function formatHistoryDate(isoDate: string): string {
	const date = new Date(isoDate)
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	]

	const month = months[date.getMonth()]
	const day = date.getDate()
	const hours = date.getHours().toString().padStart(2, '0')
	const minutes = date.getMinutes().toString().padStart(2, '0')

	return `${month} ${day}, ${hours}:${minutes}`
}

/**
 * Check if history has any entries.
 *
 * @returns Promise resolving to true if history has entries
 */
export async function hasHistory(): Promise<boolean> {
	const history = await loadHistory()
	return history.entries.length > 0
}
