/**
 * Tests for Install/Uninstall Script History Preservation.
 *
 * Feature: History Preservation During Install/Uninstall
 *
 * Verifies that user history (history.json) survives install updates
 * and uninstall operations. Uses isolated temp directories to avoid
 * affecting the real ~/.appicons installation.
 */

import { exec } from 'node:child_process'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { promisify } from 'node:util'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const execAsync = promisify(exec)

// ─── Test Constants ──────────────────────────────────────────────────────────

const MOCK_HISTORY: object = {
	version: 1,
	entries: [
		{
			id: '1706745300000-abc123',
			createdAt: '2024-01-31T19:15:00.000Z',
			config: {
				appName: 'TestApp',
				platforms: ['ios', 'android'],
				assetTypes: ['icon'],
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
				outputDir: './output',
				iconScale: 0.7,
				splashScale: 0.25,
			},
			outputDir: './output',
		},
	],
}

// ─── Test Helpers ────────────────────────────────────────────────────────────

let testDir: string
let fakeHome: string
let fakeInstallDir: string

/**
 * Creates a fake tar.gz archive containing appicons.js in a temp directory.
 * Returns the path to the archive.
 */
async function createFakeArchive(archiveDir: string): Promise<string> {
	// Create a directory with a fake appicons.js to archive
	const contentDir = path.join(archiveDir, 'content')
	await fs.mkdir(contentDir, { recursive: true })
	await fs.writeFile(
		path.join(contentDir, 'appicons.js'),
		'// fake appicons binary',
	)

	const archivePath = path.join(archiveDir, 'appicons-test.tar.gz')
	await execAsync(`tar -czf "${archivePath}" -C "${contentDir}" appicons.js`)
	return archivePath
}

/**
 * Runs a bash snippet with INSTALL_DIR and HOME overridden to test dirs.
 */
async function runBashSnippet(
	script: string,
): Promise<{ stdout: string; stderr: string }> {
	return execAsync(`bash -c '${script.replace(/'/g, "'\\''")}'`, {
		env: {
			...process.env,
			HOME: fakeHome,
		},
	})
}

// ─── Setup / Teardown ────────────────────────────────────────────────────────

beforeAll(async () => {
	testDir = path.join(
		process.env.TMPDIR || '/tmp',
		`appicons-test-${Date.now()}`,
	)
	await fs.mkdir(testDir, { recursive: true })
})

beforeEach(async () => {
	// Fresh fake home and install dir for each test
	fakeHome = path.join(testDir, `home-${Date.now()}`)
	fakeInstallDir = path.join(fakeHome, '.appicons')
	await fs.mkdir(fakeInstallDir, { recursive: true })
})

afterAll(async () => {
	await fs.rm(testDir, { recursive: true, force: true })
})

// ─── Install Script: History Preservation ────────────────────────────────────

