/**
 * DRY email orchestrator with STANDARD and CUSTOM modes.
 *
 * Responsibilities:
 * - Normalize email sending across Athlete Fund, Mentor, and Events.
 * - Resolve STANDARD (templated) emails from applicationType + status + tokens.
 * - Send CUSTOM (raw HTML) emails as-is.
 * - Fallback to application email (by applicationId) when "to" is omitted.
 * - Log every attempt in email_logs with a consistent emailType tag.
 *
 * Extensibility:
 * - Register per-applicationType resolvers at runtime via registerTemplateResolver.
 * - Bring your own tokens; resolvers decide which tokens matter.
 * - Add new application types and templates without touching the orchestrator.
 */

import { eq } from 'drizzle-orm'
import { siteConfig, emailConfig, teamConfig } from '@/lib/config/site'
import { getBrandLinks } from '@/lib/email/brand'
import {
	type ApplicationType,
	type StandardStatus,
	type EmailCategory,
	type EmailTypeTag,
	type SendEmailRequest,
	type SendEmailResult,
	type TokensByType,
	type TokensFor,
} from '@/lib/email/types'
import { resendService } from '@/lib/services/resend'
import {
	db,
	emailLogs,
	fundApplications,
	mentorApplications,
} from '@/server/db'

/* =======================================================
   Registry removed: direct dispatch by applicationType
   ======================================================= */

/* =======================================================
   Public API
   ======================================================= */

/**
 * sendApplicationEmail
 * - Single entry point to send emails across contexts.
 * - STANDARD mode: Resolve subject+html from resolvers.
 * - CUSTOM mode: Send subject+html as-is (e.g., from composer).
 */
export async function sendApplicationEmail<
	T extends ApplicationType = ApplicationType,
>(req: SendEmailRequest<T>): Promise<SendEmailResult> {
	try {
		// 1) Determine recipient
		const to = await resolveRecipient(req)

		// 2) Build subject + html
		const { subject, html, emailType } = await resolveSubjectAndHtml(req)

		// 3) Execute send
		const sendRes = await resendService.sendEmail({
			to,
			from: req.from,
			subject,
			html,
			cc: req.cc,
			bcc: req.bcc,
			replyTo: req.replyTo || emailConfig.replyToAddress,
		})
		const result:
			| { success: true; id?: string }
			| { success: false; error: string } = sendRes.success
			? { success: true, id: (sendRes as { success: true; id?: string }).id }
			: {
					success: false,
					error: (sendRes as { success: false; error: string }).error,
				}

		// 4) Log outcome
		await safeLogSend({
			applicationId: req.applicationId,
			applicationType: req.applicationType,
			emailType,
			recipientEmail: Array.isArray(to) ? to.join(', ') : to,
			status: result.success ? 'SENT' : 'FAILED',
			providerId: result.success ? result.id : undefined,
			subject,
			error: result.success
				? undefined
				: (result as { success: false; error: string }).error,
			meta: req.meta,
		})

		// 5) Return normalized result
		return {
			success: result.success,
			id: result.success ? result.id : undefined,
			error: result.success
				? undefined
				: (result as { success: false; error: string }).error ||
					'Failed to send email',
			providerResponse: sendRes,
		}
	} catch (error) {
		const msg = error instanceof Error ? error.message : 'Unknown error'
		// Best-effort log when possible
		try {
			await safeLogSend({
				applicationId: req.applicationId,
				applicationType: req.applicationType,
				emailType: mapEmailTypeTag(req),
				recipientEmail: Array.isArray(req.to)
					? req.to.join(', ')
					: req.to || 'unknown',
				status: 'FAILED',
				subject: req.subject,
				error: msg,
				meta: req.meta,
			})
		} catch {
			// ignore secondary logging failure
		}
		return { success: false, error: `Failed to send email: ${msg}` }
	}
}

/**
 * buildEmailPreview
 * - Returns subject + html (and emailType tag) for a given request
 * - No provider calls, no DB logging. Safe for UI previews.
 */
