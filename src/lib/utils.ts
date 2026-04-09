import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

/**
 * Returns two-character initials from a full name.
 * Single-word names return the first two letters; multi-word names use
 * the first letter of the first two words.
 */
export function initialsFromName(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean)
	if (parts.length === 0) return 'U'
	if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() || 'U'
	return (
		`${parts[0]?.charAt(0) || ''}${parts[1]?.charAt(0) || ''}`.toUpperCase() ||
		'U'
	)
}
