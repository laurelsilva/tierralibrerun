'use server'

import { eq, and, gte, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getAllRaceOptionsForApplication } from '@/lib/sanity/queries'
import { getCurrentUser } from '@/server/auth'
import { getUserPermissions, getUserType } from '@/server/auth/roles'
import { db, fundApplications, users } from '@/server/db'
import { initializeFundWorkflow } from '@/server/workflow/service'

function isUnknownColumnError(error: unknown, columnName: string) {
	return (
		error instanceof Error &&
		typeof error.message === 'string' &&
		error.message.includes(`Unknown column '${columnName}'`)
	)
}

// Get user's application status for the last 6 months
export async function getUserApplicationStatus(userId: string) {
	const now = new Date()
	const sixMonthsAgo = new Date(now)
	sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

	let isExempt = false
	try {
		const [user] = await db
			.select({ fundApplicationLimitExempt: users.fundApplicationLimitExempt })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1)
		isExempt = !!user?.fundApplicationLimitExempt
	} catch (error) {
		// If the DB hasn't been migrated yet, treat everyone as non-exempt.
		if (!isUnknownColumnError(error, 'fund_application_limit_exempt')) {
			throw error
		}
	}

	const applications = await db
		.select({
			id: fundApplications.id,
			race: fundApplications.race,
			status: fundApplications.status,
			workflowStage: fundApplications.workflowStage,
			createdAt: fundApplications.createdAt,
		})
		.from(fundApplications)
		.where(
			and(
				eq(fundApplications.userId, userId),
				gte(fundApplications.createdAt, sixMonthsAgo),
			),
		)
		.orderBy(desc(fundApplications.createdAt))

	return {
		applications,
		applicationCount: applications.length,
		remainingApplications: isExempt ? 1 : Math.max(0, 1 - applications.length),
		appliedRaces: applications.map((app) => app.race),
		isExempt,
	}
}

// Helper function to check if user can apply for a specific race
export async function canUserApplyForRace(userId: string, raceName: string) {
	const status = await getUserApplicationStatus(userId)

	return {
		canApply:
			status.remainingApplications > 0 &&
			!status.appliedRaces.includes(raceName),
		reason:
			status.remainingApplications === 0
				? 'You can only apply for 1 race every 6 months'
				: status.appliedRaces.includes(raceName)
					? 'Already applied for this race in the last 6 months'
					: 'Can apply',
	}
}

// Create a schema for the application
const applicationSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Valid email is required'),
	race: z.string().min(1, 'Race selection is required'),
	firstRace: z.enum(['yes', 'no'], {
		required_error: 'Please indicate if this is your first trail race',
	}),
	reason: z
		.string()
		.min(300, 'Please write a bit more about yourself (minimum 300 characters)')
		.max(2000, 'Please keep your response under 2000 characters'),
	experience: z
		.string()
		.min(300, 'Please write a bit more about your access to trail running (minimum 300 characters)')
		.max(2000, 'Please keep your response under 2000 characters'),
	goals: z
		.string()
		.min(300, 'Please write a bit more about why this race matters (minimum 300 characters)')
		.max(1500, 'Please keep your response under 1500 characters'),
	communityContribution: z
		.string()
		.min(350, 'Please write a bit more about how this will ripple outward (minimum 350 characters)')
		.max(2000, 'Please keep your response under 2000 characters'),
	// Stores mentorship expectations for new submissions; legacy data holds TLR contribution text
	tierraLibreContribution: z
		.string()
		.max(1500, 'Please keep your response under 1500 characters')
		.optional(),
	needsAssistance: z
		.string()
		.max(800, 'Please keep your response under 800 characters')
		.optional(),
	// Deprecated — no longer asked in new submissions
	gearNeeds: z
		.string()
		.max(500, 'Please keep your response under 500 characters')
		.optional(),
	wantsMentor: z.enum(['yes', 'no'], {
		required_error: 'Please indicate if you want a mentor',
	}),
	// Optional; captured only when mentorship is requested
	mentorGenderPreference: z.string().optional(),
	userId: z.string().min(1, 'User ID is required'),
})