export async function buildEmailPreview<
	T extends ApplicationType = ApplicationType,
>(
	req: SendEmailRequest<T>,
): Promise<{
	subject: string
	html: string
	emailType: EmailTypeTag
}> {
	const { subject, html, emailType } = await resolveSubjectAndHtml(req)
	return { subject, html, emailType }
}

/* =======================================================
   Resolution helpers
   ======================================================= */

async function resolveRecipient<T extends ApplicationType>(
	req: SendEmailRequest<T>,
): Promise<string | string[]> {
	// If explicit "to" provided, use it.
	if (req.to) {
		if (Array.isArray(req.to)) return req.to.map((e) => e.trim())
		if (req.to.trim().length > 0) return req.to.trim()
	}

	// Otherwise fallback by application type using applicationId (if provided)
	if (req.applicationId) {
		if (req.applicationType === 'FUND') {
			const [app] = await db
				.select({ email: fundApplications.email })
				.from(fundApplications)
				.where(eq(fundApplications.id, req.applicationId))
			if (app?.email) return app.email
		} else if (req.applicationType === 'MENTOR') {
			const [app] = await db
				.select({ email: mentorApplications.email })
				.from(mentorApplications)
				.where(eq(mentorApplications.id, req.applicationId))
			if (app?.email) return app.email
		}
		// For 'EVENT' we generally expect explicit recipient(s)
	}

	throw new Error(
		'Recipient email not provided and could not be inferred from applicationId',
	)
}

async function resolveSubjectAndHtml<T extends ApplicationType>(
	req: SendEmailRequest<T>,
): Promise<{
	subject: string
	html: string
	emailType: EmailTypeTag
}> {
	if (req.mode === 'CUSTOM') {
		if (!req.subject || !req.html) {
			throw new Error('CUSTOM mode requires both subject and html')
		}
		return {
			subject: req.subject,
			html: req.html,
			emailType: 'CUSTOM',
		}
	}

	// STANDARD mode
	const status = (req.status || 'PENDING') as StandardStatus
	if (status === 'PENDING') {
		throw new Error('STANDARD mode does not support PENDING status')
	}

	const category: EmailCategory =
		req.category && req.category !== 'CUSTOM' ? req.category : 'STATUS'

	// Narrow and dispatch to the correct resolver for strong typing
	let subject = ''
	let html = ''

	switch (req.applicationType) {
		case 'FUND': {
			const t = (req.tokens || {}) as TokensByType['FUND']
			const out = fundStandardResolver({
				applicationType: 'FUND',
				status: status as Exclude<StandardStatus, 'PENDING'>,
				category: category as Exclude<EmailCategory, 'CUSTOM'>,
				tokens: t,
			})
			subject = out.subject
			html = out.html
			break
		}
		case 'MENTOR': {
			const t = (req.tokens || {}) as TokensByType['MENTOR']
			const out = mentorStandardResolver({
				applicationType: 'MENTOR',
				status: status as Exclude<StandardStatus, 'PENDING'>,
				category: category as Exclude<EmailCategory, 'CUSTOM'>,
				tokens: t,
			})
			subject = out.subject
			html = out.html
			break
		}
		case 'EVENT': {
			const t = (req.tokens || {}) as TokensByType['EVENT']
			const out = eventStandardResolver({
				applicationType: 'EVENT',
				status: status as Exclude<StandardStatus, 'PENDING'>,
				category: category as Exclude<EmailCategory, 'CUSTOM'>,
				tokens: t,
			})
			subject = out.subject
			html = out.html
			break
		}
		default: {
			throw new Error(
				`Unsupported applicationType: ${String(req.applicationType)}`,
			)
		}
	}

	return {
		subject,
		html,
		emailType: mapEmailTypeTag(req),
	}
}

/* =======================================================
   Default resolvers (replace or override via register)
   These are intentionally simple and safe HTML wrappers.
   ======================================================= */

