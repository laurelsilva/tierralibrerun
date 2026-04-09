import { type NextRequest, NextResponse } from 'next/server'
import  { type ApplicationStatus, APPLICATION_STATUSES  } from '@/lib/types/admin'
import { getFundApplicationsPage } from '@/server/admin/service'
import { redirectIfNotAdmin } from '@/server/auth/admin'

export const dynamic = 'force-dynamic'

function parseBoolean(input: string | null): boolean | undefined {
  if (input === 'true') return true
  if (input === 'false') return false
  return undefined
}

function parseNumber(input: string | null): number | undefined {
  if (!input) return undefined
  const n = Number(input)
  return Number.isFinite(n) ? n : undefined
}

function parseStatus(input: string | null): ApplicationStatus | undefined {
  if (!input) return undefined
  return (APPLICATION_STATUSES as readonly string[]).includes(input)
    ? (input as ApplicationStatus)
    : undefined
}

export async function GET(request: NextRequest) {
  try {
    // Enforce admin privileges for all requests to this endpoint
    await redirectIfNotAdmin('/admin')

    const { searchParams } = new URL(request.url)

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const pageSize = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10) || 50)
    )

    // Filters
    const q = searchParams.get('q') || undefined
    const status = parseStatus(searchParams.get('status'))
    const firstRace = parseBoolean(searchParams.get('firstRace'))
    const year = parseNumber(searchParams.get('year'))

    // Optional: basic validation for status value
    const rawStatus = searchParams.get('status')
    if (rawStatus && !status) {
      return NextResponse.json(
        { error: `Invalid status: ${rawStatus}. Allowed: ${APPLICATION_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const result = await getFundApplicationsPage(
      { page, pageSize },
      {
        q,
        status,
        firstRace,
        year
      }
    )

    return NextResponse.json(result)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to fetch fund applications'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST() {
  return new NextResponse('Method Not Allowed', { status: 405 })
}
