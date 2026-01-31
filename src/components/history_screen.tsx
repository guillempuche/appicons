/**
 * History Screen Component
 *
 * Full history browser for viewing, loading, renaming, and deleting entries.
 * Provides a scrollable list of all history entries (up to 50 max).
 *
 * Keyboard shortcuts:
 * - ↑↓ Navigate entries
 * - Enter: Load selected entry into config screen
 * - n: Rename selected entry (opens inline editor)
 * - d: Delete selected entry (with confirmation)
 * - Esc: Back to previous screen
 */

import { useKeyboard } from '@opentui/react'
import { useCallback, useEffect, useState } from 'react'

import type { HistoryEntry } from '../types'
import {
	deleteHistoryEntry,
	formatHistoryDate,
	getEntrySummary,
	listHistory,
	renameHistoryEntry,
} from '../utils/history'

// ─── Theme Colors ──────────────────────────────────────────────────────────

const colors = {
	text: 'white',
	textMuted: 'gray',
	textDim: 'gray',
	accent: 'cyan',
	warning: 'yellow',
	danger: 'red',
} as const

// ─── Types ─────────────────────────────────────────────────────────────────

type Mode = 'browse' | 'rename' | 'delete-confirm'

// ─── Component Props ───────────────────────────────────────────────────────

interface HistoryScreenProps {
	onBack: () => void
	onSelectEntry: (entry: HistoryEntry) => void
}

// ─── Main Component ────────────────────────────────────────────────────────

/**
 * Full history browser screen.
 */
