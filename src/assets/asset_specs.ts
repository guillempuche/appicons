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

import type { AssetSpec } from '../types'

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
	{
		name: 'ios/icon-20.png',
		width: 20,
		height: 20,
		platform: 'ios',
		type: 'icon',
	},
	{
		name: 'ios/icon-20@2x.png',
		width: 40,
		height: 40,
		platform: 'ios',
		type: 'icon',
		scale: 2,
	},
	{
		name: 'ios/icon-20@3x.png',
		width: 60,
		height: 60,
		platform: 'ios',
		type: 'icon',
		scale: 3,
	},

	// Settings
	{
		name: 'ios/icon-29.png',
		width: 29,
		height: 29,
		platform: 'ios',
		type: 'icon',
	},
	{
		name: 'ios/icon-29@2x.png',
		width: 58,
		height: 58,
		platform: 'ios',
		type: 'icon',
		scale: 2,
	},
	{
		name: 'ios/icon-29@3x.png',
		width: 87,
		height: 87,
		platform: 'ios',
		type: 'icon',
		scale: 3,
	},

	// Spotlight
	{
		name: 'ios/icon-40.png',
		width: 40,
		height: 40,
		platform: 'ios',
		type: 'icon',
	},
	{
		name: 'ios/icon-40@2x.png',
		width: 80,
		height: 80,
		platform: 'ios',
		type: 'icon',
		scale: 2,
	},
	{
		name: 'ios/icon-40@3x.png',
		width: 120,
		height: 120,
		platform: 'ios',
		type: 'icon',
		scale: 3,
	},

	// App Icon (iPhone)
	{
		name: 'ios/icon-60@2x.png',
		width: 120,
		height: 120,
		platform: 'ios',
		type: 'icon',
		scale: 2,
	},
	{
		name: 'ios/icon-60@3x.png',
		width: 180,
		height: 180,
		platform: 'ios',
		type: 'icon',
		scale: 3,
	},

	// App Icon (iPad)
	{
		name: 'ios/icon-76.png',
		width: 76,
		height: 76,
		platform: 'ios',
		type: 'icon',
	},
	{
		name: 'ios/icon-76@2x.png',
		width: 152,
		height: 152,
		platform: 'ios',
		type: 'icon',
		scale: 2,
	},

	// iPad Pro
	{
		name: 'ios/icon-83.5@2x.png',
		width: 167,
		height: 167,
		platform: 'ios',
		type: 'icon',
		scale: 2,
	},

	// App Store
	{
		name: 'ios/icon-1024.png',
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
		name: 'ios/dark/icon-60@2x.png',
		width: 120,
		height: 120,
		platform: 'ios',
		type: 'icon',
		scale: 2,
		colorMode: 'dark',
	},
	{
		name: 'ios/dark/icon-60@3x.png',
		width: 180,
		height: 180,
		platform: 'ios',
		type: 'icon',
		scale: 3,
		colorMode: 'dark',
	},
	{
		name: 'ios/dark/icon-76@2x.png',
		width: 152,
		height: 152,
		platform: 'ios',
		type: 'icon',
		scale: 2,
		colorMode: 'dark',
	},
	{
		name: 'ios/dark/icon-83.5@2x.png',
		width: 167,
		height: 167,
		platform: 'ios',
		type: 'icon',
		scale: 2,
		colorMode: 'dark',
	},
	{
		name: 'ios/dark/icon-1024.png',
		width: 1024,
		height: 1024,
		platform: 'ios',
		type: 'icon',
		colorMode: 'dark',
	},
]

// ─── iOS Tinted App Icons (iOS 18+) ────────────────────────────────────────

/**
 * iOS 18+ tinted app icons.
 * Monochrome icons where the system applies the user's wallpaper tint color.
 * Generated as white foreground on transparent background.
 * Placed in tinted/ subfolder for Xcode asset catalog.
 */
