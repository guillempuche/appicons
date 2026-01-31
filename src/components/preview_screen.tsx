/**
 * Preview Screen Component
 *
 * Displays generated assets with terminal image preview after asset generation
 * is complete. Shows a progress bar during generation, then displays:
 * - Summary of generated assets.
 * - Asset grid grouped by platform.
 * - Output directory and instructions path.
 * - Any errors that occurred during generation.
 */

import { useKeyboard } from '@opentui/react'
import { useCallback, useEffect, useState } from 'react'

import { generateAssets } from '../generators/asset_generator'
import type {
	AssetGeneratorConfig,
	GeneratedAsset,
	GenerationResult,
} from '../types'
import { ImagePreview } from './image_preview'

// ─── Theme Colors ──────────────────────────────────────────────────────────
// Terminal-agnostic colors that work in both light and dark terminals.

const colors = {
	text: 'white',
	textMuted: 'gray',
	textDim: 'gray',
	accent: 'cyan',
	accentSecondary: 'yellow',
} as const

// ─── Component Props ───────────────────────────────────────────────────────

interface PreviewScreenProps {
	config: AssetGeneratorConfig
	result: GenerationResult | null
	onBack: () => void
	onGenerationComplete: (result: GenerationResult) => void
}

// ─── Main Component ────────────────────────────────────────────────────────

/**
 * Preview screen displaying asset generation progress and results.
 */
export function PreviewScreen({
	config,
	result,
	onBack,
	onGenerationComplete,
}: PreviewScreenProps) {
	const [isGenerating, setIsGenerating] = useState(false)
	const [progress, setProgress] = useState(0)

	// ─── Keyboard Handler ──────────────────────────────────────────────────────

	useKeyboard(key => {
		if (key.name === 'escape' || key.name === 'backspace') {
			onBack()
		}
	})

	// ─── Asset Generation ──────────────────────────────────────────────────────

	/**
	 * Run the asset generation pipeline asynchronously.
	 *
	 * Updates progress state and calls onGenerationComplete when done.
	 * Errors are logged but don't prevent partial results from displaying.
	 */
	const generateAssetsAsync = useCallback(async () => {
		setIsGenerating(true)
		setProgress(0)

		try {
			const generationResult = await generateAssets(config)
			setProgress(100)
			onGenerationComplete(generationResult)
		} catch (error) {
			console.error('Asset generation failed:', error)
		} finally {
			setIsGenerating(false)
		}
	}, [config, onGenerationComplete])

	// ─── Effects ───────────────────────────────────────────────────────────────

	// Trigger asset generation on mount if not already generated.
	useEffect(() => {
		if (!result && !isGenerating) {
			generateAssetsAsync()
		}
	}, [generateAssetsAsync, isGenerating, result])

	// ─── Computed Values ───────────────────────────────────────────────────────

	// Group assets by platform for organized display.
	const groupedAssets =
		result?.assets.reduce(
			(acc, asset) => {
				const platform = asset.spec.platform
				if (!acc[platform]) acc[platform] = []
				acc[platform].push(asset)
				return acc
			},
			{} as Record<string, GeneratedAsset[]>,
		) || {}

	// ─── Render ────────────────────────────────────────────────────────────────

	return (
		<box flexDirection='column' gap={2}>
			{/* Header */}
			<box
				flexDirection='row'
				justifyContent='space-between'
				alignItems='center'
			>
				<text fg={colors.text}>ASSET PREVIEW</text>
				<text fg={colors.textDim}>← Back [Esc]</text>
			</box>

			<text fg={colors.textDim}>
				────────────────────────────────────────────
			</text>

			{/* Generation Progress */}
			{isGenerating && (
				<box flexDirection='column' gap={1}>
					<text fg={colors.textMuted}>Generating assets... {progress}%</text>
					<text fg={colors.accent}>
						{'█'.repeat(Math.floor(progress * 0.4))}
						{'░'.repeat(40 - Math.floor(progress * 0.4))}
					</text>
				</box>
			)}

			{/* Results */}
			{result && (
				<box flexDirection='column' gap={2}>
					{/* Summary */}
					<box flexDirection='column' gap={1}>
						<text fg={colors.textMuted}>
							Generated {result.assets.length} assets
						</text>
						<text fg={colors.accent}>Output: {result.outputDir}</text>
						{result.errors && result.errors.length > 0 && (
							<text fg={colors.accentSecondary}>
								{result.errors.length} errors occurred
							</text>
						)}
					</box>

					<text fg={colors.textDim}>
						────────────────────────────────────────────
					</text>

					{/* Asset Groups */}
					{Object.entries(groupedAssets).map(([platform, assets]) => (
						<box key={platform} flexDirection='column' gap={1}>
							<text fg={colors.text}>
								{platform.toUpperCase()} ({assets.length} assets)
							</text>

							{/* Preview grid */}
							<box flexDirection='row' gap={2} flexWrap='wrap'>
								{assets.slice(0, 6).map(asset => (
									<box key={asset.spec.name} flexDirection='column' gap={1}>
										<ImagePreview buffer={asset.buffer} width={8} height={4} />
										<text fg={colors.textDim}>
											{asset.spec.width}×{asset.spec.height}
										</text>
									</box>
								))}
								{assets.length > 6 && (
									<box
										justifyContent='center'
										alignItems='center'
										paddingLeft={2}
										paddingRight={2}
									>
										<text fg={colors.textDim}>+{assets.length - 6} more</text>
									</box>
								)}
							</box>
						</box>
					))}

					<text fg={colors.textDim}>
						────────────────────────────────────────────
					</text>

					{/* Output Information */}
					<box flexDirection='column' gap={1}>
						<text fg={colors.text}>OUTPUT</text>
						<text fg={colors.textMuted}>Directory: {result.outputDir}</text>
						{result.instructionsPath && (
							<text fg={colors.textMuted}>
								Instructions: {result.instructionsPath}
							</text>
						)}
						<text fg={colors.textDim}>
							Copy assets to your project. See README.md for details.
						</text>
					</box>
				</box>
			)}

			{/* Errors */}
			{result?.errors && result.errors.length > 0 && (
				<box flexDirection='column' gap={1}>
					<text fg={colors.accentSecondary}>ERRORS</text>
					{result.errors.map(error => (
						<text key={error} fg={colors.textDim}>
							• {error}
						</text>
					))}
				</box>
			)}
		</box>
	)
}
