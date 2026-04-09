export type WorkflowApplicationType = 'FUND' | 'MENTOR'

export type FundWorkflowStage =
	| 'SUBMITTED'
	| 'IN_REVIEW'
	| 'WAITLISTED'
	| 'DECLINED'
	| 'AWAITING_CONFIRMATION'
	| 'CONFIRMED'
	| 'REGISTRATION_IN_PROGRESS'
	| 'REGISTERED'
	| 'ONBOARDING_IN_PROGRESS'
	| 'ACTIVE_IN_PROGRAM'
	| 'NO_LONGER_ACTIVE'
	| 'NO_SHOW_OR_DROPPED'
	| 'CLOSED'

export type MentorWorkflowStage =
	| 'SUBMITTED'
	| 'IN_REVIEW'
	| 'WAITLISTED'
	| 'DECLINED'
	| 'APPROVED_POOL'
	| 'MATCH_PENDING'
	| 'MATCHED'
	| 'ACTIVE'
	| 'CLOSED'

export type WorkflowTaskStatus = 'OPEN' | 'DONE' | 'CANCELED'
export type WorkflowTaskPriority = 'HIGH' | 'MEDIUM' | 'LOW'

export const FUND_WORKFLOW_STAGES: FundWorkflowStage[] = [
	'SUBMITTED',
	'IN_REVIEW',
	'WAITLISTED',
	'DECLINED',
	'AWAITING_CONFIRMATION',
	'CONFIRMED',
	'REGISTRATION_IN_PROGRESS',
	'REGISTERED',
	'ONBOARDING_IN_PROGRESS',
	'ACTIVE_IN_PROGRAM',
	'NO_LONGER_ACTIVE',
	'NO_SHOW_OR_DROPPED',
	'CLOSED',
]

export const MENTOR_WORKFLOW_STAGES: MentorWorkflowStage[] = [
	'SUBMITTED',
	'IN_REVIEW',
	'WAITLISTED',
	'DECLINED',
	'APPROVED_POOL',
	'MATCH_PENDING',
	'MATCHED',
	'ACTIVE',
	'CLOSED',
]

export const FUND_WORKFLOW_LABELS: Record<FundWorkflowStage, string> = {
	SUBMITTED: 'Submitted',
	IN_REVIEW: 'In Review',
	WAITLISTED: 'Waitlisted',
	DECLINED: 'Declined',
	AWAITING_CONFIRMATION: 'Awaiting Confirmation',
	CONFIRMED: 'Confirmed',
	REGISTRATION_IN_PROGRESS: 'Registration In Progress',
	REGISTERED: 'Registered',
	ONBOARDING_IN_PROGRESS: 'Onboarding In Progress',
	ACTIVE_IN_PROGRAM: 'Active In Program',
	NO_LONGER_ACTIVE: 'No Longer Active',
	NO_SHOW_OR_DROPPED: 'Did Not Start / Dropped',
	CLOSED: 'Closed',
}

export const MENTOR_WORKFLOW_LABELS: Record<MentorWorkflowStage, string> = {
	SUBMITTED: 'Submitted',
	IN_REVIEW: 'In Review',
	WAITLISTED: 'Waitlisted',
	DECLINED: 'Declined',
	APPROVED_POOL: 'Approved Pool',
	MATCH_PENDING: 'Match Pending',
	MATCHED: 'Matched',
	ACTIVE: 'Active',
	CLOSED: 'Closed',
}

export type FundOperationalBucketKey =
	| 'NEEDS_REVIEW'
	| 'WAITING_ON_ATHLETE'
	| 'READY_FOR_REGISTRATION'
	| 'ACTIVE'
	| 'ARCHIVED'
	| 'REJECTED'

export type FundAdminStatusKey = FundOperationalBucketKey

export const FUND_OPERATIONAL_BUCKET_LABELS: Record<
	FundOperationalBucketKey,
	string
> = {
	NEEDS_REVIEW: 'Needs Review',
	WAITING_ON_ATHLETE: 'Awaiting Athlete Confirmation',
	READY_FOR_REGISTRATION: 'Ready for Registration',
	ACTIVE: 'Active',
	ARCHIVED: 'Completed',
	REJECTED: 'Rejected',
}

export function getFundOperationalBucket(
	stage: FundWorkflowStage,
	options?: {
		status?: string | null
	},
): FundOperationalBucketKey {
	switch (stage) {
		case 'SUBMITTED':
		case 'IN_REVIEW':
		case 'WAITLISTED':
			return 'NEEDS_REVIEW'
		case 'AWAITING_CONFIRMATION':
			return 'WAITING_ON_ATHLETE'
		case 'CONFIRMED':
		case 'REGISTRATION_IN_PROGRESS':
			return 'READY_FOR_REGISTRATION'
		case 'REGISTERED':
		case 'ONBOARDING_IN_PROGRESS':
		case 'ACTIVE_IN_PROGRAM':
			return 'ACTIVE'
		case 'NO_LONGER_ACTIVE':
		case 'NO_SHOW_OR_DROPPED':
			return 'ARCHIVED'
		case 'DECLINED':
			return 'REJECTED'
		case 'CLOSED':
			return options?.status === 'APPROVED' ? 'ARCHIVED' : 'REJECTED'
		default:
			return 'REJECTED'
	}
}

export const FUND_ADMIN_STATUS_LABELS = FUND_OPERATIONAL_BUCKET_LABELS

export function getFundAdminStatus(
	stage: FundWorkflowStage,
	options?: {
		status?: string | null
	},
): FundAdminStatusKey {
	return getFundOperationalBucket(stage, options)
}
