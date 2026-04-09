'use server'

import { clerkClient } from '@clerk/nextjs/server'
import { eq, or, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getAllRaceOptionsForApplication } from '@/lib/sanity/queries'
import { resendService } from '@/lib/services/resend'
import { requireAdmin, isAdminEmail } from '@/server/auth/admin'
import {
	db,
	users,
	fundApplications,
	mentorApplications,
} from '@/server/db'
import {
	initializeFundWorkflow,
	transitionFundWorkflow,
} from '@/server/workflow/service'

async function findDbUserByClerkId(clerkUserId: string) {
	const suffix = `:${clerkUserId}`
	const suffixLen = suffix.length
	const [row] = await db
		.select({ id: users.id })
		.from(users)
		.where(
			or(
				eq(users.clerkId, clerkUserId),
				sql`RIGHT(${users.clerkId}, ${suffixLen}) = ${suffix}`,
			),
		)
		.limit(1)
	return row ?? null
}

// Define a custom error type
interface ErrorWithMessage {
	message: string
}

// Function to safely get an error message
function getErrorMessage(error: unknown): string {
	if (error && typeof error === 'object' && 'message' in error) {
		return (error as ErrorWithMessage).message
	}
	return String(error)
}

export async function getUserDeletionStats(userId: string) {
	// Verify admin status
	await requireAdmin()

	try {
		// Get user info
		const [user] = await db
			.select({
				name: users.name,
				email: users.email,
				userType: users.userType,
				createdAt: users.createdAt,
			})
			.from(users)
			.where(eq(users.id, userId))

		if (!user) {
			throw new Error('User not found')
		}

		const [fundAppsCount, mentorAppsCount] = await Promise.all([
			db
				.select({ count: fundApplications.id })
				.from(fundApplications)
				.where(eq(fundApplications.userId, userId)),
			db
				.select({ count: mentorApplications.id })
				.from(mentorApplications)
				.where(eq(mentorApplications.userId, userId)),
		])

		return {
			success: true,
			user,
			stats: {
				fundApplications: fundAppsCount.length,
				mentorApplications: mentorAppsCount.length,
				totalApplications: fundAppsCount.length + mentorAppsCount.length,
			},
		}
	} catch (error: unknown) {
		return {
			success: false,
			error: getErrorMessage(error),
		}
	}
}

