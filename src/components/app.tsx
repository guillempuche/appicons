/**
 * Main App Component
 *
 * Root component for the App Asset Generator TUI. This is the entry point
 * for the interactive terminal interface, managing navigation between
 * startup, config, history, and preview screens.
 *
 * Navigation flow:
 * - First-time users (no history): config → preview
 * - Returning users: startup → config/history → preview
 * - After generation: preview → startup (if history exists)
 *
 * State persistence: When the user navigates back from preview, their
 * configuration is preserved, allowing iterative refinement.
 */

import { useEffect, useState } from 'react'

import type {
	AssetGeneratorConfig,
	GenerationResult,
	HistoryEntry,
} from '../types'
import { hasHistory } from '../utils/history'
import { type ConfigFormState, ConfigScreen } from './config_screen'
import { HistoryScreen } from './history_screen'
import { PreviewScreen } from './preview_screen'
import { StartupScreen } from './startup_screen'

// ─── Theme Colors ──────────────────────────────────────────────────────────
// Terminal-agnostic colors that work in both light and dark terminals.

const theme = {
	text: 'white',
	textMuted: 'gray',
	accent: 'cyan',
}

// ─── Types ─────────────────────────────────────────────────────────────────

type Screen = 'loading' | 'startup' | 'config' | 'history' | 'preview'

// ─── Default State ─────────────────────────────────────────────────────────

/** Default form values for initial application state. */
const DEFAULT_FORM_STATE: ConfigFormState = {
	appName: 'MyApp',
	bgType: 0,
	bgColor: '#FFFFFF',
	fgType: 0,
	fgText: 'A',
	fgFont: 'Inter',
	fgColor: '#000000',
	iconScale: 0.7,
	splashScale: 0.25,
	outputPath: '',
}

// ─── Main Component ────────────────────────────────────────────────────────

/**
 * Main application component managing screen navigation and state.
 */
