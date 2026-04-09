import 'server-only'
import {currentUser} from '@clerk/nextjs/server'
import {redirect} from 'next/navigation'

/**
 * Admin emails loaded from environment variable.
 * Set ADMIN_EMAILS as a comma-separated list (e.g. "alice@example.com,bob@example.com").
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
	.split(',')
	.map((e) => e.trim().toLowerCase())
	.filter(Boolean)

function isAdminByEmail(email: string | undefined): boolean {
	if (!email) return false
	return ADMIN_EMAILS.includes(email.toLowerCase())
}

/**
 * Read capability for /admin pages:
 * - "writer" admins (role === 'admin' or admin email) and
 * - "read-only" admins (role === 'admin_readonly')
 * both return true here to allow viewing pages.
 */
export async function isAdmin() {
	try {
		const clerkUser = await currentUser()
		if (!clerkUser) return false

		const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress
		const userRole = clerkUser.publicMetadata?.role as string | undefined

		const isWriter = isAdminByEmail(userEmail) || userRole === 'admin'
		const isReadonly = userRole === 'admin_readonly'
		return isWriter || isReadonly
	} catch (error) {
		console.error('Admin check failed:', error)
		return false
	}
}

/**
 * Writer capability for mutations/actions:
 * - Only returns true for full admins (role === 'admin' or admin email)
 */
export async function isAdminWriter() {
	try {
		const clerkUser = await currentUser()
		if (!clerkUser) return false

		const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress
		const userRole = clerkUser.publicMetadata?.role as string | undefined

		return isAdminByEmail(userEmail) || userRole === 'admin'
	} catch (error) {
		console.error('Admin writer check failed:', error)
		return false
	}
}

/**
 * Convenience helper for explicitly checking read-only admins.
 */
export async function isReadOnlyAdmin() {
	try {
		const clerkUser = await currentUser()
		if (!clerkUser) return false

		const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress
		const userRole = clerkUser.publicMetadata?.role as string | undefined

		const isWriter = isAdminByEmail(userEmail) || userRole === 'admin'
		return !isWriter && userRole === 'admin_readonly'
	} catch (error) {
		console.error('Admin read-only check failed:', error)
		return false
	}
}

/**
 * Writer-only requirement for any action that mutates state.
 * Use this in server actions and API routes that perform writes.
 */
export async function requireAdmin() {
	try {
		const clerkUser = await currentUser()
		if (!clerkUser) {
			throw new Error('Unauthorized - No user found')
		}

		const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress
		const userRole = clerkUser.publicMetadata?.role as string | undefined

		if (!isAdminByEmail(userEmail) && userRole !== 'admin') {
			throw new Error('Unauthorized - Insufficient permissions')
		}

		return clerkUser
	} catch (error) {
		console.error('Admin requirement check failed:', error)
		throw error
	}
}

/**
 * Writer-only redirect guard (mutations).
 * Existing callers that protect write endpoints with this will now
 * correctly block read-only admins.
 */
export async function redirectIfNotAdmin(redirectPath: string = '/') {
	try {
		const writer = await isAdminWriter()
		if (!writer) {
			redirect(redirectPath)
		}
	} catch (error) {
		console.error('Admin redirect check failed:', error)
		redirect(redirectPath)
	}
}

// Simple email check utility
export function isAdminEmail(email: string): boolean {
	return isAdminByEmail(email)
}
