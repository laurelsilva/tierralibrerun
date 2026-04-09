import { config as epicConfig } from '@epic-web/config/eslint'
import nextPlugin from '@next/eslint-plugin-next'

const nextRecommended = nextPlugin.configs.recommended

export default [
	{
		ignores: [
			'**/.cache/**',
			'**/node_modules/**',
			'**/.next/**',
			'**/.turbo/**',
			'**/dist/**',
			'**/coverage/**',
			'pnpm-lock.yaml',
		],
	},
	...epicConfig,
	{
		files: ['**/*.{js,jsx,ts,tsx,mjs}'],
		plugins: {
			'@next/next': nextPlugin,
		},
		settings: nextRecommended.settings ?? {},
		rules: {
			...nextRecommended.rules,
		},
	},
]