export const IOS_ICONS_TINTED: AssetSpec[] = [
	{
		name: 'ios/tinted/icon-60@2x.png',
		width: 120,
		height: 120,
		platform: 'ios',
		type: 'icon',
		scale: 2,
		colorMode: 'tinted',
	},
	{
		name: 'ios/tinted/icon-60@3x.png',
		width: 180,
		height: 180,
		platform: 'ios',
		type: 'icon',
		scale: 3,
		colorMode: 'tinted',
	},
	{
		name: 'ios/tinted/icon-76@2x.png',
		width: 152,
		height: 152,
		platform: 'ios',
		type: 'icon',
		scale: 2,
		colorMode: 'tinted',
	},
	{
		name: 'ios/tinted/icon-83.5@2x.png',
		width: 167,
		height: 167,
		platform: 'ios',
		type: 'icon',
		scale: 2,
		colorMode: 'tinted',
	},
	{
		name: 'ios/tinted/icon-1024.png',
		width: 1024,
		height: 1024,
		platform: 'ios',
		type: 'icon',
		colorMode: 'tinted',
	},
]

// ─── iOS Clear Light App Icons (iOS 18+) ───────────────────────────────────

/**
 * iOS 18+ clear light app icons.
 * Translucent background for light mode with semi-transparent white.
 * Placed in clear-light/ subfolder for Xcode asset catalog.
 */
export const IOS_ICONS_CLEAR_LIGHT: AssetSpec[] = [
	{
		name: 'ios/clear-light/icon-60@2x.png',
		width: 120,
		height: 120,
		platform: 'ios',
		type: 'icon',
		scale: 2,
		colorMode: 'clear-light',
	},
	{
		name: 'ios/clear-light/icon-60@3x.png',
		width: 180,
		height: 180,
		platform: 'ios',
		type: 'icon',
		scale: 3,
		colorMode: 'clear-light',
	},
	{
		name: 'ios/clear-light/icon-76@2x.png',
		width: 152,
		height: 152,
		platform: 'ios',
		type: 'icon',
		scale: 2,
		colorMode: 'clear-light',
	},
	{
		name: 'ios/clear-light/icon-83.5@2x.png',
		width: 167,
		height: 167,
		platform: 'ios',
		type: 'icon',
		scale: 2,
		colorMode: 'clear-light',
	},
	{
		name: 'ios/clear-light/icon-1024.png',
		width: 1024,
		height: 1024,
		platform: 'ios',
		type: 'icon',
		colorMode: 'clear-light',
	},
]

// ─── iOS Clear Dark App Icons (iOS 18+) ────────────────────────────────────

/**
 * iOS 18+ clear dark app icons.
 * Translucent background for dark mode with semi-transparent black.
 * Placed in clear-dark/ subfolder for Xcode asset catalog.
 */
