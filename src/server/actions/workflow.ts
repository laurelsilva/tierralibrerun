'use server'

import { and, eq, or, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import {
	type FundWorkflowStage,
	type MentorWorkflowStage,
	MENTOR_WORKFLOW_STAGES,
} from '@/lib/types/workflow'
import { getCurrentUser } from '@/server/auth'
import { requireAdmin } from '@/server/auth/admin'
import { db, fundApplications, users } from '@/server/db'
import {
	assignMentorToFundApplication,
	removeMentorFromFundApplication,
	transitionFundWorkflow,
	transitionMentorWorkflow,
} from '@/server/workflow/service'

type FundAdminActionKey =
	| 'START_REVIEW'
	| 'APPROVE_AND_REQUEST_CONFIRMATION'
	| 'WAITLIST'
	| 'REJECT'
	| 'MARK_CONFIRMED'
	| 'MARK_REGISTERED_AND_ACTIVE'
	| 'MARK_COMPLETED'
	| 'MARK_NO_SHOW_OR_DROPPED'
	| 'CLOSE_OUT'
	| 'REOPEN_REVIEW'

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

function isMentorStage(value: string): value is MentorWorkflowStage {
	return MENTOR_WORKFLOW_STAGES.includes(value as MentorWorkflowStage)
}

function parseSendEmail(raw: FormDataEntryValue | null) {
	if (typeof raw !== 'string') return false
	return raw === '1' || raw.toLowerCase() === 'true' || raw.toLowerCase() === 'yes'
}

function parseBoolean(raw: FormDataEntryValue | null) {
	if (typeof raw !== 'string') return false
	return raw === '1' || raw.toLowerCase() === 'true' || raw.toLowerCase() === 'yes'
}

function isFundAdminAction(value: string): value is FundAdminActionKey {
	return [
		'START_REVIEW',
		'APPROVE_AND_REQUEST_CONFIRMATION',
		'WAITLIST',
		'REJECT',
		'MARK_CONFIRMED',
		'MARK_REGISTERED_AND_ACTIVE',
		'MARK_COMPLETED',
		'MARK_NO_SHOW_OR_DROPPED',
		'CLOSE_OUT',
		'REOPEN_REVIEW',
	].includes(value)
}

export async function runFundAdminAction(formData: FormData) {
	const admin = await requireAdmin()

	const applicationId = String(formData.get('applicationId') || '')
	const action = String(formData.get('action') || '').toUpperCase()
	const sendEmail = parseSendEmail(formData.get('sendEmail'))
	const registrationStatus = String(formData.get('registrationStatus') || '')

	if (!applicationId || !action) {
		return { success: false, error: 'Missing applicationId or action' }
	}

	if (!isFundAdminAction(action)) {
		return { success: false, error: 'Invalid fund admin action' }
	}

	const [application] = await db
		.select({
			workflowStage: fundApplications.workflowStage,
			status: fundApplications.status,
		})
		.from(fundApplications)
		.where(eq(fundApplications.id, applicationId))
		.limit(1)

	if (!application) {
		return { success: false, error: 'Application not found' }
	}

	const currentStage = (application.workflowStage || 'SUBMITTED').toUpperCase()
	const dbAdmin = await findDbUserByClerkId(admin.id)
	const actorEmail = admin.emailAddresses?.[0]?.emailAddress || null
	const actor = {
		actorRole: 'ADMIN' as const,
		actorUserId: dbAdmin?.id,
	}

	const runTransition = async (
		toStage: FundWorkflowStage,
		options?: {
			sendEmail?: boolean
			registrationStatus?: string
			closedReason?: string
		},
	) =>
		transitionFundWorkflow({
			applicationId,
			toStage,
			actor,
			metadata: {
				registrationStatus: options?.registrationStatus,
				closedReason: options?.closedReason,
				actorEmail,
			},
			sendEmail: options?.sendEmail ?? false,
		})

	const chain: Array<() => Promise<{ success: boolean; error?: string }>> = []

	switch (action) {
		case 'START_REVIEW':
		case 'REOPEN_REVIEW':
			chain.push(() => runTransition('IN_REVIEW'))
			break
		case 'APPROVE_AND_REQUEST_CONFIRMATION':
			chain.push(() =>
				runTransition('AWAITING_CONFIRMATION', {
					sendEmail,
				}),
			)
			break
		case 'WAITLIST':
			chain.push(() => runTransition('WAITLISTED'))
			break
		case 'REJECT':
			chain.push(() =>
				runTransition('DECLINED', {
					sendEmail,
				}),
			)
			break
		case 'MARK_CONFIRMED':
			chain.push(() => runTransition('CONFIRMED'))
			break
		case 'MARK_REGISTERED_AND_ACTIVE':
			if (currentStage === 'CONFIRMED') {
				chain.push(() => runTransition('REGISTRATION_IN_PROGRESS'))
			}
			if (currentStage === 'CONFIRMED' || currentStage === 'REGISTRATION_IN_PROGRESS') {
				chain.push(() =>
					runTransition('REGISTERED', {
						registrationStatus: registrationStatus || 'ADMIN_REGISTERED',
					}),
				)
			}
			chain.push(() => runTransition('ACTIVE_IN_PROGRAM'))
			break
		case 'MARK_COMPLETED':
			chain.push(() => runTransition('NO_LONGER_ACTIVE'))
			break
		case 'MARK_NO_SHOW_OR_DROPPED':
			chain.push(() => runTransition('NO_SHOW_OR_DROPPED'))
			break
		case 'CLOSE_OUT':
			chain.push(() =>
				runTransition('CLOSED', {
					closedReason: 'Closed out by admin.',
				}),
			)
			break
		default:
			return { success: false, error: 'Unsupported fund admin action' }
	}

	for (const step of chain) {
		const result = await step()
		if (!result.success) {
			return result
		}
	}

	revalidatePath('/admin')
	revalidatePath('/admin/fund-applications')
	revalidatePath(`/admin/applications/${applicationId}`)
	revalidatePath('/dashboard')

	return { success: true }
}

export async function transitionMentorApplicationWorkflow(formData: FormData) {
	const admin = await requireAdmin()

	const applicationId = String(formData.get('applicationId') || '')
	const toStageRaw = String(formData.get('toStage') || '').toUpperCase()
	const sendEmail = parseSendEmail(formData.get('sendEmail'))
	const closedReason = String(formData.get('closedReason') || '')

	if (!applicationId || !toStageRaw) {
		return { success: false, error: 'Missing applicationId or toStage' }
	}
	if (!isMentorStage(toStageRaw)) {
		return { success: false, error: 'Invalid mentor workflow stage' }
	}

	const dbAdmin = await findDbUserByClerkId(admin.id)
	const actorEmail = admin.emailAddresses?.[0]?.emailAddress || null

	const result = await transitionMentorWorkflow({
		applicationId,
		toStage: toStageRaw,
		actor: {
			actorRole: 'ADMIN',
			actorUserId: dbAdmin?.id,
		},
		metadata: {
			closedReason: closedReason || undefined,
			actorEmail,
		},
		sendEmail,
	})

	if (!result.success) return result

	revalidatePath('/admin')
	revalidatePath('/admin/mentor-applications')
	revalidatePath(`/admin/mentor-applications/${applicationId}`)
	revalidatePath('/dashboard')

	return result
}

export async function assignFundApplicationMentor(formData: FormData) {
	const admin = await requireAdmin()

	const fundApplicationId = String(formData.get('fundApplicationId') || '')
	const mentorApplicationId = String(formData.get('mentorApplicationId') || '')
	const allowPreferenceOverride = parseBoolean(
		formData.get('allowPreferenceOverride'),
	)

	if (!fundApplicationId || !mentorApplicationId) {
		return {
			success: false as const,
			error: 'Missing fundApplicationId or mentorApplicationId',
		}
	}

	const dbAdmin = await findDbUserByClerkId(admin.id)

	const result = await assignMentorToFundApplication({
		fundApplicationId,
		mentorApplicationId,
		actor: {
			actorRole: 'ADMIN',
			actorUserId: dbAdmin?.id,
		},
		allowPreferenceOverride,
	})

	if (!result.success) return result

	revalidatePath('/admin')
	revalidatePath('/admin/fund-applications')
	revalidatePath('/admin/fund-athletes/active')
	revalidatePath(`/admin/applications/${fundApplicationId}`)
	revalidatePath('/admin/mentor-applications')
	revalidatePath(`/admin/mentor-applications/${mentorApplicationId}`)

	if (result.previousMentorApplicationId) {
		revalidatePath(
			`/admin/mentor-applications/${result.previousMentorApplicationId}`,
		)
	}

	revalidatePath('/dashboard')

	return result
}

export async function unassignFundApplicationMentor(
	fundApplicationId: string,
) {
	const admin = await requireAdmin()

	if (!fundApplicationId) {
		return { success: false as const, error: 'Missing fundApplicationId' }
	}

	const dbAdmin = await findDbUserByClerkId(admin.id)

	const result = await removeMentorFromFundApplication({
		fundApplicationId,
		actor: {
			actorRole: 'ADMIN',
			actorUserId: dbAdmin?.id,
		},
	})

	if (!result.success) return result

	revalidatePath('/admin')
	revalidatePath('/admin/fund-applications')
	revalidatePath('/admin/fund-athletes/active')
	revalidatePath(`/admin/applications/${fundApplicationId}`)
	revalidatePath('/admin/mentor-applications')
	revalidatePath(`/admin/mentor-applications/${result.mentorApplicationId}`)
	revalidatePath('/admin/mentor-pairings')
	revalidatePath('/dashboard')

	return result
}

export async function confirmFundParticipation(applicationId: string) {
	const user = await getCurrentUser()
	if (!user) {
		return { success: false, error: 'Not authenticated' }
	}

	const [application] = await db
		.select({ id: fundApplications.id })
		.from(fundApplications)
		.where(
			and(
				eq(fundApplications.id, applicationId),
				eq(fundApplications.userId, user.id),
			),
		)
		.limit(1)

	if (!application) {
		return { success: false, error: 'Application not found' }
	}

	const result = await transitionFundWorkflow({
		applicationId,
		toStage: 'CONFIRMED',
		actor: {
			actorRole: 'ATHLETE',
			actorUserId: user.id,
		},
		metadata: {
			confirmedVia: 'dashboard',
		},
		sendEmail: false,
	})

	if (!result.success) return result

	revalidatePath('/dashboard')
	revalidatePath('/fund/apply/success')

	return { success: true }
}