export async function deleteUser(formData: FormData) {
	// Get the clerk user to verify admin status
	const adminUser = await requireAdmin()

	const userId = formData.get('userId') as string
	const clerkId = formData.get('clerkId') as string

	if (!userId || !clerkId) {
		throw new Error('Missing user information')
	}

	try {
		// First get the user's email and data before deleting from database
		const [user] = await db
			.select({
				email: users.email,
				name: users.name,
			})
			.from(users)
			.where(eq(users.id, userId))

		if (!user) {
			throw new Error('User not found')
		}

		// SAFEGUARD: Prevent deleting admin users
		if (isAdminEmail(user.email)) {
			throw new Error('Cannot delete admin users')
		}

		// SAFEGUARD: Prevent deleting the current admin user
		const currentAdminEmail = adminUser.emailAddresses?.[0]?.emailAddress
		if (user.email === currentAdminEmail) {
			throw new Error('Cannot delete your own admin account')
		}

		console.log('Admin: Starting comprehensive user deletion', {
			userId,
			clerkId,
			email: user.email,
			name: user.name,
			adminEmail: currentAdminEmail,
		})

		// Step 1: Delete all related fund applications
		try {
			await db
				.delete(fundApplications)
				.where(eq(fundApplications.userId, userId))
			console.log('Admin: Deleted fund applications', { userId })
		} catch (error) {
			console.error('Admin: Failed to delete fund applications', {
				userId,
				error,
			})
			throw new Error('Failed to delete fund applications')
		}

		// Step 2: Delete all related mentor applications
		try {
			await db
				.delete(mentorApplications)
				.where(eq(mentorApplications.userId, userId))
			console.log('Admin: Deleted mentor applications', { userId })
		} catch (error) {
			console.error('Admin: Failed to delete mentor applications', {
				userId,
				error,
			})
			throw new Error('Failed to delete mentor applications')
		}

		// Step 3: Delete the user from our database
		try {
			await db.delete(users).where(eq(users.id, userId))
			console.log('Admin: Deleted user from database', { userId })
		} catch (error) {
			console.error('Admin: Failed to delete user from database', {
				userId,
				error,
			})
			throw new Error('Failed to delete user from database')
		}

		// Step 4: Delete the user from Clerk authentication
		try {
			const clerk = await clerkClient()
			await clerk.users.deleteUser(clerkId)
			console.log('Admin: Deleted user from Clerk', { clerkId })
		} catch (error) {
			console.error('Admin: Failed to delete user from Clerk', {
				clerkId,
				error,
			})
			// This is critical - if Clerk deletion fails, user could be in inconsistent state
			throw new Error('Failed to delete user from authentication system')
		}

		// Step 5: Unsubscribe the user from Resend newsletter (soft unsubscribe; don't fail hard)
		try {
			await resendService.unsubscribeContact(user.email)
			console.log('Admin: User unsubscribed from newsletter in Resend', {
				email: user.email,
			})
		} catch (newsletterError) {
			console.warn(
				'Admin: Failed to unsubscribe user from newsletter in Resend',
				{
					email: user.email,
					error: getErrorMessage(newsletterError),
				},
			)
			// Don't fail the entire deletion if newsletter unsubscribe fails
		}

		// Revalidate all admin pages to refresh the data
		try {
			revalidatePath('/admin')
			revalidatePath('/admin/users')
			revalidatePath('/admin/fund-applications')
			revalidatePath('/admin/mentor-applications')
		} catch (error) {
			console.warn('Admin: Failed to revalidate paths after deletion', {
				error,
			})
			// Don't fail if revalidation fails
		}

		console.log('Admin: User deletion completed successfully', {
			userId,
			email: user.email,
		})

		return {
			success: true,
			message: `User ${user.name || user.email} and all associated data deleted successfully`,
		}
	} catch (error: unknown) {
		const errorMessage = getErrorMessage(error)
		console.error('Admin: Error during user deletion', {
			userId,
			clerkId,
			error: errorMessage,
		})
		return {
			success: false,
			error: `Failed to delete user: ${errorMessage}`,
		}
	}
}

export async function deleteApplication(formData: FormData) {
	// Verify admin status
	const adminUser = await requireAdmin()

	const applicationId = formData.get('applicationId') as string

	if (!applicationId) {
		throw new Error('Missing application ID')
	}

	try {
		console.log('Admin: Starting fund application deletion', {
			applicationId,
			adminEmail: adminUser.emailAddresses?.[0]?.emailAddress,
		})

		// First get the application details for logging
		const [application] = await db
			.select({
				name: fundApplications.name,
				email: fundApplications.email,
				race: fundApplications.race,
			})
			.from(fundApplications)
			.where(eq(fundApplications.id, applicationId))

		if (!application) {
			throw new Error('Application not found')
		}

		// Delete the application from database
		await db
			.delete(fundApplications)
			.where(eq(fundApplications.id, applicationId))

		console.log('Admin: Fund application deleted successfully', {
			applicationId,
			applicant: application.name,
			email: application.email,
			race: application.race,
		})

		// Revalidate admin pages to refresh the data
		try {
			revalidatePath('/admin')
			revalidatePath('/admin/fund-applications')
		} catch (error) {
			console.warn(
				'Admin: Failed to revalidate paths after application deletion',
				{ error },
			)
		}

		return {
			success: true,
			message: `Application from ${application.name} deleted successfully`,
		}
	} catch (error: unknown) {
		const errorMessage = getErrorMessage(error)
		console.error('Admin: Error during application deletion', {
			applicationId,
			error: errorMessage,
		})
		return {
			success: false,
			error: `Failed to delete application: ${errorMessage}`,
		}
	}
}

