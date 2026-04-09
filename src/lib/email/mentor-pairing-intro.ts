import { siteConfig, teamConfig } from '@/lib/config/site'
import { getBrandLinks } from '@/lib/email/brand'
import { escapeAttr, escapeHtml, wrapHtml } from '@/lib/email/orchestrator'

type MentorshipPairingIntroInput = {
	athleteName: string
	mentorName: string
	raceName: string
	raceDate?: string | null
	raceLocation?: string | null
	additionalContext?: string | null
	subjectOverride?: string | null
}

function firstName(name: string) {
	const [first] = name.trim().split(/\s+/)
	return first || name.trim() || 'friend'
}

function normalizeParagraphs(value: string | null | undefined) {
	if (!value) return []
	return value
		.replace(/\r\n/g, '\n')
		.split(/\n{2,}/)
		.map((part) => part.trim())
		.filter(Boolean)
}

function defaultSubject(input: MentorshipPairingIntroInput) {
	return `Mentor introduction: ${input.mentorName} + ${input.athleteName}${input.raceName ? ` for ${input.raceName}` : ''} \u2014 ${siteConfig.name}`
}

export function buildMentorshipPairingIntroEmail(
	input: MentorshipPairingIntroInput,
) {
	const brand = getBrandLinks()
	const athleteFirstName = firstName(input.athleteName)
	const mentorFirstName = firstName(input.mentorName)
	const raceLine = [
		input.raceName,
		input.raceDate || null,
		input.raceLocation || null,
	]
		.filter(Boolean)
		.join(' • ')

	const subject = (input.subjectOverride || '').trim() || defaultSubject(input)

	const parts: string[] = []
	parts.push(
		`<p>Hi ${escapeHtml(athleteFirstName)} and ${escapeHtml(mentorFirstName)},</p>`,
	)
	parts.push(
	`<p>I'm making this introduction for the ${siteConfig.name} mentorship program. You've been matched as athlete and mentor as <strong>${escapeHtml(athleteFirstName)}</strong> prepares for <strong>${escapeHtml(input.raceName || 'their race')}</strong>${input.raceDate ? ` on <strong>${escapeHtml(input.raceDate)}</strong>` : ''}${input.raceLocation ? ` in <strong>${escapeHtml(input.raceLocation)}</strong>` : ''}. I'm excited for you both to connect.</p>`,
	)
	parts.push(
		`<p>Please reply all to this email to make the initial connection and set up a first call or check-in. From there, choose the communication style that makes the most sense for both of you, whether that’s text, email, phone, or a simple recurring check-in cadence.</p>`,
	)
	parts.push(
		`<p>Once you two are connected, you do not need to keep me copied on your replies. Feel free to remove me from the thread and communicate directly in whatever way works best for both of you.</p>`,
	)
	parts.push(
		`<ul><li><strong>${escapeHtml(athleteFirstName)}</strong>: share your current training context, biggest questions, and what kind of support would feel most useful right now.</li><li><strong>${escapeHtml(mentorFirstName)}</strong>: share your preferred communication style, availability, and how you like to support athletes through training and race prep.</li><li><strong>Both of you</strong>: name expectations early so the relationship feels clear, useful, and sustainable.</li></ul>`,
	)
	parts.push(
		`<p>The goal of this mentorship is guidance, encouragement, accountability, and shared learning through training and race weekend. This pairing is intended to wrap once race weekend is over. There’s no one right format. What matters most is finding a rhythm that feels practical and supportive for both of you.</p>`,
	)

	for (const paragraph of normalizeParagraphs(input.additionalContext)) {
		parts.push(`<p>${escapeHtml(paragraph).replace(/\n/g, '<br/>')}</p>`)
	}

	if (raceLine) {
		parts.push(
			`<div class="secondary"><strong>Pairing details</strong><br/>${escapeHtml(raceLine)}</div>`,
		)
	}

	parts.push(
		`<p>If helpful, here is a short overview of our mentorship program: <a href="${escapeAttr(
			`${brand.websiteUrl}/blog/mentorship`,
		)}" target="_blank" rel="noopener noreferrer">Mentorship Guide</a>.</p>`,
	)
	parts.push(
		`<p>If anything feels unclear, stalled, or you need support along the way, just reply here and I’ll help.</p>`,
	)
	parts.push(`<p>Excited for this pairing.</p>`)
	parts.push(
		`<p>${teamConfig.founderName ? escapeHtml(teamConfig.founderName) + '<br/>' : ''}${siteConfig.name}</p>`,
	)

	return {
		subject,
		html: wrapHtml(parts.join('\n')),
	}
}
