import 'server-only'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { desc, eq, inArray, or, sql } from 'drizzle-orm'
import { resendService } from '@/lib/services/resend'
import { db, users } from '@/server/db'

type Issuer = string

function getIssuerFromSessionClaims(sessionClaims: unknown): Issuer | null {
	if (!sessionClaims || typeof sessionClaims !== 'object') return null
	// Clerk sessionClaims is a JWT payload; issuer is typically in `iss`.
	const iss = (sessionClaims as { iss?: unknown }).iss
	return typeof iss === 'string' && iss.trim() ? iss : null
}

function buildClerkKey(params: { issuer: Issuer | null; userId: string }) {
	// If issuer is missing, fall back to the raw userId.
	// We still allow lookups by raw userId for legacy records.
	return params.issuer ? `${params.issuer}:${params.userId}` : params.userId
}

async function getAuthIdentity(): Promise<{
	userId: string
	issuer: Issuer | null
} | null> {
	const { userId, sessionClaims } = await auth()
	if (!userId) return null
	return { userId, issuer: getIssuerFromSessionClaims(sessionClaims) }
}

async function findDbUserByClerkKeys(params: { clerkKeys: string[] }) {
	const rows = await db
		.select()
		.from(users)
		.where(inArray(users.clerkId, params.clerkKeys))

	// Prefer an exact match on the first key (namespaced), otherwise fall back.
	const preferred = rows.find((r) => r.clerkId === params.clerkKeys[0])
	return preferred ?? rows[0] ?? null
}

async function findDbUserByUserIdLoose(params: {
	userId: string
	preferredNamespacedKey?: string
}) {
	const suffix = `:${params.userId}`
	const suffixLen = suffix.length
	const rows = await db
		.select()
		.from(users)
		.where(
			or(
				eq(users.clerkId, params.userId),
				sql`RIGHT(${users.clerkId}, ${suffixLen}) = ${suffix}`,
			),
		)
		.orderBy(desc(users.updatedAt))
		.limit(25)

	if (rows.length === 0) return null

	// If any matching row is already onboarded, always prefer it.
	// This prevents redirect loops when duplicates exist across Clerk environments.
	const onboarded = rows.find((r) => r.onboardingCompleted)
	if (onboarded) return onboarded

	if (params.preferredNamespacedKey) {
		const exact = rows.find((r) => r.clerkId === params.preferredNamespacedKey)
		if (exact) return exact
	}
	const anyNamespaced = rows.find((r) => r.clerkId !== params.userId)
	return anyNamespaced ?? rows[0]
}

async function maybeMergeLegacyDuplicate(params: {
	issuer: Issuer
	userId: string
	namespacedRow: typeof users.$inferSelect
	legacyRow: typeof users.$inferSelect
}) {
	// If we ended up with both a namespaced row and an old legacy row, prefer the
	// namespaced row but opportunistically copy onboarding-related fields so users
	// don't get stuck in loops.
	const patch: Partial<typeof users.$inferInsert> = {}

	if (
		params.legacyRow.onboardingCompleted &&
		!params.namespacedRow.onboardingCompleted
	) {
		patch.onboardingCompleted = true
	}

	const copyIfMissingText = <K extends keyof typeof users.$inferSelect>(
		key: K,
	) => {
		const dst = params.namespacedRow[key]
		const src = params.legacyRow[key]
		if (dst === null || dst === undefined || dst === '') {
			if (src !== null && src !== undefined && src !== '') {
				patch[key] = src
			}
		}
	}

	const copyIfMissingNumber = <K extends keyof typeof users.$inferSelect>(
		key: K,
	) => {
		const dst = params.namespacedRow[key]
		const src = params.legacyRow[key]
		if (dst === null || dst === undefined) {
			if (src !== null && src !== undefined) {
				patch[key] = src
			}
		}
	}

	copyIfMissingText('profileImageUrl')
	copyIfMissingText('userType')
	copyIfMissingText('genderIdentity')
	copyIfMissingText('pronouns')
	copyIfMissingNumber('age')
	copyIfMissingText('locationRegion')
	copyIfMissingText('runningExperience')
	copyIfMissingText('hearAbout')

	if (Object.keys(patch).length === 0) return params.namespacedRow

	await db
		.update(users)
		.set({ ...patch, updatedAt: new Date() })
		.where(eq(users.id, params.namespacedRow.id))

	return { ...params.namespacedRow, ...patch }
}

