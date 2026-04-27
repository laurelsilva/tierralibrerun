'use client'

import { useState } from 'react'
import { AdminDetailSection } from '@/components/admin/admin-detail'
import { Button } from '@/components/ui/button'
import { formatShortDateTime } from '@/lib/dates'
import {
	FUND_WORKFLOW_LABELS,
	MENTOR_WORKFLOW_LABELS,
	type FundWorkflowStage,
	type MentorWorkflowStage,
} from '@/lib/types/workflow'
import { cn } from '@/lib/utils'

type WorkflowApplicationType = 'FUND' | 'MENTOR'
type LogFilter = 'ALL' | 'WORKFLOW' | 'EMAIL'

type WorkflowEventItem = {
	id: string
	eventType: string
	createdAt: Date | string | null
	fromStage?: string | null
	toStage?: string | null
	actorRole?: string | null
	payloadObject?: Record<string, unknown> | null
}

type EmailLogItem = {
	id: string
	emailType: string
	recipientEmail: string
	status: string
	sentAt: Date | string | null
}

type Props = {
	applicationType: WorkflowApplicationType
	workflowEvents: WorkflowEventItem[]
	emailLogs: EmailLogItem[]
	className?: string
}

type ActivityItem = {
	id: string
	kind: 'workflow' | 'email'
	title: string
	detail: string | null
	meta: string
	timestamp: Date | string | null
	tone: 'default' | 'success' | 'critical'
}

const MAX_VISIBLE_ITEMS = 12

const formatDateTime = (v: Date | string | null | undefined) =>
	formatShortDateTime(v, 'Time unknown')

function humanizeValue(value: string) {
	return value
		.toLowerCase()
		.split('_')
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(' ')
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
			return 'Admin'
		case 'ATHLETE':
			return 'Athlete'
		case 'SYSTEM':
		default:
			return 'Automatic'
	}
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

function compactDetail(parts: Array<string | null | undefined>) {
	return parts.filter(Boolean).join(' • ') || null
}

function getWorkflowNote(event: WorkflowEventItem) {
	const payload = asRecord(event.payloadObject)
	const metadata = asRecord(payload?.metadata)

	return (
		getString(metadata?.restartReason) ??
		getString(metadata?.closedReason) ??
		getString(payload?.error)
	)
}

function getWorkflowTone(event: WorkflowEventItem): ActivityItem['tone'] {
	if (event.eventType === 'WORKFLOW_EMAIL_FAILED') return 'critical'

	switch ((event.toStage || '').toUpperCase()) {
		case 'ACTIVE':
		case 'ACTIVE_IN_PROGRAM':
		case 'REGISTERED':
		case 'MATCHED':
			return 'success'
		case 'DECLINED':
		case 'CLOSED':
			return 'critical'
		default:
			return 'default'
	}
}

function toWorkflowActivityItem(
	applicationType: WorkflowApplicationType,
	event: WorkflowEventItem,
): ActivityItem {
	const fromLabel = stageLabel(applicationType, event.fromStage)
	const toLabel = stageLabel(applicationType, event.toStage)
	const note = getWorkflowNote(event)
	const time = formatDateTime(event.createdAt)
	const actor = actorLabel(event.actorRole)

	switch (event.eventType) {
		case 'APPLICATION_SUBMITTED':
			return {
				id: `workflow-${event.id}`,
				kind: 'workflow',
				title: 'Application submitted',
				detail: toLabel ? `Entered as ${toLabel}` : null,
				meta: `${actor} • ${time}`,
				timestamp: event.createdAt,
				tone: 'default',
			}
		case 'WORKFLOW_STAGE_CHANGED':
			return {
				id: `workflow-${event.id}`,
				kind: 'workflow',
				title: toLabel ? `Moved to ${toLabel}` : 'Workflow updated',
				detail: compactDetail([
					fromLabel && toLabel && fromLabel !== toLabel
						? `${fromLabel} -> ${toLabel}`
						: null,
					note,
				]),
				meta: `${actor} • ${time}`,
				timestamp: event.createdAt,
				tone: getWorkflowTone(event),
			}
		case 'WORKFLOW_EMAIL_FAILED':
			return {
				id: `workflow-${event.id}`,
				kind: 'workflow',
				title: 'Automatic email failed',
				detail: note,
				meta: `${actor} • ${time}`,
				timestamp: event.createdAt,
				tone: 'critical',
			}
		default:
			return {
				id: `workflow-${event.id}`,
				kind: 'workflow',
				title: humanizeValue(event.eventType),
				detail: note,
				meta: `${actor} • ${time}`,
				timestamp: event.createdAt,
				tone: 'default',
			}
	}
}

