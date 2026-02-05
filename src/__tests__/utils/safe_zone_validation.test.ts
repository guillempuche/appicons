/**
 * Tests for safe zone validation module.
 *
 * Tests scale validation logic for different platforms and contexts.
 */

import { describe, expect, it } from 'vitest'

import {
	ANDROID_ADAPTIVE_MAX_SCALE,
	ANDROID_ADAPTIVE_RECOMMENDED_SCALE,
	CIRCULAR_ICON_MAX_SCALE,
	formatScaleWarning,
	getDetailedScaleWarnings,
	hasScaleWarnings,
	MIN_VISIBILITY_SCALE,
	validateIconScale,
	WEB_MASKABLE_MAX_SCALE,
} from '../../utils/safe_zone_validation'

describe('SafeZoneValidation', () => {
	describe('validateIconScale', () => {
		it('should warn when scale exceeds Android safe zone (>0.66)', () => {
			// GIVEN a scale above Android adaptive safe zone
			const scale = 0.7
			const platforms = ['android'] as const
			const assetTypes = ['adaptive'] as const

			// WHEN validating the scale
			const results = validateIconScale(scale, [...platforms], [...assetTypes])

			// THEN a warning should be returned
			expect(results.length).toBeGreaterThan(0)
			expect(results[0]?.context).toBe('Android adaptive')
			expect(results[0]?.severity).toBe('warning')
		})

		it('should not warn for Android when scale is within safe zone', () => {
			// GIVEN a scale within Android adaptive safe zone
			const scale = 0.6
			const platforms = ['android'] as const
			const assetTypes = ['adaptive'] as const

			// WHEN validating the scale
			const results = validateIconScale(scale, [...platforms], [...assetTypes])

			// THEN no Android-related warnings should be returned
			const androidWarnings = results.filter(
				r => r.context === 'Android adaptive',
			)
			expect(androidWarnings.length).toBe(0)
		})

		it('should not warn for iOS-only generation at 0.9', () => {
			// GIVEN a high scale with iOS-only platform
			const scale = 0.9
			const platforms = ['ios'] as const
			const assetTypes = ['icon'] as const

			// WHEN validating the scale
			const results = validateIconScale(scale, [...platforms], [...assetTypes])

			// THEN no Android-related warnings should be returned
			const androidWarnings = results.filter(
				r => r.context === 'Android adaptive',
			)
			expect(androidWarnings.length).toBe(0)
		})

		it('should warn for maskable icons above 80%', () => {
			// GIVEN a scale above web maskable safe zone
			const scale = 0.85
			const platforms = ['web'] as const
			const assetTypes = ['favicon'] as const

			// WHEN validating the scale
			const results = validateIconScale(scale, [...platforms], [...assetTypes])

			// THEN a PWA maskable warning should be returned
			const maskableWarnings = results.filter(r => r.context === 'PWA maskable')
			expect(maskableWarnings.length).toBeGreaterThan(0)
		})

		it('should warn for watchOS icons above 80%', () => {
			// GIVEN a scale above circular safe zone
			const scale = 0.85
			const platforms = ['watchos'] as const
			const assetTypes = ['icon'] as const

			// WHEN validating the scale
			const results = validateIconScale(scale, [...platforms], [...assetTypes])

			// THEN a watchOS warning should be returned
			const watchOSWarnings = results.filter(
				r => r.context === 'watchOS circular',
			)
			expect(watchOSWarnings.length).toBeGreaterThan(0)
		})

		it('should warn for visionOS icons above 80%', () => {
			// GIVEN a scale above circular safe zone
			const scale = 0.85
			const platforms = ['visionos'] as const
			const assetTypes = ['icon'] as const

			// WHEN validating the scale
			const results = validateIconScale(scale, [...platforms], [...assetTypes])

			// THEN a visionOS warning should be returned
			const visionOSWarnings = results.filter(
				r => r.context === 'visionOS circular',
			)
			expect(visionOSWarnings.length).toBeGreaterThan(0)
		})

		it('should return info for very small scales (<0.4)', () => {
			// GIVEN a very small scale
			const scale = 0.3
			const platforms = ['ios'] as const
			const assetTypes = ['icon'] as const

			// WHEN validating the scale
			const results = validateIconScale(scale, [...platforms], [...assetTypes])

			// THEN an info message about small sizes should be returned
			const smallSizeInfo = results.filter(r => r.context === 'Small sizes')
			expect(smallSizeInfo.length).toBeGreaterThan(0)
			expect(smallSizeInfo[0]?.severity).toBe('info')
		})

		it('should not return small size warning for scales >= 0.4', () => {
			// GIVEN a normal scale
			const scale = 0.5
			const platforms = ['ios'] as const
			const assetTypes = ['icon'] as const

			// WHEN validating the scale
			const results = validateIconScale(scale, [...platforms], [...assetTypes])

			// THEN no small size info should be returned
			const smallSizeInfo = results.filter(r => r.context === 'Small sizes')
			expect(smallSizeInfo.length).toBe(0)
		})
	})

	describe('getDetailedScaleWarnings', () => {
		it('should warn for large splash scale', () => {
			// GIVEN a large splash scale
			const warnings = getDetailedScaleWarnings(
				0.7,
				0.6, // Large splash scale
				0.85,
				0.5,
				['ios'],
				['icon', 'splash'],
			)

			// THEN a splash warning should be returned
			const splashWarnings = warnings.filter(w => w.context === 'Splash screen')
			expect(splashWarnings.length).toBeGreaterThan(0)
		})

		it('should warn for very small splash scale', () => {
			// GIVEN a very small splash scale
			const warnings = getDetailedScaleWarnings(
				0.7,
				0.05, // Very small splash scale
				0.85,
				0.5,
				['ios'],
				['splash'],
			)

			// THEN a splash warning should be returned
			const splashWarnings = warnings.filter(w => w.context === 'Splash screen')
			expect(splashWarnings.length).toBeGreaterThan(0)
		})

		it('should warn for small favicon scale', () => {
			// GIVEN a small favicon scale
			const warnings = getDetailedScaleWarnings(
				0.7,
				0.25,
				0.6, // Small favicon scale
				0.5,
				['web'],
				['favicon'],
			)

			// THEN a favicon warning should be returned
			const faviconWarnings = warnings.filter(w => w.context === 'Favicon')
			expect(faviconWarnings.length).toBeGreaterThan(0)
		})

		it('should warn for large store scale', () => {
			// GIVEN a large store scale
			const warnings = getDetailedScaleWarnings(
				0.7,
				0.25,
				0.85,
				0.85, // Large store scale
				['android'],
				['store'],
			)

			// THEN a store warning should be returned
			const storeWarnings = warnings.filter(w => w.context === 'Store graphics')
			expect(storeWarnings.length).toBeGreaterThan(0)
		})
	})

	describe('formatScaleWarning', () => {
		it('should format warning with Warning prefix', () => {
			// GIVEN a warning result
			const result = {
				valid: false,
				severity: 'warning' as const,
				context: 'Test',
				message: 'Test message',
				currentScale: 0.7,
				maxScale: 0.66,
				recommendedScale: 0.6,
			}

			// WHEN formatting the warning
			const formatted = formatScaleWarning(result)

			// THEN it should have Warning prefix
			expect(formatted).toContain('Warning:')
			expect(formatted).toContain('Test message')
		})

		it('should format info with Info prefix', () => {
			// GIVEN an info result
			const result = {
				valid: true,
				severity: 'info' as const,
				context: 'Test',
				message: 'Test info',
				currentScale: 0.3,
				maxScale: 1.0,
				recommendedScale: 0.7,
			}

			// WHEN formatting the warning
			const formatted = formatScaleWarning(result)

			// THEN it should have Info prefix
			expect(formatted).toContain('Info:')
			expect(formatted).toContain('Test info')
		})
	})

	describe('hasScaleWarnings', () => {
		it('should return true when warnings exist', () => {
			// GIVEN results with a warning
			const results = [
				{
					valid: false,
					severity: 'warning' as const,
					context: 'Test',
					message: 'Test',
					currentScale: 0.7,
					maxScale: 0.66,
					recommendedScale: 0.6,
				},
			]

			// WHEN checking for warnings
			const hasWarnings = hasScaleWarnings(results)

			// THEN should return true
			expect(hasWarnings).toBe(true)
		})

		it('should return false when only info exists', () => {
			// GIVEN results with only info
			const results = [
				{
					valid: true,
					severity: 'info' as const,
					context: 'Test',
					message: 'Test',
					currentScale: 0.3,
					maxScale: 1.0,
					recommendedScale: 0.7,
				},
			]

			// WHEN checking for warnings
			const hasWarnings = hasScaleWarnings(results)

			// THEN should return false
			expect(hasWarnings).toBe(false)
		})

		it('should return false for empty results', () => {
			// GIVEN empty results
			const results: any[] = []

			// WHEN checking for warnings
			const hasWarnings = hasScaleWarnings(results)

			// THEN should return false
			expect(hasWarnings).toBe(false)
		})
	})

	describe('Constants', () => {
		it('should have correct Android adaptive max scale', () => {
			// Android safe zone is 66dp of 108dp
			expect(ANDROID_ADAPTIVE_MAX_SCALE).toBeCloseTo(0.61, 2)
		})

		it('should have correct Android recommended scale', () => {
			expect(ANDROID_ADAPTIVE_RECOMMENDED_SCALE).toBe(0.6)
		})

		it('should have correct web maskable max scale', () => {
			expect(WEB_MASKABLE_MAX_SCALE).toBe(0.8)
		})

		it('should have correct circular icon max scale', () => {
			expect(CIRCULAR_ICON_MAX_SCALE).toBe(0.8)
		})

		it('should have correct minimum visibility scale', () => {
			expect(MIN_VISIBILITY_SCALE).toBe(0.4)
		})
	})
})
