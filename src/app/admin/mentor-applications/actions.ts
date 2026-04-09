'use server'

import { eq } from 'drizzle-orm'
import { db, mentorApplications } from '@/server/db'

export async function getMentorApplicationStatus(userId: string) {
	const applications = await db
		.select()
		.from(mentorApplications)
		.where(eq(mentorApplications.userId, userId))
		.orderBy(mentorApplications.createdAt)

	return {
		applications,
		hasApplicationThisYear: applications.length > 0,
		latestApplication: applications[applications.length - 1] || null,
	}
}
