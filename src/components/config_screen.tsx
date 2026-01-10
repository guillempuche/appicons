/**
 * Configuration Screen Component
 *
 * Terminal UI Best Practices Applied:
 *
 * 1. FOCUS INDICATOR - Use `▶` cursor, not just color (accessibility)
 * 2. KEYBOARD NAVIGATION:
 *    - ↑↓ to move between fields
 *    - ←→ to change values in radio/select fields
 *    - Enter to confirm/submit
 * 3. VISUAL HIERARCHY:
 *    - Focused: `▶` prefix + bright text
 *    - Selected: `●` marker (in radio groups)
 *    - Editable: `[value]` bracket notation for input fields
 * 4. SINGLE COLUMN LAYOUT - Predictable top-to-bottom navigation
 * 5. KEYBINDINGS VISIBLE - Always show available actions at footer
 * 6. FOOTER CONTEXTUAL HELP - Tips at bottom, below keybindings
 */

import { useKeyboard } from '@opentui/react'
import { useEffect, useMemo, useState } from 'react'

import type {
	AssetGeneratorConfig,
	AssetType,
	BackgroundConfig,
	ForegroundConfig,
	Platform,
} from '../types'
import {
	fontExists,
	getGoogleFontsUrl,
	initGoogleFonts,
	normalizeFontFamily,
	searchFonts,
} from '../utils/google_fonts'
import { LivePreview } from './live_preview'

// ─── Utility Functions ─────────────────────────────────────────────────────

/**
 * Search fonts by query (case-insensitive, partial match).
 *
 * @param query - Search string to match against font names.
 * @returns Array of matching font family names.
 */
function autocompleteFonts(query: string): string[] {
	return searchFonts(query).map(f => f.family)
}

/**
 * Truncate text to fit terminal width with ellipsis.
 *
 * @param text - Text to truncate.
 * @param maxLen - Maximum allowed length.
 * @returns Truncated text with '...' if needed.
 */
function truncate(text: string, maxLen: number): string {
	if (text.length <= maxLen) return text
	return text.slice(0, maxLen - 3) + '...'
}

/**
 * Create a clickable terminal hyperlink using OSC 8 escape sequence.
 *
 * Supported by: iTerm2, VS Code terminal, GNOME Terminal, Windows Terminal,
 * Hyper, Alacritty (0.11+), Kitty, and most modern terminal emulators.
 *
 * Format: \x1b]8;;URL\x07DISPLAY_TEXT\x1b]8;;\x07
 *
 * @param url - The URL to link to
 * @param displayText - Text to display (defaults to URL if not provided)
 * @returns Terminal escape sequence for clickable link
 */
function terminalLink(url: string, displayText?: string): string {
	const text = displayText || url
	return `\x1b]8;;${url}\x07${text}\x1b]8;;\x07`
}

// ─── Layout Constants ──────────────────────────────────────────────────────

/**
 * Responsive breakpoints based on terminal column width.
 * Determines whether to show side-by-side preview or stacked layout.
 */
const BREAKPOINTS = {
	wide: 100, // Side-by-side layout with live preview.
	medium: 60, // Stacked layout with live preview.
	// Below medium: form only, no preview (narrow terminals).
}

// ─── Theme Colors ──────────────────────────────────────────────────────────
// Terminal-agnostic colors that adapt to both light and dark terminals.

const colors = {
	text: 'white',
	textMuted: 'gray',
	textDim: 'gray',
	accent: 'cyan',
	tip: 'green',
} as const

// ─── Field Definitions ─────────────────────────────────────────────────────

type FieldType = 'input' | 'radio' | 'scale'

/** Definition for a single form field. */
interface FieldDef {
	id: string
	label: string
	type: FieldType
	options?: string[]
	tip: string
	min?: number
	max?: number
	step?: number
}

/**
 * Field definitions for the configuration form.
 * Each field has a type, label, and contextual tip.
 */
