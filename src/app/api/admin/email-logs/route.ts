import {eq, and, desc} from 'drizzle-orm'
import {type NextRequest, NextResponse} from 'next/server'
import {isAdmin} from '@/server/auth/admin'
import {db, emailLogs} from '@/server/db'

export async function GET(request: NextRequest) {
	try {
		// Verify admin (view) access - allow read-only admins
		const canView = await isAdmin()
		if (!canView) {
			return NextResponse.json({error: 'Forbidden'}, {status: 403})
		}

		const {searchParams} = new URL(request.url)
		const applicationId = searchParams.get('applicationId')
		const applicationType = searchParams.get('applicationType')

		if (!applicationId || !applicationType) {
			return NextResponse.json(
				{error: 'Application ID and type are required'},
				{status: 400}
			)
		}

		// Validate application type
		if (applicationType !== 'FUND' && applicationType !== 'MENTOR') {
			return NextResponse.json(
				{error: 'Invalid application type'},
				{status: 400}
			)
		}

		// Fetch email logs for the application
		const logs = await db
			.select({
				id: emailLogs.id,
				emailType: emailLogs.emailType,
				recipientEmail: emailLogs.recipientEmail,
				status: emailLogs.status,
				sentAt: emailLogs.sentAt
			})
			.from(emailLogs)
			.where(
				and(
					eq(emailLogs.applicationId, applicationId),
					eq(emailLogs.applicationType, applicationType as 'FUND' | 'MENTOR')
				)
			)
			.orderBy(desc(emailLogs.sentAt))

		return NextResponse.json(logs)
	} catch (error) {
		console.error('Failed to fetch email logs:', error)
		return NextResponse.json(
			{error: 'Failed to fetch email logs'},
			{status: 500}
		)
	}
}