export function App() {
	// Screen navigation state - start with loading to check history
	const [screen, setScreen] = useState<Screen>('loading')

	// Track if user has any history (for navigation decisions)
	const [userHasHistory, setUserHasHistory] = useState(false)

	// Asset generation configuration and results.
	const [config, setConfig] = useState<AssetGeneratorConfig | null>(null)
	const [result, setResult] = useState<GenerationResult | null>(null)

	// Form state is lifted here for session persistence.
	// This survives back navigation, allowing users to refine settings.
	const [formState, setFormState] =
		useState<ConfigFormState>(DEFAULT_FORM_STATE)

	// Check for history on mount to determine initial screen
	useEffect(() => {
		async function checkHistoryAndNavigate() {
			const historyExists = await hasHistory()
			setUserHasHistory(historyExists)
			// First-time users go directly to config, returning users see startup
			setScreen(historyExists ? 'startup' : 'config')
		}
		checkHistoryAndNavigate()
	}, [])

	/** Handle starting a new configuration from startup screen. */
	const handleNewConfig = () => {
		setFormState(DEFAULT_FORM_STATE)
		setScreen('config')
	}

	/** Handle selecting a history entry - pre-fill config form. */
	const handleSelectHistoryEntry = (entry: HistoryEntry) => {
		// Convert HistoryEntry config back to form state
		const cfg = entry.config

		let bgType = 0
		let bgColor = '#FFFFFF'
		if (cfg.background.type === 'color' && cfg.background.color) {
			bgType = 0
			bgColor = cfg.background.color.color
		} else if (cfg.background.type === 'gradient') {
			bgType = 1
		} else if (cfg.background.type === 'image') {
			bgType = 2
		}

		let fgType = 0
		let fgText = 'A'
		let fgFont = 'Inter'
		let fgColor = '#000000'
		if (cfg.foreground.type === 'text') {
			fgType = 0
			fgText = cfg.foreground.text
			fgFont = cfg.foreground.fontFamily
			fgColor = cfg.foreground.color
		} else if (cfg.foreground.type === 'svg') {
			fgType = 1
			fgColor = cfg.foreground.color || '#000000'
		} else if (cfg.foreground.type === 'image') {
			fgType = 2
		}

		setFormState({
			appName: cfg.appName,
			bgType,
			bgColor,
			fgType,
			fgText,
			fgFont,
			fgColor,
			iconScale: cfg.iconScale ?? 0.7,
			splashScale: cfg.splashScale ?? 0.25,
			outputPath: '', // Don't reuse old output path
		})

		setScreen('config')
	}

	/** Handle browsing full history. */
	const handleBrowseHistory = () => {
		setScreen('history')
	}

	/** Handle configuration complete - navigate to preview screen. */
	const handleConfigComplete = async (newConfig: AssetGeneratorConfig) => {
		setConfig(newConfig)
		setScreen('preview')
	}

	/** Handle back navigation from config - return to startup if history exists. */
	const handleBackFromConfig = () => {
		if (userHasHistory) {
			setScreen('startup')
		}
		// If no history, stay on config (nowhere to go back to)
	}

	/** Handle back navigation from history - return to startup. */
	const handleBackFromHistory = () => {
		setScreen('startup')
	}

	/** Handle back navigation from preview - return to startup if history exists. */
	const handleBackFromPreview = async () => {
		// Refresh history status (generation may have created first entry)
		const historyExists = await hasHistory()
		setUserHasHistory(historyExists)
		setResult(null)
		// After generation, go to startup if history exists, otherwise config
		setScreen(historyExists ? 'startup' : 'config')
	}

	/** Handle generation complete - store results for display. */
	const handleGenerationComplete = (generationResult: GenerationResult) => {
		setResult(generationResult)
		// Mark that history now exists (we just added an entry)
		setUserHasHistory(true)
	}

	// Get footer text based on current screen
	const getFooterText = () => {
		switch (screen) {
			case 'startup':
				return '↑↓ Navigate | Enter Select | N New | H History | Ctrl+C Exit'
			case 'config':
				return userHasHistory
					? '↑↓ Navigate | ←→ Options | H History | Esc Back | Enter Generate | Ctrl+C Exit'
					: '↑↓ Navigate | ←→ Options | Esc Reset | Enter Generate | Ctrl+C Exit'
			case 'history':
				return '↑↓ Navigate | Enter Load | n Rename | d Delete | Esc Back | Ctrl+C Exit'
			case 'preview':
				return 'Esc Back | Ctrl+C Exit'
			default:
				return ''
		}
	}

	return (
		<box flexDirection='column' width='100%' height='100%'>
			{/* Header */}
			<box
				flexDirection='column'
				paddingLeft={2}
				paddingRight={2}
				paddingTop={1}
			>
				<text fg={theme.text}>APP ASSET GENERATOR</text>
				<text fg={theme.textMuted}>
					━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
				</text>
			</box>

			{/* Main content area */}
			<box
				flexGrow={1}
				paddingLeft={2}
				paddingRight={2}
				paddingTop={1}
				paddingBottom={1}
			>
				{screen === 'loading' && <text fg={theme.textMuted}>Loading...</text>}

				{screen === 'startup' && (
					<StartupScreen
						onNewConfig={handleNewConfig}
						onSelectEntry={handleSelectHistoryEntry}
						onBrowseHistory={handleBrowseHistory}
					/>
				)}

				{screen === 'config' && (
					<ConfigScreen
						formState={formState}
						onFormStateChange={setFormState}
						onComplete={handleConfigComplete}
						onBack={userHasHistory ? handleBackFromConfig : undefined}
						onHistory={userHasHistory ? handleBrowseHistory : undefined}
					/>
				)}

				{screen === 'history' && (
					<HistoryScreen
						onBack={handleBackFromHistory}
						onSelectEntry={handleSelectHistoryEntry}
					/>
				)}

				{screen === 'preview' && config && (
					<PreviewScreen
						config={config}
						result={result}
						onBack={handleBackFromPreview}
						onGenerationComplete={handleGenerationComplete}
					/>
				)}
			</box>

			{/* Footer */}
			<box
				flexDirection='column'
				paddingLeft={2}
				paddingRight={2}
				paddingBottom={1}
			>
				<text fg={theme.textMuted}>
					━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
				</text>
				<text fg={theme.textMuted}>{getFooterText()}</text>
			</box>
		</box>
	)
}
