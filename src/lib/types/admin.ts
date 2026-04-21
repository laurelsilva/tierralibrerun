/**
 * Shared admin types used across server and UI.
 *
 * Keep this file lightweight, dependency-free, and stable.
 * Prefer string literal unions with matching constant arrays
 * so you can use them both as runtime values (e.g., for selects)
 * and compile-time types.
 */

/**
 * Which admin-managed program or entity a resource belongs to.
 */
export type ApplicationType = 'FUND' | 'MENTOR'

export const APPLICATION_TYPES = ['FUND', 'MENTOR'] as const

export function isApplicationType(x: unknown): x is ApplicationType {
	return (
		typeof x === 'string' &&
		(APPLICATION_TYPES as readonly string[]).includes(x)
	)
}

/**
 * Shared application status values.
 * PENDING is typically a UI/state value; standard outgoing emails usually
 * cover APPROVED, WAITLISTED, REJECTED.
 */
export type ApplicationStatus =
	| 'PENDING'
	| 'APPROVED'
	| 'REJECTED'
	| 'WAITLISTED'

export const APPLICATION_STATUSES = [
	'PENDING',
	'APPROVED',
	'REJECTED',
	'WAITLISTED',
] as const

export function isApplicationStatus(x: unknown): x is ApplicationStatus {
	return (
		typeof x === 'string' &&
		(APPLICATION_STATUSES as readonly string[]).includes(x)
	)
}

/**
 * Optional helper: Map a status to a semantic UI variant.
 * Keep the return values generic (string) so different UI kits can map them as needed.
 */
export function statusToVariant(
	status: ApplicationStatus,
): 'muted' | 'amber' | 'green' | 'red' | 'purple' {
	switch (status) {
		case 'PENDING':
			return 'amber'
		case 'APPROVED':
			return 'green'
		case 'REJECTED':
			return 'red'
		case 'WAITLISTED':
			return 'purple'
		default:
			return 'muted'
	}
}
