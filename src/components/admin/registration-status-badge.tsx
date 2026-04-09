import React from 'react'

export type RegistrationStatus =
	| 'PENDING'
	| 'SELF_REGISTERED'
	| 'ADMIN_REGISTERED'
	| 'COMPLETED'

type Size = 'sm' | 'md'

export interface RegistrationStatusBadgeProps {
	status: RegistrationStatus | string
	size?: Size
	className?: string
	title?: string
}

/**
 * RegistrationStatusBadge
 * Visual, color-coded indicator for an applicant's race registration state:
 * - Pending Registration
 * - Self-Registered
 * - Registered by Admin
 *
 * Use this anywhere you show fund applications to make the registration state obvious at a glance.
 */
export function RegistrationStatusBadge({
	status,
	size = 'sm',
	className,
	title,
}: RegistrationStatusBadgeProps) {
	const normalized = normalizeStatus(status)
	const { label, classes } = getStyles(normalized, size)

	return (
		<span
			className={cx(
				'inline-flex items-center rounded-full border font-medium',
				classes,
				className,
			)}
			aria-label={`Registration status: ${label}`}
			title={title || label}
		>
			{/* A tiny dot to improve glanceability */}
			<span
				aria-hidden="true"
				className={cx(
					'mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current/70',
				)}
			/>
			{label}
		</span>
	)
}

/* ===========================
   Helpers
   =========================== */

function normalizeStatus(
	input: RegistrationStatus | string | null | undefined,
): RegistrationStatus {
	const v = String(input || '')
		.trim()
		.toUpperCase()
	if (
		v === 'SELF_REGISTERED' ||
		v === 'ADMIN_REGISTERED' ||
		v === 'COMPLETED' ||
		v === 'PENDING'
	) {
		return v
	}
	return 'PENDING'
}

function getStyles(
	status: RegistrationStatus,
	size: Size,
): { label: string; classes: string } {
	const base =
		size === 'md'
			? 'px-2.5 py-1 text-xs font-semibold'
			: 'px-2 py-0.5 text-[10px] leading-[1.1] font-semibold'

	switch (status) {
		case 'COMPLETED':
			return {
				label: 'Completed',
				classes: cx(
					base,
					'bg-muted text-muted-foreground border-border',
				),
			}
		case 'ADMIN_REGISTERED':
			return {
				label: 'Admin Registered',
				classes: cx(
					base,
					'bg-[hsl(86_60%_48%/0.15)] text-[hsl(86_60%_35%)] border-[hsl(86_60%_48%/0.3)] dark:text-[hsl(86_65%_52%)]',
				),
			}
		case 'SELF_REGISTERED':
			return {
				label: 'Athlete Registered',
				classes: cx(
					base,
					'bg-[hsl(66_75%_52%/0.15)] text-[hsl(66_75%_38%)] border-[hsl(66_75%_52%/0.3)] dark:text-[hsl(66_75%_58%)]',
				),
			}
		case 'PENDING':
		default:
			return {
				label: 'Registration Pending',
				classes: cx(base, 'bg-primary/15 text-primary border-primary/30'),
			}
	}
}

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(' ')
}

/* ===========================
   Optional utils
   =========================== */

/**
 * True when applicant has a completed registration (either self or admin).
 */
export function isRegistered(status: RegistrationStatus | string) {
	const s = normalizeStatus(status)
	return (
		s === 'SELF_REGISTERED' || s === 'ADMIN_REGISTERED' || s === 'COMPLETED'
	)
}

export default RegistrationStatusBadge
