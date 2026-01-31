/**
 * Path Utilities
 *
 * Shared path resolution functions used by both CLI and TUI.
 * Handles home directory expansion and path normalization.
 */

import * as os from 'node:os'
import * as path from 'node:path'

/**
 * Resolve a user-provided path to an absolute path.
 *
 * Handles:
 * - Home directory expansion (~/ -> /Users/x/)
 * - Relative paths (./foo -> /cwd/foo)
 * - Absolute paths (passed through)
 *
 * @param inputPath - User-provided path string.
 * @returns Resolved absolute path.
 *
 * @example
 * resolvePath('~/Desktop/icons')  // '/Users/x/Desktop/icons'
 * resolvePath('./my-output')      // '/cwd/my-output'
 * resolvePath('/tmp/icons')       // '/tmp/icons'
 */
export function resolvePath(inputPath: string): string {
	// Expand ~ to home directory
	if (inputPath.startsWith('~/')) {
		return path.join(os.homedir(), inputPath.slice(2))
	}
	// Resolve relative to absolute
	return path.resolve(inputPath)
}
