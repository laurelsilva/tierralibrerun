'use server'

import { eq, and, gte, lt } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser } from '@/server/auth'
import { getUserType } from '@/server/auth/roles'
import { db, mentorApplications, users } from '@/server/db'
import { initializeMentorWorkflow } from '@/server/workflow/service'

// Get user's mentor application status for the current year
export async function getUserMentorApplicationStatus(userId: string) {
	const currentYear = new Date().getFullYear()
	const yearStart = new Date(currentYear, 0, 1)
	const yearEnd = new Date(currentYear + 1, 0, 1)

	const applications = await db
		.select({
			id: mentorApplications.id,
			status: mentorApplications.status,
			workflowStage: mentorApplications.workflowStage,
			createdAt: mentorApplications.createdAt,
		})
		.from(mentorApplications)
		.where(
			and(
				eq(mentorApplications.userId, userId),
				gte(mentorApplications.createdAt, yearStart),
				lt(mentorApplications.createdAt, yearEnd),
			),
		)
		.orderBy(mentorApplications.createdAt)

	return {
		applications,
		hasApplicationThisYear: applications.length > 0,
		latestApplication: applications[applications.length - 1] || null,
	}
}

// Create a schema for the mentor application
const mentorApplicationSchema = z
	.object({
		name: z.string().min(1, 'Name is required'),
		email: z.string().email('Valid email is required'),
		mentorshipExperience: z.string().optional(),
		motivationToMentor: z
			.string()
			.min(50, 'Please provide at least 50 characters for your motivation'),
		preferredCommunicationStyle: z
			.string()
			.min(1, 'Please select your preferred communication style'),
		availability: z.string().min(1, 'Please describe your availability'),
		specialExpertise: z.string().optional(),
		genderIdentity: z.string().optional(),
		mentorGenderPreference: z
			.string()
			.min(1, 'Please select your mentoring preference'),
		additionalInfo: z.string().optional(),
		hearAboutProgram: z
			.string()
			.min(1, 'Please tell us how you heard about the program'),
		hearAboutProgramOther: z.string().optional(),
		userId: z.string().min(1, 'User ID is required'),
	})
	.refine(
		(data) => {
			if (
				data.hearAboutProgram === 'Other' &&
				(!data.hearAboutProgramOther ||
					data.hearAboutProgramOther.trim() === '')
			) {
				return false
			}
			return true
		},
		{
			message:
				'Please specify how you heard about the mentor program when selecting "Other"',
			path: ['hearAboutProgramOther'],
		},
	)

export async function submitMentorApplication(formData: FormData) {
	try {
		const current = await getCurrentUser()
		if (!current) {
			return { success: false, error: 'Not authenticated' }
		}
		if (!current.onboardingCompleted) {
			return {
				success: false,
				error: 'Please complete onboarding before applying.',
			}
		}

		const userType = await getUserType()
		if (userType !== 'bipoc') {
			return {
				success: false,
				error: 'You are not eligible to apply to be a mentor.',
			}
		}

		// Convert FormData to a plain object
		const rawData: Record<string, string> = {}
		formData.forEach((value, key) => {
			rawData[key] = value.toString()
		})

		// Never trust identity fields from the client.
		rawData.userId = current.id
		rawData.email = current.email
		if (current.name) rawData.name = current.name

		// Validate the data
		const validatedData = mentorApplicationSchema.parse(rawData)

		// Get user profile to populate gender identity
		const [dbUser] = await db
			.select()
			.from(users)
			.where(eq(users.id, validatedData.userId))
			.limit(1)

		if (!dbUser) {
			return {
				success: false,
				error: 'User profile not found. Please complete your profile first.',
			}
		}

		// Get current year boundaries (January 1 to December 31)
		const currentYear = new Date().getFullYear()
		const yearStart = new Date(currentYear, 0, 1)
		const yearEnd = new Date(currentYear + 1, 0, 1)

		// Check if user has already submitted a mentor application this year
		const existingApplications = await db
			.select()
			.from(mentorApplications)
			.where(
				and(
					eq(mentorApplications.userId, validatedData.userId),
					gte(mentorApplications.createdAt, yearStart),
					lt(mentorApplications.createdAt, yearEnd),
				),
			)

		if (existingApplications.length > 0) {
			return {
				success: false,
				error:
					'You have already submitted a mentor application this year. You can submit a new application next calendar year.',
			}
		}

		// Create the mentor application in the database
		const applicationId = crypto.randomUUID()
		await db.insert(mentorApplications).values({
			id: applicationId,
			userId: validatedData.userId,
			name: validatedData.name,
			email: validatedData.email,
			pronouns: dbUser.pronouns || null,
			runningExperienceYears: null, // Running experience is captured in onboarding as descriptive text
			trailRunningExperienceYears: null, // Using descriptive running experience instead of years
			mentorshipExperience: validatedData.mentorshipExperience || null,
			motivationToMentor: validatedData.motivationToMentor,
			preferredCommunicationStyle: validatedData.preferredCommunicationStyle,
			availability: validatedData.availability,
			specialExpertise: validatedData.specialExpertise || null,
			bipocIdentity: true, // All mentors are people of color since they went through onboarding
			genderIdentity: dbUser.genderIdentity || null,
			mentorGenderPreference: validatedData.mentorGenderPreference,
			locationRegion: dbUser.locationRegion || null,
			slackUsername: null, // Slack invites sent after approval, matching happens in Slack
			additionalInfo: validatedData.additionalInfo || null,
			hearAboutProgram:
				validatedData.hearAboutProgram === 'Other'
					? validatedData.hearAboutProgramOther || 'Other'
					: validatedData.hearAboutProgram,
			status: 'PENDING',
		})
		await initializeMentorWorkflow(applicationId, {
			actorRole: 'ATHLETE',
			actorUserId: current.id,
		})

		// Revalidate any pages that might show application data
		revalidatePath('/dashboard')
		revalidatePath('/mentor/apply')

		return { success: true }
	} catch (error) {
		console.error('Error submitting mentor application:', error)

		if (error instanceof z.ZodError) {
			const firstError = error.errors[0]
			return {
				success: false,
				error: firstError?.message ?? 'Unknown error occurred.',
			}
		}

		return {
			success: false,
			error: 'Failed to submit mentor application. Please try again.',
		}
	}
}