export const IOS_ICONS_CLEAR_DARK: AssetSpec[] = [
	{
		name: 'ios/clear-dark/icon-60@2x.png',
		width: 120,
		height: 120,
		platform: 'ios',
		type: 'icon',
		scale: 2,
		colorMode: 'clear-dark',
	},
	{
		name: 'ios/clear-dark/icon-60@3x.png',
		width: 180,
		height: 180,
		platform: 'ios',
		type: 'icon',
		scale: 3,
		colorMode: 'clear-dark',
	},
	{
		name: 'ios/clear-dark/icon-76@2x.png',
		width: 152,
		height: 152,
		platform: 'ios',
		type: 'icon',
		scale: 2,
		colorMode: 'clear-dark',
	},
	{
		name: 'ios/clear-dark/icon-83.5@2x.png',
		width: 167,
		height: 167,
		platform: 'ios',
		type: 'icon',
		scale: 2,
		colorMode: 'clear-dark',
	},
	{
		name: 'ios/clear-dark/icon-1024.png',
		width: 1024,
		height: 1024,
		platform: 'ios',
		type: 'icon',
		colorMode: 'clear-dark',
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
		name: 'ios/splash-1290x2796.png',
		width: 1290,
		height: 2796,
		platform: 'ios',
		type: 'splash',
	},

	// iPhone 15 Pro, 14 Pro, 13 Pro, 12 Pro
	{
		name: 'ios/splash-1179x2556.png',
		width: 1179,
		height: 2556,
		platform: 'ios',
		type: 'splash',
	},

	// iPhone 15, 14, 13, 12
	{
		name: 'ios/splash-1170x2532.png',
		width: 1170,
		height: 2532,
		platform: 'ios',
		type: 'splash',
	},

	// iPhone 11 Pro Max, XS Max
	{
		name: 'ios/splash-1242x2688.png',
		width: 1242,
		height: 2688,
		platform: 'ios',
		type: 'splash',
	},

	// iPhone 11 Pro, X, XS
	{
		name: 'ios/splash-1125x2436.png',
		width: 1125,
		height: 2436,
		platform: 'ios',
		type: 'splash',
	},

	// iPhone 11, XR
	{
		name: 'ios/splash-828x1792.png',
		width: 828,
		height: 1792,
		platform: 'ios',
		type: 'splash',
	},

	// iPhone 8 Plus, 7 Plus, 6s Plus
	{
		name: 'ios/splash-1242x2208.png',
		width: 1242,
		height: 2208,
		platform: 'ios',
		type: 'splash',
	},

	// iPhone 8, 7, 6s, SE (2nd/3rd gen)
	{
		name: 'ios/splash-750x1334.png',
		width: 750,
		height: 1334,
		platform: 'ios',
		type: 'splash',
	},

	// iPhone SE (1st gen), iPod touch
	{
		name: 'ios/splash-640x1136.png',
		width: 640,
		height: 1136,
		platform: 'ios',
		type: 'splash',
	},

	// iPad Pro 12.9" (3rd-6th gen)
	{
		name: 'ios/splash-2048x2732.png',
		width: 2048,
		height: 2732,
		platform: 'ios',
		type: 'splash',
	},

	// iPad Pro 11" (1st-4th gen)
	{
		name: 'ios/splash-1668x2388.png',
		width: 1668,
		height: 2388,
		platform: 'ios',
		type: 'splash',
	},

	// iPad Pro 10.5", Air (3rd gen)
	{
		name: 'ios/splash-1668x2224.png',
		width: 1668,
		height: 2224,
		platform: 'ios',
		type: 'splash',
	},

	// iPad Mini (6th gen), iPad (9th-10th gen)
	{
		name: 'ios/splash-1536x2048.png',
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
		name: 'android/mipmap-mdpi/ic_launcher.png',
		width: 48,
		height: 48,
		platform: 'android',
		type: 'icon',
	},
	{
		name: 'android/mipmap-hdpi/ic_launcher.png',
		width: 72,
		height: 72,
		platform: 'android',
		type: 'icon',
	},
	{
		name: 'android/mipmap-xhdpi/ic_launcher.png',
		width: 96,
		height: 96,
		platform: 'android',
		type: 'icon',
	},
	{
		name: 'android/mipmap-xxhdpi/ic_launcher.png',
		width: 144,
		height: 144,
		platform: 'android',
		type: 'icon',
	},
	{
		name: 'android/mipmap-xxxhdpi/ic_launcher.png',
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
		name: 'android/mipmap-mdpi/ic_launcher_foreground.png',
		width: 108,
		height: 108,
		platform: 'android',
		type: 'adaptive',
	},
	{
		name: 'android/mipmap-hdpi/ic_launcher_foreground.png',
		width: 162,
		height: 162,
		platform: 'android',
		type: 'adaptive',
	},
	{
		name: 'android/mipmap-xhdpi/ic_launcher_foreground.png',
		width: 216,
		height: 216,
		platform: 'android',
		type: 'adaptive',
	},
	{
		name: 'android/mipmap-xxhdpi/ic_launcher_foreground.png',
		width: 324,
		height: 324,
		platform: 'android',
		type: 'adaptive',
	},
	{
		name: 'android/mipmap-xxxhdpi/ic_launcher_foreground.png',
		width: 432,
		height: 432,
		platform: 'android',
		type: 'adaptive',
	},

	// Background layer (can be color or image)
	{
		name: 'android/mipmap-mdpi/ic_launcher_background.png',
		width: 108,
		height: 108,
		platform: 'android',
		type: 'adaptive',
	},
	{
		name: 'android/mipmap-hdpi/ic_launcher_background.png',
		width: 162,
		height: 162,
		platform: 'android',
		type: 'adaptive',
	},
	{
		name: 'android/mipmap-xhdpi/ic_launcher_background.png',
		width: 216,
		height: 216,
		platform: 'android',
		type: 'adaptive',
	},
	{
		name: 'android/mipmap-xxhdpi/ic_launcher_background.png',
		width: 324,
		height: 324,
		platform: 'android',
		type: 'adaptive',
	},
	{
		name: 'android/mipmap-xxxhdpi/ic_launcher_background.png',
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
		name: 'android/drawable-mdpi/splash.png',
		width: 320,
		height: 480,
		platform: 'android',
		type: 'splash',
	},
	{
		name: 'android/drawable-hdpi/splash.png',
		width: 480,
		height: 800,
		platform: 'android',
		type: 'splash',
	},
	{
		name: 'android/drawable-xhdpi/splash.png',
		width: 720,
		height: 1280,
		platform: 'android',
		type: 'splash',
	},
	{
		name: 'android/drawable-xxhdpi/splash.png',
		width: 1080,
		height: 1920,
		platform: 'android',
		type: 'splash',
	},
	{
		name: 'android/drawable-xxxhdpi/splash.png',
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
		name: 'android/drawable-night-mdpi/splash.png',
		width: 320,
		height: 480,
		platform: 'android',
		type: 'splash',
		colorMode: 'dark',
	},
	{
		name: 'android/drawable-night-hdpi/splash.png',
		width: 480,
		height: 800,
		platform: 'android',
		type: 'splash',
		colorMode: 'dark',
	},
	{
		name: 'android/drawable-night-xhdpi/splash.png',
		width: 720,
		height: 1280,
		platform: 'android',
		type: 'splash',
		colorMode: 'dark',
	},
	{
		name: 'android/drawable-night-xxhdpi/splash.png',
		width: 1080,
		height: 1920,
		platform: 'android',
		type: 'splash',
		colorMode: 'dark',
	},
	{
		name: 'android/drawable-night-xxxhdpi/splash.png',
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
		name: 'android/mipmap-mdpi/ic_launcher_monochrome.png',
		width: 108,
		height: 108,
		platform: 'android',
		type: 'adaptive',
		colorMode: 'any',
	},
	{
		name: 'android/mipmap-hdpi/ic_launcher_monochrome.png',
		width: 162,
		height: 162,
		platform: 'android',
		type: 'adaptive',
		colorMode: 'any',
	},
	{
		name: 'android/mipmap-xhdpi/ic_launcher_monochrome.png',
		width: 216,
		height: 216,
		platform: 'android',
		type: 'adaptive',
		colorMode: 'any',
	},
	{
		name: 'android/mipmap-xxhdpi/ic_launcher_monochrome.png',
		width: 324,
		height: 324,
		platform: 'android',
		type: 'adaptive',
		colorMode: 'any',
	},
	{
		name: 'android/mipmap-xxxhdpi/ic_launcher_monochrome.png',
		width: 432,
		height: 432,
		platform: 'android',
		type: 'adaptive',
		colorMode: 'any',
	},
]

