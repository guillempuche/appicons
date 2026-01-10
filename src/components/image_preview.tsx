/**
 * Image Preview Component
 *
 * Displays a simplified preview of generated assets in the terminal.
 * Shows background color and foreground text for a visual representation.
 */

import { useCallback, useEffect, useState } from 'react'
import sharp from 'sharp'

import type { ForegroundConfig } from '../types'

// Terminal-agnostic colors
const colors = {
	textDim: 'gray',
	surface: 'gray', // Fallback for loading state
} as const

interface ImagePreviewProps {
	buffer: Buffer
	width?: number
	height?: number
	foreground?: ForegroundConfig
}

/**
 * Extract dominant color from image buffer.
 */
async function getDominantColor(buffer: Buffer): Promise<string> {
	try {
		const { dominant } = await sharp(buffer).stats()
		const r = Math.round(dominant.r)
		const g = Math.round(dominant.g)
		const b = Math.round(dominant.b)
		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
	} catch {
		return colors.surface
	}
}

/**
 * Display a simplified preview using colored blocks.
 *
 * Shows the dominant color of the image as background with
 * the foreground text/symbol overlaid.
 */
export function ImagePreview({
	buffer,
	width,
	height,
	foreground,
}: ImagePreviewProps) {
	const [bgColor, setBgColor] = useState<string>(colors.surface)
	const [isLoading, setIsLoading] = useState(true)

	/**
	 * Extract color info from image buffer.
	 */
	const analyzeImage = useCallback(async () => {
		setIsLoading(true)
		const color = await getDominantColor(buffer)
		setBgColor(color)
		setIsLoading(false)
	}, [buffer])

	useEffect(() => {
		analyzeImage()
	}, [analyzeImage])

	const boxWidth = width ?? 10
	const boxHeight = height ?? 10

	// Get foreground display text and color
	const fgText = foreground?.type === 'text' ? foreground.text : '●'
	const fgColor =
		foreground?.type === 'text' ? foreground.color : colors.textDim

	if (isLoading) {
		return (
			<box
				width={boxWidth}
				height={boxHeight}
				justifyContent='center'
				alignItems='center'
			>
				<text fg={colors.textDim}>...</text>
			</box>
		)
	}

	// Show colored preview box with foreground text
	return (
		<box
			width={boxWidth}
			height={boxHeight}
			backgroundColor={bgColor}
			justifyContent='center'
			alignItems='center'
		>
			<text fg={fgColor}>{fgText}</text>
		</box>
	)
}
