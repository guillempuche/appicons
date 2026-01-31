/**
 * Main App Component
 *
 * Root component for the App Asset Generator TUI. This is the entry point
 * for the interactive terminal interface, managing navigation between
 * configuration and preview screens.
 *
 * Architecture:
 * - Form state is lifted to this level for session persistence.
 * - Configuration flows down to ConfigScreen.
 * - Generation results flow up from PreviewScreen.
 *
 * State persistence: When the user navigates back from preview, their
 * configuration is preserved, allowing iterative refinement.
 */

import { useState } from 'react'

import type { AssetGeneratorConfig, GenerationResult } from '../types'
import { type ConfigFormState, ConfigScreen } from './config_screen'
import { PreviewScreen } from './preview_screen'

// ─── Theme Colors ──────────────────────────────────────────────────────────
// Terminal-agnostic colors that work in both light and dark terminals.

const theme = {
	text: 'white',
	textMuted: 'gray',
	accent: 'cyan',
}

// ─── Types ─────────────────────────────────────────────────────────────────

type Screen = 'config' | 'preview'

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
	// Screen navigation state.
	const [screen, setScreen] = useState<Screen>('config')

	// Asset generation configuration and results.
	const [config, setConfig] = useState<AssetGeneratorConfig | null>(null)
	const [result, setResult] = useState<GenerationResult | null>(null)

	// Form state is lifted here for session persistence.
	// This survives back navigation, allowing users to refine settings.
	const [formState, setFormState] =
		useState<ConfigFormState>(DEFAULT_FORM_STATE)

	/** Handle configuration complete - navigate to preview screen. */
	const handleConfigComplete = async (newConfig: AssetGeneratorConfig) => {
		setConfig(newConfig)
		setScreen('preview')
	}

	/** Handle back navigation - return to config while preserving form state. */
	const handleBack = () => {
		setScreen('config')
		setResult(null)
	}

	/** Handle generation complete - store results for display. */
	const handleGenerationComplete = (generationResult: GenerationResult) => {
		setResult(generationResult)
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
				{screen === 'config' && (
					<ConfigScreen
						formState={formState}
						onFormStateChange={setFormState}
						onComplete={handleConfigComplete}
					/>
				)}

				{screen === 'preview' && config && (
					<PreviewScreen
						config={config}
						result={result}
						onBack={handleBack}
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
				<text fg={theme.textMuted}>
					{screen === 'config'
						? 'Up/Down Navigate | Left/Right Options | Esc Reset | Enter Generate | Ctrl+C Exit'
						: 'Esc Back | Ctrl+C Exit'}
				</text>
			</box>
		</box>
	)
}