async function maybeUpgradeLegacyClerkId(params: {
	userId: string
	issuer: Issuer | null
	legacyUserRow: typeof users.$inferSelect
}) {
	const namespaced = buildClerkKey({
		issuer: params.issuer,
		userId: params.userId,
	})
	if (!params.issuer) return params.legacyUserRow
	if (params.legacyUserRow.clerkId === namespaced) return params.legacyUserRow

	// Only upgrade legacy rows that are still using the raw Clerk userId.
	if (params.legacyUserRow.clerkId !== params.userId)
		return params.legacyUserRow

	// If a namespaced row already exists, don't overwrite.
	const existingNamespaced = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.clerkId, namespaced))
		.limit(1)
	if (existingNamespaced.length > 0) return params.legacyUserRow

	await db
		.update(users)
		.set({ clerkId: namespaced, updatedAt: new Date() })
		.where(eq(users.id, params.legacyUserRow.id))

	return { ...params.legacyUserRow, clerkId: namespaced }
}

/**
 * Get user from DB for the current authenticated session.
 * Does NOT create a record.
 */
export async function getUserFromClerkID() {
	const identity = await getAuthIdentity()
	if (!identity) return null

	const namespacedKey = identity.issuer
		? buildClerkKey({ issuer: identity.issuer, userId: identity.userId })
		: undefined

	// Be robust to dev/prod Clerk environments sharing a single DB:
	// look up by raw userId OR any namespaced clerkId that ends with :userId.
	const dbUser = await findDbUserByUserIdLoose({
		userId: identity.userId,
		preferredNamespacedKey: namespacedKey,
	})
	if (!dbUser) return null

	// If we don't have an issuer, we can't do targeted upgrades/merges.
	if (!identity.issuer || !namespacedKey) return dbUser

	// When we *do* have issuer, also check for a legacy duplicate for this identity
	// and merge onboarding fields to avoid redirect loops.
	const clerkKeys = [namespacedKey, identity.userId]
	const exactRows = await db
		.select()
		.from(users)
		.where(inArray(users.clerkId, clerkKeys))

	const namespacedRow =
		exactRows.find((r) => r.clerkId === namespacedKey) ?? null
	const legacyRow = exactRows.find((r) => r.clerkId === identity.userId) ?? null

	// Back-compat upgrade: if this row is legacy (raw userId), migrate to namespaced.
	if (legacyRow && namespacedRow) {
		return await maybeMergeLegacyDuplicate({
			issuer: identity.issuer,
			userId: identity.userId,
			namespacedRow,
			legacyRow,
		})
	}

	if (legacyRow && !namespacedRow) {
		return await maybeUpgradeLegacyClerkId({
			userId: identity.userId,
			issuer: identity.issuer,
			legacyUserRow: legacyRow,
		})
	}

	return namespacedRow ?? legacyRow
}

/**
 * Get current DB user, creating one if missing.
 * DB is source of truth; Clerk is authentication only.
 */
export async function getCurrentUser() {
	const identity = await getAuthIdentity()
	if (!identity) return null

	// First try existing user (including legacy raw userId rows).
	const existing = await getUserFromClerkID()
	if (existing) return existing

	// Need to create: fetch from Clerk only at creation time.
	const client = await clerkClient()
	const clerkUser = await client.users.getUser(identity.userId)

	const primaryEmailId = clerkUser.primaryEmailAddressId
	const emailAddress =
		clerkUser.emailAddresses.find(
			(e: { id: string; emailAddress: string }) => e.id === primaryEmailId,
		)?.emailAddress ??
		clerkUser.emailAddresses[0]?.emailAddress ??
		''
	const email = emailAddress.trim().toLowerCase()
	const firstName = clerkUser.firstName || ''
	const lastName = clerkUser.lastName || ''
	const name = `${firstName} ${lastName}`.trim() || null

	if (!email) {
		console.error('getCurrentUser: Cannot create user without email', {
			userId: identity.userId,
		})
		return null
	}

	const clerkIdKey = buildClerkKey({
		issuer: identity.issuer,
		userId: identity.userId,
	})

	try {
		await db.insert(users).values({
			clerkId: clerkIdKey,
			email,
			name,
			newsletterSubscribed: true,
		})

		const created = await findDbUserByClerkKeys({
			clerkKeys: identity.issuer
				? [clerkIdKey, identity.userId]
				: [identity.userId],
		})

		if (!created) {
			console.error('getCurrentUser: User insert succeeded but select failed', {
				userId: identity.userId,
			})
			return null
		}

		void resendService
			.upsertContact(email, firstName, lastName)
			.catch((error) => {
				console.error('getCurrentUser: Resend sync failed', { email, error })
			})

		return created
	} catch (error) {
		// Race: another request created concurrently.
		const raced = await findDbUserByClerkKeys({
			clerkKeys: identity.issuer
				? [clerkIdKey, identity.userId]
				: [identity.userId],
		})
		if (raced) return raced

		console.error('getCurrentUser: Failed to create user', {
			userId: identity.userId,
			error: error instanceof Error ? error.message : error,
		})
		throw error
	}
}
