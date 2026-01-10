/**
 * Complete asset specifications for iOS, Android, and Web platforms.
 *
 * This module defines all required asset sizes and variants based on official
 * platform documentation and Expo requirements. Assets are organized by:
 * - Platform: iOS, Android, or Web.
 * - Type: Icon, splash, adaptive icon, or favicon.
 * - Color mode: Light (default), dark (iOS 18+), or any (Android monochrome).
 *
 * Dark mode variants:
 * - iOS 18+: Dark app icons (stored in dark/ subfolder).
 * - Android 13+: Night splash screens (drawable-night-*) + monochrome icons.
 *
 * All dimensions are in pixels. Scale factors (@2x, @3x) indicate pixel density.
 */

import type { AssetSpec, ColorMode } from '../types'

// ─── iOS App Icons ─────────────────────────────────────────────────────────

/**
 * iOS requires icons in various sizes for different contexts:
 * - Notification icons (small)
 * - Settings icons (small)
 * - Spotlight search (medium)
 * - App icon (large)
 * - App Store (1024×1024)
 */
export const IOS_ICONS: AssetSpec[] = [
	// Notification
	{ name: 'icon-20.png', width: 20, height: 20, platform: 'ios', type: 'icon' },
	{
		name: 'icon-20@2x.png',
		width: 40,
		height: 40,
		platform: 'ios',
		type: 'icon',
		scale: 2,
	},
	{
		name: 'icon-20@3x.png',
		width: 60,
		height: 60,
		platform: 'ios',
		type: 'icon',
		scale: 3,
	},

	// Settings
	{ name: 'icon-29.png', width: 29, height: 29, platform: 'ios', type: 'icon' },
	{
		name: 'icon-29@2x.png',
		width: 58,
		height: 58,
		platform: 'ios',
		type: 'icon',
		scale: 2,
	},
	{
		name: 'icon-29@3x.png',
		width: 87,
		height: 87,
		platform: 'ios',
		type: 'icon',
		scale: 3,
	},

	// Spotlight
	{ name: 'icon-40.png', width: 40, height: 40, platform: 'ios', type: 'icon' },
	{
		name: 'icon-40@2x.png',
		width: 80,
		height: 80,
		platform: 'ios',
		type: 'icon',
		scale: 2,
	},
	{
		name: 'icon-40@3x.png',
		width: 120,
		height: 120,
		platform: 'ios',
		type: 'icon',
		scale: 3,
	},

	// App Icon (iPhone)
	{
		name: 'icon-60@2x.png',
		width: 120,
		height: 120,
		platform: 'ios',
		type: 'icon',
		scale: 2,
	},
	{
		name: 'icon-60@3x.png',
		width: 180,
		height: 180,
		platform: 'ios',
		type: 'icon',
		scale: 3,
	},

	// App Icon (iPad)
	{ name: 'icon-76.png', width: 76, height: 76, platform: 'ios', type: 'icon' },
	{
		name: 'icon-76@2x.png',
		width: 152,
		height: 152,
		platform: 'ios',
		type: 'icon',
		scale: 2,
	},

	// iPad Pro
	{
		name: 'icon-83.5@2x.png',
		width: 167,
		height: 167,
		platform: 'ios',
		type: 'icon',
		scale: 2,
	},

	// App Store
	{
		name: 'icon-1024.png',
		width: 1024,
		height: 1024,
		platform: 'ios',
		type: 'icon',
	},
]

// ─── iOS Dark App Icons (iOS 18+) ──────────────────────────────────────────

/**
 * iOS 18+ dark mode app icons.
 * Placed in dark/ subfolder for Xcode asset catalog.
 * These are optional and only generated when dark mode is enabled.
 */
export const IOS_ICONS_DARK: AssetSpec[] = [
	// Main dark icons (most commonly needed sizes)
	{
		name: 'dark/icon-60@2x.png',
		width: 120,
		height: 120,
		platform: 'ios',
		type: 'icon',
		scale: 2,
		colorMode: 'dark',
	},
	{
		name: 'dark/icon-60@3x.png',
		width: 180,
		height: 180,
		platform: 'ios',
		type: 'icon',
		scale: 3,
		colorMode: 'dark',
	},
	{
		name: 'dark/icon-76@2x.png',
		width: 152,
		height: 152,
		platform: 'ios',
		type: 'icon',
		scale: 2,
		colorMode: 'dark',
	},
	{
		name: 'dark/icon-83.5@2x.png',
		width: 167,
		height: 167,
		platform: 'ios',
		type: 'icon',
		scale: 2,
		colorMode: 'dark',
	},
	{
		name: 'dark/icon-1024.png',
		width: 1024,
		height: 1024,
		platform: 'ios',
		type: 'icon',
		colorMode: 'dark',
	},
]

