/**
 * Tests for asset specifications.
 *
 * Tests platform/type filtering and deduplication.
 */

import { describe, expect, it } from 'vitest'

import {
	ANDROID_ADAPTIVE_ICONS,
	ANDROID_ICONS,
	ANDROID_MONOCHROME_ICONS,
	ANDROID_SPLASH,
	ANDROID_SPLASH_DARK,
	getAllAssets,
	getAllVariantAssets,
	getAssetsByPlatform,
	getAssetsByType,
	getVariantAssetsByPlatform,
	getVariantAssetsByType,
	IOS_ICONS,
	IOS_ICONS_CLEAR_DARK,
	IOS_ICONS_CLEAR_LIGHT,
	IOS_ICONS_DARK,
	IOS_ICONS_TINTED,
	IOS_SPLASH,
	STORE_ASSETS,
	TVOS_ICONS,
	VISIONOS_ICONS,
	WATCHOS_ICONS,
	WEB_FAVICONS,
} from '../../assets/asset_specs'

describe('AssetSpecs', () => {
	describe('iOS icons', () => {
		it('should have required icon sizes', () => {
			// GIVEN the iOS icons specification
			const iconSizes = IOS_ICONS.map(i => i.width)

			// THEN all required iOS sizes should be present
			expect(iconSizes).toContain(20) // Notification
			expect(iconSizes).toContain(29) // Settings
			expect(iconSizes).toContain(40) // Spotlight
			expect(iconSizes).toContain(60) // App icon (with scale)
			expect(iconSizes).toContain(76) // iPad
			expect(iconSizes).toContain(1024) // App Store
		})

		it('should have @2x and @3x variants', () => {
			// GIVEN the iOS icons specification
			const hasScale2 = IOS_ICONS.some(i => i.scale === 2)
			const hasScale3 = IOS_ICONS.some(i => i.scale === 3)

			// THEN both @2x and @3x scale variants should exist
			expect(hasScale2).toBe(true)
			expect(hasScale3).toBe(true)
		})

		it('should all be square', () => {
			// GIVEN the iOS icons specification
			// THEN all icons should have equal width and height
			for (const icon of IOS_ICONS) {
				expect(icon.width).toBe(icon.height)
			}
		})

		it('should all have ios platform', () => {
			// GIVEN the iOS icons specification
			// THEN all icons should have platform set to ios
			for (const icon of IOS_ICONS) {
				expect(icon.platform).toBe('ios')
			}
		})

		it('should all have icon type', () => {
			// GIVEN the iOS icons specification
			// THEN all icons should have type set to icon
			for (const icon of IOS_ICONS) {
				expect(icon.type).toBe('icon')
			}
		})
	})

	describe('iOS dark icons', () => {
		it('should have dark colorMode', () => {
			// GIVEN the iOS dark icons specification
			// THEN all icons should have colorMode set to dark
			for (const icon of IOS_ICONS_DARK) {
				expect(icon.colorMode).toBe('dark')
			}
		})

		it('should have dark path prefix', () => {
			// GIVEN the iOS dark icons specification
			// THEN all icon names should include dark/ path
			for (const icon of IOS_ICONS_DARK) {
				expect(icon.name).toContain('dark/')
			}
		})
	})

	describe('iOS tinted icons', () => {
		it('should have tinted colorMode', () => {
			// GIVEN the iOS tinted icons specification
			// THEN all icons should have colorMode set to tinted
			for (const icon of IOS_ICONS_TINTED) {
				expect(icon.colorMode).toBe('tinted')
			}
		})

		it('should have tinted path prefix', () => {
			// GIVEN the iOS tinted icons specification
			// THEN all icon names should include tinted/ path
			for (const icon of IOS_ICONS_TINTED) {
				expect(icon.name).toContain('tinted/')
			}
		})
	})

	describe('iOS clear icons', () => {
		it('should have clear-light colorMode', () => {
			// GIVEN the iOS clear light icons specification
			// THEN all icons should have colorMode set to clear-light
			for (const icon of IOS_ICONS_CLEAR_LIGHT) {
				expect(icon.colorMode).toBe('clear-light')
			}
		})

		it('should have clear-dark colorMode', () => {
			// GIVEN the iOS clear dark icons specification
			// THEN all icons should have colorMode set to clear-dark
			for (const icon of IOS_ICONS_CLEAR_DARK) {
				expect(icon.colorMode).toBe('clear-dark')
			}
		})
	})

	describe('iOS splash screens', () => {
		it('should have common device sizes', () => {
			// GIVEN the iOS splash screens specification
			const sizes = IOS_SPLASH.map(s => `${s.width}x${s.height}`)

			// THEN common iPhone sizes should be present
			expect(sizes).toContain('1170x2532') // iPhone 14/13/12
			expect(sizes).toContain('1125x2436') // iPhone X/XS
			expect(sizes).toContain('750x1334') // iPhone 8

			// AND common iPad sizes should be present
			expect(sizes).toContain('2048x2732') // iPad Pro 12.9"
		})

		it('should all have ios platform and splash type', () => {
			// GIVEN the iOS splash screens specification
			// THEN all splash screens should have correct platform and type
			for (const splash of IOS_SPLASH) {
				expect(splash.platform).toBe('ios')
				expect(splash.type).toBe('splash')
			}
		})
	})

	describe('Android icons', () => {
		it('should have all density buckets', () => {
			// GIVEN the Android icons specification
			const densities = ANDROID_ICONS.map(i => i.name)

			// THEN all density buckets should be present
			expect(densities.some(n => n.includes('mdpi'))).toBe(true)
			expect(densities.some(n => n.includes('hdpi'))).toBe(true)
			expect(densities.some(n => n.includes('xhdpi'))).toBe(true)
			expect(densities.some(n => n.includes('xxhdpi'))).toBe(true)
			expect(densities.some(n => n.includes('xxxhdpi'))).toBe(true)
		})

		it('should use mipmap directories', () => {
			// GIVEN the Android icons specification
			// THEN all icons should use mipmap- directories
			for (const icon of ANDROID_ICONS) {
				expect(icon.name).toContain('mipmap-')
			}
		})
	})

	describe('Android adaptive icons', () => {
		it('should have foreground and background layers', () => {
			// GIVEN the Android adaptive icons specification
			const hasForeground = ANDROID_ADAPTIVE_ICONS.some(i =>
				i.name.includes('foreground'),
			)
			const hasBackground = ANDROID_ADAPTIVE_ICONS.some(i =>
				i.name.includes('background'),
			)

			// THEN both foreground and background layers should exist
			expect(hasForeground).toBe(true)
			expect(hasBackground).toBe(true)
		})

		it('should have correct canvas sizes (108dp scaled)', () => {
			// GIVEN 108dp base size at different densities
			const expectedSizes = {
				mdpi: 108,
				hdpi: 162,
				xhdpi: 216,
				xxhdpi: 324,
				xxxhdpi: 432,
			}

			// THEN each density should have the correct scaled size
			for (const [density, size] of Object.entries(expectedSizes)) {
				const icon = ANDROID_ADAPTIVE_ICONS.find(
					i => i.name.includes(density) && i.name.includes('foreground'),
				)
				expect(icon?.width).toBe(size)
			}
		})

		it('should all have adaptive type', () => {
			// GIVEN the Android adaptive icons specification
			// THEN all icons should have type set to adaptive
			for (const icon of ANDROID_ADAPTIVE_ICONS) {
				expect(icon.type).toBe('adaptive')
			}
		})
	})

	describe('Android monochrome icons', () => {
		it('should have any colorMode', () => {
			// GIVEN the Android monochrome icons specification
			// THEN all icons should have colorMode set to any
			for (const icon of ANDROID_MONOCHROME_ICONS) {
				expect(icon.colorMode).toBe('any')
			}
		})

		it('should have monochrome in name', () => {
			// GIVEN the Android monochrome icons specification
			// THEN all icon names should include monochrome
			for (const icon of ANDROID_MONOCHROME_ICONS) {
				expect(icon.name).toContain('monochrome')
			}
		})
	})

	describe('Android splash screens', () => {
		it('should have all density buckets', () => {
			// GIVEN the Android splash screens specification
			const densities = ANDROID_SPLASH.map(s => s.name)

			// THEN density buckets should be present
			expect(densities.some(n => n.includes('mdpi'))).toBe(true)
			expect(densities.some(n => n.includes('xxxhdpi'))).toBe(true)
		})

		it('should use drawable directories', () => {
			// GIVEN the Android splash screens specification
			// THEN all splash screens should use drawable- directories
			for (const splash of ANDROID_SPLASH) {
				expect(splash.name).toContain('drawable-')
			}
		})
	})

	describe('Android dark splash screens', () => {
		it('should use drawable-night directories', () => {
			// GIVEN the Android dark splash screens specification
			// THEN all splash screens should use drawable-night- directories
			for (const splash of ANDROID_SPLASH_DARK) {
				expect(splash.name).toContain('drawable-night-')
			}
		})

		it('should have dark colorMode', () => {
			// GIVEN the Android dark splash screens specification
			// THEN all splash screens should have colorMode set to dark
			for (const splash of ANDROID_SPLASH_DARK) {
				expect(splash.colorMode).toBe('dark')
			}
		})
	})

	describe('Web favicons', () => {
		it('should have standard favicon sizes', () => {
			// GIVEN the web favicons specification
			const sizes = WEB_FAVICONS.map(f => f.width)

			// THEN standard favicon sizes should be present
			expect(sizes).toContain(16)
			expect(sizes).toContain(32)
			expect(sizes).toContain(48)
		})

		it('should have Apple touch icons', () => {
			// GIVEN the web favicons specification
			const hasAppleTouch = WEB_FAVICONS.some(f =>
				f.name.includes('apple-touch'),
			)

			// THEN Apple touch icons should exist
			expect(hasAppleTouch).toBe(true)
		})

		it('should have PWA icons', () => {
			// GIVEN the web favicons specification
			const sizes = WEB_FAVICONS.map(f => f.width)

			// THEN PWA-required sizes should be present
			expect(sizes).toContain(192)
			expect(sizes).toContain(512)
		})

		it('should have maskable icons', () => {
			// GIVEN the web favicons specification
			const hasMaskable = WEB_FAVICONS.some(f => f.name.includes('maskable'))

			// THEN maskable icons should exist
			expect(hasMaskable).toBe(true)
		})

		it('should have monochrome icons', () => {
			// GIVEN the web favicons specification
			const hasMonochrome = WEB_FAVICONS.some(f =>
				f.name.includes('monochrome'),
			)

			// THEN monochrome icons should exist
			expect(hasMonochrome).toBe(true)
		})
	})

	describe('getAssetsByPlatform', () => {
		it('should return iOS assets for ios platform', () => {
			// GIVEN the ios platform filter
			// WHEN getting assets by platform
			const assets = getAssetsByPlatform('ios')

			// THEN all returned assets should be iOS assets
			expect(assets.length).toBeGreaterThan(0)
			expect(assets.every(a => a.platform === 'ios')).toBe(true)
		})

		it('should return Android assets for android platform', () => {
			// GIVEN the android platform filter
			// WHEN getting assets by platform
			const assets = getAssetsByPlatform('android')

			// THEN all returned assets should be Android assets
			expect(assets.length).toBeGreaterThan(0)
			expect(assets.every(a => a.platform === 'android')).toBe(true)
		})

		it('should return Web assets for web platform', () => {
			// GIVEN the web platform filter
			// WHEN getting assets by platform
			const assets = getAssetsByPlatform('web')

			// THEN all returned assets should be web assets
			expect(assets.length).toBeGreaterThan(0)
			expect(assets.every(a => a.platform === 'web')).toBe(true)
		})

		it('should include icons and splash for iOS', () => {
			// GIVEN the ios platform filter
			// WHEN getting assets by platform
			const assets = getAssetsByPlatform('ios')

			// THEN both icon and splash types should be included
			expect(assets.some(a => a.type === 'icon')).toBe(true)
			expect(assets.some(a => a.type === 'splash')).toBe(true)
		})

		it('should include icons, adaptive, and splash for Android', () => {
			// GIVEN the android platform filter
			// WHEN getting assets by platform
			const assets = getAssetsByPlatform('android')

			// THEN icon, adaptive, and splash types should be included
			expect(assets.some(a => a.type === 'icon')).toBe(true)
			expect(assets.some(a => a.type === 'adaptive')).toBe(true)
			expect(assets.some(a => a.type === 'splash')).toBe(true)
		})
	})

	describe('getVariantAssetsByPlatform', () => {
		it('should return dark/tinted/clear variants for iOS', () => {
			// GIVEN the ios platform filter
			// WHEN getting variant assets by platform
			const variants = getVariantAssetsByPlatform('ios')

			// THEN all iOS color mode variants should be present
			expect(variants.some(a => a.colorMode === 'dark')).toBe(true)
			expect(variants.some(a => a.colorMode === 'tinted')).toBe(true)
			expect(variants.some(a => a.colorMode === 'clear-light')).toBe(true)
			expect(variants.some(a => a.colorMode === 'clear-dark')).toBe(true)
		})

		it('should return dark splash and monochrome for Android', () => {
			// GIVEN the android platform filter
			// WHEN getting variant assets by platform
			const variants = getVariantAssetsByPlatform('android')

			// THEN dark and monochrome variants should be present
			expect(variants.some(a => a.colorMode === 'dark')).toBe(true)
			expect(variants.some(a => a.colorMode === 'any')).toBe(true)
		})

		it('should return maskable and monochrome for Web', () => {
			// GIVEN the web platform filter
			// WHEN getting variant assets by platform
			const variants = getVariantAssetsByPlatform('web')

			// THEN variants with colorMode should be present
			expect(variants.some(a => a.colorMode !== undefined)).toBe(true)
		})
	})

	describe('getAssetsByType', () => {
		it('should return icon assets for icon type', () => {
			// GIVEN the icon type filter
			// WHEN getting assets by type
			const assets = getAssetsByType('icon')

			// THEN all returned assets should be icon type
			expect(assets.length).toBeGreaterThan(0)
			expect(assets.every(a => a.type === 'icon')).toBe(true)
		})

		it('should return splash assets for splash type', () => {
			// GIVEN the splash type filter
			// WHEN getting assets by type
			const assets = getAssetsByType('splash')

			// THEN all returned assets should be splash type
			expect(assets.length).toBeGreaterThan(0)
			expect(assets.every(a => a.type === 'splash')).toBe(true)
		})

		it('should return adaptive assets for adaptive type', () => {
			// GIVEN the adaptive type filter
			// WHEN getting assets by type
			const assets = getAssetsByType('adaptive')

			// THEN all returned assets should be adaptive type
			expect(assets.length).toBeGreaterThan(0)
			expect(assets.every(a => a.type === 'adaptive')).toBe(true)
		})

		it('should return favicon assets for favicon type', () => {
			// GIVEN the favicon type filter
			// WHEN getting assets by type
			const assets = getAssetsByType('favicon')

			// THEN all returned assets should be favicon type
			expect(assets.length).toBeGreaterThan(0)
			expect(assets.every(a => a.type === 'favicon')).toBe(true)
		})

		it('should include both iOS and Android icons for icon type', () => {
			// GIVEN the icon type filter
			// WHEN getting assets by type
			const assets = getAssetsByType('icon')

			// THEN both iOS and Android platforms should be included
			expect(assets.some(a => a.platform === 'ios')).toBe(true)
			expect(assets.some(a => a.platform === 'android')).toBe(true)
		})
	})

	describe('getVariantAssetsByType', () => {
		it('should return dark variants for icon type', () => {
			// GIVEN the icon type filter
			// WHEN getting variant assets by type
			const variants = getVariantAssetsByType('icon')

			// THEN dark variants should be present
			expect(variants.some(a => a.colorMode === 'dark')).toBe(true)
		})

		it('should return dark splash for splash type', () => {
			// GIVEN the splash type filter
			// WHEN getting variant assets by type
			const variants = getVariantAssetsByType('splash')

			// THEN all variants should have dark colorMode
			expect(variants.every(a => a.colorMode === 'dark')).toBe(true)
		})

		it('should return monochrome for adaptive type', () => {
			// GIVEN the adaptive type filter
			// WHEN getting variant assets by type
			const variants = getVariantAssetsByType('adaptive')

			// THEN all variants should have any colorMode (monochrome)
			expect(variants.every(a => a.colorMode === 'any')).toBe(true)
		})
	})

	describe('getAllAssets', () => {
		it('should return all light mode assets', () => {
			// WHEN getting all assets
			const all = getAllAssets()

			// THEN assets from all platforms should be included
			expect(all.length).toBeGreaterThan(50) // Rough count
			expect(all.some(a => a.platform === 'ios')).toBe(true)
			expect(all.some(a => a.platform === 'android')).toBe(true)
			expect(all.some(a => a.platform === 'web')).toBe(true)
		})

		it('should not include variant assets', () => {
			// WHEN getting all assets
			const all = getAllAssets()

			// THEN most assets should not have colorMode (light mode is default)
			const withColorMode = all.filter(
				a => a.colorMode !== undefined && a.colorMode !== 'light',
			)
			// AND web maskable/monochrome should be minimal compared to total
			expect(withColorMode.length).toBeLessThan(all.length * 0.1)
		})
	})

	describe('getAllVariantAssets', () => {
		it('should return all variant assets', () => {
			// WHEN getting all variant assets
			const variants = getAllVariantAssets()

			// THEN all variants should have colorMode defined
			expect(variants.length).toBeGreaterThan(20)
			for (const variant of variants) {
				expect(variant.colorMode).toBeDefined()
			}
		})
	})

	describe('asset naming conventions', () => {
		it('should use consistent iOS naming', () => {
			// GIVEN the iOS icons specification
			// THEN all icon names should match the expected pattern
			for (const icon of IOS_ICONS) {
				expect(icon.name).toMatch(/^ios\/icon-[\d.]+(@\d+x)?\.png$/)
			}
		})

		it('should use consistent Android naming', () => {
			// GIVEN the Android icons specification
			// THEN all icon names should match the expected pattern
			for (const icon of ANDROID_ICONS) {
				expect(icon.name).toMatch(/^android\/mipmap-[a-z]+\/ic_launcher\.png$/)
			}
		})

		it('should use consistent Web naming', () => {
			// GIVEN the web favicons specification
			// THEN all favicon names should match the expected pattern
			for (const favicon of WEB_FAVICONS) {
				expect(favicon.name).toMatch(/^web\/[a-z-]+\d*x?\d*\.png$/)
			}
		})
	})

	describe('deduplication', () => {
		it('should have unique names in iOS icons', () => {
			// GIVEN the iOS icons specification
			const names = IOS_ICONS.map(i => i.name)
			const uniqueNames = new Set(names)

			// THEN all names should be unique
			expect(names.length).toBe(uniqueNames.size)
		})

		it('should have unique names in Android icons', () => {
			// GIVEN the Android icons specification
			const names = ANDROID_ICONS.map(i => i.name)
			const uniqueNames = new Set(names)

			// THEN all names should be unique
			expect(names.length).toBe(uniqueNames.size)
		})

		it('should have unique names in Web favicons', () => {
			// GIVEN the web favicons specification
			const names = WEB_FAVICONS.map(f => f.name)
			const uniqueNames = new Set(names)

			// THEN all names should be unique
			expect(names.length).toBe(uniqueNames.size)
		})
	})

	describe('Store assets', () => {
		it('should have Play Store icon at 512x512', () => {
			// GIVEN the store assets specification
			const playStoreIcon = STORE_ASSETS.find(a =>
				a.name.includes('play-store-icon'),
			)

			// THEN Play Store icon should be 512x512
			expect(playStoreIcon).toBeDefined()
			expect(playStoreIcon?.width).toBe(512)
			expect(playStoreIcon?.height).toBe(512)
		})

		it('should have feature graphic at 1024x500', () => {
			// GIVEN the store assets specification
			const featureGraphic = STORE_ASSETS.find(a =>
				a.name.includes('feature-graphic'),
			)

			// THEN feature graphic should be 1024x500
			expect(featureGraphic).toBeDefined()
			expect(featureGraphic?.width).toBe(1024)
			expect(featureGraphic?.height).toBe(500)
		})

		it('should have TV banner at 1280x720', () => {
			// GIVEN the store assets specification
			const tvBanner = STORE_ASSETS.find(a => a.name.includes('tv-banner'))

			// THEN TV banner should be 1280x720
			expect(tvBanner).toBeDefined()
			expect(tvBanner?.width).toBe(1280)
			expect(tvBanner?.height).toBe(720)
		})

		it('should have App Store icon at 1024x1024', () => {
			// GIVEN the store assets specification
			const appStoreIcon = STORE_ASSETS.find(a =>
				a.name.includes('app-store-icon'),
			)

			// THEN App Store icon should be 1024x1024
			expect(appStoreIcon).toBeDefined()
			expect(appStoreIcon?.width).toBe(1024)
			expect(appStoreIcon?.height).toBe(1024)
		})

		it('should include both Android and iOS store assets', () => {
			// GIVEN the store assets specification
			const hasAndroid = STORE_ASSETS.some(a => a.platform === 'android')
			const hasIOS = STORE_ASSETS.some(a => a.platform === 'ios')

			// THEN both platforms should be represented
			expect(hasAndroid).toBe(true)
			expect(hasIOS).toBe(true)
		})
	})

	describe('watchOS icons', () => {
		it('should have 1024px main icon', () => {
			// GIVEN the watchOS icons specification
			const mainIcon = WATCHOS_ICONS.find(
				i => i.name === 'watchos/icon-1024.png',
			)

			// THEN main icon should be 1024x1024
			expect(mainIcon).toBeDefined()
			expect(mainIcon?.width).toBe(1024)
			expect(mainIcon?.height).toBe(1024)
		})

		it('should all be square', () => {
			// GIVEN the watchOS icons specification
			// THEN all icons should have equal width and height
			for (const icon of WATCHOS_ICONS) {
				expect(icon.width).toBe(icon.height)
			}
		})

		it('should all have watchos platform', () => {
			// GIVEN the watchOS icons specification
			// THEN all icons should have platform set to watchos
			for (const icon of WATCHOS_ICONS) {
				expect(icon.platform).toBe('watchos')
			}
		})

		it('should have @2x variants', () => {
			// GIVEN the watchOS icons specification
			const hasScale2 = WATCHOS_ICONS.some(i => i.scale === 2)

			// THEN @2x scale variants should exist
			expect(hasScale2).toBe(true)
		})
	})

	describe('tvOS icons', () => {
		it('should have layered icon files (back/front)', () => {
			// GIVEN the tvOS icons specification
			const hasBack = TVOS_ICONS.some(i => i.name.includes('back'))
			const hasFront = TVOS_ICONS.some(i => i.name.includes('front'))

			// THEN both back and front layers should exist
			expect(hasBack).toBe(true)
			expect(hasFront).toBe(true)
		})

		it('should have top shelf images', () => {
			// GIVEN the tvOS icons specification
			const hasTopShelf = TVOS_ICONS.some(i => i.name.includes('top-shelf'))

			// THEN top shelf images should exist
			expect(hasTopShelf).toBe(true)
		})

		it('should have correct icon dimensions (800x480 @2x)', () => {
			// GIVEN the tvOS icons specification
			const icon2x = TVOS_ICONS.find(
				i => i.name === 'tvos/icon-back@2x.png' && i.scale === 2,
			)

			// THEN @2x icon should be 800x480
			expect(icon2x).toBeDefined()
			expect(icon2x?.width).toBe(800)
			expect(icon2x?.height).toBe(480)
		})

		it('should have correct top shelf dimensions', () => {
			// GIVEN the tvOS icons specification
			const topShelf1x = TVOS_ICONS.find(
				i => i.name === 'tvos/top-shelf.png' && !i.scale,
			)
			const topShelf2x = TVOS_ICONS.find(
				i => i.name === 'tvos/top-shelf@2x.png' && i.scale === 2,
			)

			// THEN top shelf sizes should be correct
			expect(topShelf1x?.width).toBe(1920)
			expect(topShelf1x?.height).toBe(720)
			expect(topShelf2x?.width).toBe(3840)
			expect(topShelf2x?.height).toBe(1440)
		})
	})

	describe('visionOS icons', () => {
		it('should have 1024px main icon', () => {
			// GIVEN the visionOS icons specification
			const mainIcon = VISIONOS_ICONS.find(
				i => i.name === 'visionos/icon-1024.png',
			)

			// THEN main icon should be 1024x1024
			expect(mainIcon).toBeDefined()
			expect(mainIcon?.width).toBe(1024)
			expect(mainIcon?.height).toBe(1024)
		})

		it('should have layered icon files', () => {
			// GIVEN the visionOS icons specification
			const hasBack = VISIONOS_ICONS.some(i => i.name.includes('back'))
			const hasFront = VISIONOS_ICONS.some(i => i.name.includes('front'))

			// THEN both back and front layers should exist
			expect(hasBack).toBe(true)
			expect(hasFront).toBe(true)
		})

		it('should all be square', () => {
			// GIVEN the visionOS icons specification
			// THEN all icons should have equal width and height
			for (const icon of VISIONOS_ICONS) {
				expect(icon.width).toBe(icon.height)
			}
		})
	})

	describe('getAssetsByPlatform with new platforms', () => {
		it('should return watchOS assets for watchos', () => {
			// GIVEN the watchos platform filter
			// WHEN getting assets by platform
			const assets = getAssetsByPlatform('watchos')

			// THEN all returned assets should be watchOS assets
			expect(assets.length).toBeGreaterThan(0)
			expect(assets.every(a => a.platform === 'watchos')).toBe(true)
		})

		it('should return tvOS assets for tvos', () => {
			// GIVEN the tvos platform filter
			// WHEN getting assets by platform
			const assets = getAssetsByPlatform('tvos')

			// THEN all returned assets should be tvOS assets
			expect(assets.length).toBeGreaterThan(0)
			expect(assets.every(a => a.platform === 'tvos')).toBe(true)
		})

		it('should return visionOS assets for visionos', () => {
			// GIVEN the visionos platform filter
			// WHEN getting assets by platform
			const assets = getAssetsByPlatform('visionos')

			// THEN all returned assets should be visionOS assets
			expect(assets.length).toBeGreaterThan(0)
			expect(assets.every(a => a.platform === 'visionos')).toBe(true)
		})
	})

	describe('getAssetsByType with store type', () => {
		it('should return store assets for store type', () => {
			// GIVEN the store type filter
			// WHEN getting assets by type
			const assets = getAssetsByType('store')

			// THEN all returned assets should be store type
			expect(assets.length).toBeGreaterThan(0)
			expect(assets.every(a => a.type === 'store')).toBe(true)
		})

		it('should include both Android and iOS store assets', () => {
			// GIVEN the store type filter
			// WHEN getting assets by type
			const assets = getAssetsByType('store')

			// THEN both platforms should be included
			expect(assets.some(a => a.platform === 'android')).toBe(true)
			expect(assets.some(a => a.platform === 'ios')).toBe(true)
		})
	})

	describe('getVariantAssetsByPlatform with new platforms', () => {
		it('should return empty array for watchos (no variants)', () => {
			// GIVEN the watchos platform filter
			// WHEN getting variant assets by platform
			const variants = getVariantAssetsByPlatform('watchos')

			// THEN should return empty array (no variants yet)
			expect(variants).toEqual([])
		})

		it('should return empty array for tvos (no variants)', () => {
			// GIVEN the tvos platform filter
			// WHEN getting variant assets by platform
			const variants = getVariantAssetsByPlatform('tvos')

			// THEN should return empty array (no variants yet)
			expect(variants).toEqual([])
		})

		it('should return empty array for visionos (no variants)', () => {
			// GIVEN the visionos platform filter
			// WHEN getting variant assets by platform
			const variants = getVariantAssetsByPlatform('visionos')

			// THEN should return empty array (no variants yet)
			expect(variants).toEqual([])
		})
	})

	describe('getVariantAssetsByType with store type', () => {
		it('should return empty array for store (no variants)', () => {
			// GIVEN the store type filter
			// WHEN getting variant assets by type
			const variants = getVariantAssetsByType('store')

			// THEN should return empty array
			expect(variants).toEqual([])
		})
	})

	describe('getAllAssets includes new platforms', () => {
		it('should include store assets', () => {
			// WHEN getting all assets
			const all = getAllAssets()

			// THEN store assets should be included
			expect(all.some(a => a.type === 'store')).toBe(true)
		})

		it('should include watchOS assets', () => {
			// WHEN getting all assets
			const all = getAllAssets()

			// THEN watchOS assets should be included
			expect(all.some(a => a.platform === 'watchos')).toBe(true)
		})

		it('should include tvOS assets', () => {
			// WHEN getting all assets
			const all = getAllAssets()

			// THEN tvOS assets should be included
			expect(all.some(a => a.platform === 'tvos')).toBe(true)
		})

		it('should include visionOS assets', () => {
			// WHEN getting all assets
			const all = getAllAssets()

			// THEN visionOS assets should be included
			expect(all.some(a => a.platform === 'visionos')).toBe(true)
		})
	})
})