export async function deleteMentorApplication(formData: FormData) {
	// Verify admin status
	const adminUser = await requireAdmin()

	const applicationId = formData.get('applicationId') as string

	if (!applicationId) {
		throw new Error('Missing application ID')
	}

	try {
		console.log('Admin: Starting mentor application deletion', {
			applicationId,
			adminEmail: adminUser.emailAddresses?.[0]?.emailAddress,
		})

		// First get the application details for logging
		const [application] = await db
			.select({
				name: mentorApplications.name,
				email: mentorApplications.email,
				motivationToMentor: mentorApplications.motivationToMentor,
			})
			.from(mentorApplications)
			.where(eq(mentorApplications.id, applicationId))

		if (!application) {
			throw new Error('Mentor application not found')
		}

		// Delete the application from database
		await db
			.delete(mentorApplications)
			.where(eq(mentorApplications.id, applicationId))

		console.log('Admin: Mentor application deleted successfully', {
			applicationId,
			applicant: application.name,
			email: application.email,
		})

		// Revalidate admin pages to refresh the data
		try {
			revalidatePath('/admin')
			revalidatePath('/admin/mentor-applications')
		} catch (error) {
			console.warn(
				'Admin: Failed to revalidate paths after mentor application deletion',
				{ error },
			)
		}

		return {
			success: true,
			message: `Mentor application from ${application.name} deleted successfully`,
		}
	} catch (error: unknown) {
		const errorMessage = getErrorMessage(error)
		console.error('Admin: Error during mentor application deletion', {
			applicationId,
			error: errorMessage,
		})
		return {
			success: false,
			error: `Failed to delete mentor application: ${errorMessage}`,
		}
	}
}

export async function createMentorFundApplication(formData: FormData) {
	const admin = await requireAdmin()

	const userId = String(formData.get('userId') || '')
	if (!userId) {
		return { success: false, error: 'Missing userId' }
	}

	try {
		const [user] = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				pronouns: users.pronouns,
				userType: users.userType,
				age: users.age,
				genderIdentity: users.genderIdentity,
				locationRegion: users.locationRegion,
				hearAbout: users.hearAbout,
			})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1)

		if (!user) {
			return { success: false, error: 'User not found' }
		}

		const now = new Date()
		const actor = await findDbUserByClerkId(admin.id)
		const applicationId = crypto.randomUUID()
		const displayName = user.name?.trim() || user.email

		await db.insert(fundApplications).values({
			id: applicationId,
			userId: user.id,
			name: displayName,
			email: user.email,
			age: user.age ?? 0,
			zipcode: user.locationRegion || 'Not specified',
			race: 'Mentor Support Registration - Pending Race Selection',
			firstRace: false,
			experience:
				'Admin-created default application for mentor support tracking.',
			reason:
				'This application was manually created by admin to support a mentor with race registration and impact tracking.',
			goals: 'Registration support and program impact tracking.',
			communityContribution:
				'Mentor contribution tracked through community support workflows.',
			tierraLibreContribution:
				'Admin-created default mentor support application.',
			bipocIdentity: user.userType === 'bipoc',
			genderIdentity: user.genderIdentity || 'Not specified',
			additionalAssistanceNeeds: null,
			referralSource: user.hearAbout || 'Admin Created',
			gearNeeds: null,
			wantsMentor: false,
			mentorGenderPreference: null,
			adminNotes: `Admin-created on ${now.toLocaleDateString('en-US')} for mentor support tracking.`,
			status: 'PENDING',
			workflowStage: 'SUBMITTED',
			registrationStatus: 'PENDING',
		})

		await initializeFundWorkflow(applicationId, {
			actorRole: 'ADMIN',
			actorUserId: actor?.id,
		})

		const approvedTransition = await transitionFundWorkflow({
			applicationId,
			toStage: 'AWAITING_CONFIRMATION',
			actor: {
				actorRole: 'ADMIN',
				actorUserId: actor?.id,
			},
			metadata: {
				source: 'ADMIN_MENTOR_FUND_APPLICATION',
				skipAthleteConfirmation: true,
			},
			sendEmail: false,
		})

		if (!approvedTransition.success) {
			return { success: false, error: approvedTransition.error }
		}

		const confirmedTransition = await transitionFundWorkflow({
			applicationId,
			toStage: 'CONFIRMED',
			actor: {
				actorRole: 'ADMIN',
				actorUserId: actor?.id,
			},
			metadata: {
				source: 'ADMIN_MENTOR_FUND_APPLICATION',
				confirmedByAdmin: true,
			},
			sendEmail: false,
		})

		if (!confirmedTransition.success) {
			return { success: false, error: confirmedTransition.error }
		}

		revalidatePath('/admin')
		revalidatePath('/admin/fund-applications')
		revalidatePath('/admin/mentor-applications')
		revalidatePath('/admin/users')
		revalidatePath(`/admin/users/${userId}`)
		revalidatePath(`/admin/applications/${applicationId}`)

		return {
			success: true,
			applicationId,
			message: `Mentor athlete application created for ${displayName}.`,
		}
	} catch (error: unknown) {
		return { success: false, error: getErrorMessage(error) }
	}
}