// ─── iOS Splash Screens ────────────────────────────────────────────────────

/**
 * iOS splash screens for various device sizes and orientations.
 * Covers iPhone, iPhone Plus/Max, and iPad models.
 */
export const IOS_SPLASH: AssetSpec[] = [
	// iPhone 15 Pro Max, 14 Pro Max, 13 Pro Max
	{
		name: 'splash-1290x2796.png',
		width: 1290,
		height: 2796,
		platform: 'ios',
		type: 'splash',
	},

	// iPhone 15 Pro, 14 Pro, 13 Pro, 12 Pro
	{
		name: 'splash-1179x2556.png',
		width: 1179,
		height: 2556,
		platform: 'ios',
		type: 'splash',
	},

	// iPhone 15, 14, 13, 12
	{
		name: 'splash-1170x2532.png',
		width: 1170,
		height: 2532,
		platform: 'ios',
		type: 'splash',
	},

	// iPhone 11 Pro Max, XS Max
	{
		name: 'splash-1242x2688.png',
		width: 1242,
		height: 2688,
		platform: 'ios',
		type: 'splash',
	},

	// iPhone 11 Pro, X, XS
	{
		name: 'splash-1125x2436.png',
		width: 1125,
		height: 2436,
		platform: 'ios',
		type: 'splash',
	},

	// iPhone 11, XR
	{
		name: 'splash-828x1792.png',
		width: 828,
		height: 1792,
		platform: 'ios',
		type: 'splash',
	},

	// iPhone 8 Plus, 7 Plus, 6s Plus
	{
		name: 'splash-1242x2208.png',
		width: 1242,
		height: 2208,
		platform: 'ios',
		type: 'splash',
	},

	// iPhone 8, 7, 6s, SE (2nd/3rd gen)
	{
		name: 'splash-750x1334.png',
		width: 750,
		height: 1334,
		platform: 'ios',
		type: 'splash',
	},

	// iPhone SE (1st gen), iPod touch
	{
		name: 'splash-640x1136.png',
		width: 640,
		height: 1136,
		platform: 'ios',
		type: 'splash',
	},

	// iPad Pro 12.9" (3rd-6th gen)
	{
		name: 'splash-2048x2732.png',
		width: 2048,
		height: 2732,
		platform: 'ios',
		type: 'splash',
	},

	// iPad Pro 11" (1st-4th gen)
	{
		name: 'splash-1668x2388.png',
		width: 1668,
		height: 2388,
		platform: 'ios',
		type: 'splash',
	},

	// iPad Pro 10.5", Air (3rd gen)
	{
		name: 'splash-1668x2224.png',
		width: 1668,
		height: 2224,
		platform: 'ios',
		type: 'splash',
	},

	// iPad Mini (6th gen), iPad (9th-10th gen)
	{
		name: 'splash-1536x2048.png',
		width: 1536,
		height: 2048,
		platform: 'ios',
		type: 'splash',
	},
]

// ─── Android Icons ─────────────────────────────────────────────────────────

/**
 * Android launcher icons for different screen densities.
 * Uses mipmap folders for proper scaling across devices.
 */
export const ANDROID_ICONS: AssetSpec[] = [
	{
		name: 'mipmap-mdpi/ic_launcher.png',
		width: 48,
		height: 48,
		platform: 'android',
		type: 'icon',
	},
	{
		name: 'mipmap-hdpi/ic_launcher.png',
		width: 72,
		height: 72,
		platform: 'android',
		type: 'icon',
	},
	{
		name: 'mipmap-xhdpi/ic_launcher.png',
		width: 96,
		height: 96,
		platform: 'android',
		type: 'icon',
	},
	{
		name: 'mipmap-xxhdpi/ic_launcher.png',
		width: 144,
		height: 144,
		platform: 'android',
		type: 'icon',
	},
	{
		name: 'mipmap-xxxhdpi/ic_launcher.png',
		width: 192,
		height: 192,
		platform: 'android',
		type: 'icon',
	},
]

// ─── Android Adaptive Icons ────────────────────────────────────────────────

/**
 * Android Adaptive Icons (API 26+) consist of separate foreground and background layers.
 * The system composites these layers and applies the device's mask shape.
 *
 * Key dimensions:
 * - Total canvas: 108×108 dp (1024×1024 px at xxxhdpi)
 * - Safe zone: Inner 66×66 dp (432×432 px) - content should stay within this
 * - Maskable area: Full 108×108 dp can be visible depending on OEM mask
 */
