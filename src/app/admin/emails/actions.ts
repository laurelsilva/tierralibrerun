'use server'
import { clerkClient } from '@clerk/nextjs/server'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { emailConfig, teamConfig } from '@/lib/config/site'
import { getBrandLinks } from '@/lib/email/brand'
import { buildMentorshipPairingIntroEmail } from '@/lib/email/mentor-pairing-intro'
import {
	sendApplicationEmail,
	buildEmailPreview,
} from '@/lib/email/orchestrator'
import {
	type ApplicationType,
	type StandardStatus,
	type EmailCategory,
	type EmailMode,
	type SendEmailRequest,
	type SendEmailResult,
} from '@/lib/email/types'

/**
 * Simple Email Actions for Admin
 *
 * Features:
 * - sendEmail: one entry-point that supports STANDARD (status-based) and CUSTOM (raw HTML) emails
 * - previewEmail: build subject+html without sending (safe for UI preview)
 * - listPresets/loadPreset/savePreset: lightweight preset management (in-memory with useful defaults)
 *
 * Notes:
 * - Access is restricted to admins.
 * - Presets are kept in-memory for simplicity and DX. They reset on server restart.
 * - For production persistence, swap PRESETS_STORE to use your DB.
 */

import { redirectIfNotAdmin } from '@/server/auth/admin'
import {
	db,
	fundApplications,
	mentorApplications,
	mentorshipMatches,
} from '@/server/db'

/* =========================================================================================
   Admin Gate
   ========================================================================================= */

async function requireAdmin() {
	// Throws/redirects when not admin
	await redirectIfNotAdmin('/admin')
}

/* =========================================================================================
   Public Actions
   ========================================================================================= */

export async function sendEmail(input: {
	applicationType: ApplicationType
	applicationId?: string
	// Either STANDARD or CUSTOM. If omitted, inferred: subject+html => CUSTOM, else STANDARD.
	mode?: EmailMode
	status?: StandardStatus // required in STANDARD mode (cannot be PENDING)
	category?: EmailCategory // optional; defaults to 'STATUS' in STANDARD mode
	to?: string
	from?: string
	cc?: string[]
	bcc?: string[]
	replyTo?: string
	subject?: string // required for CUSTOM
	html?: string // required for CUSTOM
	// Tokens are strongly typed by applicationType, but we accept unknown for DX flexibility.
	// You can import the exact token type for stronger typing in callers.
	tokens?: Record<string, unknown>
	meta?: Record<string, unknown>
}): Promise<SendEmailResult> {
	await requireAdmin()

	const resolvedMode: EmailMode =
		input.mode || (input.subject && input.html ? 'CUSTOM' : 'STANDARD')

	if (resolvedMode === 'CUSTOM') {
		if (!input.subject || !input.html) {
			return { success: false, error: 'CUSTOM mode requires subject and html' }
		}
	}

	if (resolvedMode === 'STANDARD') {
		if (!input.status || input.status === 'PENDING') {
			return {
				success: false,
				error:
					'STANDARD mode requires status to be APPROVED, WAITLISTED, or REJECTED',
			}
		}
	}

	const req: SendEmailRequest = {
		applicationType: input.applicationType,
		applicationId: input.applicationId,
		mode: resolvedMode,
		status: input.status,
		category:
			input.category || (resolvedMode === 'STANDARD' ? 'STATUS' : 'CUSTOM'),
		to: input.to,
		from: input.from,
		cc: input.cc,
		bcc: input.bcc,
		replyTo: input.replyTo,
		subject: input.subject,
		html: input.html,
		tokens: coalesceTokens(input.tokens),
		meta: input.meta,
	}

	return await sendApplicationEmail(req)
}

async function getMentorshipPairingEmailData(fundApplicationId: string) {
	const [application] = await db
		.select({
			id: fundApplications.id,
			name: fundApplications.name,
			email: fundApplications.email,
			race: fundApplications.race,
			raceDate: fundApplications.raceDate,
			raceLocation: fundApplications.raceLocation,
		})
		.from(fundApplications)
		.where(eq(fundApplications.id, fundApplicationId))
		.limit(1)

	if (!application) {
		throw new Error('Athlete application not found')
	}

	const [currentMatch] = await db
		.select({
			mentorApplicationId: mentorshipMatches.mentorApplicationId,
			mentorName: mentorApplications.name,
			mentorEmail: mentorApplications.email,
		})
		.from(mentorshipMatches)
		.innerJoin(
			mentorApplications,
			eq(mentorApplications.id, mentorshipMatches.mentorApplicationId),
		)
		.where(
			and(
				eq(mentorshipMatches.fundApplicationId, fundApplicationId),
				isNull(mentorshipMatches.endedAt),
			),
		)
		.orderBy(desc(mentorshipMatches.createdAt))
		.limit(1)

	if (!currentMatch) {
		throw new Error('No active mentor pairing found for this athlete')
	}

	return {
		application,
		currentMatch,
	}
}

function formatRaceDate(value: Date | string | null | undefined) {
	if (!value) return null
	return new Date(value).toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	})
}

function normalizeEmail(value: string | null | undefined) {
	return String(value || '')
		.trim()
		.toLowerCase()
}

function parseEmailList(value: string | undefined) {
	return String(value || '')
		.split(',')
		.map((entry) => normalizeEmail(entry))
		.filter(Boolean)
}

function hasAdminRole(value: unknown): boolean {
	if (typeof value === 'string') {
		const role = value.trim().toLowerCase()
		return role === 'admin' || role === 'admin_readonly'
	}
	if (Array.isArray(value)) {
		return (value as unknown[]).some((entry) => hasAdminRole(entry))
	}
	return false
}