export async function submitApplication(formData: FormData) {
	try {
		const dbUser = await getCurrentUser()
		if (!dbUser) {
			return { success: false, error: 'Not authenticated' }
		}
		if (!dbUser.onboardingCompleted) {
			return {
				success: false,
				error: 'Please complete onboarding before applying.',
			}
		}

		const userType = await getUserType()
		const permissions = getUserPermissions(userType)
		if (!permissions.canApplyForFunding) {
			return {
				success: false,
				error: 'You are not eligible to apply for funding.',
			}
		}

		// Convert FormData to a plain object
		const rawData: Record<string, string> = {}
		formData.forEach((value, key) => {
			rawData[key] = value.toString()
		})

		// Never trust userId (or identity fields) from the client.
		rawData.userId = dbUser.id
		rawData.email = dbUser.email
		if (dbUser.name) rawData.name = dbUser.name

		// Validate the data
		const validatedData = applicationSchema.parse(rawData)

		// Get user demographics from profile
		const [userProfile] = await db
			.select({
				age: users.age,
				locationRegion: users.locationRegion,
				userType: users.userType,
				genderIdentity: users.genderIdentity,
				hearAbout: users.hearAbout,
			})
			.from(users)
			.where(eq(users.id, validatedData.userId))
			.limit(1)

		if (!userProfile) {
			return {
				success: false,
				error: 'User profile not found. Please complete your profile first.',
			}
		}

		let isExempt = false
		try {
			const [row] = await db
				.select({
					fundApplicationLimitExempt: users.fundApplicationLimitExempt,
				})
				.from(users)
				.where(eq(users.id, validatedData.userId))
				.limit(1)
			isExempt = !!row?.fundApplicationLimitExempt
		} catch (error) {
			if (!isUnknownColumnError(error, 'fund_application_limit_exempt')) {
				throw error
			}
		}

		// Age requirement is enforced at account creation, so no need to check here

		// Get applications from the last 6 months
		const now = new Date()
		const sixMonthsAgo = new Date(now)
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

		// Check existing applications in the last 6 months
		const existingApplications = await db
			.select()
			.from(fundApplications)
			.where(
				and(
					eq(fundApplications.userId, validatedData.userId),
					gte(fundApplications.createdAt, sixMonthsAgo),
				),
			)
			.orderBy(desc(fundApplications.createdAt))

		// Check if user has already applied for a race in the last 6 months
		// Skip this guard if user is exempt.
		if (!isExempt && existingApplications.length >= 1) {
			const lastApplication = existingApplications[0]
			if (lastApplication && lastApplication.createdAt) {
				const lastApplicationDate = new Date(lastApplication.createdAt)
				const nextEligibleDate = new Date(lastApplicationDate)
				nextEligibleDate.setMonth(nextEligibleDate.getMonth() + 6)

				return {
					success: false,
					error: `You can only apply for 1 race every 6 months. Your next application will be available on ${nextEligibleDate.toLocaleDateString()}.`,
				}
			}
		}

		// Check if user has already applied for this specific race in the last 6 months
		const duplicateRaceApplication = existingApplications.find(
			(app) => app.race === validatedData.race,
		)

		if (duplicateRaceApplication) {
			return {
				success: false,
				error: `You have already applied for "${validatedData.race}" in the last 6 months. You can only apply once per race every 6 months.`,
			}
		}

		const raceOptions = await getAllRaceOptionsForApplication()
		const matchingRace = raceOptions?.find(
			(option) =>
				`${option.raceSeries.name} - ${option.distance}` === validatedData.race,
		)
		const raceDateRaw = matchingRace?.raceSeries?.date
		const raceDate =
			typeof raceDateRaw === 'string' && raceDateRaw.trim().length > 0
				? new Date(raceDateRaw)
				: null
		const normalizedRaceDate =
			raceDate && !Number.isNaN(raceDate.getTime()) ? raceDate : null
		const raceLocation = matchingRace?.raceSeries?.location ?? null

		// Create the application in the database using Drizzle
		const applicationId = crypto.randomUUID()
		await db.insert(fundApplications).values({
			id: applicationId,
			userId: validatedData.userId,
			name: validatedData.name,
			email: validatedData.email,
			age: userProfile?.age ?? 0, // Use age from profile or 0
			zipcode: userProfile?.locationRegion ?? 'Not specified', // Use locationRegion (which now stores zipcode) or fallback
			race: validatedData.race,
			firstRace: validatedData.firstRace === 'yes',
			experience: validatedData.experience,
			reason: validatedData.reason,
			goals: validatedData.goals || null,
			communityContribution: validatedData.communityContribution,
			tierraLibreContribution: validatedData.tierraLibreContribution,
			bipocIdentity: userProfile?.userType === 'bipoc', // Use userType from profile or false
			genderIdentity: userProfile?.genderIdentity ?? 'Not specified',
			additionalAssistanceNeeds: validatedData.needsAssistance || null,
			gearNeeds: validatedData.gearNeeds || null,
			referralSource: userProfile?.hearAbout ?? 'Not specified', // Use from profile or fallback
			wantsMentor: validatedData.wantsMentor === 'yes',
			mentorGenderPreference:
				validatedData.wantsMentor === 'yes'
					? validatedData.mentorGenderPreference || 'no-preference'
					: null,
			raceDate: normalizedRaceDate,
			raceLocation,
		})
		await initializeFundWorkflow(applicationId, {
			actorRole: 'ATHLETE',
			actorUserId: dbUser.id,
		})

		// Revalidate any pages that might show application data
		revalidatePath('/dashboard')
		revalidatePath('/fund/apply')

		return { success: true }
	} catch (error) {
		console.error('Error submitting application:', error)

		if (error instanceof z.ZodError) {
			// Format the errors for better user experience
			const ageError = error.errors.find((err) => err.path.includes('age'))
			if (ageError) {
				return {
					success: false,
					error: ageError.message,
				}
			}

			const firstError = error.errors[0]
			return {
				success: false,
				error: firstError?.message ?? 'Unknown error occurred.',
			}
		}

		return {
			success: false,
			error: 'Failed to submit application. Please try again.',
		}
	}
}
