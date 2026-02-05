/**
 * Safe zone validation for icon scaling across different platforms.
 *
 * Different platforms have different safe zone requirements:
 * - Android adaptive icons: 66dp of 108dp canvas (61%), recommended 60%
 * - Web maskable icons: 80% per W3C PWA spec
 * - watchOS/visionOS circular: 80% diameter recommended
 * - Store listing graphics: Full bleed allowed, 50% recommended
 */

import type { AssetType, Platform } from '../types'

// ─── Safe Zone Constants ───────────────────────────────────────────────────

/** Maximum safe scale for Android adaptive icons (66dp of 108dp). */
export const ANDROID_ADAPTIVE_MAX_SCALE = 0.61

/** Recommended scale for Android adaptive icons. */
export const ANDROID_ADAPTIVE_RECOMMENDED_SCALE = 0.6

/** Maximum safe scale for web maskable icons (W3C PWA safe zone). */
export const WEB_MASKABLE_MAX_SCALE = 0.8

/** Recommended scale for web maskable icons. */
export const WEB_MASKABLE_RECOMMENDED_SCALE = 0.7

/** Maximum safe scale for circular icons (watchOS, visionOS). */
export const CIRCULAR_ICON_MAX_SCALE = 0.8

/** Recommended scale for circular icons. */
export const CIRCULAR_ICON_RECOMMENDED_SCALE = 0.7

/** Maximum scale for store listing graphics (full bleed allowed). */
export const STORE_MAX_SCALE = 1.0

/** Recommended scale for store listing graphics. */
export const STORE_RECOMMENDED_SCALE = 0.5

/** Minimum recommended scale for visibility at small sizes. */
export const MIN_VISIBILITY_SCALE = 0.4

// ─── Types ─────────────────────────────────────────────────────────────────

export type ScaleWarningSeverity = 'info' | 'warning' | 'error'

export interface ScaleValidationResult {
	valid: boolean
	severity: ScaleWarningSeverity
	context: string
	message: string
	currentScale: number
	maxScale: number
	recommendedScale: number
}

// ─── Validation Functions ──────────────────────────────────────────────────

/**
 * Validates icon scale based on platform guidelines.
 *
 * @param scale - The icon scale value (0.1-1.5)
 * @param platforms - Target platforms to validate against
 * @param assetTypes - Asset types being generated
 * @returns Array of validation results with warnings/errors
 */
export function validateIconScale(
	scale: number,
	platforms: Platform[],
	assetTypes: AssetType[],
): ScaleValidationResult[] {
	const results: ScaleValidationResult[] = []

	// Android adaptive icon safe zone check
	if (platforms.includes('android') && assetTypes.includes('adaptive')) {
		if (scale > ANDROID_ADAPTIVE_MAX_SCALE) {
			results.push({
				valid: false,
				severity: 'warning',
				context: 'Android adaptive',
				message: `Icon may clip on Android (safe zone is 66dp of 108dp canvas). Scale ${(scale * 100).toFixed(0)}% exceeds safe limit of ${(ANDROID_ADAPTIVE_MAX_SCALE * 100).toFixed(0)}%.`,
				currentScale: scale,
				maxScale: ANDROID_ADAPTIVE_MAX_SCALE,
				recommendedScale: ANDROID_ADAPTIVE_RECOMMENDED_SCALE,
			})
		}
	}

	// Web maskable icon safe zone check
	if (platforms.includes('web') && assetTypes.includes('favicon')) {
		if (scale > WEB_MASKABLE_MAX_SCALE) {
			results.push({
				valid: false,
				severity: 'warning',
				context: 'PWA maskable',
				message: `PWA maskable icon may clip (W3C safe zone is 80%). Scale ${(scale * 100).toFixed(0)}% exceeds safe limit.`,
				currentScale: scale,
				maxScale: WEB_MASKABLE_MAX_SCALE,
				recommendedScale: WEB_MASKABLE_RECOMMENDED_SCALE,
			})
		}
	}

	// watchOS circular icon check
	if (platforms.includes('watchos') && assetTypes.includes('icon')) {
		if (scale > CIRCULAR_ICON_MAX_SCALE) {
			results.push({
				valid: false,
				severity: 'warning',
				context: 'watchOS circular',
				message: `Content may clip in watchOS circular mask at ${(scale * 100).toFixed(0)}% scale.`,
				currentScale: scale,
				maxScale: CIRCULAR_ICON_MAX_SCALE,
				recommendedScale: CIRCULAR_ICON_RECOMMENDED_SCALE,
			})
		}
	}

	// visionOS circular icon check
	if (platforms.includes('visionos') && assetTypes.includes('icon')) {
		if (scale > CIRCULAR_ICON_MAX_SCALE) {
			results.push({
				valid: false,
				severity: 'warning',
				context: 'visionOS circular',
				message: `Content may clip in visionOS circular mask at ${(scale * 100).toFixed(0)}% scale.`,
				currentScale: scale,
				maxScale: CIRCULAR_ICON_MAX_SCALE,
				recommendedScale: CIRCULAR_ICON_RECOMMENDED_SCALE,
			})
		}
	}

	// Visibility check for very small scales
	if (scale < MIN_VISIBILITY_SCALE && assetTypes.includes('icon')) {
		results.push({
			valid: true,
			severity: 'info',
			context: 'Small sizes',
			message: `Icon may be hard to see at small sizes (20px) with ${(scale * 100).toFixed(0)}% scale.`,
			currentScale: scale,
			maxScale: 1.0,
			recommendedScale: 0.7,
		})
	}

	return results
}

