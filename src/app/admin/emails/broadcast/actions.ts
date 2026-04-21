'use server'

import { currentUser } from '@clerk/nextjs/server'
import {
	escapeHtml,
	escapeAttr,
	wrapHtml,
	renderSignature,
} from '@/lib/email/orchestrator'
import { resendService } from '@/lib/services/resend'
import {
	type Recipient,
	type RaceGroup,
	type GroupId,
	getRecipientsForGroup,
} from '@/server/admin/email-groups'
import { requireAdmin } from '@/server/auth/admin'
import { db, emailLogs } from '@/server/db'

/* =======================================================
   Types
   ======================================================= */

export interface BroadcastRecipientResult {
	recipients: Recipient[]
	raceGroups?: RaceGroup[]
}

export interface BroadcastSendResult {
	success: boolean
	sent: number
	failed: number
	errors: string[]
}

/* =======================================================
   Actions
   ======================================================= */

/**
 * Fetch recipients for a given group.
 * Returns the list plus optional race groups for the race-filter dropdown.
 */
export async function fetchRecipients(
	groupId: GroupId,
	raceFilter?: string,
): Promise<BroadcastRecipientResult> {
	await requireAdmin()
	return getRecipientsForGroup(groupId, raceFilter)
}

/**
 * Build a branded HTML preview without sending.
 * Used for the live iframe preview in the composer.
 */
export async function previewBroadcast(input: {
	body: string
	ctaUrl?: string
	ctaLabel?: string
}): Promise<{ html: string }> {
	await requireAdmin()
	const html = buildBroadcastHtml(input.body, input.ctaUrl, input.ctaLabel)
	return { html }
}

/**
 * Send a broadcast email to a list of recipients.
 * Uses Resend batch API for efficient delivery.
 */
export async function sendBroadcast(input: {
	recipients: Array<{ id: string; email: string; name: string }>
	subject: string
	body: string
	ctaUrl?: string
	ctaLabel?: string
	groupId: GroupId
}): Promise<BroadcastSendResult> {
	await requireAdmin()

	const { recipients, subject, body, ctaUrl, ctaLabel, groupId } = input

	if (!subject.trim()) {
		return {
			success: false,
			sent: 0,
			failed: 0,
			errors: ['Subject is required'],
		}
	}
	if (!body.trim()) {
		return {
			success: false,
			sent: 0,
			failed: 0,
			errors: ['Message body is required'],
		}
	}
	if (recipients.length === 0) {
		return {
			success: false,
			sent: 0,
			failed: 0,
			errors: ['No recipients selected'],
		}
	}

	const html = buildBroadcastHtml(body, ctaUrl, ctaLabel)

	// Personalize each email with the recipient's first name
	const emails = recipients.map((r) => {
		const firstName = deriveFirstName(r.name)
		const personalizedHtml = html.replace(
			'{{GREETING_NAME}}',
			escapeHtml(firstName || 'friend'),
		)
		return {
			to: r.email,
			subject,
			html: personalizedHtml,
		}
	})

	const result = await resendService.sendBatchEmails(emails)

	// Log the broadcast send
	const applicationType = resolveApplicationType(groupId)
	try {
		for (const recipient of recipients) {
			await db.insert(emailLogs).values({
				applicationId: recipient.id,
				applicationType,
				emailType: 'CUSTOM',
				recipientEmail: recipient.email,
				status: result.sent > 0 ? 'SENT' : 'FAILED',
			})
		}
	} catch {
		// Swallow logging errors -- don't block the send result
	}

	return {
		success: result.failed === 0,
		sent: result.sent,
		failed: result.failed,
		errors: result.errors,
	}
}

/**
 * Send a test email to the current admin user.
 * Uses the same template as the broadcast but sends only to the admin's email.
 */
export async function sendTestEmail(input: {
	subject: string
	body: string
	ctaUrl?: string
	ctaLabel?: string
}): Promise<{ success: boolean; sentTo?: string; error?: string }> {
	await requireAdmin()

	const user = await currentUser()
	const adminEmail = user?.emailAddresses?.[0]?.emailAddress
	if (!adminEmail) {
		return { success: false, error: 'Could not determine your email address' }
	}

	const { subject, body, ctaUrl, ctaLabel } = input

	if (!subject.trim() || !body.trim()) {
		return { success: false, error: 'Subject and message are required' }
	}

	const html = buildBroadcastHtml(body, ctaUrl, ctaLabel)
	const personalizedHtml = html.replace(
		'{{GREETING_NAME}}',
		escapeHtml(deriveFirstName(user.firstName || 'Admin')),
	)

	const result = await resendService.sendEmail({
		to: adminEmail,
		subject: `[TEST] ${subject.trim()}`,
		html: personalizedHtml,
	})

	if (result.success) {
		return { success: true, sentTo: adminEmail }
	}
	return {
		success: false,
		error: result.error || 'Failed to send test email',
	}
}

/* =======================================================
   Helpers
   ======================================================= */

function buildBroadcastHtml(
	body: string,
	ctaUrl?: string,
	ctaLabel?: string,
): string {
	const parts: string[] = []

	// Greeting with personalization placeholder
	parts.push(`<p>Dear {{GREETING_NAME}},</p>`)

	// Convert plain text body to paragraphs (double newline = new paragraph)
	const resolved = body.replace(/\r\n/g, '\n')
	const blocks = resolved
		.split(/\n{2,}/)
		.map((b) => b.trim())
		.filter(Boolean)
	for (const block of blocks) {
		parts.push(`<p>${escapeHtml(block).replace(/\n/g, '<br/>')}</p>`)
	}

	// Optional CTA button
	if (ctaUrl && ctaUrl.trim()) {
		const label = ctaLabel?.trim() || 'Learn More'
		parts.push(
			`<p><a class="button" href="${escapeAttr(ctaUrl.trim())}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a></p>`,
		)
	}

	parts.push(renderSignature())

	return wrapHtml(parts.join('\n'))
}

function deriveFirstName(name?: string): string {
	if (!name) return ''
	const [first] = name.trim().split(/\s+/)
	return first || ''
}

function resolveApplicationType(groupId: GroupId): 'FUND' | 'MENTOR' {
	switch (groupId) {
		case 'active-athletes':
		case 'active-by-race-series':
		case 'no-longer-active-athletes':
		case 'no-show-or-dropped-athletes':
			return 'FUND'
		case 'active-mentors':
			return 'MENTOR'
		case 'newsletter':
			return 'FUND' // newsletter broadcasts default to FUND for logging
		default:
			return 'FUND'
	}
}
