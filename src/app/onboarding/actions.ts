'use server'

import { auth } from '@clerk/nextjs/server'
import { eq, or, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/server/auth'
import { db, users } from '@/server/db'

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

interface OnboardingStepData {
	type:
		| 'profile_photo'
		| 'slack'
		| 'strava'
		| 'donate'
		| 'instagram'
		| 'user_type'
		| 'demographics'
	profileImageUrl?: string | null
	slackJoined?: boolean
	stravaJoined?: boolean
	donationCompleted?: boolean
	instagramFollowed?: boolean
	userType?: 'bipoc' | 'ally'
	genderIdentity?: string
	pronouns?: string
	age?: number
	zipcode?: string
	locationRegion?: string
	runningExperience?: string
	hearAbout?: string
	acceptedCodeOfConduct?: boolean
}

export async function updateOnboardingStep(stepData: OnboardingStepData) {
	try {
		const [{ userId }] = await Promise.all([auth()])
		if (!userId) {
			return { success: false, error: 'User not found' }
		}
		const dbUser = await getCurrentUser()

		if (!dbUser) {
			return {
				success: false,
				error: 'User not found',
			}
		}

		// Update based on step type
		const updateData: Partial<{
			profileImageUrl: string | null
			slackJoined: boolean
			stravaJoined: boolean
			donationCompleted: boolean
			instagramFollowed: boolean
			userType: 'bipoc' | 'ally'
			genderIdentity: string
			pronouns: string
			age: number
			locationRegion: string
			runningExperience: string
			hearAbout: string
			acceptedCodeOfConduct: boolean
			updatedAt: Date
		}> = {
			updatedAt: new Date(),
		}

		switch (stepData.type) {
			case 'profile_photo':
				if (stepData.profileImageUrl) {
					updateData.profileImageUrl = stepData.profileImageUrl
				}
				break
			case 'slack':
				updateData.slackJoined = stepData.slackJoined || false
				break
			case 'strava':
				updateData.stravaJoined = stepData.stravaJoined || false
				break
			case 'donate':
				updateData.donationCompleted = stepData.donationCompleted || false
				break
			case 'instagram':
				updateData.instagramFollowed = stepData.instagramFollowed || false
				break
			case 'user_type':
				if (stepData.userType) {
					updateData.userType = stepData.userType
				}
				break
			case 'demographics':
				// Validate age requirement
				if (stepData.age && stepData.age < 18) {
					return {
						success: false,
						error: 'You must be at least 18 years old to create an account',
					}
				}
				// Validate zipcode
				if (stepData.zipcode) {
					const zipcodeRegex = /^[A-Z0-9\s-]{3,10}$/i
					if (!zipcodeRegex.test(stepData.zipcode.trim())) {
						return {
							success: false,
							error: 'Please enter a valid ZIP/Postal Code (3-10 characters)',
						}
					}
					updateData.locationRegion = stepData.zipcode.trim()
				}
				if (stepData.genderIdentity) {
					updateData.genderIdentity = stepData.genderIdentity
				}
				if (stepData.pronouns) {
					updateData.pronouns = stepData.pronouns
				}
				if (stepData.age) {
					updateData.age = stepData.age
				}
				if (stepData.runningExperience) {
					updateData.runningExperience = stepData.runningExperience
				}
				if (stepData.hearAbout) {
					updateData.hearAbout = stepData.hearAbout
				}
				if (stepData.acceptedCodeOfConduct !== undefined) {
					updateData.acceptedCodeOfConduct = stepData.acceptedCodeOfConduct
				}
				break
			default:
				return {
					success: false,
					error: 'Invalid step type',
				}
		}

		// Update ALL possible rows for this Clerk user (raw + namespaced).
		const suffix = `:${userId}`
		const suffixLen = suffix.length
		await db
			.update(users)
			.set(updateData)
			.where(
				or(
					eq(users.clerkId, userId),
					sql`RIGHT(${users.clerkId}, ${suffixLen}) = ${suffix}`,
				),
			)

		revalidatePath('/onboarding')
		revalidatePath('/dashboard')

		return { success: true }
	} catch (error: unknown) {
		console.error('Error updating onboarding step:', error)
		return {
			success: false,
			error: getErrorMessage(error),
		}
	}
}

export async function completeOnboarding() {
	try {
		const { userId } = await auth()
		if (!userId) {
			return { success: false, error: 'User not found' }
		}
		const dbUser = await getCurrentUser()

		if (!dbUser) {
			return {
				success: false,
				error: 'User not found',
			}
		}

		// Mark onboarding complete on ALL possible rows for this Clerk user.
		const suffix = `:${userId}`
		const suffixLen = suffix.length
		await db
			.update(users)
			.set({ onboardingCompleted: true, updatedAt: new Date() })
			.where(
				or(
					eq(users.clerkId, userId),
					sql`RIGHT(${users.clerkId}, ${suffixLen}) = ${suffix}`,
				),
			)

		const verify = await db
			.select({ onboardingCompleted: users.onboardingCompleted })
			.from(users)
			.where(
				or(
					eq(users.clerkId, userId),
					sql`RIGHT(${users.clerkId}, ${suffixLen}) = ${suffix}`,
				),
			)
			.limit(25)

		if (!verify.some((r) => r.onboardingCompleted === true)) {
			return {
				success: false,
				error: 'Onboarding could not be persisted. Please try again.',
			}
		}

		revalidatePath('/onboarding')
		revalidatePath('/dashboard')

		return { success: true }
	} catch (error: unknown) {
		console.error('Error completing onboarding:', error)
		return {
			success: false,
			error: getErrorMessage(error),
		}
	}
}
