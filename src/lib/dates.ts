/**
 * Consistent date parsing and formatting helpers for the admin UI.
 *
 * Many inputs originate from Sanity in the format "YYYY-MM-DD HH:mm" (no "T").
 * We normalize those to ISO-like strings to avoid inconsistent parsing.
 *
 * Defaults:
 * - locale: 'en-US'
 * - timeZone: 'America/Los_Angeles'
 */

export const DEFAULT_ADMIN_LOCALE = 'en-US'
export const DEFAULT_ADMIN_TIMEZONE = 'America/Los_Angeles'

export type Dateish = string | number | Date

/**
 * Normalize common non-ISO datetime strings to ISO-like strings.
 * - Turns "YYYY-MM-DD HH:mm" into "YYYY-MM-DDTHH:mm"
 * - Adds ":00" seconds if missing (e.g., "YYYY-MM-DDTHH:mm" -> "YYYY-MM-DDTHH:mm:00")
 */
function normalizeDateString(input: string): string {
	let s = input.trim()

	// Convert a space-separated date-time into ISO-like with 'T'
	if (s.includes(' ') && !s.includes('T')) {
		s = s.replace(' ', 'T')
	}

	// Add seconds if the string looks like "YYYY-MM-DDTHH:mm"
	if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) {
		s = `${s}:00`
	}

	return s
}

/**
 * Attempts to parse various date inputs into a valid Date object.
 * Returns null if parsing fails.
 */
export function toDate(input: Dateish): Date | null {
	if (input instanceof Date) {
		return isFinite(input.getTime()) ? input : null
	}

	if (typeof input === 'number') {
		const d = new Date(input)
		return isFinite(d.getTime()) ? d : null
	}

	if (typeof input === 'string') {
		const normalized = normalizeDateString(input)
		const d = new Date(normalized)
		return isFinite(d.getTime()) ? d : null
	}

	return null
}

/**
 * Safe check for a valid Date object (not NaN).
 */
export function isValidDate(d: unknown): d is Date {
	return d instanceof Date && isFinite(d.getTime())
}

/**
 * Formats a date/time with sensible admin defaults (Pacific time).
 * Provide overrides via the options param.
 */
export function formatAdminDateTime(
	input: Dateish,
	options?: Intl.DateTimeFormatOptions,
	locale: string = DEFAULT_ADMIN_LOCALE,
	timeZone: string = DEFAULT_ADMIN_TIMEZONE,
): string {
	const d = toDate(input)
	if (!d) return 'Date TBD'

	const fmt: Intl.DateTimeFormatOptions = {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		timeZone,
		...(options || {}),
	}

	return d.toLocaleString(locale, fmt)
}

/**
 * Formats a full, more detailed admin datetime (e.g., for detail pages).
 * Example: "Friday, January 5, 2025, 10:35 AM"
 */
export function formatAdminDateTimeLong(
	input: Dateish,
	options?: Intl.DateTimeFormatOptions,
	locale: string = DEFAULT_ADMIN_LOCALE,
	timeZone: string = DEFAULT_ADMIN_TIMEZONE,
): string {
	const d = toDate(input)
	if (!d) return 'Date TBD'

	const fmt: Intl.DateTimeFormatOptions = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		timeZone,
		...(options || {}),
	}

	return d.toLocaleString(locale, fmt)
}

/**
 * Formats a date-only string for admin usage (no time).
 * Example: "Jan 5, 2025"
 */
export function formatAdminDateOnly(
	input: Dateish,
	options?: Intl.DateTimeFormatOptions,
	locale: string = DEFAULT_ADMIN_LOCALE,
	timeZone: string = DEFAULT_ADMIN_TIMEZONE,
): string {
	const d = toDate(input)
	if (!d) return 'Date TBD'

	const fmt: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		timeZone,
		...(options || {}),
	}

	return d.toLocaleDateString(locale, fmt)
}

/**
 * Returns a simple relative label for recent days: "Today", "Yesterday",
 * or a formatted date for anything else.
 */
export function formatAdminRelativeOrDate(
	input: Dateish,
	locale: string = DEFAULT_ADMIN_LOCALE,
	timeZone: string = DEFAULT_ADMIN_TIMEZONE,
): string {
	const d = toDate(input)
	if (!d) return 'Date TBD'

	const now = new Date()
	const today = new Date(now.toLocaleString('en-US', { timeZone }))
	today.setHours(0, 0, 0, 0)

	const target = new Date(d.toLocaleString('en-US', { timeZone }))
	target.setHours(0, 0, 0, 0)

	const diffDays = Math.round(
		(target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
	)

	if (diffDays === 0) return 'Today'
	if (diffDays === -1) return 'Yesterday'

	return formatAdminDateOnly(d, undefined, locale, timeZone)
}

/**
 * Convenience wrappers mirroring existing usage patterns in the codebase.
 */
export const formatEventDateTime = formatAdminDateTime
export const formatEventDateTimeLong = formatAdminDateTimeLong

/**
 * Format a date as "January 5, 2025" (long month, no time).
 * Accepts Date, string, number, null, or undefined. Returns 'Date TBD' for
 * falsy or unparseable values.
 */
export function formatLongDate(
	input: Dateish | null | undefined,
	fallback = 'Date TBD',
): string {
	if (!input) return fallback
	const d = toDate(input)
	if (!d) return fallback
	return d.toLocaleDateString(DEFAULT_ADMIN_LOCALE, {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	})
}

/**
 * Format a date as "Jan 5" (short, no year). Useful for compact UI.
 */
export function formatCompactDate(
	input: Dateish | null | undefined,
	fallback = 'TBD',
): string {
	if (!input) return fallback
	const d = toDate(input)
	if (!d) return fallback
	return d.toLocaleDateString(DEFAULT_ADMIN_LOCALE, {
		month: 'short',
		day: 'numeric',
	})
}

/**
 * Format a date-time as "Jan 5, 2025, 10:35 AM" (short month + time).
 */
export function formatShortDateTime(
	input: Dateish | null | undefined,
	fallback = 'Date TBD',
): string {
	if (!input) return fallback
	const d = toDate(input)
	if (!d) return fallback
	return d.toLocaleString(DEFAULT_ADMIN_LOCALE, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	})
}

export function toMysqlDateTime(input: Dateish): string | null {
	const d = toDate(input)
	if (!d) return null

	const pad = (value: number) => String(value).padStart(2, '0')

	return [
		`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
		`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
	].join(' ')
}