export function HistoryScreen({ onBack, onSelectEntry }: HistoryScreenProps) {
	const [entries, setEntries] = useState<HistoryEntry[]>([])
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [isLoading, setIsLoading] = useState(true)
	const [mode, setMode] = useState<Mode>('browse')
	const [renameValue, setRenameValue] = useState('')
	const [terminalHeight, setTerminalHeight] = useState(
		process.stdout.rows || 24,
	)

	// Calculate visible rows (account for header, footer, help text)
	const visibleRows = Math.max(5, terminalHeight - 12)

	// Calculate scroll offset for viewport
	const scrollOffset = Math.max(
		0,
		Math.min(
			selectedIndex - Math.floor(visibleRows / 2),
			entries.length - visibleRows,
		),
	)

	// Define loadEntries before the useEffect that uses it
	const loadEntries = useCallback(async () => {
		setIsLoading(true)
		try {
			const loaded = await listHistory()
			setEntries(loaded)
			// Reset selection if it's out of bounds
			if (selectedIndex >= loaded.length) {
				setSelectedIndex(Math.max(0, loaded.length - 1))
			}
		} catch (error) {
			console.error('Failed to load history:', error)
		} finally {
			setIsLoading(false)
		}
	}, [selectedIndex])

	// Load history entries on mount
	useEffect(() => {
		loadEntries()
	}, [loadEntries])

	// Listen for terminal resize
	useEffect(() => {
		const handleResize = () => {
			setTerminalHeight(process.stdout.rows || 24)
		}
		process.stdout.on('resize', handleResize)
		return () => {
			process.stdout.off('resize', handleResize)
		}
	}, [])

	// Handle rename submission
	const handleRenameSubmit = useCallback(async () => {
		const entry = entries[selectedIndex]
		if (!entry) return

		const newName = renameValue.trim() || undefined
		const success = await renameHistoryEntry(entry.id, newName)

		if (success) {
			await loadEntries()
		}

		setMode('browse')
		setRenameValue('')
	}, [entries, selectedIndex, renameValue, loadEntries])

	// Handle delete confirmation
	const handleDeleteConfirm = useCallback(async () => {
		const entry = entries[selectedIndex]
		if (!entry) return

		const success = await deleteHistoryEntry(entry.id)

		if (success) {
			await loadEntries()
		}

		setMode('browse')
	}, [entries, selectedIndex, loadEntries])

	// Keyboard handler
	useKeyboard(key => {
		// Handle mode-specific keys first
		if (mode === 'rename') {
			if (key.name === 'return') {
				handleRenameSubmit()
			} else if (key.name === 'escape') {
				setMode('browse')
				setRenameValue('')
			}
			return
		}

		if (mode === 'delete-confirm') {
			if (key.name === 'y' || key.name === 'return') {
				handleDeleteConfirm()
			} else if (key.name === 'n' || key.name === 'escape') {
				setMode('browse')
			}
			return
		}

		// Browse mode navigation
		if (key.name === 'up') {
			setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
		} else if (key.name === 'down' || key.name === 'tab') {
			setSelectedIndex(prev => (prev < entries.length - 1 ? prev + 1 : prev))
		} else if (key.name === 'return') {
			const entry = entries[selectedIndex]
			if (entry) {
				onSelectEntry(entry)
			}
		} else if (key.name === 'escape' || key.name === 'backspace') {
			onBack()
		} else if (key.sequence === 'n') {
			// Start rename mode
			const entry = entries[selectedIndex]
			if (entry) {
				setRenameValue(entry.name || '')
				setMode('rename')
			}
		} else if (key.sequence === 'd') {
			// Start delete confirmation
			if (entries[selectedIndex]) {
				setMode('delete-confirm')
			}
		}
	})

	// Format entry display
	function formatEntry(entry: HistoryEntry): {
		date: string
		platforms: string
		fgType: string
		name: string
	} {
		const date = formatHistoryDate(entry.createdAt)
		const platforms = entry.config.platforms.join(',')

		let fgType: string
		const fg = entry.config.foreground
		if (fg.type === 'text') {
			fgType = `text "${fg.text}"`
		} else if (fg.type === 'svg') {
			fgType = 'svg'
		} else {
			fgType = 'image'
		}

		const name = entry.name || getEntrySummary(entry)

		return { date, platforms, fgType, name }
	}

	if (isLoading) {
		return (
			<box flexDirection='column' gap={1}>
				<text fg={colors.textMuted}>Loading history...</text>
			</box>
		)
	}

	if (entries.length === 0) {
		return (
			<box flexDirection='column' gap={1}>
				<text fg={colors.text}>HISTORY</text>
				<text fg={colors.textDim}>
					────────────────────────────────────────────
				</text>
				<text fg={colors.textMuted}>No history entries yet.</text>
				<text fg={colors.textMuted}>
					Generate assets to create your first entry.
				</text>
				<box marginTop={2}>
					<text fg={colors.textDim}>[Esc] Back</text>
				</box>
			</box>
		)
	}

	// Get visible entries for current viewport
	const visibleEntries = entries.slice(scrollOffset, scrollOffset + visibleRows)

	return (
		<box flexDirection='column' gap={0}>
			{/* Header */}
			<box flexDirection='row' justifyContent='space-between'>
				<text fg={colors.text}>HISTORY ({entries.length} entries)</text>
				<text fg={colors.textDim}>[Esc] Back</text>
			</box>
			<text fg={colors.textDim}>
				────────────────────────────────────────────
			</text>

			{/* Entry List */}
			<box flexDirection='column' marginTop={1} gap={0}>
				{visibleEntries.map((entry, visibleIndex) => {
					const actualIndex = scrollOffset + visibleIndex
					const isSelected = actualIndex === selectedIndex
					const { date, platforms, fgType, name } = formatEntry(entry)

					return (
						<box key={entry.id} flexDirection='row' gap={1}>
							<text fg={isSelected ? colors.accent : colors.textMuted}>
								{isSelected ? '▶' : ' '}
							</text>
							<text fg={isSelected ? colors.text : colors.textMuted}>
								{date}
							</text>
							<text fg={isSelected ? colors.accent : colors.textDim}>
								{platforms.padEnd(12)}
							</text>
							<text fg={isSelected ? colors.text : colors.textDim}>
								{fgType.padEnd(12)}
							</text>
							<text fg={isSelected ? colors.warning : colors.textDim}>
								{entry.name ? `"${name}"` : ''}
							</text>
						</box>
					)
				})}

				{/* Scroll indicator */}
				{entries.length > visibleRows && (
					<text fg={colors.textDim}>
						{'  '}... showing {scrollOffset + 1}-
						{Math.min(scrollOffset + visibleRows, entries.length)} of{' '}
						{entries.length}
					</text>
				)}
			</box>

			{/* Mode-specific UI */}
			<box marginTop={2}>
				{mode === 'rename' && (
					<box flexDirection='column' gap={1}>
						<text fg={colors.accent}>Rename entry:</text>
						<box flexDirection='row' gap={1}>
							<text fg={colors.textDim}>[</text>
							<input
								focused={true}
								value={renameValue}
								onInput={setRenameValue}
								width={30}
								textColor={colors.text}
								cursorColor={colors.accent}
							/>
							<text fg={colors.textDim}>]</text>
						</box>
						<text fg={colors.textDim}>
							Enter: Save • Esc: Cancel • Leave empty to clear name
						</text>
					</box>
				)}

				{mode === 'delete-confirm' && entries[selectedIndex] && (
					<box flexDirection='column' gap={1}>
						<text fg={colors.danger}>Delete this entry?</text>
						<text fg={colors.textMuted}>
							{formatEntry(entries[selectedIndex]).name}
						</text>
						<text fg={colors.textDim}>Y: Delete • N/Esc: Cancel</text>
					</box>
				)}

				{mode === 'browse' && (
					<text fg={colors.textDim}>
						[Enter] Load • [n] Rename • [d] Delete • [Esc] Back
					</text>
				)}
			</box>
		</box>
	)
}
