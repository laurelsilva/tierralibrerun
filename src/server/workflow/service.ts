import { and, desc, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import { toMysqlDateTime } from '@/lib/dates'
import { sendApplicationEmail } from '@/lib/email/orchestrator'
import {
	type FundWorkflowStage,
	type MentorWorkflowStage,
	FUND_WORKFLOW_LABELS,
	MENTOR_WORKFLOW_LABELS,
} from '@/lib/types/workflow'
import { getAvatarUrlFromClerkId } from '@/server/clerk/avatar'
import {
	applicationEvents,
	applicationTasks,
	db,
	fundApplications,
	mentorApplications,
	mentorshipMatches,
	users,
} from '@/server/db'

export type WorkflowActorRole = 'ADMIN' | 'ATHLETE' | 'SYSTEM'

export interface WorkflowActor {
	actorUserId?: string | null
	actorRole: WorkflowActorRole
}

export interface WorkflowTransition {
	toStage: string
	label: string
	description: string
}

const FUND_TRANSITIONS: Record<FundWorkflowStage, WorkflowTransition[]> = {
	SUBMITTED: [
		{
			toStage: 'IN_REVIEW',
			label: 'Start Review',
			description: 'Move this submission into active review.',
		},
		{
			toStage: 'AWAITING_CONFIRMATION',
			label: 'Approve + Request Confirmation',
			description: 'Send approval and wait for athlete confirmation.',
		},
		{
			toStage: 'WAITLISTED',
			label: 'Waitlist',
			description: 'Place applicant on waitlist for this cycle.',
		},
		{
			toStage: 'DECLINED',
			label: 'Decline',
			description: 'Mark as declined for this cycle.',
		},
	],
	IN_REVIEW: [
		{
			toStage: 'AWAITING_CONFIRMATION',
			label: 'Approve + Request Confirmation',
			description: 'Send approval and wait for athlete confirmation.',
		},
		{
			toStage: 'WAITLISTED',
			label: 'Waitlist',
			description: 'Place applicant on waitlist for this cycle.',
		},
		{
			toStage: 'DECLINED',
			label: 'Decline',
			description: 'Mark as declined for this cycle.',
		},
	],
	WAITLISTED: [
		{
			toStage: 'IN_REVIEW',
			label: 'Re-open Review',
			description: 'Bring back into active review.',
		},
		{
			toStage: 'AWAITING_CONFIRMATION',
			label: 'Approve + Request Confirmation',
			description: 'Move from waitlist to approval flow.',
		},
		{
			toStage: 'CLOSED',
			label: 'Close',
			description: 'Close without further action.',
		},
	],
	DECLINED: [
		{
			toStage: 'IN_REVIEW',
			label: 'Re-open Review',
			description: 'Reopen if the decision should be revisited.',
		},
		{
			toStage: 'CLOSED',
			label: 'Close',
			description: 'Archive this lifecycle.',
		},
	],
	AWAITING_CONFIRMATION: [
		{
			toStage: 'CONFIRMED',
			label: 'Mark Confirmed',
			description: 'Athlete confirmed attendance and commitment.',
		},
		{
			toStage: 'WAITLISTED',
			label: 'Move to Waitlist',
			description: 'Pause due to capacity or logistics.',
		},
		{
			toStage: 'CLOSED',
			label: 'Close (No Response / Withdrawn)',
			description: 'Close when athlete does not confirm.',
		},
	],
	CONFIRMED: [
		{
			toStage: 'REGISTRATION_IN_PROGRESS',
			label: 'Start Registration',
			description: 'Begin race registration operations.',
		},
		{
			toStage: 'CLOSED',
			label: 'Close',
			description: 'Close if athlete withdraws.',
		},
	],
	REGISTRATION_IN_PROGRESS: [
		{
			toStage: 'REGISTERED',
			label: 'Mark Registered',
			description: 'Race registration is fully confirmed.',
		},
		{
			toStage: 'CLOSED',
			label: 'Close',
			description: 'Close if registration cannot be completed.',
		},
	],
	REGISTERED: [
		{
			toStage: 'ONBOARDING_IN_PROGRESS',
			label: 'Start Onboarding',
			description: 'Begin Slack/community/mentor onboarding.',
		},
		{
			toStage: 'ACTIVE_IN_PROGRAM',
			label: 'Activate Athlete',
			description: 'Mark athlete as fully active in program.',
		},
		{
			toStage: 'NO_SHOW_OR_DROPPED',
			label: 'Mark No Show / Dropped',
			description:
				'Athlete was registered but did not start or withdrew before race.',
		},
		{
			toStage: 'NO_LONGER_ACTIVE',
			label: 'Mark No Longer Active',
			description: 'Race completed and athlete is no longer active this cycle.',
		},
	],
	ONBOARDING_IN_PROGRESS: [
		{
			toStage: 'ACTIVE_IN_PROGRAM',
			label: 'Activate Athlete',
			description: 'Onboarding complete; athlete is now active.',
		},
		{
			toStage: 'NO_SHOW_OR_DROPPED',
			label: 'Mark No Show / Dropped',
			description:
				'Athlete was registered but did not start or withdrew before race.',
		},
		{
			toStage: 'NO_LONGER_ACTIVE',
			label: 'Mark No Longer Active',
			description: 'Race completed and athlete is no longer active this cycle.',
		},
		{
			toStage: 'CLOSED',
			label: 'Close',
			description: 'Close lifecycle if athlete exits program.',
		},
	],
	ACTIVE_IN_PROGRAM: [
		{
			toStage: 'NO_LONGER_ACTIVE',
			label: 'Mark No Longer Active',
			description: 'Race completed and athlete is no longer active this cycle.',
		},
		{
			toStage: 'NO_SHOW_OR_DROPPED',
			label: 'Mark No Show / Dropped',
			description:
				'Athlete was registered but did not start or withdrew before race.',
		},
		{
			toStage: 'CLOSED',
			label: 'Close',
			description: 'Close lifecycle after completion or withdrawal.',
		},
	],
	NO_LONGER_ACTIVE: [
		{
			toStage: 'ACTIVE_IN_PROGRAM',
			label: 'Mark Active',
			description: 'Re-open as active if this outcome was set by mistake.',
		},
		{
			toStage: 'CLOSED',
			label: 'Close',
			description: 'Archive this lifecycle.',
		},
	],
	NO_SHOW_OR_DROPPED: [
		{
			toStage: 'REGISTRATION_IN_PROGRESS',
			label: 'Re-open Registration',
			description: 'Re-open if the athlete is returning to this race flow.',
		},
		{
			toStage: 'CLOSED',
			label: 'Close',
			description: 'Archive this lifecycle outcome.',
		},
	],
	CLOSED: [
		{
			toStage: 'IN_REVIEW',
			label: 'Re-open',
			description: 'Reopen the lifecycle for additional actions.',
		},
	],
}

const MENTOR_TRANSITIONS: Record<MentorWorkflowStage, WorkflowTransition[]> = {
	SUBMITTED: [
		{
			toStage: 'IN_REVIEW',
			label: 'Start Review',
			description: 'Move this submission into active review.',
		},
		{
			toStage: 'APPROVED_POOL',
			label: 'Approve to Pool',
			description: 'Approve mentor into available pool.',
		},
		{
			toStage: 'WAITLISTED',
			label: 'Waitlist',
			description: 'Waitlist due to current capacity.',
		},
		{
			toStage: 'DECLINED',
			label: 'Decline',
			description: 'Decline mentor application.',
		},
	],
	IN_REVIEW: [
		{
			toStage: 'APPROVED_POOL',
			label: 'Approve to Pool',
			description: 'Approve mentor into available pool.',
		},
		{
			toStage: 'WAITLISTED',
			label: 'Waitlist',
			description: 'Waitlist due to current capacity.',
		},
		{
			toStage: 'DECLINED',
			label: 'Decline',
			description: 'Decline mentor application.',
		},
	],
	WAITLISTED: [
		{
			toStage: 'IN_REVIEW',
			label: 'Re-open Review',
			description: 'Reconsider mentor application.',
		},
		{
			toStage: 'APPROVED_POOL',
			label: 'Approve to Pool',
			description: 'Approve mentor into available pool.',
		},
		{
			toStage: 'CLOSED',
			label: 'Close',
			description: 'Close lifecycle without approval.',
		},
	],
	DECLINED: [
		{
			toStage: 'IN_REVIEW',
			label: 'Re-open Review',
			description: 'Reconsider mentor application.',
		},
		{
			toStage: 'CLOSED',
			label: 'Close',
			description: 'Archive mentor lifecycle.',
		},
	],
	APPROVED_POOL: [
		{
			toStage: 'MATCH_PENDING',
			label: 'Mark Match Pending',
			description: 'Prepare mentor for athlete pairing.',
		},
		{
			toStage: 'MATCHED',
			label: 'Mark Matched',
			description: 'Mentor has been matched with an athlete.',
		},
	],
	MATCH_PENDING: [
		{
			toStage: 'MATCHED',
			label: 'Mark Matched',
			description: 'Mentor has been matched with an athlete.',
		},
		{
			toStage: 'APPROVED_POOL',
			label: 'Return to Pool',
			description: 'Return mentor to approved pool.',
		},
	],
	MATCHED: [
		{
			toStage: 'ACTIVE',
			label: 'Mark Active',
			description: 'Mentor is actively supporting athlete(s).',
		},
		{
			toStage: 'APPROVED_POOL',
			label: 'Return to Pool',
			description: 'End pairing and return mentor to pool.',
		},
	],
	ACTIVE: [
		{
			toStage: 'APPROVED_POOL',
			label: 'Return to Pool',
			description: 'Set mentor available for future matches.',
		},
		{
			toStage: 'CLOSED',
			label: 'Close',
			description: 'Close mentor lifecycle.',
		},
	],
	CLOSED: [
		{
			toStage: 'IN_REVIEW',
			label: 'Re-open',
			description: 'Reopen mentor lifecycle.',
		},
	],
}

const FUND_MENTOR_ASSIGNABLE_STAGES: FundWorkflowStage[] = [
	'AWAITING_CONFIRMATION',
	'CONFIRMED',
	'REGISTRATION_IN_PROGRESS',
	'REGISTERED',
	'ONBOARDING_IN_PROGRESS',
	'ACTIVE_IN_PROGRAM',
]

const ACTIVE_MENTOR_POOL_STAGES: MentorWorkflowStage[] = [
	'APPROVED_POOL',
	'MATCH_PENDING',
	'MATCHED',
	'ACTIVE',
]

export type MentorAssignmentOption = {
	applicationId: string
	userId: string
	name: string
	email: string
	workflowStage: string
	workflowStageLabel: string
	genderIdentity: string | null
	locationRegion: string | null
	specialExpertise: string | null
	preferredCommunicationStyle: string | null
	avatarUrl: string | null
	assignedAthleteCount: number
	isCurrentMatch: boolean
	isAssignable: boolean
	matchedAt: Date | null
	compatibilityStatus: 'aligned' | 'needs_review' | 'conflict'
	compatibilityLabel: string
	compatibilitySummary: string
	compatibilityDetails: string[]
	requiresPreferenceOverride: boolean
	hiddenByDefault: boolean
}

export type FundMentorAssignmentContext = {
	currentMatch: MentorAssignmentOption | null
	mentorOptions: MentorAssignmentOption[]
	hiddenConflictCount: number
}

function parseJsonPayload(payload?: string | null): Record<string, unknown> {
	if (!payload) return {}
	try {
		const parsed = JSON.parse(payload)
		if (parsed && typeof parsed === 'object') {
			return parsed as Record<string, unknown>
		}
	} catch {
		return {}
	}
	return {}
}

async function logEvent(input: {
	applicationId: string
	applicationType: 'FUND' | 'MENTOR'
	eventType: string
	fromStage?: string | null
	toStage?: string | null
	actor?: WorkflowActor
	payload?: Record<string, unknown>
}) {
	await db.insert(applicationEvents).values({
		applicationId: input.applicationId,
		applicationType: input.applicationType,
		eventType: input.eventType,
		fromStage: input.fromStage ?? null,
		toStage: input.toStage ?? null,
		actorUserId: input.actor?.actorUserId ?? null,
		actorRole: input.actor?.actorRole ?? 'SYSTEM',
		payload: input.payload ? JSON.stringify(input.payload) : null,
	})
}

async function ensureOpenTask(input: {
	applicationId: string
	applicationType: 'FUND' | 'MENTOR'
	taskType: string
	title: string
	description?: string
	priority?: 'HIGH' | 'MEDIUM' | 'LOW'
	dueAt?: Date | null
}) {
	const existing = await db
		.select({ id: applicationTasks.id })
		.from(applicationTasks)
		.where(
			and(
				eq(applicationTasks.applicationId, input.applicationId),
				eq(applicationTasks.applicationType, input.applicationType),
				eq(applicationTasks.taskType, input.taskType),
				eq(applicationTasks.status, 'OPEN'),
			),
		)
		.limit(1)

	if (existing.length > 0) return

	await db.insert(applicationTasks).values({
		applicationId: input.applicationId,
		applicationType: input.applicationType,
		taskType: input.taskType,
		title: input.title,
		description: input.description ?? null,
		priority: input.priority ?? 'MEDIUM',
		dueAt: input.dueAt ?? null,
	})
}

async function markTasksByType(
	applicationType: 'FUND' | 'MENTOR',
	applicationId: string,
	taskTypes: string[],
	nextStatus: 'DONE' | 'CANCELED',
) {
	if (taskTypes.length === 0) return
	await db
		.update(applicationTasks)
		.set({
			status: nextStatus,
			completedAt: nextStatus === 'DONE' ? new Date() : null,
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(applicationTasks.applicationType, applicationType),
				eq(applicationTasks.applicationId, applicationId),
				inArray(applicationTasks.taskType, taskTypes),
				eq(applicationTasks.status, 'OPEN'),
			),
		)
}

async function cancelAllOpenTasks(
	applicationType: 'FUND' | 'MENTOR',
	applicationId: string,
) {
	await db
		.update(applicationTasks)
		.set({
			status: 'CANCELED',
			completedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(applicationTasks.applicationType, applicationType),
				eq(applicationTasks.applicationId, applicationId),
				eq(applicationTasks.status, 'OPEN'),
			),
		)
}

export async function initializeFundWorkflow(
	applicationId: string,
	actor?: WorkflowActor,
) {
	await logEvent({
		applicationId,
		applicationType: 'FUND',
		eventType: 'APPLICATION_SUBMITTED',
		fromStage: null,
		toStage: 'SUBMITTED',
		actor,
	})

	await ensureOpenTask({
		applicationId,
		applicationType: 'FUND',
		taskType: 'REVIEW_APPLICATION',
		title: 'Review athlete application',
		description:
			'Review application details and decide: approve, waitlist, or decline.',
		priority: 'HIGH',
	})
}

export async function initializeMentorWorkflow(
	applicationId: string,
	actor?: WorkflowActor,
) {
	await logEvent({
		applicationId,
		applicationType: 'MENTOR',
		eventType: 'APPLICATION_SUBMITTED',
		fromStage: null,
		toStage: 'SUBMITTED',
		actor,
	})

	await ensureOpenTask({
		applicationId,
		applicationType: 'MENTOR',
		taskType: 'REVIEW_APPLICATION',
		title: 'Review mentor application',
		description:
			'Review mentor application and decide: approve to pool, waitlist, or decline.',
		priority: 'HIGH',
	})
}

export async function syncPastRaceFundApplications() {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const todayMysql = toMysqlDateTime(today)

	if (!todayMysql) {
		return {
			transitionedToNoLongerActive: 0,
			transitionedToClosed: 0,
		}
	}

	const staleActiveApplications = await db
		.select({ id: fundApplications.id })
		.from(fundApplications)
		.where(
			and(
				inArray(fundApplications.workflowStage, [
					'REGISTERED',
					'ONBOARDING_IN_PROGRESS',
					'ACTIVE_IN_PROGRAM',
				]),
				isNotNull(fundApplications.raceDate),
				sql`${fundApplications.raceDate} < ${todayMysql}`,
			),
		)

	for (const application of staleActiveApplications) {
		await transitionFundWorkflow({
			applicationId: application.id,
			toStage: 'NO_LONGER_ACTIVE',
			actor: {
				actorRole: 'SYSTEM',
			},
			metadata: {
				autoClosedReason: 'race_date_passed',
				effectiveDate: today.toISOString(),
			},
			sendEmail: false,
		})
	}

	const stalePreRaceApplications = await db
		.select({ id: fundApplications.id })
		.from(fundApplications)
		.where(
			and(
				inArray(fundApplications.workflowStage, [
					'AWAITING_CONFIRMATION',
					'CONFIRMED',
					'REGISTRATION_IN_PROGRESS',
				]),
				isNotNull(fundApplications.raceDate),
				sql`${fundApplications.raceDate} < ${todayMysql}`,
			),
		)

	for (const application of stalePreRaceApplications) {
		await transitionFundWorkflow({
			applicationId: application.id,
			toStage: 'CLOSED',
			actor: {
				actorRole: 'SYSTEM',
			},
			metadata: {
				autoClosedReason: 'race_date_passed_before_completion',
				closedReason: 'Race date passed before application completed.',
				effectiveDate: today.toISOString(),
			},
			sendEmail: false,
		})
	}

	return {
		transitionedToNoLongerActive: staleActiveApplications.length,
		transitionedToClosed: stalePreRaceApplications.length,
		mentorshipsEnded: await endPastRaceMentorships(todayMysql),
	}
}

/**
 * End mentorship matches where the athlete's race date has passed.
 * Also syncs mentor stages so mentors with no remaining open matches
 * move back to APPROVED_POOL.
 */
async function endPastRaceMentorships(todayMysql: string) {
	const staleMatches = await db
		.select({
			matchId: mentorshipMatches.id,
			mentorApplicationId: mentorshipMatches.mentorApplicationId,
		})
		.from(mentorshipMatches)
		.innerJoin(
			fundApplications,
			eq(mentorshipMatches.fundApplicationId, fundApplications.id),
		)
		.where(
			and(
				isNull(mentorshipMatches.endedAt),
				isNotNull(fundApplications.raceDate),
				sql`${fundApplications.raceDate} < ${todayMysql}`,
			),
		)

	if (staleMatches.length === 0) return 0

	const now = new Date()
	const affectedMentorIds = new Set<string>()

	for (const match of staleMatches) {
		await db
			.update(mentorshipMatches)
			.set({ endedAt: now, updatedAt: now })
			.where(eq(mentorshipMatches.id, match.matchId))
		affectedMentorIds.add(match.mentorApplicationId)
	}

	for (const mentorId of affectedMentorIds) {
		await syncMentorStageWithOpenMatches(mentorId, { actorRole: 'SYSTEM' })
	}

	return staleMatches.length
}

export function getAvailableFundTransitions(
	stage: FundWorkflowStage,
): WorkflowTransition[] {
	return FUND_TRANSITIONS[stage] ?? []
}

export function getAvailableMentorTransitions(
	stage: MentorWorkflowStage,
): WorkflowTransition[] {
	return MENTOR_TRANSITIONS[stage] ?? []
}

export function canAssignMentorToFundApplicationStage(
	stage: FundWorkflowStage,
) {
	return FUND_MENTOR_ASSIGNABLE_STAGES.includes(stage)
}

function normalizeGenderForPreference(value: string | null | undefined) {
	const normalized = (value || '').trim().toLowerCase()
	if (!normalized) return null
	if (
		normalized === 'prefer not to answer' ||
		normalized === 'self-describe' ||
		normalized === 'not specified'
	) {
		return null
	}
	return normalized
}

function normalizeGenderPreference(value: string | null | undefined) {
	const normalized = (value || '').trim().toLowerCase()
	if (normalized === 'same-gender') return 'same-gender' as const
	return 'no-preference' as const
}

function evaluateMentorAssignmentCompatibility(input: {
	athleteGenderIdentity: string | null | undefined
	athleteMentorPreference: string | null | undefined
	mentorGenderIdentity: string | null | undefined
	mentorMenteePreference: string | null | undefined
}) {
	const athleteGender = normalizeGenderForPreference(input.athleteGenderIdentity)
	const mentorGender = normalizeGenderForPreference(input.mentorGenderIdentity)
	const athletePreference = normalizeGenderPreference(
		input.athleteMentorPreference,
	)
	const mentorPreference = normalizeGenderPreference(input.mentorMenteePreference)

	const requiresSameGender =
		athletePreference === 'same-gender' || mentorPreference === 'same-gender'
	const sameKnownGender =
		Boolean(athleteGender) &&
		Boolean(mentorGender) &&
		athleteGender === mentorGender

	if (!requiresSameGender) {
		return {
			status: 'aligned' as const,
			label: 'Preference match',
			summary: 'No gender preference conflicts detected.',
			details: [],
			requiresPreferenceOverride: false,
			hiddenByDefault: false,
		}
	}

	if (!athleteGender || !mentorGender) {
		const details: string[] = []
		if (athletePreference === 'same-gender') {
			details.push(
				'Athlete prefers a same-gender mentor, but one or both gender identities are unavailable.',
			)
		}
		if (mentorPreference === 'same-gender') {
			details.push(
				'Mentor prefers to support someone who shares their gender identity, but one or both gender identities are unavailable.',
			)
		}

		return {
			status: 'needs_review' as const,
			label: 'Needs review',
			summary:
				'Same-gender preferences exist, but this match cannot be auto-verified from the available profile data.',
			details,
			requiresPreferenceOverride: false,
			hiddenByDefault: false,
		}
	}

	if (sameKnownGender) {
		const details: string[] = []
		if (athletePreference === 'same-gender') {
			details.push('Athlete same-gender preference is respected.')
		}
		if (mentorPreference === 'same-gender') {
			details.push('Mentor same-gender preference is respected.')
		}

		return {
			status: 'aligned' as const,
			label: 'Preference match',
			summary: 'This pairing respects the stated gender preferences.',
			details,
			requiresPreferenceOverride: false,
			hiddenByDefault: false,
		}
	}

	const details: string[] = []
	if (athletePreference === 'same-gender') {
		details.push('Athlete asked for a mentor who shares their gender identity.')
	}
	if (mentorPreference === 'same-gender') {
		details.push(
			'Mentor asked to support athletes who share their gender identity.',
		)
	}

	return {
		status: 'conflict' as const,
		label: 'Preference conflict',
		summary:
			'This pairing would go against at least one stated same-gender preference.',
		details,
		requiresPreferenceOverride: true,
		hiddenByDefault: true,
	}
}

async function getOpenMentorMatchCount(mentorApplicationId: string) {
	const rows = await db
		.select({
			value: sql<number>`count(*)`.mapWith(Number),
		})
		.from(mentorshipMatches)
		.where(
			and(
				eq(mentorshipMatches.mentorApplicationId, mentorApplicationId),
				isNull(mentorshipMatches.endedAt),
			),
		)

	return rows[0]?.value ?? 0
}

async function syncMentorStageWithOpenMatches(
	mentorApplicationId: string,
	actor: WorkflowActor,
) {
	const [mentor] = await db
		.select({
			workflowStage: mentorApplications.workflowStage,
		})
		.from(mentorApplications)
		.where(eq(mentorApplications.id, mentorApplicationId))
		.limit(1)

	if (!mentor) return

	const stage =
		(mentor.workflowStage || 'SUBMITTED') as MentorWorkflowStage
	const openMatchCount = await getOpenMentorMatchCount(mentorApplicationId)

	if (
		openMatchCount > 0 &&
		(stage === 'APPROVED_POOL' || stage === 'MATCH_PENDING')
	) {
		await transitionMentorWorkflow({
			applicationId: mentorApplicationId,
			toStage: 'MATCHED',
			actor,
			metadata: {
				syncReason: 'open_match_created',
			},
			sendEmail: false,
		})
		return
	}

	if (
		openMatchCount === 0 &&
		(stage === 'MATCH_PENDING' || stage === 'MATCHED')
	) {
		await transitionMentorWorkflow({
			applicationId: mentorApplicationId,
			toStage: 'APPROVED_POOL',
			actor,
			metadata: {
				syncReason: 'open_matches_cleared',
			},
			sendEmail: false,
		})
	}
}

export async function getFundMentorAssignmentContext(
	fundApplicationId: string,
): Promise<FundMentorAssignmentContext> {
	const [fundApplication] = await db
		.select({
			genderIdentity: fundApplications.genderIdentity,
			mentorGenderPreference: fundApplications.mentorGenderPreference,
		})
		.from(fundApplications)
		.where(eq(fundApplications.id, fundApplicationId))
		.limit(1)

	if (!fundApplication) {
		return {
			currentMatch: null,
			mentorOptions: [],
			hiddenConflictCount: 0,
		}
	}

	const mentorRows = await db
		.select({
			applicationId: mentorApplications.id,
			userId: mentorApplications.userId,
			name: mentorApplications.name,
			email: mentorApplications.email,
			workflowStage: mentorApplications.workflowStage,
			genderIdentity: mentorApplications.genderIdentity,
			mentorGenderPreference: mentorApplications.mentorGenderPreference,
			locationRegion: users.locationRegion,
			specialExpertise: mentorApplications.specialExpertise,
			preferredCommunicationStyle:
				mentorApplications.preferredCommunicationStyle,
			profileImageUrl: users.profileImageUrl,
			clerkId: users.clerkId,
		})
		.from(mentorApplications)
		.leftJoin(users, eq(users.id, mentorApplications.userId))
		.where(
			and(
				eq(mentorApplications.status, 'APPROVED'),
				inArray(mentorApplications.workflowStage, ACTIVE_MENTOR_POOL_STAGES),
			),
		)

	const [currentMatchRow] = await db
		.select({
			matchId: mentorshipMatches.id,
			matchedAt: mentorshipMatches.createdAt,
			applicationId: mentorApplications.id,
			userId: mentorApplications.userId,
			name: mentorApplications.name,
			email: mentorApplications.email,
			workflowStage: mentorApplications.workflowStage,
			genderIdentity: mentorApplications.genderIdentity,
			mentorGenderPreference: mentorApplications.mentorGenderPreference,
			locationRegion: users.locationRegion,
			specialExpertise: mentorApplications.specialExpertise,
			preferredCommunicationStyle:
				mentorApplications.preferredCommunicationStyle,
			profileImageUrl: users.profileImageUrl,
			clerkId: users.clerkId,
		})
		.from(mentorshipMatches)
		.innerJoin(
			mentorApplications,
			eq(mentorApplications.id, mentorshipMatches.mentorApplicationId),
		)
		.leftJoin(users, eq(users.id, mentorApplications.userId))
		.where(
			and(
				eq(mentorshipMatches.fundApplicationId, fundApplicationId),
				isNull(mentorshipMatches.endedAt),
			),
		)
		.orderBy(desc(mentorshipMatches.createdAt))
		.limit(1)

	const loadRows = await db
		.select({
			mentorApplicationId: mentorshipMatches.mentorApplicationId,
			value: sql<number>`count(*)`.mapWith(Number),
		})
		.from(mentorshipMatches)
		.where(isNull(mentorshipMatches.endedAt))
		.groupBy(mentorshipMatches.mentorApplicationId)

	const loadByMentorId = new Map(
		loadRows.map((row) => [row.mentorApplicationId, row.value]),
	)

	const mentorRowsById = new Map(
		mentorRows.map((row) => [row.applicationId, row]),
	)

	if (currentMatchRow && !mentorRowsById.has(currentMatchRow.applicationId)) {
		mentorRowsById.set(currentMatchRow.applicationId, currentMatchRow)
	}

	const mentorOptions = await Promise.all(
		Array.from(mentorRowsById.values()).map(async (row) => {
			const stage = (row.workflowStage || 'SUBMITTED') as MentorWorkflowStage
			const avatarUrl =
				row.profileImageUrl || (await getAvatarUrlFromClerkId(row.clerkId))
			const compatibility = evaluateMentorAssignmentCompatibility({
				athleteGenderIdentity: fundApplication.genderIdentity,
				athleteMentorPreference: fundApplication.mentorGenderPreference,
				mentorGenderIdentity: row.genderIdentity,
				mentorMenteePreference: row.mentorGenderPreference,
			})

			return {
				applicationId: row.applicationId,
				userId: row.userId,
				name: row.name,
				email: row.email,
				workflowStage: row.workflowStage,
				workflowStageLabel: MENTOR_WORKFLOW_LABELS[stage] || row.workflowStage,
				genderIdentity: row.genderIdentity,
				locationRegion: row.locationRegion,
				specialExpertise: row.specialExpertise,
				preferredCommunicationStyle: row.preferredCommunicationStyle,
				avatarUrl,
				assignedAthleteCount: loadByMentorId.get(row.applicationId) ?? 0,
				isCurrentMatch: row.applicationId === currentMatchRow?.applicationId,
				isAssignable: ACTIVE_MENTOR_POOL_STAGES.includes(stage),
				matchedAt:
					row.applicationId === currentMatchRow?.applicationId
						? currentMatchRow.matchedAt
						: null,
				compatibilityStatus: compatibility.status,
				compatibilityLabel: compatibility.label,
				compatibilitySummary: compatibility.summary,
				compatibilityDetails: compatibility.details,
				requiresPreferenceOverride: compatibility.requiresPreferenceOverride,
				hiddenByDefault: compatibility.hiddenByDefault,
			}
		}),
	)

	mentorOptions.sort((left, right) => {
		if (left.isCurrentMatch !== right.isCurrentMatch) {
			return left.isCurrentMatch ? -1 : 1
		}

		const compatibilityRank = {
			aligned: 0,
			needs_review: 1,
			conflict: 2,
		}
		if (
			compatibilityRank[left.compatibilityStatus] !==
			compatibilityRank[right.compatibilityStatus]
		) {
			return (
				compatibilityRank[left.compatibilityStatus] -
				compatibilityRank[right.compatibilityStatus]
			)
		}

		if (left.assignedAthleteCount !== right.assignedAthleteCount) {
			return left.assignedAthleteCount - right.assignedAthleteCount
		}

		return left.name.localeCompare(right.name)
	})

	return {
		currentMatch:
			mentorOptions.find((option) => option.isCurrentMatch) ?? null,
		mentorOptions,
		hiddenConflictCount: mentorOptions.filter(
			(option) => option.hiddenByDefault && !option.isCurrentMatch,
		).length,
	}
}

export async function assignMentorToFundApplication(input: {
	fundApplicationId: string
	mentorApplicationId: string
	actor: WorkflowActor
	allowPreferenceOverride?: boolean
}) {
	const [fundApplication] = await db
		.select({
			id: fundApplications.id,
			userId: fundApplications.userId,
			name: fundApplications.name,
			wantsMentor: fundApplications.wantsMentor,
			workflowStage: fundApplications.workflowStage,
			genderIdentity: fundApplications.genderIdentity,
			mentorGenderPreference: fundApplications.mentorGenderPreference,
		})
		.from(fundApplications)
		.where(eq(fundApplications.id, input.fundApplicationId))
		.limit(1)

	if (!fundApplication) {
		return { success: false as const, error: 'Athlete application not found.' }
	}

	const fundStage =
		(fundApplication.workflowStage || 'SUBMITTED') as FundWorkflowStage
	if (!canAssignMentorToFundApplicationStage(fundStage)) {
		return {
			success: false as const,
			error:
				'Mentor pairing is only available after the athlete has been approved.',
		}
	}

	const [mentorApplication] = await db
		.select({
			id: mentorApplications.id,
			userId: mentorApplications.userId,
			name: mentorApplications.name,
			status: mentorApplications.status,
			workflowStage: mentorApplications.workflowStage,
			genderIdentity: mentorApplications.genderIdentity,
			mentorGenderPreference: mentorApplications.mentorGenderPreference,
		})
		.from(mentorApplications)
		.where(eq(mentorApplications.id, input.mentorApplicationId))
		.limit(1)

	if (!mentorApplication) {
		return { success: false as const, error: 'Selected mentor was not found.' }
	}

	const mentorStage =
		(mentorApplication.workflowStage || 'SUBMITTED') as MentorWorkflowStage
	const mentorIsEligible =
		mentorApplication.status === 'APPROVED' &&
		ACTIVE_MENTOR_POOL_STAGES.includes(mentorStage)
	const compatibility = evaluateMentorAssignmentCompatibility({
		athleteGenderIdentity: fundApplication.genderIdentity,
		athleteMentorPreference: fundApplication.mentorGenderPreference,
		mentorGenderIdentity: mentorApplication.genderIdentity,
		mentorMenteePreference: mentorApplication.mentorGenderPreference,
	})

	const [currentMatch] = await db
		.select({
			id: mentorshipMatches.id,
			mentorApplicationId: mentorshipMatches.mentorApplicationId,
		})
		.from(mentorshipMatches)
		.where(
			and(
				eq(mentorshipMatches.fundApplicationId, input.fundApplicationId),
				isNull(mentorshipMatches.endedAt),
			),
		)
		.orderBy(desc(mentorshipMatches.createdAt))
		.limit(1)

	if (currentMatch?.mentorApplicationId === input.mentorApplicationId) {
		await syncMentorStageWithOpenMatches(input.mentorApplicationId, input.actor)

		return {
			success: true as const,
			changed: false,
			mentorApplicationId: input.mentorApplicationId,
			previousMentorApplicationId: null,
		}
	}

	if (!mentorIsEligible) {
		return {
			success: false as const,
			error: 'Selected mentor is not currently in the active mentor pool.',
		}
	}

	if (
		compatibility.requiresPreferenceOverride &&
		input.allowPreferenceOverride !== true
	) {
		return {
			success: false as const,
			error:
				'This pairing conflicts with a stated same-gender preference. Review the warning and confirm the override before saving.',
		}
	}

	if (mentorApplication.userId === fundApplication.userId) {
		return {
			success: false as const,
			error:
				'An athlete cannot be matched to their own mentor application.',
		}
	}

	const now = new Date()
	const previousMentorApplicationId = currentMatch?.mentorApplicationId ?? null

	if (currentMatch) {
		await db
			.update(mentorshipMatches)
			.set({
				endedAt: now,
				updatedAt: now,
			})
			.where(eq(mentorshipMatches.id, currentMatch.id))
	}

	await db.insert(mentorshipMatches).values({
		fundApplicationId: input.fundApplicationId,
		mentorApplicationId: input.mentorApplicationId,
		adminNotes: fundApplication.wantsMentor
			? 'Assigned via admin athlete detail page.'
			: 'Assigned via admin athlete detail page; athlete did not explicitly request mentorship.',
	})

	await Promise.all([
		markTasksByType('FUND', input.fundApplicationId, ['MATCH_MENTOR'], 'DONE'),
		markTasksByType('MENTOR', input.mentorApplicationId, ['MATCH_MENTOR'], 'DONE'),
		logEvent({
			applicationId: input.fundApplicationId,
			applicationType: 'FUND',
			eventType: currentMatch
				? 'MENTOR_MATCH_UPDATED'
				: 'MENTOR_MATCH_CREATED',
			fromStage: fundStage,
			toStage: fundStage,
			actor: input.actor,
			payload: {
				mentorApplicationId: input.mentorApplicationId,
				previousMentorApplicationId,
				athleteRequestedMentor: fundApplication.wantsMentor,
				preferenceCompatibility: compatibility.status,
				preferenceOverrideApplied:
					compatibility.requiresPreferenceOverride &&
					input.allowPreferenceOverride === true,
			},
		}),
		logEvent({
			applicationId: input.mentorApplicationId,
			applicationType: 'MENTOR',
			eventType: 'MENTOR_ASSIGNED_TO_ATHLETE',
			fromStage: mentorStage,
			toStage: mentorStage,
			actor: input.actor,
			payload: {
				fundApplicationId: input.fundApplicationId,
				replacedExistingMentor: Boolean(currentMatch),
				preferenceCompatibility: compatibility.status,
			},
		}),
		previousMentorApplicationId
			? logEvent({
					applicationId: previousMentorApplicationId,
					applicationType: 'MENTOR',
					eventType: 'MENTOR_UNASSIGNED_FROM_ATHLETE',
					actor: input.actor,
					payload: {
						fundApplicationId: input.fundApplicationId,
						reassignedToMentorApplicationId: input.mentorApplicationId,
					},
				})
			: Promise.resolve(),
	])

	await syncMentorStageWithOpenMatches(input.mentorApplicationId, input.actor)

	if (
		previousMentorApplicationId &&
		previousMentorApplicationId !== input.mentorApplicationId
	) {
		await syncMentorStageWithOpenMatches(
			previousMentorApplicationId,
			input.actor,
		)
	}

	return {
		success: true as const,
		changed: true,
		mentorApplicationId: input.mentorApplicationId,
		previousMentorApplicationId,
	}
}

export async function removeMentorFromFundApplication(input: {
	fundApplicationId: string
	actor: WorkflowActor
}) {
	const [currentMatch] = await db
		.select({
			id: mentorshipMatches.id,
			mentorApplicationId: mentorshipMatches.mentorApplicationId,
		})
		.from(mentorshipMatches)
		.where(
			and(
				eq(mentorshipMatches.fundApplicationId, input.fundApplicationId),
				isNull(mentorshipMatches.endedAt),
			),
		)
		.orderBy(desc(mentorshipMatches.createdAt))
		.limit(1)

	if (!currentMatch) {
		return { success: false as const, error: 'No active mentor pairing found.' }
	}

	const now = new Date()

	await db
		.update(mentorshipMatches)
		.set({ endedAt: now, updatedAt: now })
		.where(eq(mentorshipMatches.id, currentMatch.id))

	await Promise.all([
		logEvent({
			applicationId: input.fundApplicationId,
			applicationType: 'FUND',
			eventType: 'MENTOR_MATCH_REMOVED',
			actor: input.actor,
			payload: {
				mentorApplicationId: currentMatch.mentorApplicationId,
				reason: 'Admin removed mentor pairing.',
			},
		}),
		logEvent({
			applicationId: currentMatch.mentorApplicationId,
			applicationType: 'MENTOR',
			eventType: 'MENTOR_UNASSIGNED_FROM_ATHLETE',
			actor: input.actor,
			payload: {
				fundApplicationId: input.fundApplicationId,
				reason: 'Admin removed mentor pairing.',
			},
		}),
	])

	await syncMentorStageWithOpenMatches(
		currentMatch.mentorApplicationId,
		input.actor,
	)

	return {
		success: true as const,
		mentorApplicationId: currentMatch.mentorApplicationId,
	}
}

function computeFundLegacyFields(input: {
	currentStatus: string
	currentRegistrationStatus: string
	toStage: FundWorkflowStage
	metadata?: Record<string, unknown>
}) {
	const next: {
		status?: 'PENDING' | 'APPROVED' | 'WAITLISTED' | 'REJECTED'
		registrationStatus?:
			| 'PENDING'
			| 'SELF_REGISTERED'
			| 'ADMIN_REGISTERED'
			| 'COMPLETED'
	} = {}

	switch (input.toStage) {
		case 'WAITLISTED':
			next.status = 'WAITLISTED'
			break
		case 'DECLINED':
			next.status = 'REJECTED'
			break
		case 'AWAITING_CONFIRMATION':
		case 'CONFIRMED':
		case 'REGISTRATION_IN_PROGRESS':
		case 'REGISTERED':
		case 'ONBOARDING_IN_PROGRESS':
		case 'ACTIVE_IN_PROGRAM':
		case 'NO_LONGER_ACTIVE':
		case 'NO_SHOW_OR_DROPPED':
			next.status = 'APPROVED'
			break
		case 'SUBMITTED':
		case 'IN_REVIEW':
			next.status = 'PENDING'
			break
		case 'CLOSED':
			break
	}

	if (
		input.toStage === 'REGISTERED' ||
		input.toStage === 'ONBOARDING_IN_PROGRESS' ||
		input.toStage === 'ACTIVE_IN_PROGRAM' ||
		input.toStage === 'NO_SHOW_OR_DROPPED'
	) {
		const requested = String(input.metadata?.registrationStatus || '').toUpperCase()
		next.registrationStatus =
			requested === 'SELF_REGISTERED'
				? 'SELF_REGISTERED'
				: requested === 'ADMIN_REGISTERED'
					? 'ADMIN_REGISTERED'
					: input.currentRegistrationStatus === 'SELF_REGISTERED'
						? 'SELF_REGISTERED'
						: input.currentRegistrationStatus === 'ADMIN_REGISTERED'
							? 'ADMIN_REGISTERED'
							: 'ADMIN_REGISTERED'
	} else if (
		input.toStage === 'NO_LONGER_ACTIVE' ||
		(input.toStage === 'CLOSED' && input.currentStatus === 'APPROVED')
	) {
		next.registrationStatus = 'COMPLETED'
	} else if (
		input.toStage === 'SUBMITTED' ||
		input.toStage === 'IN_REVIEW' ||
		input.toStage === 'AWAITING_CONFIRMATION' ||
		input.toStage === 'CONFIRMED' ||
		input.toStage === 'REGISTRATION_IN_PROGRESS'
	) {
		if (
			input.currentRegistrationStatus !== 'SELF_REGISTERED' &&
			input.currentRegistrationStatus !== 'ADMIN_REGISTERED'
		) {
			next.registrationStatus = 'PENDING'
		}
	}

	return next
}

async function sendFundTransitionEmail(input: {
	applicationId: string
	toStage: FundWorkflowStage
	application: typeof fundApplications.$inferSelect
}) {
	const toStageToStatus: Partial<Record<FundWorkflowStage, 'APPROVED' | 'WAITLISTED' | 'REJECTED'>> = {
		AWAITING_CONFIRMATION: 'APPROVED',
		WAITLISTED: 'WAITLISTED',
		DECLINED: 'REJECTED',
	}
	const status = toStageToStatus[input.toStage]
	if (!status) return { success: true as const }

	return sendApplicationEmail({
		applicationType: 'FUND',
		applicationId: input.applicationId,
		mode: 'STANDARD',
		status,
		category: 'STATUS',
		tokens: {
			applicantName: input.application.name,
			firstName: input.application.name?.split(' ')[0],
			recipientEmail: input.application.email,
			raceName: input.application.race,
			raceDate: input.application.raceDate
				? new Date(input.application.raceDate).toLocaleDateString('en-US', {
						weekday: 'long',
						year: 'numeric',
						month: 'long',
						day: 'numeric',
					})
				: undefined,
			raceLocation: input.application.raceLocation ?? undefined,
			wantsMentor: input.application.wantsMentor,
			registrationMode: 'ORG_REGISTERS',
		},
	})
}

async function sendMentorTransitionEmail(input: {
	applicationId: string
	toStage: MentorWorkflowStage
	application: typeof mentorApplications.$inferSelect
}) {
	const toStageToStatus: Partial<
		Record<MentorWorkflowStage, 'APPROVED' | 'WAITLISTED' | 'REJECTED'>
	> = {
		APPROVED_POOL: 'APPROVED',
		WAITLISTED: 'WAITLISTED',
		DECLINED: 'REJECTED',
	}
	const status = toStageToStatus[input.toStage]
	if (!status) return { success: true as const }

	return sendApplicationEmail({
		applicationType: 'MENTOR',
		applicationId: input.applicationId,
		mode: 'STANDARD',
		status,
		category: 'STATUS',
		tokens: {
			applicantName: input.application.name,
			firstName: input.application.name?.split(' ')[0],
			recipientEmail: input.application.email,
		},
	})
}

export async function transitionFundWorkflow(input: {
	applicationId: string
	toStage: FundWorkflowStage
	actor: WorkflowActor
	metadata?: Record<string, unknown>
	sendEmail?: boolean
}) {
	const [application] = await db
		.select()
		.from(fundApplications)
		.where(eq(fundApplications.id, input.applicationId))
		.limit(1)

	if (!application) {
		return { success: false as const, error: 'Application not found' }
	}

	const fromStage = (application.workflowStage || 'SUBMITTED') as FundWorkflowStage
	const allowed = getAvailableFundTransitions(fromStage)
	const canTransition = allowed.some((t) => t.toStage === input.toStage)
	if (!canTransition) {
		return {
			success: false as const,
			error: `Invalid transition: ${fromStage} -> ${input.toStage}`,
		}
	}

	const now = new Date()
	const updates: Partial<typeof fundApplications.$inferInsert> = {
		workflowStage: input.toStage,
		updatedAt: now,
	}

	const legacy = computeFundLegacyFields({
		currentStatus: application.status,
		currentRegistrationStatus: application.registrationStatus,
		toStage: input.toStage,
		metadata: input.metadata,
	})
	if (legacy.status) updates.status = legacy.status
	if (legacy.registrationStatus) updates.registrationStatus = legacy.registrationStatus

	if (
		(input.toStage === 'WAITLISTED' || input.toStage === 'DECLINED') &&
		!application.decisionAt
	) {
		updates.decisionAt = now
	}
	if (input.toStage === 'AWAITING_CONFIRMATION') {
		updates.decisionAt = application.decisionAt ?? now
		updates.offerSentAt = now
		updates.confirmationDeadlineAt = new Date(now.getTime() + 72 * 60 * 60 * 1000)
	}
	if (input.toStage === 'CONFIRMED') {
		updates.confirmedAt = now
	}
	if (input.toStage === 'REGISTRATION_IN_PROGRESS') {
		updates.registrationStartedAt = now
	}
	if (input.toStage === 'REGISTERED') {
		updates.registeredAt = now
	}
	if (input.toStage === 'ONBOARDING_IN_PROGRESS') {
		updates.onboardingStartedAt = now
	}
	if (input.toStage === 'ACTIVE_IN_PROGRAM') {
		updates.activatedAt = now
	}
	if (input.toStage === 'CLOSED') {
		updates.closedAt = now
		const reason = input.metadata?.closedReason
		if (typeof reason === 'string' && reason.trim().length > 0) {
			updates.closedReason = reason.trim()
		}
	}

	await db
		.update(fundApplications)
		.set(updates)
		.where(eq(fundApplications.id, input.applicationId))

	const postUpdateOps: Promise<unknown>[] = []

	postUpdateOps.push(
		logEvent({
			applicationId: input.applicationId,
			applicationType: 'FUND',
			eventType: 'WORKFLOW_STAGE_CHANGED',
			fromStage,
			toStage: input.toStage,
			actor: input.actor,
			payload: {
				metadata: input.metadata ?? null,
				legacy,
			},
		}),
	)

	if (input.toStage === 'IN_REVIEW') {
		postUpdateOps.push(
			ensureOpenTask({
				applicationId: input.applicationId,
				applicationType: 'FUND',
				taskType: 'REVIEW_APPLICATION',
				title: 'Review athlete application',
				description:
					'Review application details and decide: approve, waitlist, or decline.',
				priority: 'HIGH',
			}),
		)
	}

	if (input.toStage === 'AWAITING_CONFIRMATION') {
		postUpdateOps.push(
			markTasksByType('FUND', input.applicationId, ['REVIEW_APPLICATION'], 'DONE'),
			ensureOpenTask({
				applicationId: input.applicationId,
				applicationType: 'FUND',
				taskType: 'WAIT_FOR_CONFIRMATION',
				title: 'Await athlete confirmation',
				description:
					'Athlete must confirm participation before registration can proceed.',
				priority: 'HIGH',
				dueAt: updates.confirmationDeadlineAt ?? null,
			}),
		)
	}

	if (input.toStage === 'CONFIRMED') {
		postUpdateOps.push(
			markTasksByType('FUND', input.applicationId, ['WAIT_FOR_CONFIRMATION'], 'DONE'),
			ensureOpenTask({
				applicationId: input.applicationId,
				applicationType: 'FUND',
				taskType: 'REGISTER_ATHLETE',
				title: 'Register athlete in race platform',
				description:
					'Complete race registration in UltraSignup (or partner platform).',
				priority: 'HIGH',
			}),
		)
	}

	if (input.toStage === 'REGISTRATION_IN_PROGRESS') {
		postUpdateOps.push(
			ensureOpenTask({
				applicationId: input.applicationId,
				applicationType: 'FUND',
				taskType: 'REGISTER_ATHLETE',
				title: 'Register athlete in race platform',
				description:
					'Complete race registration in UltraSignup (or partner platform).',
				priority: 'HIGH',
			}),
		)
	}

	if (input.toStage === 'REGISTERED') {
		postUpdateOps.push(
			markTasksByType('FUND', input.applicationId, ['REGISTER_ATHLETE'], 'DONE'),
			ensureOpenTask({
				applicationId: input.applicationId,
				applicationType: 'FUND',
				taskType: 'ONBOARD_ATHLETE',
				title: 'Onboard athlete to community',
				description:
					'Send registration confirmation, Slack onboarding, and intro guidance.',
				priority: 'HIGH',
			}),
		)

		if (application.wantsMentor) {
			postUpdateOps.push(
				ensureOpenTask({
					applicationId: input.applicationId,
					applicationType: 'FUND',
					taskType: 'MATCH_MENTOR',
					title: 'Create mentor match',
					description: 'Pair athlete with an approved mentor.',
					priority: 'MEDIUM',
				}),
			)
		}
	}

	if (input.toStage === 'ONBOARDING_IN_PROGRESS') {
		postUpdateOps.push(
			ensureOpenTask({
				applicationId: input.applicationId,
				applicationType: 'FUND',
				taskType: 'ONBOARD_ATHLETE',
				title: 'Onboard athlete to community',
				description:
					'Send registration confirmation, Slack onboarding, and intro guidance.',
				priority: 'HIGH',
			}),
		)
	}

	if (input.toStage === 'ACTIVE_IN_PROGRAM') {
		postUpdateOps.push(
			markTasksByType(
				'FUND',
				input.applicationId,
				['ONBOARD_ATHLETE', 'MATCH_MENTOR'],
				'DONE',
			),
		)
	}

	if (
		input.toStage === 'WAITLISTED' ||
		input.toStage === 'DECLINED' ||
		input.toStage === 'NO_LONGER_ACTIVE' ||
		input.toStage === 'NO_SHOW_OR_DROPPED' ||
		input.toStage === 'CLOSED'
	) {
		postUpdateOps.push(cancelAllOpenTasks('FUND', input.applicationId))
	}

	if (input.sendEmail) {
		postUpdateOps.push(
			sendFundTransitionEmail({
				applicationId: input.applicationId,
				toStage: input.toStage,
				application: {
					...application,
					status: legacy.status ?? application.status,
				},
			}).then((emailResult) => {
				if (!emailResult.success) {
					return logEvent({
						applicationId: input.applicationId,
						applicationType: 'FUND',
						eventType: 'WORKFLOW_EMAIL_FAILED',
						fromStage: input.toStage,
						toStage: input.toStage,
						actor: input.actor,
						payload: { error: emailResult.error },
					})
				}
			}),
		)
	}

	await Promise.all(postUpdateOps)

	return {
		success: true as const,
		fromStage,
		toStage: input.toStage,
		label: FUND_WORKFLOW_LABELS[input.toStage],
	}
}

export async function transitionMentorWorkflow(input: {
	applicationId: string
	toStage: MentorWorkflowStage
	actor: WorkflowActor
	metadata?: Record<string, unknown>
	sendEmail?: boolean
}) {
	const [application] = await db
		.select()
		.from(mentorApplications)
		.where(eq(mentorApplications.id, input.applicationId))
		.limit(1)

	if (!application) {
		return { success: false as const, error: 'Mentor application not found' }
	}

	const fromStage = (application.workflowStage || 'SUBMITTED') as MentorWorkflowStage
	const allowed = getAvailableMentorTransitions(fromStage)
	const canTransition = allowed.some((t) => t.toStage === input.toStage)
	if (!canTransition) {
		return {
			success: false as const,
			error: `Invalid transition: ${fromStage} -> ${input.toStage}`,
		}
	}

	const now = new Date()
	const updates: Partial<typeof mentorApplications.$inferInsert> = {
		workflowStage: input.toStage,
		updatedAt: now,
	}

	if (input.toStage === 'APPROVED_POOL') {
		updates.status = 'APPROVED'
		updates.decisionAt = application.decisionAt ?? now
		updates.approvedAt = now
	}
	if (input.toStage === 'WAITLISTED') {
		updates.status = 'WAITLISTED'
		updates.decisionAt = application.decisionAt ?? now
	}
	if (input.toStage === 'DECLINED') {
		updates.status = 'REJECTED'
		updates.decisionAt = application.decisionAt ?? now
	}
	if (input.toStage === 'IN_REVIEW' || input.toStage === 'SUBMITTED') {
		updates.status = 'PENDING'
	}
	if (input.toStage === 'MATCHED') {
		updates.matchedAt = now
	}
	if (input.toStage === 'ACTIVE') {
		updates.activatedAt = now
	}
	if (input.toStage === 'CLOSED') {
		updates.closedAt = now
		const reason = input.metadata?.closedReason
		if (typeof reason === 'string' && reason.trim().length > 0) {
			updates.closedReason = reason.trim()
		}
	}

	await db
		.update(mentorApplications)
		.set(updates)
		.where(eq(mentorApplications.id, input.applicationId))

	const postUpdateOps: Promise<unknown>[] = []

	postUpdateOps.push(
		logEvent({
			applicationId: input.applicationId,
			applicationType: 'MENTOR',
			eventType: 'WORKFLOW_STAGE_CHANGED',
			fromStage,
			toStage: input.toStage,
			actor: input.actor,
			payload: {
				metadata: input.metadata ?? null,
			},
		}),
	)

	if (input.toStage === 'IN_REVIEW') {
		postUpdateOps.push(
			ensureOpenTask({
				applicationId: input.applicationId,
				applicationType: 'MENTOR',
				taskType: 'REVIEW_APPLICATION',
				title: 'Review mentor application',
				description:
					'Review mentor application and decide: approve to pool, waitlist, or decline.',
				priority: 'HIGH',
			}),
		)
	}

	if (input.toStage === 'APPROVED_POOL') {
		postUpdateOps.push(
			markTasksByType('MENTOR', input.applicationId, ['REVIEW_APPLICATION'], 'DONE'),
			ensureOpenTask({
				applicationId: input.applicationId,
				applicationType: 'MENTOR',
				taskType: 'MATCH_MENTOR',
				title: 'Match mentor with athlete',
				description:
					'Assign this mentor to a confirmed athlete requesting mentorship.',
				priority: 'MEDIUM',
			}),
		)
	}

	if (input.toStage === 'MATCHED' || input.toStage === 'ACTIVE') {
		postUpdateOps.push(
			markTasksByType('MENTOR', input.applicationId, ['MATCH_MENTOR'], 'DONE'),
		)
	}

	if (
		input.toStage === 'WAITLISTED' ||
		input.toStage === 'DECLINED' ||
		input.toStage === 'CLOSED'
	) {
		postUpdateOps.push(cancelAllOpenTasks('MENTOR', input.applicationId))
	}

	if (input.sendEmail) {
		postUpdateOps.push(
			sendMentorTransitionEmail({
				applicationId: input.applicationId,
				toStage: input.toStage,
				application: {
					...application,
					status: updates.status ?? application.status,
				},
			}).then((emailResult) => {
				if (!emailResult.success) {
					return logEvent({
						applicationId: input.applicationId,
						applicationType: 'MENTOR',
						eventType: 'WORKFLOW_EMAIL_FAILED',
						fromStage: input.toStage,
						toStage: input.toStage,
						actor: input.actor,
						payload: { error: emailResult.error },
					})
				}
			}),
		)
	}

	await Promise.all(postUpdateOps)

	return {
		success: true as const,
		fromStage,
		toStage: input.toStage,
		label: MENTOR_WORKFLOW_LABELS[input.toStage],
	}
}

export async function getFundWorkflowContext(applicationId: string) {
	const [application] = await db
		.select()
		.from(fundApplications)
		.where(eq(fundApplications.id, applicationId))
		.limit(1)
	if (!application) return null

	const events = await db
		.select()
		.from(applicationEvents)
		.where(
			and(
				eq(applicationEvents.applicationType, 'FUND'),
				eq(applicationEvents.applicationId, applicationId),
			),
		)

	const normalizedEvents = events
		.slice()
		.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
		.map((event) => ({
			...event,
			payloadObject: parseJsonPayload(event.payload),
		}))

	const stage = (application.workflowStage || 'SUBMITTED') as FundWorkflowStage
	return {
		application,
		stage,
		events: normalizedEvents,
	}
}

export async function getMentorWorkflowContext(applicationId: string) {
	const [application] = await db
		.select()
		.from(mentorApplications)
		.where(eq(mentorApplications.id, applicationId))
		.limit(1)
	if (!application) return null

	const tasks = await db
		.select()
		.from(applicationTasks)
		.where(
			and(
				eq(applicationTasks.applicationType, 'MENTOR'),
				eq(applicationTasks.applicationId, applicationId),
			),
		)

	const events = await db
		.select()
		.from(applicationEvents)
		.where(
			and(
				eq(applicationEvents.applicationType, 'MENTOR'),
				eq(applicationEvents.applicationId, applicationId),
			),
		)

	const normalizedEvents = events
		.slice()
		.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
		.map((event) => ({
			...event,
			payloadObject: parseJsonPayload(event.payload),
		}))

	const stage =
		(application.workflowStage || 'SUBMITTED') as MentorWorkflowStage
	return {
		application,
		stage,
		transitions: getAvailableMentorTransitions(stage),
		tasks,
		events: normalizedEvents,
	}
}