function fundStandardResolver(input: {
	applicationType: 'FUND'
	status: Exclude<StandardStatus, 'PENDING'>
	category: Exclude<EmailCategory, 'CUSTOM'>
	tokens: TokensFor<'FUND'>
}) {
	const t = normalizeFundTokens(input.tokens)
	let subject =
		input.status === 'APPROVED'
			? t.raceName
				? `You're approved for ${t.raceName} — ${siteConfig.name}`
				: `You're approved — ${siteConfig.name}`
			: input.status === 'WAITLISTED'
				? t.raceName
					? `Waitlist update for ${t.raceName} — ${siteConfig.name}`
					: `Waitlist update — ${siteConfig.name}`
				: t.raceName
					? `Update on your application for ${t.raceName} — ${siteConfig.name}`
					: `Update on your application — ${siteConfig.name}`

	const customSubject = (t.customSubject || '').trim()
	if (customSubject) {
		subject = ensureBrandSuffix(interpolateTokens(customSubject, t))
	}

	const body = renderFundBody(input.status, t)
	return { subject, html: wrapHtml(body) }
}

function mentorStandardResolver(input: {
	applicationType: 'MENTOR'
	status: Exclude<StandardStatus, 'PENDING'>
	category: Exclude<EmailCategory, 'CUSTOM'>
	tokens: TokensFor<'MENTOR'>
}) {
	const t = normalizeMentorTokens(input.tokens)
	let subject =
		input.status === 'APPROVED'
			? `You're approved as a mentor — ${siteConfig.name}`
			: input.status === 'WAITLISTED'
				? `Mentor application waitlist — ${siteConfig.name}`
				: `Update on your mentor application — ${siteConfig.name}`

	const customSubject = (t.customSubject || '').trim()
	if (customSubject) {
		subject = ensureBrandSuffix(interpolateTokens(customSubject, t))
	}

	const body = renderMentorBody(input.status, t)
	return { subject, html: wrapHtml(body) }
}

function eventStandardResolver(input: {
	applicationType: 'EVENT'
	status: Exclude<StandardStatus, 'PENDING'>
	category: Exclude<EmailCategory, 'CUSTOM'>
	tokens: TokensFor<'EVENT'>
}) {
	const t = normalizeEventTokens(input.tokens)
	// Subject varies more by category than status for events
	let subject = ''
	switch (input.category) {
		case 'INVITE':
			subject = t.eventTitle
				? `You're invited: ${t.eventTitle} — ${siteConfig.name}`
				: `You're invited — ${siteConfig.name}`
			break
		case 'REMINDER':
			subject = t.eventTitle
				? `Reminder: ${t.eventTitle} — ${siteConfig.name}`
				: `Event reminder — ${siteConfig.name}`
			break
		case 'ANNOUNCEMENT':
			subject = t.eventTitle
				? `Announcement: ${t.eventTitle} — ${siteConfig.name}`
				: `Announcement — ${siteConfig.name}`
			break
		default:
			subject = t.eventTitle
				? `${t.eventTitle} — ${siteConfig.name}`
				: `${siteConfig.name} — Update`
	}

	const body = renderEventBody(input.category, t)
	return { subject, html: wrapHtml(body) }
}

/* =======================================================
   Default renderers (simple, human-first copy)
   ======================================================= */

