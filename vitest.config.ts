import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		include: ['src/__tests__/**/*.test.ts'],
		exclude: ['node_modules', 'dist'],
		setupFiles: ['src/__tests__/setup.ts'],
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
			exclude: [
				'src/__tests__/**',
				'src/components/**',
				'src/index.tsx',
				'src/cli.ts',
			],
			reporter: ['text', 'json', 'html'],
		},
		testTimeout: 10000,
	},
})
