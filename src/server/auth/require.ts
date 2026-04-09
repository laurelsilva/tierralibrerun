import 'server-only'

import { redirect } from 'next/navigation'
import { getCurrentUser } from './user'
import {
	ONBOARDING_PATH,
	ONBOARDING_RETURN_PARAM,
	normalizeInternalPath,
} from '@/lib/onboarding-routing'

export async function requireUser(params?: {
	next?: string
	redirectTo?: string
}) {
	const user = await getCurrentUser()
	if (user) return user

	const redirectTo = params?.redirectTo ?? '/?auth=sign-in'
	const next = normalizeInternalPath(params?.next)

	if (next) {
		const joiner = redirectTo.includes('?') ? '&' : '?'
		redirect(`${redirectTo}${joiner}redirect_url=${encodeURIComponent(next)}`)
	}

	redirect(redirectTo)
}

export async function requireOnboardedUser(params?: {
	next?: string
	onboardingPath?: string
}) {
	const user = await requireUser({ next: params?.next })

	if (user.onboardingCompleted) return user

	const onboardingPath = params?.onboardingPath ?? ONBOARDING_PATH
	const next = normalizeInternalPath(params?.next)

	if (next) {
		const joiner = onboardingPath.includes('?') ? '&' : '?'
		redirect(
			`${onboardingPath}${joiner}${ONBOARDING_RETURN_PARAM}=${encodeURIComponent(next)}`,
		)
	}

	redirect(onboardingPath)
}
