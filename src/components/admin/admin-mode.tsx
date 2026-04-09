'use client'

import {useEffect, useRef, useState} from 'react'

/**
 * useAdminReadOnly
 *
 * Returns true when the current page is in admin read-only mode.
 * - Safe for SSR: the initial value is false to match server HTML.
 * - After mount, it checks the DOM for [data-admin-mode="readonly"] and updates state.
 * - Subscribes to DOM mutations so navigation within the admin area updates automatically.
 *
 * Why this exists:
 * Reading from document/querySelector during render causes hydration mismatches.
 * This hook delays DOM reads until after mount (in an effect), preventing those issues.
 */
export function useAdminReadOnly(): boolean {
	const [readOnly, setReadOnly] = useState(false)
	const mounted = useRef(false)

	useEffect(() => {
		mounted.current = true

		const getMode = () => {
			const el = document.querySelector(
				'[data-admin-mode]'
			) as HTMLElement | null
			const mode = el?.getAttribute('data-admin-mode')
			return mode === 'readonly'
		}

		// Initial detection after mount
		setReadOnly(getMode())

		// Observe attribute changes anywhere in the subtree (in case layout re-renders)
		const observer = new MutationObserver(() => {
			if (!mounted.current) return
			setReadOnly(getMode())
		})

		// Observe the whole document body for changes to data-admin-mode
		observer.observe(document.body, {
			subtree: true,
			attributes: true,
			attributeFilter: ['data-admin-mode']
		})

		// Also re-check on visibility changes (route transitions, etc.)
		const onVisibility = () => mounted.current && setReadOnly(getMode())
		document.addEventListener('visibilitychange', onVisibility)

		return () => {
			mounted.current = false
			observer.disconnect()
			document.removeEventListener('visibilitychange', onVisibility)
		}
	}, [])

	return readOnly
}

/**
 * adminDisabledProps
 *
 * Small helper to produce stable props for disabling interactive elements.
 * - Uses undefined for “off” so React doesn’t flip between null/undefined and cause
 *   attribute mismatches.
 */
export function adminDisabledProps(
	readOnly: boolean,
	titleWhenDisabled = 'Read-only mode: changes are disabled'
): {disabled?: true; title?: string} {
	return readOnly
		? {disabled: true, title: titleWhenDisabled}
		: {disabled: undefined, title: undefined}
}

/**
 * withReadOnlyGuard
 *
 * Wrap a handler so it no-ops in read-only mode.
 * Example:
 *   const onClick = withReadOnlyGuard(handleClick, isReadOnly)
 */
export function withReadOnlyGuard<T extends (...args: unknown[]) => unknown>(
	handler: T,
	readOnly: boolean
): T {
	if (!readOnly) return handler
	const noop = ((...args: Parameters<T>): ReturnType<T> => {
		void args
		if (process.env.NODE_ENV !== 'production') {
			console.warn('Blocked action in read-only admin mode')
		}
		return undefined as unknown as ReturnType<T>
	}) as T
	return noop
}
