/**
 * Tests for Path Utilities.
 *
 * Tests path resolution including home directory expansion,
 * relative path resolution, and absolute path handling.
 */

import * as os from 'node:os'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'

import { resolvePath } from '../../utils/path_utils'

describe('PathUtils', () => {
	describe('resolvePath', () => {
		it('should expand home directory with tilde prefix', () => {
			// GIVEN a path starting with ~/
			const inputPath = '~/Desktop/icons'

			// WHEN resolving the path
			const result = resolvePath(inputPath)

			// THEN the tilde should be expanded to the home directory
			expect(result).toBe(path.join(os.homedir(), 'Desktop/icons'))
		})

		it('should resolve relative path to absolute', () => {
			// GIVEN a relative path
			const inputPath = './my-output'

			// WHEN resolving the path
			const result = resolvePath(inputPath)

			// THEN the path should be resolved to an absolute path
			expect(path.isAbsolute(result)).toBe(true)
			expect(result).toBe(path.resolve('./my-output'))
		})

		it('should pass through absolute paths unchanged', () => {
			// GIVEN an absolute path
			const inputPath = '/tmp/icons'

			// WHEN resolving the path
			const result = resolvePath(inputPath)

			// THEN the path should remain unchanged
			expect(result).toBe('/tmp/icons')
		})

		it('should handle nested relative paths', () => {
			// GIVEN a nested relative path
			const inputPath = './assets/generated/icons'

			// WHEN resolving the path
			const result = resolvePath(inputPath)

			// THEN the full path should be resolved
			expect(path.isAbsolute(result)).toBe(true)
			expect(result.endsWith('assets/generated/icons')).toBe(true)
		})

		it('should handle parent directory references', () => {
			// GIVEN a path with parent directory reference
			const inputPath = '../sibling-project/assets'

			// WHEN resolving the path
			const result = resolvePath(inputPath)

			// THEN the path should be correctly resolved
			expect(path.isAbsolute(result)).toBe(true)
			expect(result.includes('..')).toBe(false)
		})

		it('should handle tilde without trailing path', () => {
			// GIVEN just the home directory shorthand
			const inputPath = '~/'

			// WHEN resolving the path
			const result = resolvePath(inputPath)

			// THEN the home directory should be returned
			expect(result).toBe(os.homedir())
		})

		it('should handle deeply nested home directory paths', () => {
			// GIVEN a deeply nested path under home
			const inputPath = '~/projects/app/assets/icons/generated'

			// WHEN resolving the path
			const result = resolvePath(inputPath)

			// THEN all path segments should be preserved
			expect(result).toBe(
				path.join(os.homedir(), 'projects/app/assets/icons/generated'),
			)
		})

		it('should handle paths with spaces', () => {
			// GIVEN a path containing spaces
			const inputPath = '~/My Documents/App Icons'

			// WHEN resolving the path
			const result = resolvePath(inputPath)

			// THEN spaces should be preserved in the path
			expect(result).toBe(path.join(os.homedir(), 'My Documents/App Icons'))
		})

		it('should not expand tilde when not at the start', () => {
			// GIVEN a path with tilde not at the start
			const inputPath = '/some/path/~user'

			// WHEN resolving the path
			const result = resolvePath(inputPath)

			// THEN the tilde should not be expanded
			expect(result).toBe('/some/path/~user')
		})

		it('should handle empty relative path', () => {
			// GIVEN an empty relative path (current directory)
			const inputPath = '.'

			// WHEN resolving the path
			const result = resolvePath(inputPath)

			// THEN current working directory should be returned
			expect(result).toBe(process.cwd())
		})

		it('should handle path without leading dot or slash', () => {
			// GIVEN a path without leading dot or slash
			const inputPath = 'output/icons'

			// WHEN resolving the path
			const result = resolvePath(inputPath)

			// THEN it should be treated as relative and resolved
			expect(path.isAbsolute(result)).toBe(true)
			expect(result).toBe(path.resolve('output/icons'))
		})
	})
})