function renderFundBody(
	status: Exclude<StandardStatus, 'PENDING'>,
	t: ReturnType<typeof normalizeFundTokens>,
) {
	const parts: string[] = []
	parts.push(
		`<p>Dear ${escapeHtml(t.firstName || t.applicantName || 'athlete')},</p>`,
	)

	const customBody = (t.customBody || '').trim()
	if (customBody) {
		parts.push(renderCustomBody(customBody, t))
	} else {
		if (status === 'APPROVED') {
			parts.push(
				`<p><strong>Your Athlete Fund application is approved — congratulations! 🎉</strong></p>`,
			)
			if (t.raceName || t.raceDate || t.raceLocation) {
				parts.push(
					`<p>We’re excited to support your participation in <strong>${escapeHtml(
						t.raceName || 'your race',
					)}</strong>${t.raceDate ? ` on <strong>${escapeHtml(t.raceDate)}</strong>` : ''}${
						t.raceLocation
							? ` in <strong>${escapeHtml(t.raceLocation)}</strong>`
							: ''
					}.</p>`,
				)
			}
			parts.push(
				`<p>Because we are a small nonprofit with limited resources, we want to make sure that everything we provide has the greatest impact and avoids waste. To confirm your spot, please reply to this email within 72 hours with the following:</p>`,
			)
			parts.push('<ol>')
			const regMode = t.registrationMode || 'ORG_REGISTERS'
			if (regMode === 'SELF_REGISTER') {
				const link = t.registrationLink
					? `<a href="${escapeAttr(t.registrationLink)}" target="_blank" rel="noopener noreferrer">Register here</a>`
					: 'Register using the provided link.'
				const code = t.registrationCode
					? ` — use discount code <strong>${escapeHtml(t.registrationCode)}</strong> when you register.`
					: ''
				parts.push(
					`<li><strong>Please register for your race</strong><br>${link}${code}</li>`,
				)
			} else {
				parts.push(
					`<li><strong>Confirm your participation</strong><br>We’ll register you via UltraSignup. Reply with your UltraSignup email (or account email) and date of birth.</li>`,
				)
			}

			if (
				t.gear &&
				(t.gear.shoes ||
					t.gear.tshirt ||
					t.gear.shorts ||
					(t.gear.customItems?.length ?? 0) > 0)
			) {
				parts.push(
					`<li><strong>Trail Gear</strong><br>We plan to support the following item(s):`,
				)
				const items: string[] = []
				if (t.gear.shoes) items.push('<li>Trail Shoes</li>')
				if (t.gear.tshirt) items.push('<li>Running T-Shirt</li>')
				if (t.gear.shorts) items.push('<li>Running Shorts</li>')
				if (Array.isArray(t.gear.customItems)) {
					for (const it of t.gear.customItems) {
						if (typeof it === 'string' && it.trim()) {
							items.push(`<li>${escapeHtml(it.trim())}</li>`)
						}
					}
				}
				parts.push(`<ul>${items.join('')}</ul>`)
				parts.push(
					`<p>${escapeHtml(
						t.gear.instructions ||
							`Please reply with your sizes and preferred fit (women’s/men’s/unisex), and include a reliable shipping address. Note: unisex sizing for tops and bottoms isn’t always guaranteed, so please provide your second-best fit option as well. For trail shoes, many athletes go a half size up—especially for longer training runs and races—to allow extra room for comfort.`,
					)}</p></li>`,
				)
			}

			if (t.wantsMentor) {
				parts.push(
					`<li><strong>Mentorship commitment</strong><br>Please confirm you can connect ~30 minutes every two weeks with your mentor leading up to race day. You’ll decide cadence, timing, and communication style together.</li>`,
				)
			}
			if (Array.isArray(t.preRaceEvents) && t.preRaceEvents.length > 0) {
				const eventLis: string[] = []
				for (const ev of t.preRaceEvents) {
					if (!ev) continue
					let line = ''
					if (ev.title) line += `<strong>${escapeHtml(ev.title)}</strong>`
					if (ev.start) line += ` — ${escapeHtml(ev.start)}`
					if (ev.locationName) line += ` @ ${escapeHtml(ev.locationName)}`
					if (ev.rsvpUrl)
						line += ` — <a href="${escapeAttr(ev.rsvpUrl)}" target="_blank" rel="noopener noreferrer">RSVP</a>`
					eventLis.push(`<li>${line}</li>`)
				}
				parts.push(
					`<li><strong>Pre-Race Events</strong><br>We encourage you to join these optional community events before race day.<ul>${eventLis.join(
						'',
					)}</ul></li>`,
				)
			}
			parts.push(`</ol>`)
		} else if (status === 'WAITLISTED') {
			parts.push(
				`<p>Thank you for applying to the <strong>Athlete Fund</strong>${t.raceName ? ` for <strong>${escapeHtml(t.raceName)}</strong>` : ''}.</p>`,
			)
			parts.push(
				`<p><strong>At this time, we are unable to provide support for this specific event.</strong> This is typically due to the race being at full capacity or the event date being too close for us to effectively coordinate the level of support we aim to provide.</p>`,
			)
			parts.push(
				`<p><strong>However, we would still love to work with you!</strong> Please take a look at <a href="${defaultBrand().websiteUrl}/fund/apply" target="_blank" rel="noopener noreferrer">the races we have available</a> and submit another application. We recommend choosing a race <strong>three to six months out</strong>; this timeline allows us to fully support your journey with mentorship, community resources, and the preparation you deserve.</p>`,
			)
			if (
				t.recommendedRace &&
				(t.recommendedRace.name ||
					t.recommendedRace.url ||
					t.recommendedRace.info)
			) {
				const rr = t.recommendedRace
				const pieces: string[] = []
				if (rr.name) pieces.push(`<strong>${escapeHtml(rr.name)}</strong>`)
				if (rr.info) pieces.push(`${escapeHtml(rr.info)}`)
				const details = pieces.join(' — ')
				const link = rr.url
					? ` <a href="${escapeAttr(rr.url)}" target="_blank" rel="noopener noreferrer">View race</a>`
					: ''
				parts.push(
					`<p>If helpful, here’s an event to consider: ${details}${link}</p>`,
				)
			}
		} else {
			parts.push(
				`<p>Thank you for applying to the Athlete Fund${t.raceName ? ` for ${escapeHtml(t.raceName)}` : ''}. Because we received many strong applications and have limited capacity, we’re not able to offer support this time.</p>`,
			)
			parts.push(
				`<p>This decision isn’t a reflection of your potential as an athlete. We’d love to stay connected in our community and hope you’ll apply again for a future race.</p>`,
			)
			if (t.decisionNotes) {
				parts.push(`<p>${escapeHtml(t.decisionNotes)}</p>`)
			}
		}
	}

	if (status !== 'WAITLISTED') {
		const includeHeartfelt = status !== 'REJECTED'
		parts.push(
			renderCommunity(
				t.brand,
				'FUND',
				false,
				includeHeartfelt,
				status === 'APPROVED',
			),
		)
	}
	parts.push(renderSignature())
	return parts.join('\n')
}

