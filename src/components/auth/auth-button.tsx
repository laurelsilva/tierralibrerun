'use client'

import { useClerk, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { useCallback, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { buildPostSignUpPath } from '@/lib/onboarding-routing'

type ButtonVariant =
	| 'default'
	| 'destructive'
	| 'outline'
	| 'secondary'
	| 'ghost'
	| 'link'

type ButtonSize = 'sm' | 'default' | 'lg' | 'icon'

export type AuthAction = 'sign-in' | 'sign-up'

export interface UseAuthModalOptions {
	redirectTo?: string
}

/**
 * Small helper to derive a safe redirect target.
 * - If provided, uses `redirectTo`
 * - Otherwise, uses current pathname (client-only)
 */
function getRedirectTarget(redirectTo?: string) {
	if (redirectTo) return redirectTo
	if (typeof window !== 'undefined') return window.location.pathname || '/'
	return '/'
}

export function useAuthModal() {
	const { openSignIn, openSignUp } = useClerk()

	const openSignInModal = useCallback(
		(opts?: UseAuthModalOptions) => {
			const target = getRedirectTarget(opts?.redirectTo)
			const postSignUpTarget = buildPostSignUpPath(target)
			openSignIn({
				forceRedirectUrl: target,
				fallbackRedirectUrl: target,
				signUpForceRedirectUrl: postSignUpTarget,
				signUpFallbackRedirectUrl: postSignUpTarget,
			})
		},
		[openSignIn],
	)

	const openSignUpModal = useCallback(
		(opts?: UseAuthModalOptions) => {
			const target = getRedirectTarget(opts?.redirectTo)
			const postSignUpTarget = buildPostSignUpPath(target)
			openSignUp({
				forceRedirectUrl: postSignUpTarget,
				fallbackRedirectUrl: postSignUpTarget,
				signInForceRedirectUrl: target,
				signInFallbackRedirectUrl: target,
			})
		},
		[openSignUp],
	)

	const openAuth = useCallback(
		(action: AuthAction, opts?: UseAuthModalOptions) => {
			if (action === 'sign-up') {
				openSignUpModal(opts)
			} else {
				openSignInModal(opts)
			}
		},
		[openSignInModal, openSignUpModal],
	)

	return { openSignInModal, openSignUpModal, openAuth }
}

export interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	/**
	 * Which Clerk modal to open.
	 * Defaults to 'sign-in'.
	 */
	action?: AuthAction
	/**
	 * After auth completes, where to send the user.
	 * Defaults to the current pathname.
	 */
	redirectTo?: string
	/**
	 * Optional text for the button.
	 * If not provided, will use a sensible default per action.
	 */
	label?: string
	/**
	 * Pass-through UI props for your design system button.
	 */
	variant?: ButtonVariant
	size?: ButtonSize
	className?: string
	/**
	 * Render asChild to wrap an anchor or custom component.
	 */
	asChild?: boolean
}

/**
 * AuthButton
 * A shared, client-side button that opens Clerk's sign-in or sign-up modal
 * in a consistent way across the app. Use this anywhere you need to prompt
 * users to authenticate without routing to dedicated /sign-in or /sign-up pages.
 *
 * Example usage:
 *  - <AuthButton action="sign-in" label="Sign In" />
 *  - <AuthButton action="sign-up" label="Create Account" redirectTo="/fund/apply" />
 *
 * For programmatic usage (e.g. inside handlers), use the exported `useAuthModal` hook:
 *  const { openAuth } = useAuthModal()
 *  openAuth('sign-in', { redirectTo: '/somewhere' })
 */
export const AuthButton = forwardRef<HTMLButtonElement, AuthButtonProps>(
	(
		{
			action = 'sign-in',
			redirectTo,
			label,
			variant = 'outline',
			size = 'lg',
			className,
			asChild,
			onClick,
			disabled,
			...rest
		},
		ref,
	) => {
		const router = useRouter()
		const { isSignedIn } = useUser()
		const { openAuth } = useAuthModal()

		const defaultLabel = action === 'sign-up' ? 'Create Account' : 'Sign In'

		const handleClick = useCallback(
			(e: React.MouseEvent<HTMLButtonElement>) => {
				onClick?.(e)
				if (e.defaultPrevented) return

				const target = getRedirectTarget(redirectTo)

				// If already signed in, go directly to target
				if (isSignedIn) {
					router.push(target)
					return
				}

				// Otherwise, open the Clerk modal for the requested action
				openAuth(action, { redirectTo: target })
			},
			[action, isSignedIn, onClick, openAuth, redirectTo, router],
		)

		return (
			<Button
				ref={ref}
				type="button"
				variant={variant}
				size={size}
				className={className}
				asChild={asChild}
				onClick={handleClick}
				disabled={disabled}
				{...rest}
			>
				{label ?? defaultLabel}
			</Button>
		)
	},
)

AuthButton.displayName = 'AuthButton'