function getEmailTypeLabel(type: string) {
	switch (type) {
		case 'APPROVAL':
			return 'Approval'
		case 'REJECTION':
			return 'Rejection'
		case 'WAITLIST':
			return 'Waitlist'
		case 'CUSTOM':
			return 'Custom'
		case 'UPDATE':
			return 'Update'
		case 'INVITE':
			return 'Invite'
		case 'REMINDER':
			return 'Reminder'
		case 'ANNOUNCEMENT':
			return 'Announcement'
		default:
			return humanizeValue(type)
	}
}

function toEmailActivityItem(log: EmailLogItem): ActivityItem {
	const label = getEmailTypeLabel(log.emailType)
	const failed = log.status === 'FAILED'

	return {
		id: `email-${log.id}`,
		kind: 'email',
		title: `${label} email ${failed ? 'failed' : 'sent'}`,
		detail: `To ${log.recipientEmail}`,
		meta: formatDateTime(log.sentAt),
		timestamp: log.sentAt,
		tone: failed ? 'critical' : 'success',
	}
}

function itemClasses(tone: ActivityItem['tone']) {
	switch (tone) {
		case 'success':
			return 'border-secondary/25 bg-secondary/5'
		case 'critical':
			return 'border-destructive/25 bg-destructive/5'
		case 'default':
		default:
			return 'border-border/60 bg-muted/20'
	}
}

function dotClasses(item: ActivityItem) {
	if (item.kind === 'email') {
		return item.tone === 'critical' ? 'bg-destructive' : 'bg-secondary'
	}

	switch (item.tone) {
		case 'success':
			return 'bg-secondary'
		case 'critical':
			return 'bg-destructive'
		case 'default':
		default:
			return 'bg-primary/70'
	}
}

export function ActivityLogSection({
	applicationType,
	workflowEvents,
	emailLogs,
	className,
}: Props) {
	const [filter, setFilter] = useState<LogFilter>('ALL')

	const allItems = [
		...workflowEvents.map((event) =>
			toWorkflowActivityItem(applicationType, event),
		),
		...emailLogs.map((log) => toEmailActivityItem(log)),
	].sort((a, b) => +new Date(b.timestamp || 0) - +new Date(a.timestamp || 0))

	const filteredItems = allItems.filter((item) => {
		if (filter === 'WORKFLOW') return item.kind === 'workflow'
		if (filter === 'EMAIL') return item.kind === 'email'
		return true
	})

	const visibleItems = filteredItems.slice(0, MAX_VISIBLE_ITEMS)
	const hiddenCount = Math.max(filteredItems.length - visibleItems.length, 0)

	const filters: Array<{ key: LogFilter; label: string; count: number }> = [
		{ key: 'ALL', label: 'All', count: allItems.length },
		{ key: 'WORKFLOW', label: 'Workflow', count: workflowEvents.length },
		{ key: 'EMAIL', label: 'Emails', count: emailLogs.length },
	]

	return (
		<AdminDetailSection
			title="Activity Log"
			description="Newest first. Workflow changes and emails in one place."
			className={className}
			footer={
				hiddenCount > 0 ? (
					<p className="text-muted-foreground text-xs">
						Showing {visibleItems.length} of {filteredItems.length} entries.
					</p>
				) : null
			}
		>
			<div className="flex flex-wrap gap-2">
				{filters.map((option) => (
					<Button
						key={option.key}
						type="button"
						variant={filter === option.key ? 'secondary' : 'ghost'}
						size="sm"
						className="rounded-full"
						onClick={() => setFilter(option.key)}
					>
						{option.label} {option.count}
					</Button>
				))}
			</div>

			{visibleItems.length === 0 ? (
				<div className="text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-sm">
					No activity in this view yet.
				</div>
			) : (
				<div className="max-h-[34rem] space-y-2 overflow-y-auto pr-1">
					{visibleItems.map((item) => (
						<div
							key={item.id}
							className={cn(
								'rounded-xl border px-3 py-3 transition-colors',
								itemClasses(item.tone),
							)}
						>
							<div className="flex items-start gap-3">
								<span
									className={cn(
										'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full',
										dotClasses(item),
									)}
								/>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="text-sm font-medium">{item.title}</p>
										<span className="text-muted-foreground border-border/70 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-[0.12em] uppercase">
											{item.kind}
										</span>
									</div>
									{item.detail ? (
										<p className="text-muted-foreground mt-1 text-xs leading-relaxed">
											{item.detail}
										</p>
									) : null}
									<p className="text-muted-foreground mt-1 text-[11px]">
										{item.meta}
									</p>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</AdminDetailSection>
	)
}
