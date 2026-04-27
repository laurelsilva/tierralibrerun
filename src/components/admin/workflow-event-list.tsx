import { WorkflowStageBadge } from './workflow-stage-badge'
import { formatShortDateTime } from '@/lib/dates'
import {
	FUND_WORKFLOW_LABELS,
	MENTOR_WORKFLOW_LABELS,
	type FundWorkflowStage,
	type MentorWorkflowStage,
} from '@/lib/types/workflow'
import { cn } from '@/lib/utils'

type WorkflowApplicationType = 'FUND' | 'MENTOR'

type WorkflowEventItem = {
	id: string
	eventType: string
	createdAt: Date | string | null
	fromStage?: string | null
	toStage?: string | null
	actorRole?: string | null
	payloadObject?: Record<string, unknown> | null
}

type Props = {
	applicationType: WorkflowApplicationType
	events: WorkflowEventItem[]
	emptyMessage?: string
}

const formatDateTime = (v: Date | string | null | undefined) =>
	formatShortDateTime(v, 'No activity yet')

function humanizeValue(value: string) {
	return value
		.toLowerCase()
		.split('_')
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(' ')
}

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null
	return value as Record<string, unknown>
}

function getString(value: unknown): string | null {
	if (typeof value !== 'string') return null
	const normalized = value.trim()
	return normalized.length > 0 ? normalized : null
}

function stageLabel(
	applicationType: WorkflowApplicationType,
	stage: string | null | undefined,
) {
	if (!stage) return null

	if (applicationType === 'FUND') {
		const normalized = stage.toUpperCase() as FundWorkflowStage
		return FUND_WORKFLOW_LABELS[normalized] ?? humanizeValue(stage)
	}

	const normalized = stage.toUpperCase() as MentorWorkflowStage
	return MENTOR_WORKFLOW_LABELS[normalized] ?? humanizeValue(stage)
}

function actorLabel(actorRole: string | null | undefined) {
	switch ((actorRole || '').toUpperCase()) {
		case 'ADMIN':
			return 'Admin action'
		case 'ATHLETE':
			return 'Athlete action'
		case 'SYSTEM':
		default:
			return 'Automatic update'
	}
}

function getMetadataNote(event: WorkflowEventItem) {
	const payload = asRecord(event.payloadObject)
	const metadata = asRecord(payload?.metadata)

	const restartReason = getString(metadata?.restartReason)
	if (restartReason) return restartReason

	const closedReason = getString(metadata?.closedReason)
	if (closedReason) return closedReason

	const error = getString(payload?.error)
	if (error) return error

	return null
}

function getEventTitle(
	applicationType: WorkflowApplicationType,
	event: WorkflowEventItem,
) {
	const toLabel = stageLabel(applicationType, event.toStage)

	switch (event.eventType) {
		case 'APPLICATION_SUBMITTED':
			return 'Application submitted'
		case 'WORKFLOW_STAGE_CHANGED':
			return toLabel ? `Moved to ${toLabel}` : 'Workflow updated'
		case 'WORKFLOW_EMAIL_FAILED':
			return 'Automatic email failed'
		default:
			return humanizeValue(event.eventType)
	}
}

function getEventDescription(
	applicationType: WorkflowApplicationType,
	event: WorkflowEventItem,
) {
	if (event.eventType === 'WORKFLOW_STAGE_CHANGED') {
		const fromLabel = stageLabel(applicationType, event.fromStage)
		const toLabel = stageLabel(applicationType, event.toStage)
		if (fromLabel && toLabel && fromLabel !== toLabel) {
			return `Previous stage: ${fromLabel}`
		}
	}

	if (event.eventType === 'APPLICATION_SUBMITTED') {
		const toLabel = stageLabel(applicationType, event.toStage)
		if (toLabel) return `Entered workflow as ${toLabel}`
	}

	return null
}

function showTransition(event: WorkflowEventItem) {
	return Boolean(event.fromStage || event.toStage)
}

export function WorkflowEventList({
	applicationType,
	events,
	emptyMessage = 'No workflow updates yet.',
}: Props) {
	return (
		<ul className="space-y-2">
			{events.map((event) => {
				const description = getEventDescription(applicationType, event)
				const metadataNote = getMetadataNote(event)

				return (
					<li
						key={event.id}
						className={cn(
							'border-border/60 bg-muted/40 rounded-md border px-3 py-3',
							event.eventType === 'WORKFLOW_EMAIL_FAILED' &&
								'border-destructive/25 bg-destructive/5',
						)}
					>
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<p className="text-sm font-medium">
									{getEventTitle(applicationType, event)}
								</p>
								{description ? (
									<p className="text-muted-foreground mt-1 text-xs">
										{description}
									</p>
								) : null}
							</div>
							<p className="text-muted-foreground shrink-0 text-xs">
								{formatDateTime(event.createdAt)}
							</p>
						</div>

						{showTransition(event) ? (
							<div className="mt-2 flex flex-wrap items-center gap-2">
								{event.fromStage ? (
									<WorkflowStageBadge
										applicationType={applicationType}
										stage={event.fromStage}
									/>
								) : null}
								{event.fromStage && event.toStage ? (
									<span className="text-muted-foreground text-xs">to</span>
								) : null}
								{event.toStage ? (
									<WorkflowStageBadge
										applicationType={applicationType}
										stage={event.toStage}
									/>
								) : null}
							</div>
						) : null}

						<div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs">
							<span>{actorLabel(event.actorRole)}</span>
							{metadataNote ? (
								<>
									<span aria-hidden="true">&middot;</span>
									<span>{metadataNote}</span>
								</>
							) : null}
						</div>
					</li>
				)
			})}
			{events.length === 0 ? (
				<li className="text-muted-foreground text-sm">{emptyMessage}</li>
			) : null}
		</ul>
	)
}
