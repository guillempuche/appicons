/**
 * Startup Screen Component
 *
 * Entry point for TUI when history exists. Shows:
 * - Option to create new configuration
 * - Recent history entries (up to 3)
 * - Option to browse all history
 *
 * First-time users (no history) skip this screen and go directly to config.
 */

import { useKeyboard } from '@opentui/react'
import { useEffect, useState } from 'react'

import type { HistoryEntry } from '../types'
import {
	formatHistoryDate,
	getEntrySummary,
	listHistory,
} from '../utils/history'

// ─── Theme Colors ──────────────────────────────────────────────────────────

const colors = {
	text: 'white',
	textMuted: 'gray',
	textDim: 'gray',
	accent: 'cyan',
	highlight: 'yellow',
} as const

// ─── Component Props ───────────────────────────────────────────────────────

interface StartupScreenProps {
	onNewConfig: () => void
	onSelectEntry: (entry: HistoryEntry) => void
	onBrowseHistory: () => void
}

// ─── Main Component ────────────────────────────────────────────────────────

/**
 * Startup screen showing quick access to recent configurations.
 */
export function StartupScreen({
	onNewConfig,
	onSelectEntry,
	onBrowseHistory,
}: StartupScreenProps) {
	const [recentEntries, setRecentEntries] = useState<HistoryEntry[]>([])
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [isLoading, setIsLoading] = useState(true)

	// Load recent history entries on mount
	useEffect(() => {
		async function loadRecentEntries() {
			setIsLoading(true)
			try {
				const entries = await listHistory(3)
				setRecentEntries(entries)
			} catch (error) {
				console.error('Failed to load history:', error)
			} finally {
				setIsLoading(false)
			}
		}
		loadRecentEntries()
	}, [])

	// Calculate total selectable items:
	// [N] New config + recent entries + [H] Browse history
	const totalItems = 1 + recentEntries.length + 1

	// Keyboard navigation
	useKeyboard(key => {
		if (key.name === 'up') {
			setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
		} else if (key.name === 'down' || key.name === 'tab') {
			setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev))
		} else if (key.name === 'return') {
			handleSelect()
		} else if (key.name === 'n') {
			onNewConfig()
		} else if (key.name === 'h') {
			onBrowseHistory()
		} else if (key.sequence >= '1' && key.sequence <= '3') {
			const entryIndex = parseInt(key.sequence, 10) - 1
			const entry = recentEntries[entryIndex]
			if (entry) {
				onSelectEntry(entry)
			}
		}
	})

	function handleSelect() {
		if (selectedIndex === 0) {
			onNewConfig()
		} else if (selectedIndex <= recentEntries.length) {
			const entry = recentEntries[selectedIndex - 1]
			if (entry) {
				onSelectEntry(entry)
			}
		} else {
			onBrowseHistory()
		}
	}

	// Format entry display text
	function formatEntry(entry: HistoryEntry, index: number): string {
		const date = formatHistoryDate(entry.createdAt)
		const summary = entry.name || getEntrySummary(entry)
		return `[${index + 1}] ${date} - ${summary}`
	}

	if (isLoading) {
		return (
			<box flexDirection='column' gap={1}>
				<text fg={colors.textMuted}>Loading history...</text>
			</box>
		)
	}

	return (
		<box flexDirection='column' gap={1}>
			{/* Title */}
			<text fg={colors.text}>QUICK START</text>
			<text fg={colors.textDim}>
				────────────────────────────────────────────
			</text>

			{/* New Configuration Option */}
			<box flexDirection='row' gap={1}>
				<text fg={selectedIndex === 0 ? colors.accent : colors.textMuted}>
					{selectedIndex === 0 ? '▶' : ' '}
				</text>
				<text fg={selectedIndex === 0 ? colors.text : colors.textMuted}>
					[N] New configuration
				</text>
			</box>

			{/* Recent Entries */}
			{recentEntries.length > 0 && (
				<>
					<box marginTop={1}>
						<text fg={colors.textDim}>Recent:</text>
					</box>
					{recentEntries.map((entry, index) => {
						const itemIndex = index + 1
						const isSelected = selectedIndex === itemIndex
						return (
							<box key={entry.id} flexDirection='row' gap={1}>
								<text fg={isSelected ? colors.accent : colors.textMuted}>
									{isSelected ? '▶' : ' '}
								</text>
								<text fg={isSelected ? colors.text : colors.textMuted}>
									{formatEntry(entry, index)}
								</text>
							</box>
						)
					})}
				</>
			)}

			{/* Browse History Option */}
			<box marginTop={1} flexDirection='row' gap={1}>
				<text
					fg={
						selectedIndex === totalItems - 1 ? colors.accent : colors.textMuted
					}
				>
					{selectedIndex === totalItems - 1 ? '▶' : ' '}
				</text>
				<text
					fg={selectedIndex === totalItems - 1 ? colors.text : colors.textMuted}
				>
					[H] Browse all history
				</text>
			</box>

			{/* Help Text */}
			<box marginTop={2}>
				<text fg={colors.textDim}>
					↑↓ Navigate • Enter Select • N/H/1-3 Quick select
				</text>
			</box>
		</box>
	)
}