export const ANDROID_ADAPTIVE_ICONS: AssetSpec[] = [
	// Foreground layer (transparent PNG with icon)
	{
		name: 'mipmap-mdpi/ic_launcher_foreground.png',
		width: 108,
		height: 108,
		platform: 'android',
		type: 'adaptive',
	},
	{
		name: 'mipmap-hdpi/ic_launcher_foreground.png',
		width: 162,
		height: 162,
		platform: 'android',
		type: 'adaptive',
	},
	{
		name: 'mipmap-xhdpi/ic_launcher_foreground.png',
		width: 216,
		height: 216,
		platform: 'android',
		type: 'adaptive',
	},
	{
		name: 'mipmap-xxhdpi/ic_launcher_foreground.png',
		width: 324,
		height: 324,
		platform: 'android',
		type: 'adaptive',
	},
	{
		name: 'mipmap-xxxhdpi/ic_launcher_foreground.png',
		width: 432,
		height: 432,
		platform: 'android',
		type: 'adaptive',
	},

	// Background layer (can be color or image)
	{
		name: 'mipmap-mdpi/ic_launcher_background.png',
		width: 108,
		height: 108,
		platform: 'android',
		type: 'adaptive',
	},
	{
		name: 'mipmap-hdpi/ic_launcher_background.png',
		width: 162,
		height: 162,
		platform: 'android',
		type: 'adaptive',
	},
	{
		name: 'mipmap-xhdpi/ic_launcher_background.png',
		width: 216,
		height: 216,
		platform: 'android',
		type: 'adaptive',
	},
	{
		name: 'mipmap-xxhdpi/ic_launcher_background.png',
		width: 324,
		height: 324,
		platform: 'android',
		type: 'adaptive',
	},
	{
		name: 'mipmap-xxxhdpi/ic_launcher_background.png',
		width: 432,
		height: 432,
		platform: 'android',
		type: 'adaptive',
	},
]

// ─── Android Splash Screens ────────────────────────────────────────────────

/**
 * Android splash screens for different screen densities.
 * Covers common portrait orientations.
 */
export const ANDROID_SPLASH: AssetSpec[] = [
	{
		name: 'drawable-mdpi/splash.png',
		width: 320,
		height: 480,
		platform: 'android',
		type: 'splash',
	},
	{
		name: 'drawable-hdpi/splash.png',
		width: 480,
		height: 800,
		platform: 'android',
		type: 'splash',
	},
	{
		name: 'drawable-xhdpi/splash.png',
		width: 720,
		height: 1280,
		platform: 'android',
		type: 'splash',
	},
	{
		name: 'drawable-xxhdpi/splash.png',
		width: 1080,
		height: 1920,
		platform: 'android',
		type: 'splash',
	},
	{
		name: 'drawable-xxxhdpi/splash.png',
		width: 1440,
		height: 2560,
		platform: 'android',
		type: 'splash',
	},
]

// ─── Android Night Splash Screens (API 29+) ────────────────────────────────

/**
 * Android dark mode splash screens using -night resource qualifier.
 * Android automatically uses these when the device is in dark mode.
 */
export const ANDROID_SPLASH_DARK: AssetSpec[] = [
	{
		name: 'drawable-night-mdpi/splash.png',
		width: 320,
		height: 480,
		platform: 'android',
		type: 'splash',
		colorMode: 'dark',
	},
	{
		name: 'drawable-night-hdpi/splash.png',
		width: 480,
		height: 800,
		platform: 'android',
		type: 'splash',
		colorMode: 'dark',
	},
	{
		name: 'drawable-night-xhdpi/splash.png',
		width: 720,
		height: 1280,
		platform: 'android',
		type: 'splash',
		colorMode: 'dark',
	},
	{
		name: 'drawable-night-xxhdpi/splash.png',
		width: 1080,
		height: 1920,
		platform: 'android',
		type: 'splash',
		colorMode: 'dark',
	},
	{
		name: 'drawable-night-xxxhdpi/splash.png',
		width: 1440,
		height: 2560,
		platform: 'android',
		type: 'splash',
		colorMode: 'dark',
	},
]

// ─── Android Monochrome Icons (API 33+) ────────────────────────────────────

/**
 * Android 13+ themed icon support via monochrome layer.
 * These icons should be single-color (typically white on transparent).
 * The system applies the user's theme color to them.
 */
export const ANDROID_MONOCHROME_ICONS: AssetSpec[] = [
	{
		name: 'mipmap-mdpi/ic_launcher_monochrome.png',
		width: 108,
		height: 108,
		platform: 'android',
		type: 'adaptive',
		colorMode: 'any',
	},
	{
		name: 'mipmap-hdpi/ic_launcher_monochrome.png',
		width: 162,
		height: 162,
		platform: 'android',
		type: 'adaptive',
		colorMode: 'any',
	},
	{
		name: 'mipmap-xhdpi/ic_launcher_monochrome.png',
		width: 216,
		height: 216,
		platform: 'android',
		type: 'adaptive',
		colorMode: 'any',
	},
	{
		name: 'mipmap-xxhdpi/ic_launcher_monochrome.png',
		width: 324,
		height: 324,
		platform: 'android',
		type: 'adaptive',
		colorMode: 'any',
	},
	{
		name: 'mipmap-xxxhdpi/ic_launcher_monochrome.png',
		width: 432,
		height: 432,
		platform: 'android',
		type: 'adaptive',
		colorMode: 'any',
	},
]