// ─── Store Listing Assets ──────────────────────────────────────────────────

/**
 * Store listing assets for app stores.
 * - Play Store icon: 512×512 (required for Google Play)
 * - Feature graphic: 1024×500 (Play Store feature banner)
 * - TV banner: 1280×720 (Google Play TV apps)
 * - App Store icon: 1024×1024 (same as ios/icon-1024, but in store/ folder)
 */
export const STORE_ASSETS: AssetSpec[] = [
	{
		name: 'store/android/play-store-icon.png',
		width: 512,
		height: 512,
		platform: 'android',
		type: 'store',
	},
	{
		name: 'store/android/feature-graphic.png',
		width: 1024,
		height: 500,
		platform: 'android',
		type: 'store',
	},
	{
		name: 'store/android/tv-banner.png',
		width: 1280,
		height: 720,
		platform: 'android',
		type: 'store',
	},
	{
		name: 'store/ios/app-store-icon.png',
		width: 1024,
		height: 1024,
		platform: 'ios',
		type: 'store',
	},
]

// ─── watchOS Icons ─────────────────────────────────────────────────────────

/**
 * watchOS app icons for Apple Watch.
 * Icons are circular (system applies mask).
 * Safe zone: 80% diameter.
 *
 * Sizes per Apple HIG:
 * - 48pt @2x (96px): 38mm/40mm Notification Center
 * - 80pt @2x (160px): 40mm/44mm Home Screen
 * - 88pt @2x (176px): 38mm Long-Look
 * - 92pt @2x (184px): 40mm Long-Look
 * - 172pt @2x (344px): 44mm Long-Look
 * - 196pt @2x (392px): 45mm Long-Look
 * - 216pt @2x (432px): 49mm Long-Look
 * - 234pt @2x (468px): 44mm Home Screen
 * - 1024px: App Store
 */