export async function adminOverrideApplicationLimits(formData: FormData) {
	// Verify admin status
	await requireAdmin()

	const userId = formData.get('userId') as string
	const bypassLimits = formData.get('bypassLimits') === 'true'

	if (!userId) {
		throw new Error('Missing required information')
	}

	try {
		if (bypassLimits) {
			// Admin can force create an application bypassing limits
			// This is useful for special cases or corrections
			console.log(`Admin override: Creating application for user ${userId}`)
		}

		return { success: true }
	} catch (error: unknown) {
		console.error('Error with admin override:', error)
		return {
			success: false,
			error: getErrorMessage(error),
		}
	}
}

export async function setUserFundApplicationLimitExempt(
	userId: string,
	fundApplicationLimitExempt: boolean,
) {
	await requireAdmin()

	if (!userId) {
		return { success: false, error: 'Missing userId' }
	}

	try {
		await db
			.update(users)
			.set({
				fundApplicationLimitExempt,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId))

		revalidatePath('/admin/users')
		revalidatePath(`/admin/users/${userId}`)

		return { success: true }
	} catch (error: unknown) {
		return { success: false, error: getErrorMessage(error) }
	}
}

export async function updateFundApplicationRace(
	applicationId: string,
	race: string,
) {
	await requireAdmin()

	if (!applicationId || !race) {
		return { success: false, error: 'Missing required information' }
	}

	try {
		const [application] = await db
			.select({ id: fundApplications.id, userId: fundApplications.userId })
			.from(fundApplications)
			.where(eq(fundApplications.id, applicationId))

		if (!application) {
			return { success: false, error: 'Application not found' }
		}

		const raceOptions = await getAllRaceOptionsForApplication()
		const matchingRace = raceOptions?.find(
			(option) => `${option.raceSeries.name} - ${option.distance}` === race,
		)

		let raceDate: Date | null = null
		const raceDateRaw = matchingRace?.raceSeries?.date
		if (typeof raceDateRaw === 'string' && raceDateRaw.trim().length > 0) {
			const parsed = new Date(raceDateRaw)
			raceDate = Number.isNaN(parsed.getTime()) ? null : parsed
		}
		const raceLocation = matchingRace?.raceSeries?.location ?? null

		await db
			.update(fundApplications)
			.set({
				race,
				raceDate,
				raceLocation,
				updatedAt: new Date(),
			})
			.where(eq(fundApplications.id, applicationId))

		revalidatePath('/admin')
		revalidatePath('/admin/fund-applications')
		revalidatePath(`/admin/applications/${applicationId}`)
		revalidatePath('/dashboard')

		return { success: true }
	} catch (error: unknown) {
		return { success: false, error: getErrorMessage(error) }
	}
}
