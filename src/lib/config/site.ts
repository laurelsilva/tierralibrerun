/**
 * Centralized site configuration.
 *
 * All brand-specific values (name, tagline, social links, emails, etc.) live here.
 * Fork maintainers: update these values to match your organization.
 *
 * Content that changes frequently (marketing copy, hero images, etc.) should live
 * in Sanity CMS via the "siteSettings" singleton document type.
 */

export const siteConfig = {
	/** Organization / site name */
	name: process.env.NEXT_PUBLIC_SITE_NAME || 'Trail Running Community',

	/** Short tagline */
	tagline:
		process.env.NEXT_PUBLIC_SITE_TAGLINE || 'Advancing Access in Trail Running',

	/** One-sentence description used in metadata */
	description:
		process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
		'A trail running community building authentic connections through nature. Apply for race funding and connect with fellow athletes.',

	/** Canonical site URL */
	url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',

	/** Keywords for SEO */
	keywords:
		'trail running, athletes, community, nature, race funding, ultramarathon',

	/** Locale */
	locale: 'en_US',

	/** Year the organization was founded */
	foundingYear: '2024',

	/** Tax / EIN for 501(c)(3) display — leave empty to hide */
	taxId: process.env.NEXT_PUBLIC_TAX_ID || '',

	/** Donation platform embed URL — leave empty to disable donations page */
	donationUrl: process.env.NEXT_PUBLIC_DONATION_URL || '',
} as const

export const socialConfig = {
	instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
	strava: process.env.NEXT_PUBLIC_STRAVA_URL || '',
	twitter: process.env.NEXT_PUBLIC_TWITTER_URL || '',
	twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE || '',
} as const

export const emailConfig = {
	/** Default from address for transactional emails */
	fromAddress:
		process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com',

	/** Default reply-to address */
	replyToAddress:
		process.env.EMAIL_REPLY_TO_ADDRESS || 'team@example.com',

	/** Contact email shown in UI */
	contactEmail:
		process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'team@example.com',

	/** Admin email addresses (comma-separated) for BCC on important emails */
	adminEmails: (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean),
} as const

export const teamConfig = {
	/** Primary contact / founder name used in email signatures */
	founderName: process.env.SITE_FOUNDER_NAME || '',

	/** Program lead name (used in mentorship emails) */
	programLeadName: process.env.SITE_PROGRAM_LEAD_NAME || '',

	/** Program lead email */
	programLeadEmail: process.env.SITE_PROGRAM_LEAD_EMAIL || '',
} as const

export type SiteConfig = typeof siteConfig
export type SocialConfig = typeof socialConfig
export type EmailConfig = typeof emailConfig
export type TeamConfig = typeof teamConfig
