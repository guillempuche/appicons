/**
 * Autocomplete Input Component
 *
 * Custom input with autocomplete suggestions using Google Fonts API.
 * Shows a dropdown of matching fonts as the user types.
 */

import { useEffect, useState } from 'react'

import { autocompleteGoogleFonts } from '../utils/google_fonts_api'

interface AutocompleteInputProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	width?: number
	textColor?: string
	backgroundColor?: string
	suggestionTextColor?: string
	suggestionBackgroundColor?: string
}

/**
 * Autocomplete input with Google Fonts suggestions.
 *
 * Features:
 * - Fetches suggestions from Google Fonts API as user types
 * - Shows dropdown with up to 5 matching fonts
 * - Debounces API calls to avoid rate limiting
 * - Updates suggestions in real-time
 */
export function AutocompleteInput({
	value,
	onChange,
	placeholder = '',
	width = 40,
	textColor = 'white',
	backgroundColor,
	suggestionTextColor = 'gray',
	suggestionBackgroundColor,
}: AutocompleteInputProps) {
	const [suggestions, setSuggestions] = useState<string[]>([])
	const [showSuggestions, setShowSuggestions] = useState(false)
	const [isLoading, setIsLoading] = useState(false)

	/**
	 * Fetch suggestions when value changes.
	 * Debounced to avoid excessive API calls.
	 */
	useEffect(() => {
		// Only fetch if value has at least 2 characters
		if (value.length < 2) {
			setSuggestions([])
			setShowSuggestions(false)
			return
		}

		setIsLoading(true)

		// Debounce API call
		const timeoutId = setTimeout(async () => {
			try {
				const results = await autocompleteGoogleFonts(value, 5)
				setSuggestions(results)
				setShowSuggestions(results.length > 0)
			} catch (error) {
				console.error('Autocomplete error:', error)
				setSuggestions([])
			} finally {
				setIsLoading(false)
			}
		}, 300)

		return () => clearTimeout(timeoutId)
	}, [value])

	/**
	 * Handle suggestion selection.
	 */
	const handleSelectSuggestion = (suggestion: string) => {
		onChange(suggestion)
		setShowSuggestions(false)
	}

	return (
		<box flexDirection='column' gap={0}>
			<input
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				width={width}
				textColor={textColor}
				{...(backgroundColor ? { backgroundColor } : {})}
			/>

			{/* Loading indicator */}
			{isLoading && (
				<text fg={suggestionTextColor}>Loading suggestions...</text>
			)}

			{/* Suggestions dropdown */}
			{showSuggestions && suggestions.length > 0 && (
				<box
					flexDirection='column'
					gap={0}
					paddingTop={1}
					paddingBottom={1}
					paddingLeft={1}
					paddingRight={1}
					width={width}
				>
					<text fg={suggestionTextColor}>Suggestions:</text>
					{suggestions.map(suggestion => (
						<box key={suggestion} paddingLeft={1} paddingRight={1}>
							<text fg={suggestionTextColor}>→ {suggestion}</text>
						</box>
					))}
				</box>
			)}
		</box>
	)
}