export const WATCHOS_ICONS: AssetSpec[] = [
	{
		name: 'watchos/icon-1024.png',
		width: 1024,
		height: 1024,
		platform: 'watchos',
		type: 'icon',
	},
	{
		name: 'watchos/icon-48@2x.png',
		width: 96,
		height: 96,
		platform: 'watchos',
		type: 'icon',
		scale: 2,
	},
	{
		name: 'watchos/icon-80@2x.png',
		width: 160,
		height: 160,
		platform: 'watchos',
		type: 'icon',
		scale: 2,
	},
	{
		name: 'watchos/icon-88@2x.png',
		width: 176,
		height: 176,
		platform: 'watchos',
		type: 'icon',
		scale: 2,
	},
	{
		name: 'watchos/icon-92@2x.png',
		width: 184,
		height: 184,
		platform: 'watchos',
		type: 'icon',
		scale: 2,
	},
	{
		name: 'watchos/icon-172@2x.png',
		width: 344,
		height: 344,
		platform: 'watchos',
		type: 'icon',
		scale: 2,
	},
	{
		name: 'watchos/icon-196@2x.png',
		width: 392,
		height: 392,
		platform: 'watchos',
		type: 'icon',
		scale: 2,
	},
	{
		name: 'watchos/icon-216@2x.png',
		width: 432,
		height: 432,
		platform: 'watchos',
		type: 'icon',
		scale: 2,
	},
	{
		name: 'watchos/icon-234@2x.png',
		width: 468,
		height: 468,
		platform: 'watchos',
		type: 'icon',
		scale: 2,
	},
]

// ─── tvOS Icons ────────────────────────────────────────────────────────────

/**
 * tvOS app icons for Apple TV.
 * Uses layered image stacks for parallax effect.
 * Dimensions: 400×240 @1x, 800×480 @2x per Apple HIG.
 * Safe zone: Inner 80% of canvas.
 *
 * Top Shelf: Banner shown when app is focused on top row.
 * 1920×720 @1x, 3840×1440 @2x.
 */
export const TVOS_ICONS: AssetSpec[] = [
	// Background layer
	{
		name: 'tvos/icon-back.png',
		width: 400,
		height: 240,
		platform: 'tvos',
		type: 'icon',
	},
	{
		name: 'tvos/icon-back@2x.png',
		width: 800,
		height: 480,
		platform: 'tvos',
		type: 'icon',
		scale: 2,
	},
	// Foreground layer
	{
		name: 'tvos/icon-front.png',
		width: 400,
		height: 240,
		platform: 'tvos',
		type: 'icon',
	},
	{
		name: 'tvos/icon-front@2x.png',
		width: 800,
		height: 480,
		platform: 'tvos',
		type: 'icon',
		scale: 2,
	},
	// Top Shelf banner
	{
		name: 'tvos/top-shelf.png',
		width: 1920,
		height: 720,
		platform: 'tvos',
		type: 'icon',
	},
	{
		name: 'tvos/top-shelf@2x.png',
		width: 3840,
		height: 1440,
		platform: 'tvos',
		type: 'icon',
		scale: 2,
	},
]

// ─── visionOS Icons ────────────────────────────────────────────────────────

