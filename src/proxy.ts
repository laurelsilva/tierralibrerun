import {
	clerkMiddleware,
	createRouteMatcher,
	type ClerkMiddlewareAuth,
} from '@clerk/nextjs/server'
import { type NextRequest } from 'next/server'

/**
 * Routes accessible without authentication.
 *
 * Protected routes (/dashboard, /admin, /fund/apply, /mentor/apply, etc.)
 * are NOT listed here — they require sign-in at the middleware level.
 * Those routes also have their own layout-level guards (requireOnboardedUser,
 * requireAdmin) as a second layer of defence.
 */
const isPublicRoute = createRouteMatcher([
	// Marketing & informational pages
	'/',
	'/blog',
	'/blog/:slug',
	'/donate',
	'/hyak',
	'/races(.*)',
	'/fund',
	'/code-of-conduct',
	'/companies(.*)',
	'/privacy-policy',
	'/terms-of-service',

	// Mentor landing page (handles auth state internally)
	'/mentor',

	// Onboarding flow (must be accessible during sign-up)
	'/onboarding',
	'/new-user',

	// Sanity Studio (has its own auth)
	'/studio(.*)',
])

export default clerkMiddleware(
	async (auth: ClerkMiddlewareAuth, request: NextRequest) => {
		if (!isPublicRoute(request)) {
			await auth.protect()
		}
	},
)

export const config = {
	matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