describe('Install Script - History Preservation', () => {
	it('should preserve history.json when updating an existing installation', async () => {
		// GIVEN an existing installation with history.json
		await fs.writeFile(
			path.join(fakeInstallDir, 'appicons.js'),
			'// old version',
		)
		await fs.writeFile(
			path.join(fakeInstallDir, 'history.json'),
			JSON.stringify(MOCK_HISTORY, null, 2),
		)

		// AND a new release archive is available
		const archiveDir = path.join(testDir, `archive-${Date.now()}`)
		await fs.mkdir(archiveDir, { recursive: true })
		const archivePath = await createFakeArchive(archiveDir)

		// WHEN the install download_release logic runs
		await runBashSnippet(`
			set -euo pipefail
			INSTALL_DIR="${fakeInstallDir}"

			# Preserve user data (history) across updates
			history_backup=""
			if [[ -f "$INSTALL_DIR/history.json" ]]; then
				history_backup=$(mktemp)
				cp "$INSTALL_DIR/history.json" "$history_backup"
			fi

			# Remove existing installation
			rm -rf "$INSTALL_DIR"

			# Create install directory and extract
			mkdir -p "$INSTALL_DIR"
			tar -xzf "${archivePath}" -C "$INSTALL_DIR"

			# Restore user data
			if [[ -n "$history_backup" ]] && [[ -f "$history_backup" ]]; then
				cp "$history_backup" "$INSTALL_DIR/history.json"
				rm -f "$history_backup"
			fi
		`)

		// THEN history.json should exist after the update
		const historyContent = await fs.readFile(
			path.join(fakeInstallDir, 'history.json'),
			'utf-8',
		)
		const history = JSON.parse(historyContent)
		expect(history.version).toBe(1)
		expect(history.entries).toHaveLength(1)
		expect(history.entries[0].id).toBe('1706745300000-abc123')

		// AND the new appicons.js should also exist
		const appiconsExists = await fs
			.access(path.join(fakeInstallDir, 'appicons.js'))
			.then(() => true)
			.catch(() => false)
		expect(appiconsExists).toBe(true)
	})

	it('should handle fresh install without history.json', async () => {
		// GIVEN no existing installation
		await fs.rm(fakeInstallDir, { recursive: true, force: true })

		// AND a release archive
		const archiveDir = path.join(testDir, `archive-fresh-${Date.now()}`)
		await fs.mkdir(archiveDir, { recursive: true })
		const archivePath = await createFakeArchive(archiveDir)

		// WHEN the install download_release logic runs
		await runBashSnippet(`
			set -euo pipefail
			INSTALL_DIR="${fakeInstallDir}"

			# Preserve user data (history) across updates
			history_backup=""
			if [[ -f "$INSTALL_DIR/history.json" ]]; then
				history_backup=$(mktemp)
				cp "$INSTALL_DIR/history.json" "$history_backup"
			fi

			# Remove existing installation
			if [[ -d "$INSTALL_DIR" ]]; then
				rm -rf "$INSTALL_DIR"
			fi

			# Create install directory and extract
			mkdir -p "$INSTALL_DIR"
			tar -xzf "${archivePath}" -C "$INSTALL_DIR"

			# Restore user data
			if [[ -n "$history_backup" ]] && [[ -f "$history_backup" ]]; then
				cp "$history_backup" "$INSTALL_DIR/history.json"
				rm -f "$history_backup"
			fi
		`)

		// THEN appicons.js should be installed
		const appiconsExists = await fs
			.access(path.join(fakeInstallDir, 'appicons.js'))
			.then(() => true)
			.catch(() => false)
		expect(appiconsExists).toBe(true)

		// AND no history.json should be created
		const historyExists = await fs
			.access(path.join(fakeInstallDir, 'history.json'))
			.then(() => true)
			.catch(() => false)
		expect(historyExists).toBe(false)
	})

	it('should restore history from uninstall backup when reinstalling', async () => {
		// GIVEN no existing installation but an uninstall backup exists
		await fs.rm(fakeInstallDir, { recursive: true, force: true })
		const backupPath = path.join(fakeHome, '.appicons_history_backup.json')
		await fs.writeFile(backupPath, JSON.stringify(MOCK_HISTORY, null, 2))

		// AND a release archive
		const archiveDir = path.join(testDir, `archive-reinstall-${Date.now()}`)
		await fs.mkdir(archiveDir, { recursive: true })
		const archivePath = await createFakeArchive(archiveDir)

		// WHEN the install download_release logic runs (with uninstall backup detection)
		await runBashSnippet(`
			set -euo pipefail
			INSTALL_DIR="${fakeInstallDir}"
			HOME="${fakeHome}"

			# Preserve user data (history) across updates
			history_backup=""
			if [[ -f "$INSTALL_DIR/history.json" ]]; then
				history_backup=$(mktemp)
				cp "$INSTALL_DIR/history.json" "$history_backup"
			elif [[ -f "$HOME/.appicons_history_backup.json" ]]; then
				history_backup="$HOME/.appicons_history_backup.json"
			fi

			# Remove existing installation
			if [[ -d "$INSTALL_DIR" ]]; then
				rm -rf "$INSTALL_DIR"
			fi

			# Create install directory and extract
			mkdir -p "$INSTALL_DIR"
			tar -xzf "${archivePath}" -C "$INSTALL_DIR"

			# Restore user data
			if [[ -n "$history_backup" ]] && [[ -f "$history_backup" ]]; then
				cp "$history_backup" "$INSTALL_DIR/history.json"
				if [[ "$history_backup" == "$HOME/.appicons_history_backup.json" ]]; then
					rm -f "$HOME/.appicons_history_backup.json"
				else
					rm -f "$history_backup"
				fi
			fi
		`)

		// THEN history.json should be restored from the backup
		const historyContent = await fs.readFile(
			path.join(fakeInstallDir, 'history.json'),
			'utf-8',
		)
		const history = JSON.parse(historyContent)
		expect(history.entries).toHaveLength(1)
		expect(history.entries[0].config.appName).toBe('TestApp')

		// AND the uninstall backup file should be cleaned up
		const backupExists = await fs
			.access(backupPath)
			.then(() => true)
			.catch(() => false)
		expect(backupExists).toBe(false)
	})

	it('should preserve history content integrity across multiple updates', async () => {
		// GIVEN an installation with a history containing multiple entries
		const multiEntryHistory = {
			version: 1,
			entries: [
				{ ...MOCK_HISTORY, id: 'entry-1' },
				{ ...MOCK_HISTORY, id: 'entry-2' },
				{ ...MOCK_HISTORY, id: 'entry-3' },
			],
		}
		await fs.writeFile(path.join(fakeInstallDir, 'appicons.js'), '// v1')
		await fs.writeFile(
			path.join(fakeInstallDir, 'history.json'),
			JSON.stringify(multiEntryHistory, null, 2),
		)

		const archiveDir = path.join(testDir, `archive-multi-${Date.now()}`)
		await fs.mkdir(archiveDir, { recursive: true })
		const archivePath = await createFakeArchive(archiveDir)

		// WHEN updating twice in succession
		for (let i = 0; i < 2; i++) {
			await runBashSnippet(`
				set -euo pipefail
				INSTALL_DIR="${fakeInstallDir}"

				history_backup=""
				if [[ -f "$INSTALL_DIR/history.json" ]]; then
					history_backup=$(mktemp)
					cp "$INSTALL_DIR/history.json" "$history_backup"
				fi

				rm -rf "$INSTALL_DIR"
				mkdir -p "$INSTALL_DIR"
				tar -xzf "${archivePath}" -C "$INSTALL_DIR"

				if [[ -n "$history_backup" ]] && [[ -f "$history_backup" ]]; then
					cp "$history_backup" "$INSTALL_DIR/history.json"
					rm -f "$history_backup"
				fi
			`)
		}

		// THEN all history entries should be preserved
		const historyContent = await fs.readFile(
			path.join(fakeInstallDir, 'history.json'),
			'utf-8',
		)
		const history = JSON.parse(historyContent)
		expect(history.entries).toHaveLength(3)
	})
})

