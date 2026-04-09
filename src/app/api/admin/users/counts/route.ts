import {NextResponse} from 'next/server'
import {getUsersCounts} from '@/server/admin/service'
import {isAdmin} from '@/server/auth/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
	try {
		const canView = await isAdmin()
		if (!canView) {
			return NextResponse.json({error: 'Forbidden'}, {status: 403})
		}

		const counts = await getUsersCounts()
		return NextResponse.json(counts)
	} catch (err) {
		const message =
			err instanceof Error ? err.message : 'Failed to fetch users counts'
		return NextResponse.json({error: message}, {status: 500})
	}
}

export async function POST() {
	return new NextResponse('Method Not Allowed', {status: 405})
}
