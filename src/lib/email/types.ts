/**
 * Core email types for a DRY, multi-context email system.
 *
 * Goals:
 * - One normalized contract to send emails across Athlete Fund and Mentor.
 * - Clear separation between STANDARD (templated, status-driven) and CUSTOM (raw HTML) modes.
 * - Strong, type-safe tokens per context to avoid copy/paste and conditional spaghetti.
 * - Extensible categories and metadata for logging, analytics, and deliverability.
 */

/**
 * Which application/program the email belongs to.
 * Add more program types here as the org grows (e.g., 'SCHOLARSHIP', 'PROGRAM_X').
 */
export type ApplicationType = 'FUND' | 'MENTOR'

/**
 * Standard application statuses used for templated (STANDARD mode) messages.
 * Use 'PENDING' for UI state only (not typically sent as an email).
 */
export type StandardStatus = 'APPROVED' | 'WAITLISTED' | 'REJECTED' | 'PENDING'

/**
 * Overall email mode:
 * - STANDARD: pick a template by (applicationType, status, category), hydrate tokens into HTML/subject
 * - CUSTOM: send exactly the provided subject+html (composer/custom), no templating/wrapping
 */
export type EmailMode = 'STANDARD' | 'CUSTOM'

/**
 * High-level intent of an email (orthogonal to status).
 * Useful for logging, filtering, and analytics.
 */
export type EmailCategory =
	| 'STATUS' // approval / waitlist / rejection
	| 'ANNOUNCEMENT'
	| 'INVITE'
	| 'REMINDER'
	| 'UPDATE'
	| 'CUSTOM' // fully custom (composer)
	| 'OTHER'

/**
 * Log-friendly type tags (e.g., for email_logs.emailType).
 * Keep this relatively stable to avoid migration churn.
 */
export type EmailTypeTag =
	| 'APPROVAL'
	| 'WAITLIST'
	| 'REJECTION'
	| 'INVITE'
	| 'REMINDER'
	| 'ANNOUNCEMENT'
	| 'UPDATE'
	| 'CUSTOM'

/**
 * Basic brand/config links that can be injected into templates or used by the composer.
 */
export interface BrandLinks {
	websiteUrl?: string // e.g., https://example.com
	slackUrl?: string
	stravaUrl?: string
	instagramUrl?: string
	twitterUrl?: string
}

/**
 * Optional attachment support (conservative typing for portability).
 * For remote assets, prefer url. For inline, use content (base64) + mimeType.
 */
export interface EmailAttachment {
	filename: string
	mimeType?: string
	/**
	 * Base64-encoded content for inline attachments.
	 * Avoid very large payloads; use urls when possible.
	 */
	contentBase64?: string
	/** Public or signed URL to fetch the asset. */
	url?: string
}

/* ===========================
   Token Models (by context)
   =========================== */

/**
 * Tokens common to all contexts.
 * These should be safe defaults and kept minimal.
 */
export interface BaseTokens {
	applicantName?: string
	firstName?: string // derived client-side from applicantName if not provided
	recipientEmail?: string
	brand?: BrandLinks
	/** Optional subject override for STANDARD templates (admin tool). */
	customSubject?: string
	/** Optional body override for STANDARD templates (admin tool). */
	customBody?: string
}

/**
 * Athlete Fund tokens
 */
export interface FundTokens extends BaseTokens {
	raceName?: string
	raceDate?: string // pre-formatted string (e.g., "Saturday, May 10, 2025")
	raceLocation?: string
	wantsMentor?: boolean
	/**
	 * Registration handling for approval emails:
	 * - 'ORG_REGISTERS': org handles registration (e.g., UltraSignup). Email asks for account email + DOB.
	 * - 'SELF_REGISTER': athlete registers themselves using provided link/code.
	 */
	registrationMode?: 'ORG_REGISTERS' | 'SELF_REGISTER'
	/** Registration link for SELF_REGISTER mode */
	registrationLink?: string
	/** Optional discount or access code for SELF_REGISTER mode */
	registrationCode?: string
	/**
	 * Additional context to include for WAITLISTED/REJECTED decisions.
	 */
	decisionNotes?: string
	/**
	 * Optional recommended race suggestion to include on waitlist/rejection emails.
	 */
	recommendedRace?: {
		name?: string
		info?: string
		url?: string
	}
	gear?: {
		shoes?: boolean
		tshirt?: boolean
		shorts?: boolean
		customItems?: string[]
		instructions?: string // inclusive guidance for size/fit/shipping
	}
}

/**
 * Mentor tokens
 */