/**
 * visionOS app icons for Apple Vision Pro.
 * Icons are circular (system applies mask).
 * Safe zone: 80% diameter.
 * Supports optional layered 3D effect with back/front layers.
 */
export const VISIONOS_ICONS: AssetSpec[] = [
	{
		name: 'visionos/icon-1024.png',
		width: 1024,
		height: 1024,
		platform: 'visionos',
		type: 'icon',
	},
	{
		name: 'visionos/icon-back.png',
		width: 1024,
		height: 1024,
		platform: 'visionos',
		type: 'icon',
	},
	{
		name: 'visionos/icon-front.png',
		width: 1024,
		height: 1024,
		platform: 'visionos',
		type: 'icon',
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
		name: 'web/favicon-16x16.png',
		width: 16,
		height: 16,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'web/favicon-32x32.png',
		width: 32,
		height: 32,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'web/favicon-48x48.png',
		width: 48,
		height: 48,
		platform: 'web',
		type: 'favicon',
	},

	// Apple Touch Icons
	{
		name: 'web/apple-touch-icon-57x57.png',
		width: 57,
		height: 57,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'web/apple-touch-icon-60x60.png',
		width: 60,
		height: 60,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'web/apple-touch-icon-72x72.png',
		width: 72,
		height: 72,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'web/apple-touch-icon-76x76.png',
		width: 76,
		height: 76,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'web/apple-touch-icon-114x114.png',
		width: 114,
		height: 114,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'web/apple-touch-icon-120x120.png',
		width: 120,
		height: 120,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'web/apple-touch-icon-144x144.png',
		width: 144,
		height: 144,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'web/apple-touch-icon-152x152.png',
		width: 152,
		height: 152,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'web/apple-touch-icon-180x180.png',
		width: 180,
		height: 180,
		platform: 'web',
		type: 'favicon',
	},

	// PWA icons (any purpose - standard icons)
	{
		name: 'web/icon-192x192.png',
		width: 192,
		height: 192,
		platform: 'web',
		type: 'favicon',
	},
	{
		name: 'web/icon-512x512.png',
		width: 512,
		height: 512,
		platform: 'web',
		type: 'favicon',
	},

	// PWA maskable icons (safe zone aware, for adaptive icon display)
	{
		name: 'web/icon-maskable-192x192.png',
		width: 192,
		height: 192,
		platform: 'web',
		type: 'favicon',
		colorMode: 'any', // Indicates maskable (safe zone aware)
	},
	{
		name: 'web/icon-maskable-512x512.png',
		width: 512,
		height: 512,
		platform: 'web',
		type: 'favicon',
		colorMode: 'any', // Indicates maskable (safe zone aware)
	},

	// PWA monochrome icons (for themed/tinted display)
	{
		name: 'web/icon-monochrome-192x192.png',
		width: 192,
		height: 192,
		platform: 'web',
		type: 'favicon',
		colorMode: 'tinted', // Indicates monochrome
	},
	{
		name: 'web/icon-monochrome-512x512.png',
		width: 512,
		height: 512,
		platform: 'web',
		type: 'favicon',
		colorMode: 'tinted', // Indicates monochrome
	},
]

// ─── Utility Functions ─────────────────────────────────────────────────────

/**
 * Get all asset specifications for a given platform.
 * Light mode only (default behavior).
 */
export function getAssetsByPlatform(
	platform: 'ios' | 'android' | 'web' | 'watchos' | 'tvos' | 'visionos',
): AssetSpec[] {
	const storeForPlatform = STORE_ASSETS.filter(s => s.platform === platform)
	switch (platform) {
		case 'ios':
			return [...IOS_ICONS, ...IOS_SPLASH, ...storeForPlatform]
		case 'android':
			return [
				...ANDROID_ICONS,
				...ANDROID_ADAPTIVE_ICONS,
				...ANDROID_SPLASH,
				...storeForPlatform,
			]
		case 'web':
			return WEB_FAVICONS
		case 'watchos':
			return WATCHOS_ICONS
		case 'tvos':
			return TVOS_ICONS
		case 'visionos':
			return VISIONOS_ICONS
	}
}