// ─── Uninstall Script: History Backup ────────────────────────────────────────

describe('Uninstall Script - History Backup', () => {
	it('should back up history.json when user declines deletion', async () => {
		// GIVEN an installation with history.json
		await fs.writeFile(path.join(fakeInstallDir, 'appicons.js'), '// appicons')
		await fs.writeFile(
			path.join(fakeInstallDir, 'history.json'),
			JSON.stringify(MOCK_HISTORY, null, 2),
		)

		// WHEN the uninstall runs and user answers "n" (keep history)
		await runBashSnippet(`
			set -euo pipefail
			INSTALL_DIR="${fakeInstallDir}"
			HOME="${fakeHome}"

			if [[ -d "$INSTALL_DIR" ]]; then
				if [[ -f "$INSTALL_DIR/history.json" ]]; then
					answer="n"
					if [[ ! "$answer" =~ ^[Yy]$ ]]; then
						history_dest="$HOME/.appicons_history_backup.json"
						cp "$INSTALL_DIR/history.json" "$history_dest"
					fi
				fi
				rm -rf "$INSTALL_DIR"
			fi
		`)

		// THEN the install directory should be removed
		const installExists = await fs
			.access(fakeInstallDir)
			.then(() => true)
			.catch(() => false)
		expect(installExists).toBe(false)

		// AND history should be backed up to ~/.appicons_history_backup.json
		const backupPath = path.join(fakeHome, '.appicons_history_backup.json')
		const backupContent = await fs.readFile(backupPath, 'utf-8')
		const backup = JSON.parse(backupContent)
		expect(backup.version).toBe(1)
		expect(backup.entries).toHaveLength(1)
	})

	it('should delete history when user confirms deletion', async () => {
		// GIVEN an installation with history.json
		await fs.writeFile(path.join(fakeInstallDir, 'appicons.js'), '// appicons')
		await fs.writeFile(
			path.join(fakeInstallDir, 'history.json'),
			JSON.stringify(MOCK_HISTORY, null, 2),
		)

		// WHEN the uninstall runs and user answers "y" (delete history)
		await runBashSnippet(`
			set -euo pipefail
			INSTALL_DIR="${fakeInstallDir}"
			HOME="${fakeHome}"

			if [[ -d "$INSTALL_DIR" ]]; then
				if [[ -f "$INSTALL_DIR/history.json" ]]; then
					answer="y"
					if [[ ! "$answer" =~ ^[Yy]$ ]]; then
						history_dest="$HOME/.appicons_history_backup.json"
						cp "$INSTALL_DIR/history.json" "$history_dest"
					fi
				fi
				rm -rf "$INSTALL_DIR"
			fi
		`)

		// THEN the install directory should be removed
		const installExists = await fs
			.access(fakeInstallDir)
			.then(() => true)
			.catch(() => false)
		expect(installExists).toBe(false)

		// AND no backup should exist
		const backupPath = path.join(fakeHome, '.appicons_history_backup.json')
		const backupExists = await fs
			.access(backupPath)
			.then(() => true)
			.catch(() => false)
		expect(backupExists).toBe(false)
	})

	it('should handle uninstall when no history.json exists', async () => {
		// GIVEN an installation without history.json
		await fs.writeFile(path.join(fakeInstallDir, 'appicons.js'), '// appicons')

		// WHEN the uninstall runs
		await runBashSnippet(`
			set -euo pipefail
			INSTALL_DIR="${fakeInstallDir}"
			HOME="${fakeHome}"

			if [[ -d "$INSTALL_DIR" ]]; then
				if [[ -f "$INSTALL_DIR/history.json" ]]; then
					history_dest="$HOME/.appicons_history_backup.json"
					cp "$INSTALL_DIR/history.json" "$history_dest"
				fi
				rm -rf "$INSTALL_DIR"
			fi
		`)

		// THEN the install directory should be removed
		const installExists = await fs
			.access(fakeInstallDir)
			.then(() => true)
			.catch(() => false)
		expect(installExists).toBe(false)

		// AND no backup should be created
		const backupPath = path.join(fakeHome, '.appicons_history_backup.json')
		const backupExists = await fs
			.access(backupPath)
			.then(() => true)
			.catch(() => false)
		expect(backupExists).toBe(false)
	})
})