const FIELDS: FieldDef[] = [
	// Application metadata.
	{
		id: 'appName',
		label: 'App Name',
		type: 'input',
		tip: 'Appears in app stores and device home screens',
	},

	// Background configuration.
	{
		id: 'bgType',
		label: 'Background Type',
		type: 'radio',
		options: ['Color', 'Gradient', 'Image'],
		tip: 'Solid colors work best for icons',
	},
	{
		id: 'bgColor',
		label: 'Background Color',
		type: 'input',
		tip: 'Use #F7F5F0 for newspaper look',
	},

	// Foreground configuration.
	{
		id: 'fgType',
		label: 'Foreground Type',
		type: 'radio',
		options: ['Text', 'SVG', 'Image'],
		tip: 'Text icons are crisp at all sizes',
	},
	{
		id: 'fgText',
		label: 'Text',
		type: 'input',
		tip: 'Single characters work best: " X ★',
	},
	{
		id: 'fgFont',
		label: 'Font Family',
		type: 'input',
		tip: 'Any Google Font: Playfair Display, Inter...',
	},
	{
		id: 'fgColor',
		label: 'Text Color',
		type: 'input',
		tip: 'Ensure contrast with background',
	},

	// Scale configuration.
	{
		id: 'iconScale',
		label: 'Icon Scale',
		type: 'scale',
		min: 0.2,
		max: 1.0,
		step: 0.05,
		tip: '0.6-0.7 standard • 0.8-0.9 bold • 0.5-0.6 minimal',
	},
	{
		id: 'splashScale',
		label: 'Splash Scale',
		type: 'scale',
		min: 0.1,
		max: 0.5,
		step: 0.05,
		tip: '0.2-0.3 standard • 0.15-0.2 subtle • 0.3-0.4 prominent',
	},
]

// ─── Form State Interface ──────────────────────────────────────────────────

/**
 * Form state that persists across navigation (lifted to App component).
 * Contains all user-configurable values for asset generation.
 */
export interface ConfigFormState {
	appName: string
	bgType: number
	bgColor: string
	fgType: number
	fgText: string
	fgFont: string
	fgColor: string
	iconScale: number
	splashScale: number
}

// ─── Color Utility Functions ───────────────────────────────────────────────

/**
 * Validates if a string is a valid hex color.
 *
 * @param color - Color string to validate.
 * @returns True if valid hex format (#RGB, #RRGGBB, #RGBA, #RRGGBBAA).
 */
function isValidHexColor(color: string): boolean {
	return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(
		color,
	)
}

/**
 * Expands shorthand hex (#RGB) to full form (#RRGGBB).
 *
 * @param hex - Hex color (3 or 6 digit).
 * @returns 6-digit hex color.
 */
function expandHex(hex: string): string {
	if (hex.length === 4) {
		return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
	}
	return hex
}

/**
 * Calculates relative luminance of a hex color.
 *
 * Uses ITU-R BT.601 coefficients for perceived brightness.
 * This matches how humans perceive brightness (green > red > blue).
 *
 * @param hex - Hex color code.
 * @returns Luminance value from 0 (black) to 1 (white).
 */