/**
 * Get all variant (dark, tinted, clear) asset specifications for a given platform.
 * Returns specs that have colorMode set to any non-light value.
 */
export function getVariantAssetsByPlatform(
	platform: 'ios' | 'android' | 'web' | 'watchos' | 'tvos' | 'visionos',
): AssetSpec[] {
	switch (platform) {
		case 'ios':
			return [
				...IOS_ICONS_DARK,
				...IOS_ICONS_TINTED,
				...IOS_ICONS_CLEAR_LIGHT,
				...IOS_ICONS_CLEAR_DARK,
			]
		case 'android':
			return [...ANDROID_SPLASH_DARK, ...ANDROID_MONOCHROME_ICONS]
		case 'web':
			// Web maskable and monochrome icons are included in WEB_FAVICONS
			// They have colorMode set to identify their purpose
			return WEB_FAVICONS.filter(spec => spec.colorMode !== undefined)
		case 'watchos':
		case 'tvos':
		case 'visionos':
			// New platforms don't have variants yet
			return []
	}
}

/**
 * @deprecated Use getVariantAssetsByPlatform instead.
 * Get dark mode asset specifications for a given platform.
 */
export function getDarkAssetsByPlatform(
	platform: 'ios' | 'android' | 'web',
): AssetSpec[] {
	return getVariantAssetsByPlatform(platform)
}

/**
 * Get all asset specifications for a given type.
 */
export function getAssetsByType(
	type: 'icon' | 'splash' | 'adaptive' | 'favicon' | 'store',
): AssetSpec[] {
	switch (type) {
		case 'icon':
			return [
				...IOS_ICONS,
				...ANDROID_ICONS,
				...WATCHOS_ICONS,
				...TVOS_ICONS,
				...VISIONOS_ICONS,
			]
		case 'splash':
			return [...IOS_SPLASH, ...ANDROID_SPLASH]
		case 'adaptive':
			return ANDROID_ADAPTIVE_ICONS
		case 'favicon':
			return WEB_FAVICONS
		case 'store':
			return STORE_ASSETS
	}
}

/**
 * Get all variant (dark, tinted, clear) asset specifications for a given type.
 */
export function getVariantAssetsByType(
	type: 'icon' | 'splash' | 'adaptive' | 'favicon' | 'store',
): AssetSpec[] {
	switch (type) {
		case 'icon':
			return [
				...IOS_ICONS_DARK,
				...IOS_ICONS_TINTED,
				...IOS_ICONS_CLEAR_LIGHT,
				...IOS_ICONS_CLEAR_DARK,
			]
		case 'splash':
			return [...ANDROID_SPLASH_DARK]
		case 'adaptive':
			return ANDROID_MONOCHROME_ICONS
		case 'favicon':
			// Web maskable and monochrome icons
			return WEB_FAVICONS.filter(spec => spec.colorMode !== undefined)
		case 'store':
			// Store assets don't have variants
			return []
	}
}

/**
 * @deprecated Use getVariantAssetsByType instead.
 * Get dark mode asset specifications for a given type.
 */
export function getDarkAssetsByType(
	type: 'icon' | 'splash' | 'adaptive' | 'favicon',
): AssetSpec[] {
	return getVariantAssetsByType(type)
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
		...STORE_ASSETS,
		...WATCHOS_ICONS,
		...TVOS_ICONS,
		...VISIONOS_ICONS,
	]
}

/**
 * Get all variant (dark, tinted, clear, monochrome) asset specifications.
 */
export function getAllVariantAssets(): AssetSpec[] {
	return [
		...IOS_ICONS_DARK,
		...IOS_ICONS_TINTED,
		...IOS_ICONS_CLEAR_LIGHT,
		...IOS_ICONS_CLEAR_DARK,
		...ANDROID_SPLASH_DARK,
		...ANDROID_MONOCHROME_ICONS,
		...WEB_FAVICONS.filter(spec => spec.colorMode !== undefined),
	]
}

/**
 * @deprecated Use getAllVariantAssets instead.
 * Get all dark mode asset specifications.
 */
export function getAllDarkAssets(): AssetSpec[] {
	return getAllVariantAssets()
}