/**
 * Get detailed scale warnings for all scale types.
 *
 * @param iconScale - Scale for app icons
 * @param splashScale - Scale for splash screens
 * @param faviconScale - Scale for favicons
 * @param storeScale - Scale for store listing graphics
 * @param platforms - Target platforms
 * @param assetTypes - Asset types being generated
 * @returns Array of all validation results
 */
export function getDetailedScaleWarnings(
	iconScale: number,
	splashScale: number,
	faviconScale: number,
	storeScale: number,
	platforms: Platform[],
	assetTypes: AssetType[],
): ScaleValidationResult[] {
	const results: ScaleValidationResult[] = []

	// Icon scale validations
	if (assetTypes.some(t => ['icon', 'adaptive'].includes(t))) {
		results.push(...validateIconScale(iconScale, platforms, assetTypes))
	}

	// Splash scale validations
	if (assetTypes.includes('splash')) {
		if (splashScale > 0.5) {
			results.push({
				valid: true,
				severity: 'info',
				context: 'Splash screen',
				message: `Large splash (>${(0.5 * 100).toFixed(0)}%) may feel overwhelming on smaller devices.`,
				currentScale: splashScale,
				maxScale: 1.0,
				recommendedScale: 0.25,
			})
		}
		if (splashScale < 0.1) {
			results.push({
				valid: true,
				severity: 'info',
				context: 'Splash screen',
				message: `Very small splash (<10%) may be hard to see.`,
				currentScale: splashScale,
				maxScale: 1.0,
				recommendedScale: 0.25,
			})
		}
	}

	// Favicon scale validations
	if (assetTypes.includes('favicon')) {
		if (faviconScale < 0.7) {
			results.push({
				valid: true,
				severity: 'warning',
				context: 'Favicon',
				message: `Favicon scale <70% may be hard to see at 16px/32px sizes.`,
				currentScale: faviconScale,
				maxScale: 1.0,
				recommendedScale: 0.85,
			})
		}
	}

	// Store scale validations
	if (assetTypes.includes('store')) {
		if (storeScale > 0.8) {
			results.push({
				valid: true,
				severity: 'info',
				context: 'Store graphics',
				message: `Large store scale (>${(0.8 * 100).toFixed(0)}%) may crowd feature graphics.`,
				currentScale: storeScale,
				maxScale: STORE_MAX_SCALE,
				recommendedScale: STORE_RECOMMENDED_SCALE,
			})
		}
	}

	return results
}

/**
 * Format validation result as a warning message string.
 */
export function formatScaleWarning(result: ScaleValidationResult): string {
	const prefix = result.severity === 'warning' ? 'Warning: ' : 'Info: '
	return `${prefix}${result.message}`
}

/**
 * Check if any validation results contain warnings or errors.
 */
export function hasScaleWarnings(results: ScaleValidationResult[]): boolean {
	return results.some(r => r.severity === 'warning' || r.severity === 'error')
}