function renderMentorBody(
	status: Exclude<StandardStatus, 'PENDING'>,
	t: ReturnType<typeof normalizeMentorTokens>,
) {
	const parts: string[] = []
	parts.push(
		`<p>Dear ${escapeHtml(t.firstName || t.applicantName || 'mentor')},</p>`,
	)

	const customBody = (t.customBody || '').trim()
	if (customBody) {
		parts.push(renderCustomBody(customBody, t))
		parts.push(renderSignature())
		return parts.join('\n')
	}
	if (status === 'APPROVED') {
		const slack = t.brand.slackUrl
		const slackCta = slack
			? `<p><a class="button" href="${escapeAttr(slack)}" target="_blank" rel="noopener noreferrer">Join Slack</a></p>`
			: `<p>We’ll email your Slack invite separately.</p>`
		parts.push(
			`<p><strong>You’re approved to mentor — thank you for supporting athletes in our community! 🎉</strong></p>`,
		)
		parts.push(
			`<p>We’re excited to welcome you as a mentor. Here are your next steps to get started:</p>`,
		)
		parts.push(
			`<ol>
				<li>
					<p><strong>Join Slack</strong></p>
					<p>We’ll add you to <strong>#mentors</strong> to coordinate pairing and share resources. Please introduce yourself in <strong>#introductions</strong> so the community can get to know you.</p>
					${slackCta}
				</li>
				<li>
					<p><strong>Read our mentorship guide</strong></p>
					<p>This guide sets expectations and answers common questions.</p>
					<p><a class="button" href="${defaultBrand().websiteUrl}/blog/mentorship" target="_blank" rel="noopener noreferrer">Mentorship Guide</a></p>
				</li>
				<li>
					<p><strong>Schedule a kick‑off with our Program Lead${teamConfig.programLeadName ? `, ${teamConfig.programLeadName}` : ''}</strong></p>
					<p>Once you've joined Slack, send them a message to coordinate your first check‑in.</p>
				</li>
			</ol>`,
		)
	} else if (status === 'WAITLISTED') {
		parts.push(
			`<p>Thank you for applying to mentor with ${siteConfig.name}. You're currently on our waitlist. We'll reach out if a pairing becomes available.</p>`,
		)
	} else {
		parts.push(
			`<p>Thank you for applying to mentor with ${siteConfig.name}. We're not able to move forward right now due to limited pairing capacity.</p>`,
		)
		parts.push(
			`<p>We’d love to stay connected — please reapply in the future if your availability or focus areas change.</p>`,
		)
	}

	parts.push(renderSignature())
	return parts.join('\n')
}