function userHasAdminRole(user: {
	publicMetadata?: { role?: unknown }
}): boolean {
	return hasAdminRole(user.publicMetadata?.role)
}

async function resolveAdminBccEmails() {
	const recipients = new Set<string>()

	for (const email of emailConfig.adminEmails) {
		const normalized = normalizeEmail(email)
		if (normalized) recipients.add(normalized)
	}

	for (const email of parseEmailList(process.env.NEXT_PUBLIC_ADMIN_EMAILS)) {
		recipients.add(email)
	}

	// Include all Clerk admins so BCC covers both env-configured admins and
	// role-based admin users.
	try {
		const clerk = await clerkClient()
		let offset = 0
		const limit = 100

		while (true) {
			const page = await clerk.users.getUserList({ limit, offset })
			const data = Array.isArray((page as { data?: unknown[] }).data)
				? ((page as { data: unknown[] }).data as Array<{
						publicMetadata?: { role?: unknown }
						emailAddresses?: Array<{ id: string; emailAddress: string }>
				  }>)
				: []

			for (const user of data) {
				if (!userHasAdminRole(user)) continue
				for (const emailAddress of user.emailAddresses || []) {
					const normalized = normalizeEmail(emailAddress.emailAddress)
					if (normalized) recipients.add(normalized)
				}
			}

			if (data.length < limit) break
			offset += data.length
		}
	} catch (error) {
		console.warn('[emails] Unable to load Clerk admin users for BCC', error)
	}

	return Array.from(recipients)
}

export async function previewMentorshipPairingEmail(input: {
	fundApplicationId: string
	subjectOverride?: string
	additionalContext?: string
}) {
	await requireAdmin()

	try {
		const { application, currentMatch } = await getMentorshipPairingEmailData(
			input.fundApplicationId,
		)

		const { subject, html } = buildMentorshipPairingIntroEmail({
			athleteName: application.name,
			mentorName: currentMatch.mentorName,
			raceName: application.race,
			raceDate: formatRaceDate(application.raceDate),
			raceLocation: application.raceLocation,
			subjectOverride: input.subjectOverride,
			additionalContext: input.additionalContext,
		})
		const bcc = await resolveAdminBccEmails()

		return {
			success: true as const,
			subject,
			html,
			bcc,
			to: [
				{
					name: application.name,
					email: application.email,
				},
				{
					name: currentMatch.mentorName,
					email: currentMatch.mentorEmail,
				},
			],
		}
	} catch (error) {
		return {
			success: false as const,
			error:
				error instanceof Error
					? error.message
					: 'Failed to build mentorship introduction email',
		}
	}
}

export async function sendMentorshipPairingEmail(input: {
	fundApplicationId: string
	subjectOverride?: string
	additionalContext?: string
}) {
	await requireAdmin()

	try {
		const { application, currentMatch } = await getMentorshipPairingEmailData(
			input.fundApplicationId,
		)

		const { subject, html } = buildMentorshipPairingIntroEmail({
			athleteName: application.name,
			mentorName: currentMatch.mentorName,
			raceName: application.race,
			raceDate: formatRaceDate(application.raceDate),
			raceLocation: application.raceLocation,
			subjectOverride: input.subjectOverride,
			additionalContext: input.additionalContext,
		})
		const bcc = await resolveAdminBccEmails()

		const result = await sendApplicationEmail({
			applicationType: 'FUND',
			applicationId: input.fundApplicationId,
			mode: 'CUSTOM',
			category: 'CUSTOM',
			to: [application.email, currentMatch.mentorEmail],
			from: teamConfig.founderName
				? `${teamConfig.founderName} <${emailConfig.fromAddress}>`
				: emailConfig.fromAddress,
			bcc,
			replyTo: emailConfig.replyToAddress,
			subject,
			html,
			meta: {
				template: 'MENTOR_PAIRING_INTRO',
				mentorApplicationId: currentMatch.mentorApplicationId,
				mentorEmail: currentMatch.mentorEmail,
			},
		})

		if (result.success) {
			revalidatePath(`/admin/applications/${input.fundApplicationId}`)
		}

		return result
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: 'Failed to send mentorship introduction email',
		}
	}
}

export async function previewEmail(input: {
	applicationType: ApplicationType
	applicationId?: string
	mode: EmailMode
	status?: StandardStatus
	category?: EmailCategory
	subject?: string
	html?: string
	tokens?: Record<string, unknown>
}): Promise<
	| {
			success: true
			subject: string
			html: string
			emailType:
				| 'APPROVAL'
				| 'WAITLIST'
				| 'REJECTION'
				| 'INVITE'
				| 'REMINDER'
				| 'ANNOUNCEMENT'
				| 'UPDATE'
				| 'CUSTOM'
	  }
	| { success: false; error: string }
> {
	await requireAdmin()

	try {
		const req: SendEmailRequest = {
			applicationType: input.applicationType,
			applicationId: input.applicationId,
			mode: input.mode,
			status: input.status,
			category: input.category,
			subject: input.subject,
			html: input.html,
			tokens: coalesceTokens(input.tokens),
		}

		const { subject, html, emailType } = await buildEmailPreview(req)
		return { success: true, subject, html, emailType }
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Failed to build preview',
		}
	}
}

/* =========================================================================================
   Presets (In-memory store with useful defaults)
   ========================================================================================= */

// Seed defaults designed to be clear and human-first.
// They use simple {{token}} placeholders you can replace in the client or via previewPreset.

/* =========================================================================================
   Helpers
   ========================================================================================= */

function coalesceTokens(tokens: Record<string, unknown> | undefined) {
	const brand = getBrandLinks()
	return {
		brand,
		...(tokens || {}),
	}
}
