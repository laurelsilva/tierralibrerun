import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import {
	buildOnboardingPath,
	resolveOnboardingReturnTarget,
} from '@/lib/onboarding-routing'
import { getCurrentUser } from '@/server/auth'

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = {
	'cache-control': 'no-store, no-cache, must-revalidate',
}

export async function GET(request: Request) {
	const url = new URL(request.url)
	const next = resolveOnboardingReturnTarget(url.searchParams)
	const { userId } = await auth()

	if (!userId) {
		return NextResponse.json(
			{ status: 'pending' },
			{
				status: 202,
				headers: NO_STORE_HEADERS,
			},
		)
	}

	const user = await getCurrentUser()
	if (!user) {
		return NextResponse.json(
			{ status: 'pending' },
			{
				status: 202,
				headers: NO_STORE_HEADERS,
			},
		)
	}

	const redirectTo = user.onboardingCompleted
		? (next ?? '/dashboard')
		: buildOnboardingPath(next)

	return NextResponse.json(
		{
			status: 'ready',
			redirectTo,
		},
		{
			headers: NO_STORE_HEADERS,
		},
	)
}
