/**
 * Centralized site configuration.
 *
 * All brand-specific values (name, tagline, social links, emails, etc.) live here.
 * Fork maintainers: update these values to match your organization.
 *
 * Content that changes frequently (marketing copy, hero images, etc.) should live
 * in Sanity CMS via the "siteSettings" singleton document type.
 */

function normalizeEnvString(value: string | undefined, fallback: string) {
	return (value ?? fallback).replace(/[\r\n]+/g, ' ').trim()
}

function normalizeEnvList(value: string | undefined) {
	return (value || '')
		.split(',')
		.map((entry) => normalizeEnvString(entry, ''))
		.filter(Boolean)
}

export const siteConfig = {
	/** Organization / site name */
	name: normalizeEnvString(
		process.env.NEXT_PUBLIC_SITE_NAME,
		'Tierra Libre Run',
	),

	/** Short tagline */
	tagline: normalizeEnvString(
		process.env.NEXT_PUBLIC_SITE_TAGLINE,
		'Trail Access for BIPOC Athletes',
	),

	/** One-sentence description used in metadata */
	description: normalizeEnvString(
		process.env.NEXT_PUBLIC_SITE_DESCRIPTION,
		'Tierra Libre Run is a nonprofit initiative that funds race entries and provides mentorship for runners of color entering trail running. Everything built around the trail race experience.',
	),

	/** Canonical site URL */
	url: normalizeEnvString(
		process.env.NEXT_PUBLIC_SITE_URL,
		'http://localhost:3000',
	),

	/** Keywords for SEO */
	keywords:
		'trail running, runners of color, race funding, mentorship, nonprofit, trail access, underrepresented communities, outdoor access',

	/** Locale */
	locale: 'en_US',

	/** Year the organization was founded */
	foundingYear: '2024',

	/** Tax / EIN for 501(c)(3) display, leave empty to hide */
	taxId: normalizeEnvString(process.env.NEXT_PUBLIC_TAX_ID, ''),

	/** Donation platform embed URL, leave empty to disable donations page */
	donationUrl: normalizeEnvString(process.env.NEXT_PUBLIC_DONATION_URL, ''),

	/**
	 * Default Open Graph / social share image URL.
	 * Set NEXT_PUBLIC_DEFAULT_OG_IMAGE to your own Sanity CDN image URL.
	 * Falls back to empty string (no OG image) if not set.
	 */
	defaultOgImage: normalizeEnvString(process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE, ''),
} as const

export const socialConfig = {
	instagram: normalizeEnvString(process.env.NEXT_PUBLIC_INSTAGRAM_URL, ''),
	strava: normalizeEnvString(process.env.NEXT_PUBLIC_STRAVA_URL, ''),
	twitter: normalizeEnvString(process.env.NEXT_PUBLIC_TWITTER_URL, ''),
	twitterHandle: normalizeEnvString(process.env.NEXT_PUBLIC_TWITTER_HANDLE, ''),
} as const

export const emailConfig = {
	/** Default from address for transactional emails */
	fromAddress: normalizeEnvString(
		process.env.EMAIL_FROM_ADDRESS,
		'noreply@example.com',
	),

	/** Default reply-to address */
	replyToAddress: normalizeEnvString(
		process.env.EMAIL_REPLY_TO_ADDRESS,
		'team@tierralibre.run',
	),

	/** Contact email shown in UI */
	contactEmail: normalizeEnvString(
		process.env.NEXT_PUBLIC_CONTACT_EMAIL,
		'team@tierralibre.run',
	),

	/** Admin email addresses (comma-separated) for BCC on important emails */
	adminEmails: normalizeEnvList(process.env.ADMIN_EMAILS),
} as const

export const teamConfig = {
	/** Primary contact / founder name used in email signatures */
	founderName: normalizeEnvString(process.env.SITE_FOUNDER_NAME, ''),

	/** Program lead name (used in mentorship emails) */
	programLeadName: normalizeEnvString(process.env.SITE_PROGRAM_LEAD_NAME, ''),

	/** Program lead email */
	programLeadEmail: normalizeEnvString(process.env.SITE_PROGRAM_LEAD_EMAIL, ''),
} as const

export type SiteConfig = typeof siteConfig
export type SocialConfig = typeof socialConfig
export type EmailConfig = typeof emailConfig
export type TeamConfig = typeof teamConfig