function renderEventBody(
	category: EmailCategory,
	t: ReturnType<typeof normalizeEventTokens>,
) {
	const parts: string[] = []
	parts.push(
		`<p>Dear ${escapeHtml(t.firstName || t.applicantName || 'friend')},</p>`,
	)
	if (category === 'INVITE') {
		parts.push(
			`<p><strong>You’re invited${t.eventTitle ? ` to ${escapeHtml(t.eventTitle)}` : ''}!</strong></p>`,
		)
		if (t.eventMessage) {
			parts.push(`<p>${escapeHtml(t.eventMessage)}</p>`)
		}
	} else if (category === 'REMINDER') {
		parts.push(
			`<p><strong>Reminder${t.eventTitle ? ` — ${escapeHtml(t.eventTitle)}` : ''}</strong></p>`,
		)
	} else if (category === 'ANNOUNCEMENT') {
		parts.push(
			`<p><strong>Announcement${t.eventTitle ? ` — ${escapeHtml(t.eventTitle)}` : ''}</strong></p>`,
		)
	}
	if (t.eventStart || t.eventLocationName) {
		parts.push(
			`<p>${t.eventStart ? `${escapeHtml(t.eventStart)}` : ''}${
				t.eventLocationName ? ` — ${escapeHtml(t.eventLocationName)}` : ''
			}</p>`,
		)
	}
	if (t.eventAddress) {
		parts.push(`<p>${escapeHtml(t.eventAddress)}</p>`)
	}
	if (t.descriptionHtml) {
		parts.push(`<div>${t.descriptionHtml}</div>`)
	}
	if (t.rsvpEnabled && t.eventMapUrl) {
		parts.push(
			`<p><a href="${escapeAttr(t.eventMapUrl)}" target="_blank" rel="noopener noreferrer">View Map</a></p>`,
		)
	}
	if (t.rsvpEnabled && t.rsvpUrl) {
		parts.push(
			`<p><a href="${escapeAttr(t.rsvpUrl)}" target="_blank" rel="noopener noreferrer"><strong>RSVP Now</strong></a></p>`,
		)
	}

	parts.push(renderSignature())
	return parts.join('\n')
}

/* =======================================================
   Logging + type mapping
   ======================================================= */

async function safeLogSend(input: {
	applicationId?: string
	applicationType: ApplicationType
	emailType: EmailTypeTag
	recipientEmail: string
	status: 'SENT' | 'FAILED'
	providerId?: string
	subject?: string
	error?: string
	meta?: Record<string, unknown>
}) {
	try {
		await db.insert(emailLogs).values({
			applicationId: input.applicationId || 'UNKNOWN',
			applicationType: input.applicationType,
			emailType: input.emailType,
			recipientEmail: input.recipientEmail,
			status: input.status,
		})
	} catch {
		// swallow log errors to avoid blocking sending
	}
}