function getLuminance(hex: string): number {
	const expanded = expandHex(hex)
	const r = parseInt(expanded.slice(1, 3), 16) / 255
	const g = parseInt(expanded.slice(3, 5), 16) / 255
	const b = parseInt(expanded.slice(5, 7), 16) / 255
	return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * Returns a contrasting border color based on luminance.
 *
 * Used for color preview boxes to ensure visibility against any background.
 * Light colors get dark border, dark colors get light border.
 *
 * @param hex - Hex color code.
 * @returns Contrasting border color.
 */
function getContrastBorder(hex: string): string {
	const luminance = getLuminance(hex)
	return luminance > 0.6 ? '#666666' : '#CCCCCC'
}

/**
 * Generate datetime-based output directory path.
 *
 * @returns Path like './assets/generated-20240115-143052'.
 */
function getOutputDir(): string {
	const now = new Date()
	const timestamp = now
		.toISOString()
		.replace(/[-:]/g, '')
		.replace('T', '-')
		.slice(0, 15)
	return `./assets/generated-${timestamp}`
}

// ─── Component Props ───────────────────────────────────────────────────────

interface ConfigScreenProps {
	formState: ConfigFormState
	onFormStateChange: (state: ConfigFormState) => void
	onComplete: (config: AssetGeneratorConfig) => void
}

/** Default values for each field (used for ESC reset). */
const DEFAULTS: ConfigFormState = {
	appName: 'MyApp',
	bgType: 0,
	bgColor: '#FFFFFF',
	fgType: 0,
	fgText: 'A',
	fgFont: 'Inter',
	fgColor: '#000000',
	iconScale: 0.7,
	splashScale: 0.25,
}

// ─── Main Component ────────────────────────────────────────────────────────

/**
 * Configuration screen for asset generation settings.
 *
 * Provides a keyboard-navigable form with live preview. Supports:
 * - Input fields for text values.
 * - Radio groups for type selection.
 * - Scale sliders for size adjustments.
 * - Font autocomplete from Google Fonts.
 */
export function ConfigScreen({
	formState,
	onFormStateChange,
	onComplete,
}: ConfigScreenProps) {
	// ─── State ─────────────────────────────────────────────────────────────────

	const [focusIndex, setFocusIndex] = useState(0)

	// Destructure form values from lifted state (session-persistent).
	const {
		appName,
		bgType,
		bgColor,
		fgType,
		fgText,
		fgFont,
		fgColor,
		iconScale,
		splashScale,
	} = formState

	// Font autocomplete suggestions and loading state.
	const [fontSuggestions, setFontSuggestions] = useState<string[]>([])
	const [fontsLoaded, setFontsLoaded] = useState(false)

	// Terminal size for responsive layout decisions.
	const [terminalWidth, setTerminalWidth] = useState(
		process.stdout.columns || 80,
	)

	// ─── Form State Helpers ────────────────────────────────────────────────────

	/** Update a single field in the form state. */
	const updateField = <K extends keyof ConfigFormState>(
		key: K,
		value: ConfigFormState[K],
	) => {
		onFormStateChange({ ...formState, [key]: value })
	}

	// ─── Effects ───────────────────────────────────────────────────────────────

	// Initialize Google Fonts cache on mount (fetches 1,500+ fonts).
	useEffect(() => {
		initGoogleFonts().then(() => setFontsLoaded(true))
	}, [])

	// Listen for terminal resize events.
	useEffect(() => {
		const handleResize = () => {
			setTerminalWidth(process.stdout.columns || 80)
		}
		process.stdout.on('resize', handleResize)
		return () => {
			process.stdout.off('resize', handleResize)
		}
	}, [])

	// Update font suggestions when font input changes (instant local search).
	useEffect(() => {
		if (fgFont.length < 1) {
			setFontSuggestions([])
			return
		}
		const results = autocompleteFonts(fgFont)
		setFontSuggestions(results)
	}, [fgFont])

	// ─── Computed Values ───────────────────────────────────────────────────────

	const scaleFields = FIELDS.filter(f => f.type === 'scale')

	// Determine layout based on terminal width.
	const showPreview = terminalWidth >= BREAKPOINTS.medium
	const sideBySide = terminalWidth >= BREAKPOINTS.wide

	// Compute Google Fonts preview URL for clickable link.
	const fontPreviewUrl = useMemo(() => {
		const isValidFont = fontsLoaded && fontExists(fgFont)
		return getGoogleFontsUrl(isValidFont ? fgFont : null, fgText || '"')
	}, [fgFont, fgText, fontsLoaded])

	/**
	 * Compute visible fields based on current type selections.
	 *
	 * Dynamically shows/hides fields based on background and foreground types.
	 * For example, bgColor is only shown when bgType is 'Color'.
	 */
	const getVisibleFields = (): FieldDef[] => {
		const visible: FieldDef[] = []

		// Always show appName and bgType
		const appNameField = FIELDS.find(f => f.id === 'appName')
		const bgTypeField = FIELDS.find(f => f.id === 'bgType')
		if (appNameField) visible.push(appNameField)
		if (bgTypeField) visible.push(bgTypeField)

		// Show bgColor only for Color type
		if (bgType === 0) {
			const bgColorField = FIELDS.find(f => f.id === 'bgColor')
			if (bgColorField) visible.push(bgColorField)
		}

		// Always show fgType
		const fgTypeField = FIELDS.find(f => f.id === 'fgType')
		if (fgTypeField) visible.push(fgTypeField)

		// Show text-related fields only for Text type
		if (fgType === 0) {
			const fgTextField = FIELDS.find(f => f.id === 'fgText')
			const fgFontField = FIELDS.find(f => f.id === 'fgFont')
			const fgColorField = FIELDS.find(f => f.id === 'fgColor')
			if (fgTextField) visible.push(fgTextField)
			if (fgFontField) visible.push(fgFontField)
			if (fgColorField) visible.push(fgColorField)
		}

		// Always show scale fields at the end
		visible.push(...scaleFields)

		return visible
	}

	const visibleFields = getVisibleFields()
	const currentField = visibleFields[focusIndex]

	// Build current background config for live preview.
	const currentBackground = useMemo((): BackgroundConfig => {
		if (bgType === 0) {
			return { type: 'color', color: { type: 'solid', color: bgColor } }
		} else if (bgType === 1) {
			return {
				type: 'gradient',
				gradient: {
					type: 'linear',
					colors: ['#B3D9E8', '#004C6E'],
					angle: 180,
				},
			}
		} else {
			return { type: 'image', imagePath: './background.png' }
		}
	}, [bgType, bgColor])

	// Build current foreground config for live preview.
	const currentForeground = useMemo((): ForegroundConfig => {
		if (fgType === 0) {
			// Normalize font family to correct casing for API calls.
			const normalizedFont = normalizeFontFamily(fgFont)
			return {
				type: 'text',
				text: fgText,
				fontFamily: normalizedFont,
				color: fgColor,
				fontSource: 'google',
			}
		} else if (fgType === 1) {
			return { type: 'svg', svgPath: './icon.svg', color: fgColor }
		} else {
			return { type: 'image', imagePath: './icon.png' }
		}
	}, [fgType, fgText, fgFont, fgColor])

	// ─── Navigation Handlers ───────────────────────────────────────────────────

	/** Move focus up or down in the field list. */
	const navigate = (dir: 'up' | 'down') => {
		if (dir === 'up' && focusIndex > 0) {
			setFocusIndex(focusIndex - 1)
		} else if (dir === 'down' && focusIndex < visibleFields.length - 1) {
			setFocusIndex(focusIndex + 1)
		}
	}

	/** Change radio button selection left or right. */
	const changeRadio = (dir: 'left' | 'right') => {
		if (!currentField || currentField.type !== 'radio' || !currentField.options)
			return
		const max = currentField.options.length - 1

		if (currentField.id === 'bgType') {
			if (dir === 'left' && bgType > 0) updateField('bgType', bgType - 1)
			if (dir === 'right' && bgType < max) updateField('bgType', bgType + 1)
		} else if (currentField.id === 'fgType') {
			if (dir === 'left' && fgType > 0) updateField('fgType', fgType - 1)
			if (dir === 'right' && fgType < max) updateField('fgType', fgType + 1)
		}
	}

	/** Adjust scale slider value left or right. */
	const changeScale = (dir: 'left' | 'right') => {
		if (!currentField || currentField.type !== 'scale') return
		const { min = 0, max = 1, step = 0.05 } = currentField

		if (currentField.id === 'iconScale') {
			const newValue =
				dir === 'left'
					? Math.max(min, iconScale - step)
					: Math.min(max, iconScale + step)
			updateField('iconScale', Math.round(newValue * 100) / 100)
		} else if (currentField.id === 'splashScale') {
			const newValue =
				dir === 'left'
					? Math.max(min, splashScale - step)
					: Math.min(max, splashScale + step)
			updateField('splashScale', Math.round(newValue * 100) / 100)
		}
	}

	// ─── Field Value Accessors ─────────────────────────────────────────────────

	/** Get the current value for a text input field. */
	const getValue = (fieldId: string): string => {
		switch (fieldId) {
			case 'appName':
				return appName
			case 'bgColor':
				return bgColor
			case 'fgText':
				return fgText
			case 'fgFont':
				return fgFont
			case 'fgColor':
				return fgColor
			default:
				return ''
		}
	}

	/** Set the value for a text input field. */
	const setValue = (fieldId: string, value: string) => {
		switch (fieldId) {
			case 'appName':
				updateField('appName', value)
				break
			case 'bgColor':
				updateField('bgColor', value)
				break
			case 'fgText':
				updateField('fgText', value)
				break
			case 'fgFont':
				updateField('fgFont', value)
				break
			case 'fgColor':
				updateField('fgColor', value)
				break
		}
	}

	/** Reset current field to its default value (ESC key). */
	const resetCurrentField = () => {
		if (!currentField) return
		const fieldId = currentField.id as keyof ConfigFormState

		if (fieldId in DEFAULTS) {
			updateField(fieldId, DEFAULTS[fieldId])
		}
	}

	// ─── Keyboard Handler ──────────────────────────────────────────────────────

	useKeyboard(key => {
		if (key.name === 'up') navigate('up')
		else if (key.name === 'down' || key.name === 'tab') navigate('down')
		else if (key.name === 'left') {
			if (currentField?.type === 'radio') changeRadio('left')
			else if (currentField?.type === 'scale') changeScale('left')
		} else if (key.name === 'right') {
			if (currentField?.type === 'radio') changeRadio('right')
			else if (currentField?.type === 'scale') changeScale('right')
		} else if (key.name === 'escape') resetCurrentField()
		else if (key.name === 'return') handleSubmit()
	})

	// ─── Form Submission ───────────────────────────────────────────────────────

	/**
	 * Build final configuration and trigger generation.
	 *
	 * Assembles background and foreground configs based on current type
	 * selections and calls onComplete with the full AssetGeneratorConfig.
	 */
	const handleSubmit = () => {
		// Build background config based on selected type.
		let background: BackgroundConfig
		if (bgType === 0) {
			background = { type: 'color', color: { type: 'solid', color: bgColor } }
		} else if (bgType === 1) {
			background = {
				type: 'gradient',
				gradient: {
					type: 'linear',
					colors: ['#B3D9E8', '#004C6E'],
					angle: 180,
				},
			}
		} else {
			background = { type: 'image', imagePath: './background.png' }
		}

		// Build foreground config based on selected type.
		let foreground: ForegroundConfig
		if (fgType === 0) {
			// Normalize font family to correct casing for API calls.
			const normalizedFont = normalizeFontFamily(fgFont)
			foreground = {
				type: 'text',
				text: fgText,
				fontFamily: normalizedFont,
				color: fgColor,
				fontSource: 'google',
			}
		} else if (fgType === 1) {
			foreground = { type: 'svg', svgPath: './icon.svg', color: fgColor }
		} else {
			foreground = { type: 'image', imagePath: './icon.png' }
		}

		// Invoke completion callback with full configuration.
		onComplete({
			appName,
			platforms: ['ios', 'android', 'web'] as Platform[],
			assetTypes: ['icon', 'splash', 'adaptive', 'favicon'] as AssetType[],
			background,
			foreground,
			outputDir: getOutputDir(),
			iconScale,
			splashScale,
		})
	}

	// ─── Field Rendering ───────────────────────────────────────────────────────

	// Label column width (longest label: "Background Color" = 16 chars).
	const labelWidth = 17

	/**
	 * Render a single field row based on its type.
	 *
	 * Handles three field types:
	 * - Input: Text input with bracket notation [value].
	 * - Radio: Option buttons with ● selected / ○ unselected.
	 * - Scale: Visual slider with ←→ adjustment.
	 */
	const renderField = (field: FieldDef, index: number) => {
		const isFocused = index === focusIndex
		const prefix = isFocused ? '▶ ' : '  '
		const labelFg = isFocused ? colors.text : colors.textMuted

		if (field.type === 'radio' && field.options) {
			const selectedIndex = field.id === 'bgType' ? bgType : fgType
			return (
				<box key={field.id} flexDirection='row' gap={0}>
					<text fg={labelFg}>
						{prefix}
						{field.label.padEnd(labelWidth)}
					</text>
					{field.options.map((opt, i) => (
						<text
							key={opt}
							fg={i === selectedIndex ? colors.accent : colors.textDim}
						>
							{i === selectedIndex ? '● ' : '○ '}
							{opt}
							{'  '}
						</text>
					))}
				</box>
			)
		}

		// Scale field - visual slider with ←→ navigation.
		if (field.type === 'scale') {
			const value = field.id === 'iconScale' ? iconScale : splashScale
			const { min = 0, max = 1 } = field
			const percentage = Math.round(value * 100)
			const sliderWidth = 20
			const filled = Math.round(((value - min) / (max - min)) * sliderWidth)

			return (
				<box key={field.id} flexDirection='row' gap={0}>
					<text fg={labelFg}>
						{prefix}
						{field.label.padEnd(labelWidth)}
					</text>
					<text fg={colors.textDim}>{'['}</text>
					<text fg={colors.accent}>{'━'.repeat(filled)}</text>
					<text fg={isFocused ? colors.accent : colors.textDim}>●</text>
					<text fg={colors.textDim}>{'─'.repeat(sliderWidth - filled)}</text>
					<text fg={colors.textDim}>{']'}</text>
					<text fg={colors.text}>{` ${percentage}%`}</text>
				</box>
			)
		}

		// Text input field - bracket notation [value] indicates editability.
		const value = getValue(field.id)
		const isColorField = field.id.includes('Color')
		const fieldWidth = 18 // Uniform width for bracket alignment.
		const showColorPreview = isColorField && isValidHexColor(value)

		return (
			<box key={field.id} flexDirection='row' gap={0}>
				<text fg={labelFg}>
					{prefix}
					{field.label.padEnd(labelWidth)}
				</text>
				<text fg={colors.textDim}>[</text>
				<input
					focused={isFocused}
					value={value}
					onInput={v => setValue(field.id, v)}
					width={fieldWidth}
					textColor={colors.text}
					cursorColor={colors.accent}
				/>
				<text fg={colors.textDim}>]</text>
				{showColorPreview && (
					<box flexDirection='row' gap={0}>
						<text fg={getContrastBorder(value)}> │</text>
						<box width={2} height={1} backgroundColor={value} />
						<text fg={getContrastBorder(value)}>│</text>
					</box>
				)}
			</box>
		)
	}

	// ─── Render ────────────────────────────────────────────────────────────────

	return (
		<box
			flexDirection={sideBySide ? 'row' : 'column'}
			width='100%'
			height='100%'
			gap={sideBySide ? 4 : 2}
		>
			{/* Form Fields */}
			<box flexDirection='column' gap={0}>
				<box flexDirection='column' gap={0}>
					{visibleFields.map((field, index) => renderField(field, index))}
				</box>

				{/* Contextual Tip or Font Suggestions */}
				<box marginTop={2} flexDirection='column' gap={0}>
					{currentField?.id === 'fgFont' ? (
						<>
							{fontSuggestions.length > 0 ? (
								<>
									<text fg={colors.tip}>
										💡 Matches ({fontSuggestions.length}):
									</text>
									<text fg={colors.tip}>
										{'   '}
										{truncate(fontSuggestions.join(', '), terminalWidth - 5)}
									</text>
								</>
							) : fgFont.length > 0 ? (
								<text fg={colors.textDim}>💡 No matching fonts found</text>
							) : (
								<text fg={colors.tip}>💡 {currentField?.tip}</text>
							)}
							{/* Google Fonts preview link - clickable via OSC 8 */}
							<text wrapMode='char'>
								{terminalLink(fontPreviewUrl, `🔗 ${fontPreviewUrl}`)}
							</text>
						</>
					) : (
						<text fg={colors.tip}>💡 {currentField?.tip}</text>
					)}
				</box>
			</box>

			{/* Live Preview - only shown on medium+ screens */}
			{showPreview && (
				<box flexDirection='column'>
					<LivePreview
						background={currentBackground}
						foreground={currentForeground}
						iconScale={iconScale}
					/>
				</box>
			)}
		</box>
	)
}