// ─── Web Favicons ──────────────────────────────────────────────────────────

/**
 * Web favicons for browsers, PWAs, and platform integrations.
 * Includes standard favicons and Apple touch icons.
 */
export const WEB_FAVICONS: AssetSpec[] = [
	// Standard favicons
	{
		name: 'favicon-16x16.png',
		width: 16,
		height: 16,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'favicon-32x32.png',
		width: 32,
		height: 32,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'favicon-48x48.png',
		width: 48,
		height: 48,
		platform: 'web',
		type: 'favicon',
	},

	// Apple Touch Icons
	{
		name: 'apple-touch-icon-57x57.png',
		width: 57,
		height: 57,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'apple-touch-icon-60x60.png',
		width: 60,
		height: 60,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'apple-touch-icon-72x72.png',
		width: 72,
		height: 72,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'apple-touch-icon-76x76.png',
		width: 76,
		height: 76,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'apple-touch-icon-114x114.png',
		width: 114,
		height: 114,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'apple-touch-icon-120x120.png',
		width: 120,
		height: 120,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'apple-touch-icon-144x144.png',
		width: 144,
		height: 144,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'apple-touch-icon-152x152.png',
		width: 152,
		height: 152,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'apple-touch-icon-180x180.png',
		width: 180,
		height: 180,
		platform: 'web',
		type: 'favicon',
	},

	// PWA icons
	{
		name: 'android-chrome-192x192.png',
		width: 192,
		height: 192,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'android-chrome-512x512.png',
		width: 512,
		height: 512,
		platform: 'web',
		type: 'favicon',
	},
]

// ─── Utility Functions ─────────────────────────────────────────────────────

/**
 * Get all asset specifications for a given platform.
 * Light mode only (default behavior).
 */
export function getAssetsByPlatform(
	platform: 'ios' | 'android' | 'web',
): AssetSpec[] {
	switch (platform) {
		case 'ios':
			return [...IOS_ICONS, ...IOS_SPLASH]
		case 'android':
			return [...ANDROID_ICONS, ...ANDROID_ADAPTIVE_ICONS, ...ANDROID_SPLASH]
		case 'web':
			return WEB_FAVICONS
	}
}

/**
 * Get dark mode asset specifications for a given platform.
 * Only returns specs that have colorMode: 'dark' or 'any'.
 */
export function getDarkAssetsByPlatform(
	platform: 'ios' | 'android' | 'web',
): AssetSpec[] {
	switch (platform) {
		case 'ios':
			return [...IOS_ICONS_DARK]
		case 'android':
			return [...ANDROID_SPLASH_DARK, ...ANDROID_MONOCHROME_ICONS]
		case 'web':
			return [] // Web uses CSS prefers-color-scheme, no separate assets
	}
}

/**
 * Get all asset specifications for a given type.
 */
export function getAssetsByType(
	type: 'icon' | 'splash' | 'adaptive' | 'favicon',
): AssetSpec[] {
	switch (type) {
		case 'icon':
			return [...IOS_ICONS, ...ANDROID_ICONS]
		case 'splash':
			return [...IOS_SPLASH, ...ANDROID_SPLASH]
		case 'adaptive':
			return ANDROID_ADAPTIVE_ICONS
		case 'favicon':
			return WEB_FAVICONS
	}
}

/**
 * Get dark mode asset specifications for a given type.
 */
export function getDarkAssetsByType(
	type: 'icon' | 'splash' | 'adaptive' | 'favicon',
): AssetSpec[] {
	switch (type) {
		case 'icon':
			return [...IOS_ICONS_DARK]
		case 'splash':
			return [...ANDROID_SPLASH_DARK]
		case 'adaptive':
			return ANDROID_MONOCHROME_ICONS
		case 'favicon':
			return [] // Web uses CSS, no separate dark favicons
	}
}

/**
 * Get all asset specifications (light mode only).
 */
export function getAllAssets(): AssetSpec[] {
	return [
		...IOS_ICONS,
		...IOS_SPLASH,
		...ANDROID_ICONS,
		...ANDROID_ADAPTIVE_ICONS,
		...ANDROID_SPLASH,
		...WEB_FAVICONS,
	]
}

/**
 * Get all dark mode asset specifications.
 */
export function getAllDarkAssets(): AssetSpec[] {
	return [
		...IOS_ICONS_DARK,
		...ANDROID_SPLASH_DARK,
		...ANDROID_MONOCHROME_ICONS,
	]
}