function mapEmailTypeTag<T extends ApplicationType>(
	req: SendEmailRequest<T>,
): EmailTypeTag {
	if (req.mode === 'CUSTOM') return 'CUSTOM'
	if (req.applicationType === 'FUND' || req.applicationType === 'MENTOR') {
		switch (req.status) {
			case 'APPROVED':
				return 'APPROVAL'
			case 'WAITLISTED':
				return 'WAITLIST'
			case 'REJECTED':
				return 'REJECTION'
			default:
				return 'UPDATE'
		}
	}
	// Events or other categories
	switch (req.category) {
		case 'INVITE':
			return 'INVITE'
		case 'REMINDER':
			return 'REMINDER'
		case 'ANNOUNCEMENT':
			return 'ANNOUNCEMENT'
		case 'UPDATE':
			return 'UPDATE'
		default:
			return 'UPDATE'
	}
}

/* =======================================================
   Token normalization helpers
   ======================================================= */

function deriveFirstName(name?: string) {
	if (!name) return undefined
	const [first] = name.trim().split(/\s+/)
	return first || undefined
}

function normalizeFundTokens(tokens: TokensFor<'FUND'>) {
	const brand = tokens.brand || defaultBrand()
	const preRaceEvents = Array.isArray(tokens.preRaceEvents)
		? tokens.preRaceEvents.filter(Boolean)
		: []
	return {
		...tokens,
		firstName: tokens.firstName || deriveFirstName(tokens.applicantName),
		brand,
		decisionNotes:
			typeof tokens.decisionNotes === 'string' ? tokens.decisionNotes : '',
		customSubject:
			typeof tokens.customSubject === 'string' ? tokens.customSubject : '',
		customBody: typeof tokens.customBody === 'string' ? tokens.customBody : '',
		preRaceEvents,
		registrationMode:
			tokens.registrationMode === 'SELF_REGISTER'
				? 'SELF_REGISTER'
				: 'ORG_REGISTERS',
	}
}

function normalizeMentorTokens(tokens: TokensFor<'MENTOR'>) {
	const brand = tokens.brand || defaultBrand()
	return {
		...tokens,
		firstName: tokens.firstName || deriveFirstName(tokens.applicantName),
		brand,
		customSubject:
			typeof tokens.customSubject === 'string' ? tokens.customSubject : '',
		customBody: typeof tokens.customBody === 'string' ? tokens.customBody : '',
	}
}

function normalizeEventTokens(tokens: TokensFor<'EVENT'>) {
	const brand = tokens.brand || defaultBrand()
	return {
		...tokens,
		firstName: tokens.firstName || deriveFirstName(tokens.applicantName),
		brand,
		customSubject:
			typeof tokens.customSubject === 'string' ? tokens.customSubject : '',
		customBody: typeof tokens.customBody === 'string' ? tokens.customBody : '',
	}
}

function ensureBrandSuffix(subject: string) {
	const s = (subject || '').trim()
	const name = siteConfig.name
	if (!s) return name
	return new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(s)
		? s
		: `${s} — ${name}`
}

function renderCustomBody(raw: string, tokens: Record<string, unknown>) {
	const resolved = interpolateTokens(raw, tokens).replace(/\r\n/g, '\n')
	const blocks = resolved
		.split(/\n{2,}/)
		.map((b) => b.trim())
		.filter(Boolean)
	return blocks
		.map((b) => `<p>${escapeHtml(b).replace(/\n/g, '<br/>')}</p>`)
		.join('\n')
}

function interpolateTokens(template: string, tokens: Record<string, unknown>) {
	return (template || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, path) => {
		const v = getPathValue(tokens, String(path))
		if (v === undefined || v === null) return ''
		if (typeof v === 'string') return v
		if (typeof v === 'number' || typeof v === 'boolean') return String(v)
		return ''
	})
}

function getPathValue(obj: Record<string, unknown>, path: string) {
	const parts = path.split('.')
	let cur: unknown = obj
	for (const p of parts) {
		if (!cur || typeof cur !== 'object') return undefined
		cur = (cur as Record<string, unknown>)[p]
	}
	return cur
}

