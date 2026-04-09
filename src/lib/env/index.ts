import { z } from 'zod'

const envSchema = z.object({
	// Database
	PLANETSCALE_DB_HOST: z.string().min(1, 'Database host is required'),
	PLANETSCALE_DB_USERNAME: z.string().min(1, 'Database username is required'),
	PLANETSCALE_DB_PASSWORD: z.string().min(1, 'Database password is required'),

	// Clerk Auth
	NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
		.string()
		.min(1, 'Clerk publishable key is required'),
	CLERK_SECRET_KEY: z.string().min(1, 'Clerk secret key is required'),
	CLERK_WEBHOOK_SECRET: z.string().optional(),
	NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/?auth=sign-in'),
	NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/?auth=sign-up'),
	NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: z.string().optional(),
	NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: z.string().optional(),
	NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: z.string().optional(),
	NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: z.string().optional(),
	NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default('/dashboard'),
	NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default('/new-user'),

	// App
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.default('development'),
	NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
	NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
	GOOGLE_SITE_VERIFICATION: z.string().optional(),

	// Sanity
	NEXT_PUBLIC_SANITY_PROJECT_ID: z
		.string()
		.min(1, 'Sanity project ID is required'),
	NEXT_PUBLIC_SANITY_DATASET: z.string().min(1, 'Sanity dataset is required'),
	NEXT_PUBLIC_SANITY_API_VERSION: z.string().default('2025-06-01'),
	SANITY_API_TOKEN: z.string().optional(),

	// Email
	RESEND_API_KEY: z.string().min(1, 'Resend API key is required'),
	RESEND_MENTOR_AUDIENCE_ID: z
		.string()
		.min(1, 'Resend mentor audience ID is required'),
})

const envParse = envSchema.safeParse(process.env)

if (!envParse.success) {
	console.error(
		'❌ Invalid environment variables:',
		envParse.error.flatten().fieldErrors,
	)
	throw new Error('Invalid environment variables')
}

export const env = envParse.data

const configuredForceRedirects = [
	env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL,
	env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL,
].filter(
	(value): value is string =>
		typeof value === 'string' && value.trim().length > 0,
)

if (configuredForceRedirects.length > 0) {
	console.warn(
		'Clerk force redirect URLs are configured. This app uses per-flow Clerk redirects in the UI so athlete fund and mentor application intent survives sign-up; remove NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL and NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL to avoid overriding those routes globally.',
	)
}

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>
