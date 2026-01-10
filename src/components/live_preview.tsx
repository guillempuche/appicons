/**
 * Live Preview Component
 *
 * Displays real-time preview of generated assets as user configures options
 * in the configuration screen. Shows two previews side-by-side at different
 * sizes to help users understand how their icon will appear:
 * - Large (256px): Detail view for design refinement.
 * - Small (64px): How the icon looks at typical app icon sizes.
 *
 * Features:
 * - Debounced updates (300ms) to avoid excessive regeneration.
 * - Race condition protection via generation ID tracking.
 * - Loading and error states for feedback during generation.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import {
	generatePreviewIcon,
	PREVIEW_SIZES,
} from '../generators/asset_generator'
import type { BackgroundConfig, ForegroundConfig } from '../types'
import { ImagePreview } from './image_preview'

// ─── Theme Colors ──────────────────────────────────────────────────────────

const colors = {
	text: 'white',
	textMuted: 'gray',
	textDim: 'gray',
} as const

// ─── Component Props ───────────────────────────────────────────────────────

interface LivePreviewProps {
	background: BackgroundConfig
	foreground: ForegroundConfig
	iconScale?: number
}

// ─── Layout Constants ──────────────────────────────────────────────────────

/**
 * Terminal cells have ~2:1 aspect ratio (taller than wide).
 * To display a visually square box, width should be ~2x height.
 */
const TERMINAL_ASPECT_RATIO = 2

// ─── Main Component ────────────────────────────────────────────────────────

/**
 * Live preview component showing side-by-side asset previews.
 *
 * Renders two preview sizes simultaneously and updates them in real-time
 * as the user modifies configuration options in the parent form.
 */
export function LivePreview({
	background,
	foreground,
	iconScale = 0.7,
}: LivePreviewProps) {
	// Preview image buffers for both sizes.
	const [largeBuffer, setLargeBuffer] = useState<Buffer | null>(null)
	const [smallBuffer, setSmallBuffer] = useState<Buffer | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Track pending generation to avoid race conditions when config changes rapidly.
	const generationId = useRef(0)

	/**
	 * Generate preview icons for both sizes.
	 *
	 * Uses generation ID to ensure only the latest request updates state,
	 * preventing race conditions when the user changes config rapidly.
	 */
	const generatePreviews = useCallback(async () => {
		const currentId = ++generationId.current
		setIsLoading(true)
		setError(null)

		try {
			const config = { background, foreground, iconScale }

			// Generate both sizes in parallel
			const [large, small] = await Promise.all([
				generatePreviewIcon(config, PREVIEW_SIZES.large),
				generatePreviewIcon(config, PREVIEW_SIZES.small),
			])

			// Only update if this is still the latest generation
			if (currentId === generationId.current) {
				setLargeBuffer(large)
				setSmallBuffer(small)
				setIsLoading(false)
			}
		} catch (err) {
			if (currentId === generationId.current) {
				setError((err as Error).message)
				setIsLoading(false)
			}
		}
	}, [background, foreground, iconScale])

	/**
	 * Debounce preview generation on config changes.
	 */
	useEffect(() => {
		const timeoutId = setTimeout(generatePreviews, 300)
		return () => clearTimeout(timeoutId)
	}, [generatePreviews])

	// Loading state
	if (isLoading && !largeBuffer) {
		return (
			<box flexDirection='column' gap={1}>
				<text fg={colors.textMuted}>Preview</text>
				<text fg={colors.textDim}>Generating...</text>
			</box>
		)
	}

	// Error state
	if (error) {
		return (
			<box flexDirection='column' gap={1}>
				<text fg={colors.textMuted}>Preview</text>
				<text fg='red'>Error: {error}</text>
			</box>
		)
	}

	return (
		<box flexDirection='column' gap={1}>
			<text fg={colors.textMuted}>
				Preview{isLoading ? ' (updating...)' : ''}
			</text>

			{/* Side-by-side previews aligned to top */}
			<box flexDirection='row' gap={3} alignItems='flex-start'>
				{/* Large preview - 8 rows tall, 16 cols wide (square appearance) */}
				<box flexDirection='column' gap={0}>
					{largeBuffer && (
						<ImagePreview
							buffer={largeBuffer}
							width={8 * TERMINAL_ASPECT_RATIO}
							height={8}
							foreground={foreground}
						/>
					)}
					<text fg={colors.textDim}>256×256</text>
				</box>

				{/* Small preview - 4 rows tall, 8 cols wide (square appearance) */}
				<box flexDirection='column' gap={0}>
					{smallBuffer && (
						<ImagePreview
							buffer={smallBuffer}
							width={4 * TERMINAL_ASPECT_RATIO}
							height={4}
							foreground={foreground}
						/>
					)}
					<text fg={colors.textDim}>64×64</text>
				</box>
			</box>
		</box>
	)
}