/* =======================================================
   HTML wrapper + utilities
   ======================================================= */

export function wrapHtml(inner: string) {
	return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
	body {
		font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
		line-height: 1.75;
		color: hsl(42, 15%, 18%);
		font-size: 16px;
		max-width: 640px;
		margin: 0 auto;
		padding: 20px;
		background-color: hsl(42, 38%, 97%);
	}
	.header {
		background: hsl(46, 95%, 55%);
		color: hsl(46, 30%, 12%);
		padding: 28px 24px;
		border-radius: 10px 10px 0 0;
		text-align: center;
	}
	.header h1 {
		margin: 0;
		font-size: 24px;
		font-weight: 800;
	}
	.content {
		background: #fffdf9;
		padding: 24px 28px;
		border: 1px solid hsl(42, 15%, 82%);
		border-radius: 0 0 10px 10px;
	}
	.secondary {
		background: hsl(42, 25%, 90%);
		color: hsl(42, 35%, 22%);
		padding: 12px;
		border-radius: 8px;
	}
	h3 { margin-top: 20px; }
	p { margin: 16px 0; }
	ol { padding-left: 20px; margin: 16px 0; }
	ul { padding-left: 20px; margin: 16px 0; }
	li { margin: 10px 0; }
	.footer {
		margin-top: 20px;
		padding-top: 12px;
		border-top: 1px solid hsl(42, 15%, 82%);
		text-align: center;
		color: hsl(42, 10%, 42%);
		font-size: 12px;
	}
	a.button {
		display: inline-block;
		padding: 10px 16px;
		background: hsl(46, 95%, 55%);
		color: hsl(46, 30%, 12%) !important;
		text-decoration: none;
		border-radius: 10px;
		font-weight: 600;
		font-size: 14px;
		margin: 8px 8px 0 0;
	}
</style>
</head>
<body>
	<div class="header">
		<h1>${siteConfig.name}</h1>
	</div>
	<div class="content">
		${inner}
	</div>
	<div class="footer">
		<p style="margin:0;"><a href="${escapeAttr(
			defaultBrand().websiteUrl ?? siteConfig.url,
		)}" target="_blank" rel="noopener noreferrer">${siteConfig.name}</a></p>
	</div>
</body>
</html>`
}

function renderCommunity(
	brand: ReturnType<typeof defaultBrand>,
	type: ApplicationType,
	showMentorNote = false,
	includeHeartfelt = true,
	includeSlack = false,
) {
	const slack = brand.slackUrl
	const strava = brand.stravaUrl

	const parts: string[] = []
	if (includeHeartfelt) {
		parts.push(
			`<p>That’s it for now. Thank you for reading this email and for being part of our community. You belong here, and we’re excited to be part of your running journey.</p>`,
		)
	}
	parts.push(`<h3>Join our community</h3>`)
	const buttons: string[] = []
	if (includeSlack && slack)
		buttons.push(
			`<a class="button" href="${escapeAttr(slack)}" target="_blank" rel="noopener noreferrer">Join Slack</a>`,
		)
	if (type !== 'MENTOR' && strava) {
		buttons.push(
			`<a class="button" href="${escapeAttr(strava)}" target="_blank" rel="noopener noreferrer">Join Strava</a>`,
		)
	}
	parts.push(`<p>${buttons.join(' ')}</p>`)
	if (type === 'MENTOR' && showMentorNote && slack) {
		parts.push(
			`<p>Once you join Slack, we’ll add you to the <strong>#mentors</strong> channel to coordinate pairing and resources.</p>`,
		)
	}
	return parts.join('\n')
}

export function renderSignature() {
	return `<p>— The ${siteConfig.name} Team</p>`
}

function defaultBrand() {
	return getBrandLinks()
}

export function escapeHtml(s: string) {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

export function escapeAttr(s: string) {
	return s.replace(/"/g, '&quot;')
}
