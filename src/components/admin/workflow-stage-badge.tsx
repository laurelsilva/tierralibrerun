import {
	type FundAdminStatusKey,
	type FundWorkflowStage,
	type MentorWorkflowStage,
	FUND_ADMIN_STATUS_LABELS,
	FUND_WORKFLOW_LABELS,
	getFundAdminStatus,
	MENTOR_WORKFLOW_LABELS,
} from '@/lib/types/workflow'

type AppType = 'FUND' | 'MENTOR'

type Props = {
	applicationType: AppType
	stage: string
	size?: 'sm' | 'md'
}

type FundAdminStatusBadgeProps = {
	stage: string
	status?: string | null
	size?: 'sm' | 'md'
}

function normalizeFundStage(stage: string): FundWorkflowStage {
	const up = stage.toUpperCase() as FundWorkflowStage
	return up in FUND_WORKFLOW_LABELS ? up : 'SUBMITTED'
}

function normalizeMentorStage(stage: string): MentorWorkflowStage {
	const up = stage.toUpperCase() as MentorWorkflowStage
	return up in MENTOR_WORKFLOW_LABELS ? up : 'SUBMITTED'
}

function classesForFund(stage: FundWorkflowStage) {
	switch (stage) {
		case 'ACTIVE_IN_PROGRAM':
			return 'border-secondary bg-secondary text-secondary-foreground'
		case 'NO_LONGER_ACTIVE':
			return 'border-border bg-muted text-muted-foreground'
		case 'NO_SHOW_OR_DROPPED':
			return 'border-accent bg-accent text-accent-foreground'
		case 'REGISTERED':
		case 'ONBOARDING_IN_PROGRESS':
			return 'border-secondary bg-secondary text-secondary-foreground'
		case 'AWAITING_CONFIRMATION':
		case 'CONFIRMED':
		case 'REGISTRATION_IN_PROGRESS':
			return 'border-primary/30 bg-primary/15 text-primary'
		case 'WAITLISTED':
			return 'border-accent bg-accent text-accent-foreground'
		case 'DECLINED':
		case 'CLOSED':
			return 'border-destructive/30 bg-destructive/15 text-destructive'
		case 'IN_REVIEW':
		case 'SUBMITTED':
		default:
			return 'border-border bg-muted text-muted-foreground'
	}
}

function classesForMentor(stage: MentorWorkflowStage) {
	switch (stage) {
		case 'ACTIVE':
			return 'border-secondary bg-secondary text-secondary-foreground'
		case 'MATCHED':
		case 'MATCH_PENDING':
			return 'border-primary/30 bg-primary/15 text-primary'
		case 'APPROVED_POOL':
			return 'border-secondary bg-secondary text-secondary-foreground'
		case 'WAITLISTED':
			return 'border-accent bg-accent text-accent-foreground'
		case 'DECLINED':
		case 'CLOSED':
			return 'border-destructive/30 bg-destructive/15 text-destructive'
		case 'IN_REVIEW':
		case 'SUBMITTED':
		default:
			return 'border-border bg-muted text-muted-foreground'
	}
}

function classesForFundAdminStatus(status: FundAdminStatusKey) {
	switch (status) {
		case 'ACTIVE':
			return 'border-secondary bg-secondary text-secondary-foreground'
		case 'ARCHIVED':
			return 'border-border bg-muted text-muted-foreground'
		case 'REJECTED':
			return 'border-destructive/30 bg-destructive/15 text-destructive'
		case 'WAITING_ON_ATHLETE':
		case 'READY_FOR_REGISTRATION':
			return 'border-primary/30 bg-primary/15 text-primary'
		case 'NEEDS_REVIEW':
		default:
			return 'border-border bg-muted text-muted-foreground'
	}
}

export function WorkflowStageBadge({
	applicationType,
	stage,
	size = 'sm',
}: Props) {
	const base =
		size === 'md'
			? 'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold'
			: 'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold'

	if (applicationType === 'FUND') {
		const normalized = normalizeFundStage(stage)
		return (
			<span className={`${base} ${classesForFund(normalized)}`}>
				{FUND_WORKFLOW_LABELS[normalized]}
			</span>
		)
	}

	const normalized = normalizeMentorStage(stage)
	return (
		<span className={`${base} ${classesForMentor(normalized)}`}>
			{MENTOR_WORKFLOW_LABELS[normalized]}
		</span>
	)
}

export default WorkflowStageBadge

export function FundAdminStatusBadge({
	stage,
	status,
	size = 'sm',
}: FundAdminStatusBadgeProps) {
	const base =
		size === 'md'
			? 'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold'
			: 'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold'
	const normalizedStage = normalizeFundStage(stage)
	const adminStatus = getFundAdminStatus(normalizedStage, { status })

	return (
		<span className={`${base} ${classesForFundAdminStatus(adminStatus)}`}>
			{FUND_ADMIN_STATUS_LABELS[adminStatus]}
		</span>
	)
}