export interface MentorTokens extends BaseTokens {
	availability?: string // free text or pre-formatted
	preferredCommunicationStyle?: string
	mentorshipAreas?: string[] // e.g., ["first trail race", "training plans", "gear tips"]
	notes?: string
}

/**
 * Map the tokens by application type for strong typing.
 */
export type TokensByType = {
	FUND: FundTokens
	MENTOR: MentorTokens
}

/* ===========================
   Send Request / Response
   =========================== */

/**
 * Normalized send request for ANY email across contexts.
 *
 * - STANDARD mode: Provide { applicationType, status, category, tokens } and the system
 *   will resolve a subject+html using templates.
 *
 * - CUSTOM mode: Provide { subject, html } and the system will send "as-is".
 *   Tokens may be present for logging or future substitutions, but are not required.
 */
export interface SendEmailRequest<
	TType extends ApplicationType = ApplicationType,
> {
	applicationType: TType
	/**
	 * Optional link back to a specific application row (fund/mentor) or event id.
	 * Recommended for logging + traceability, but not required for generic sends.
	 */
	applicationId?: string
	mode: EmailMode
	status?: StandardStatus // required when mode=STANDARD (except PENDING may be disallowed by orchestrator)
	category?: EmailCategory // defaults to 'STATUS' in STANDARD mode; 'CUSTOM' in CUSTOM mode
	to?: string | string[] // recipient(s); if omitted and applicationId is provided, system may fallback using app data
	from?: string
	cc?: string[]
	bcc?: string[]
	replyTo?: string
	subject?: string // required when mode=CUSTOM; ignored when mode=STANDARD (resolved via template)
	html?: string // required when mode=CUSTOM; ignored when mode=STANDARD (resolved via template)
	attachments?: EmailAttachment[]
	/**
	 * Strongly typed tokens by applicationType to hydrate STANDARD templates (and for analytics).
	 * In CUSTOM mode, tokens are optional and not injected automatically.
	 */
	tokens?: TokensByType[TType]
	/**
	 * Extra untyped metadata (for experiments, A/B flags, analytics).
	 * Avoid storing PII or secrets here.
	 */
	meta?: Record<string, unknown>
}

/**
 * Result of an email send attempt.
 */
export interface SendEmailResult {
	success: boolean
	/** Provider message id (if available) */
	id?: string
	/** Flat, human-readable error message (for UI) */
	error?: string
	/** Structured provider response (if needed for diagnostics) */
	providerResponse?: unknown
}

/* ===========================
   Template Resolution Contract
   =========================== */

/**
 * A template resolver takes a typed STANDARD request and returns subject+html.
 * This allows swapping templates without changing the send orchestrator.
 */
export type TemplateResolver<TType extends ApplicationType> = (input: {
	applicationType: TType
	status: Exclude<StandardStatus, 'PENDING'>
	category: Exclude<EmailCategory, 'CUSTOM'> // STANDARD should not be 'CUSTOM'
	tokens: TokensByType[TType]
}) => {
	subject: string
	html: string
}

/* ===========================
   Logging Contract
   =========================== */

export interface EmailLogEntry {
	applicationId?: string
	applicationType: ApplicationType
	emailType: EmailTypeTag
	recipientEmail: string
	status: 'SENT' | 'FAILED'
	sentAt?: string // ISO timestamp
	providerId?: string
	subject?: string
	// Optional diagnostic payloads
	error?: string
	meta?: Record<string, unknown>
}

/* ===========================
   Utility Helpers (Types)
   =========================== */

/**
 * Utility to map an ApplicationType to its token shape.
 */
export type TokensFor<T extends ApplicationType> = T extends 'FUND'
	? FundTokens
	: T extends 'MENTOR'
		? MentorTokens
		: never

/**
 * Common preset keys if you decide to persist presets in DB (optional).
 * Keep in sync with your UI preset picker / seed data.
 */
export type PresetKey =
	| 'FUND_APPROVED'
	| 'FUND_WAITLISTED'
	| 'FUND_REJECTED'
	| 'MENTOR_APPROVED'
	| 'MENTOR_WAITLISTED'
	| 'MENTOR_REJECTED'
	| 'CUSTOM_DEFAULT'

/**
 * Preset definition for DB-backed or JSON-backed composer presets.
 */
export interface EmailPreset {
	key: PresetKey
	applicationType: ApplicationType
	category: EmailCategory
	status?: Exclude<StandardStatus, 'PENDING'> // for status templates
	subjectTemplate: string // may include tokens like {{firstName}} or {{raceName}}
	htmlTemplate: string // the template body (full HTML or partial depending on your system)
	defaultTokens?: Partial<TokensByType[ApplicationType]> // optional seed tokens
	brand?: BrandLinks
	updatedAt?: string
	createdAt?: string
}
