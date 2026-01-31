/**
 * Tests for History Storage Module.
 *
 * Feature: History Storage
 *
 * Tests the persistent storage of generation configurations for reuse,
 * including pure utility functions and integration tests with the file system.
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type {
	AssetGeneratorConfig,
	HistoryEntry,
	HistoryFile,
} from '../../types'
import {
	deleteHistoryEntry,
	formatHistoryDate,
	getEntrySummary,
	getHistoryEntry,
	getHistoryPath,
	hasHistory,
	listHistory,
	loadHistory,
	renameHistoryEntry,
	saveToHistory,
} from '../../utils/history'

// ─── Test Fixtures ──────────────────────────────────────────────────────────

const createMockConfig = (
	overrides?: Partial<AssetGeneratorConfig>,
): AssetGeneratorConfig => ({
	appName: 'TestApp',
	platforms: ['ios', 'android'],
	assetTypes: ['icon', 'splash'],
	background: {
		type: 'color',
		color: { type: 'solid', color: '#FFFFFF' },
	},
	foreground: {
		type: 'text',
		text: 'T',
		fontFamily: 'Inter',
		color: '#000000',
		fontSource: 'google',
	},
	outputDir: './test-output',
	iconScale: 0.7,
	splashScale: 0.25,
	...overrides,
})

const createMockEntry = (overrides?: Partial<HistoryEntry>): HistoryEntry => ({
	id: 'test-id',
	createdAt: '2024-01-31T10:00:00.000Z',
	config: createMockConfig(),
	outputDir: './test-output',
	...overrides,
})

// ─── Path Helpers ───────────────────────────────────────────────────────────

describe('History Path Helpers', () => {
	it('should return path under home directory', () => {
		// GIVEN the history path function
		// WHEN getting the history path
		const historyPath = getHistoryPath()

		// THEN it should be under ~/.appicons/
		expect(historyPath).toContain('.appicons')
		expect(historyPath).toMatch(/history\.json$/)
	})
})

// ─── Display Helpers (Pure Functions) ───────────────────────────────────────

describe('Display Helpers', () => {
	describe('getEntrySummary', () => {
		it('should generate summary for text foreground', () => {
			// GIVEN an entry with text foreground
			const entry = createMockEntry()

			// WHEN getting summary
			const summary = getEntrySummary(entry)

			// THEN it includes platforms and text info
			expect(summary).toContain('ios,android')
			expect(summary).toContain('text "T"')
		})

		it('should generate summary for SVG foreground', () => {
			// GIVEN an entry with SVG foreground
			const entry = createMockEntry({
				config: createMockConfig({
					foreground: { type: 'svg', svgPath: '/path/to/logo.svg' },
				}),
			})

			// WHEN getting summary
			const summary = getEntrySummary(entry)

			// THEN it includes platforms and svg filename
			expect(summary).toContain('ios,android')
			expect(summary).toContain('svg logo.svg')
		})

		it('should generate summary for image foreground', () => {
			// GIVEN an entry with image foreground
			const entry = createMockEntry({
				config: createMockConfig({
					foreground: { type: 'image', imagePath: '/path/to/icon.png' },
				}),
			})

			// WHEN getting summary
			const summary = getEntrySummary(entry)

			// THEN it includes platforms and image filename
			expect(summary).toContain('ios,android')
			expect(summary).toContain('image icon.png')
		})
	})

	describe('formatHistoryDate', () => {
		it('should format ISO date to readable format', () => {
			// GIVEN an ISO date string
			const isoDate = '2024-01-31T19:15:00.000Z'

			// WHEN formatting
			const formatted = formatHistoryDate(isoDate)

			// THEN it returns readable format
			expect(formatted).toMatch(/Jan 31, \d{2}:\d{2}/)
		})

		it('should handle different months', () => {
			// GIVEN dates from different months
			const dates = [
				{ iso: '2024-06-15T10:00:00.000Z', expected: /Jun 15/ },
				{ iso: '2024-12-25T08:30:00.000Z', expected: /Dec 25/ },
			]

			dates.forEach(({ iso, expected }) => {
				const formatted = formatHistoryDate(iso)
				expect(formatted).toMatch(expected)
			})
		})
	})
})

// ─── Integration Tests with Real File System ────────────────────────────────

// Note: These tests modify the actual history file. Each test cleans up after itself.
describe('History File Operations', () => {
	let backupHistory: HistoryFile | null = null
	const historyPath = getHistoryPath()
	const historyDir = path.dirname(historyPath)

	// Backup existing history before tests
	beforeAll(async () => {
		try {
			const content = await fs.readFile(historyPath, 'utf-8')
			backupHistory = JSON.parse(content) as HistoryFile
		} catch {
			backupHistory = null
		}
	})

	// Ensure directory exists before each test
	beforeEach(async () => {
		await fs.mkdir(historyDir, { recursive: true })
	})

	// Restore history after all tests
	afterAll(async () => {
		await fs.mkdir(historyDir, { recursive: true })
		if (backupHistory) {
			await fs.writeFile(historyPath, JSON.stringify(backupHistory, null, 2))
		} else {
			// Remove history file if there wasn't one before
			try {
				await fs.unlink(historyPath)
			} catch {
				// Ignore if doesn't exist
			}
		}
	})

	describe('loadHistory', () => {
		it('should return history with version 1', async () => {
			// WHEN loading history
			const history = await loadHistory()

			// THEN it should have version 1
			expect(history.version).toBe(1)
			expect(Array.isArray(history.entries)).toBe(true)
		})
	})

	describe('saveToHistory', () => {
		it('should save entry and return it with ID and timestamp', async () => {
			// GIVEN a config
			const config = createMockConfig({ appName: 'IntegrationTestApp' })

			// WHEN saving to history
			const entry = await saveToHistory(config, './integration-test-output')

			// THEN the entry has required fields
			expect(entry.id).toBeTruthy()
			expect(entry.createdAt).toBeTruthy()
			expect(entry.config.appName).toBe('IntegrationTestApp')
			expect(entry.outputDir).toBe('./integration-test-output')

			// Clean up
			await deleteHistoryEntry(entry.id)
		})

		it('should save entry with optional name', async () => {
			// GIVEN a config and name
			const config = createMockConfig()

			// WHEN saving with a name
			const entry = await saveToHistory(config, './output', 'My Custom Name')

			// THEN the name is saved
			expect(entry.name).toBe('My Custom Name')

			// Clean up
			await deleteHistoryEntry(entry.id)
		})
	})

	describe('getHistoryEntry', () => {
		it('should return entry when ID exists', async () => {
			// GIVEN a saved entry
			const config = createMockConfig({ appName: 'GetEntryTest' })
			const saved = await saveToHistory(config, './output')

			// WHEN getting the entry by ID
			const entry = await getHistoryEntry(saved.id)

			// THEN the entry is returned
			expect(entry).toBeDefined()
			expect(entry?.id).toBe(saved.id)
			expect(entry?.config.appName).toBe('GetEntryTest')

			// Clean up
			await deleteHistoryEntry(saved.id)
		})

		it('should return undefined when ID does not exist', async () => {
			// WHEN getting a non-existent entry
			const entry = await getHistoryEntry('non-existent-id-12345')

			// THEN undefined is returned
			expect(entry).toBeUndefined()
		})
	})

	describe('listHistory', () => {
		it('should return entries newest first', async () => {
			// GIVEN two saved entries
			const first = await saveToHistory(
				createMockConfig({ appName: 'First' }),
				'./out',
			)
			// Small delay to ensure different timestamps
			await new Promise(resolve => setTimeout(resolve, 10))
			const second = await saveToHistory(
				createMockConfig({ appName: 'Second' }),
				'./out',
			)

			// WHEN listing history
			const entries = await listHistory()

			// THEN entries are returned with newest first
			const firstIndex = entries.findIndex(e => e.id === first.id)
			const secondIndex = entries.findIndex(e => e.id === second.id)
			expect(secondIndex).toBeLessThan(firstIndex)

			// Clean up
			await deleteHistoryEntry(first.id)
			await deleteHistoryEntry(second.id)
		})

		it('should respect the limit parameter', async () => {
			// GIVEN multiple saved entries
			const entries = []
			for (let i = 0; i < 5; i++) {
				entries.push(
					await saveToHistory(
						createMockConfig({ appName: `LimitTest${i}` }),
						'./out',
					),
				)
			}

			// WHEN listing with limit
			const limited = await listHistory(3)

			// THEN only the limited number is returned
			expect(limited.length).toBeLessThanOrEqual(3)

			// Clean up
			for (const entry of entries) {
				await deleteHistoryEntry(entry.id)
			}
		})
	})

	describe('deleteHistoryEntry', () => {
		it('should remove entry and return true when ID exists', async () => {
			// GIVEN a saved entry
			const saved = await saveToHistory(createMockConfig(), './output')

			// WHEN deleting the entry
			const result = await deleteHistoryEntry(saved.id)

			// THEN true is returned
			expect(result).toBe(true)

			// AND the entry no longer exists
			const entry = await getHistoryEntry(saved.id)
			expect(entry).toBeUndefined()
		})

		it('should return false when ID does not exist', async () => {
			// WHEN deleting a non-existent entry
			const result = await deleteHistoryEntry('non-existent-delete-id')

			// THEN false is returned
			expect(result).toBe(false)
		})
	})

	describe('renameHistoryEntry', () => {
		it('should update name and return true when ID exists', async () => {
			// GIVEN a saved entry
			const saved = await saveToHistory(createMockConfig(), './output')

			// WHEN renaming the entry
			const result = await renameHistoryEntry(saved.id, 'New Name')

			// THEN true is returned
			expect(result).toBe(true)

			// AND the name is updated
			const entry = await getHistoryEntry(saved.id)
			expect(entry?.name).toBe('New Name')

			// Clean up
			await deleteHistoryEntry(saved.id)
		})

		it('should clear name when undefined is passed', async () => {
			// GIVEN a saved entry with a name
			const saved = await saveToHistory(
				createMockConfig(),
				'./output',
				'Original Name',
			)

			// WHEN clearing the name
			const result = await renameHistoryEntry(saved.id, undefined)

			// THEN true is returned
			expect(result).toBe(true)

			// AND the name is cleared
			const entry = await getHistoryEntry(saved.id)
			expect(entry?.name).toBeUndefined()

			// Clean up
			await deleteHistoryEntry(saved.id)
		})

		it('should return false when ID does not exist', async () => {
			// WHEN renaming a non-existent entry
			const result = await renameHistoryEntry(
				'non-existent-rename-id',
				'New Name',
			)

			// THEN false is returned
			expect(result).toBe(false)
		})
	})

	describe('hasHistory', () => {
		it('should return true when history has entries', async () => {
			// GIVEN at least one entry in history
			const saved = await saveToHistory(createMockConfig(), './output')

			// WHEN checking for history
			const result = await hasHistory()

			// THEN true is returned
			expect(result).toBe(true)

			// Clean up
			await deleteHistoryEntry(saved.id)
		})
	})
})
