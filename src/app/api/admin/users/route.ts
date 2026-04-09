import {type NextRequest, NextResponse} from 'next/server'
import {getUsersPage} from '@/server/admin/service'
import {isAdmin} from '@/server/auth/admin'

export const dynamic = 'force-dynamic'

function parseBoolean(input: string | null): boolean | undefined {
	if (input === 'true') return true
	if (input === 'false') return false
	return undefined
}

export async function GET(request: NextRequest) {
	try {
		// Admin guard
		const canView = await isAdmin()
		if (!canView) {
			return NextResponse.json({error: 'Forbidden'}, {status: 403})
		}

		const {searchParams} = new URL(request.url)

		// Pagination
		const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
		const pageSize = Math.min(
			200,
			Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10) || 50)
		)

		// Filters
		const q = searchParams.get('q') || undefined
		const userType = searchParams.get('userType') || undefined
		const onboarding = parseBoolean(searchParams.get('onboarding'))

		const result = await getUsersPage(
			{page, pageSize},
			{
				q,
				userType,
				onboardingCompleted: onboarding
			}
		)

		return NextResponse.json(result)
	} catch (err) {
		const message =
			err instanceof Error ? err.message : 'Failed to fetch users page'
		return NextResponse.json({error: message}, {status: 500})
	}
}

export async function POST() {
	return new NextResponse('Method Not Allowed', {status: 405})
}