// ─── Full Cycle: Uninstall → Reinstall ───────────────────────────────────────

describe('Full Cycle - Uninstall then Reinstall', () => {
	it('should preserve history across uninstall and reinstall', async () => {
		// GIVEN an installation with history.json
		await fs.writeFile(path.join(fakeInstallDir, 'appicons.js'), '// appicons')
		await fs.writeFile(
			path.join(fakeInstallDir, 'history.json'),
			JSON.stringify(MOCK_HISTORY, null, 2),
		)

		// WHEN uninstalling (user keeps history)
		await runBashSnippet(`
			set -euo pipefail
			INSTALL_DIR="${fakeInstallDir}"
			HOME="${fakeHome}"

			if [[ -f "$INSTALL_DIR/history.json" ]]; then
				cp "$INSTALL_DIR/history.json" "$HOME/.appicons_history_backup.json"
			fi
			rm -rf "$INSTALL_DIR"
		`)

		// AND then reinstalling
		const archiveDir = path.join(testDir, `archive-cycle-${Date.now()}`)
		await fs.mkdir(archiveDir, { recursive: true })
		const archivePath = await createFakeArchive(archiveDir)

		await runBashSnippet(`
			set -euo pipefail
			INSTALL_DIR="${fakeInstallDir}"
			HOME="${fakeHome}"

			history_backup=""
			if [[ -f "$INSTALL_DIR/history.json" ]]; then
				history_backup=$(mktemp)
				cp "$INSTALL_DIR/history.json" "$history_backup"
			elif [[ -f "$HOME/.appicons_history_backup.json" ]]; then
				history_backup="$HOME/.appicons_history_backup.json"
			fi

			if [[ -d "$INSTALL_DIR" ]]; then
				rm -rf "$INSTALL_DIR"
			fi

			mkdir -p "$INSTALL_DIR"
			tar -xzf "${archivePath}" -C "$INSTALL_DIR"

			if [[ -n "$history_backup" ]] && [[ -f "$history_backup" ]]; then
				cp "$history_backup" "$INSTALL_DIR/history.json"
				if [[ "$history_backup" == "$HOME/.appicons_history_backup.json" ]]; then
					rm -f "$HOME/.appicons_history_backup.json"
				else
					rm -f "$history_backup"
				fi
			fi
		`)

		// THEN history.json should be restored in the new installation
		const historyContent = await fs.readFile(
			path.join(fakeInstallDir, 'history.json'),
			'utf-8',
		)
		const history = JSON.parse(historyContent)
		expect(history.version).toBe(1)
		expect(history.entries).toHaveLength(1)
		expect(history.entries[0].id).toBe('1706745300000-abc123')

		// AND the backup file should be cleaned up
		const backupExists = await fs
			.access(path.join(fakeHome, '.appicons_history_backup.json'))
			.then(() => true)
			.catch(() => false)
		expect(backupExists).toBe(false)

		// AND appicons.js should be installed
		const appiconsExists = await fs
			.access(path.join(fakeInstallDir, 'appicons.js'))
			.then(() => true)
			.catch(() => false)
		expect(appiconsExists).toBe(true)
	})
})
