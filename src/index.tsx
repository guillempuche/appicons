/**
 * Xiroi Asset Generator - Entry Point
 *
 * Launches the OpenTUI-based terminal user interface.
 * For CLI usage, use subcommands: xiroi-assets generate, validate, etc.
 */

import { ConsolePosition } from '@opentui/core'

/**
 * Reset terminal state to prevent escape sequence leaks.
 *
 * Sends:
 * - OSC 8 close: Terminates any open hyperlinks
 * - SGR reset: Clears text formatting (bold, color, underline)
 *
 * This prevents "sticky" terminal state when the app exits
 * (e.g., everything remaining underlined from an unclosed OSC 8 link).
 */
function resetTerminalState(): void {
	process.stdout.write('\x1b]8;;\x07') // Close any open OSC 8 hyperlink
	process.stdout.write('\x1b[0m') // Reset SGR attributes
}

/**
 * Launch the interactive OpenTUI interface.
 * Called by cli.ts when no subcommand is provided.
 */
export async function runInteractiveMenu(): Promise<void> {
	// Dynamic import to avoid loading OpenTUI in CLI-only mode
	const { createCliRenderer } = await import('@opentui/core')
	const { createRoot } = await import('@opentui/react')
	const { App } = await import('./components/app')

	try {
		const renderer = await createCliRenderer({
			consoleOptions: {
				position: ConsolePosition.BOTTOM,
				sizePercent: 20,
				maxStoredLogs: 100,
			},
			useConsole: true,
		})

		const root = createRoot(renderer)
		root.render(<App />)

		renderer.start()

		// Handle graceful shutdown
		const cleanup = () => {
			renderer.stop()
			root.unmount()
			renderer.destroy() // Restores terminal state, disables mouse tracking
			resetTerminalState()
		}

		process.on('SIGINT', () => {
			cleanup()
			process.exit(0)
		})

		process.on('SIGTERM', () => {
			cleanup()
			process.exit(0)
		})

		// Ensure terminal state is reset even on unexpected exits
		process.on('exit', resetTerminalState)
	} catch (error) {
		resetTerminalState()
		console.error('Failed to start OpenTUI:', error)
		console.error('\nNote: OpenTUI requires Bun runtime.')
		console.error('Use CLI mode instead: xiroi-assets generate --help')
		process.exit(1)
	}
}

// Auto-run when executed directly
runInteractiveMenu()
