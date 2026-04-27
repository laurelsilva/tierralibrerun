'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
	adminDisabledProps,
	useAdminReadOnly,
} from '@/components/admin/admin-mode'
import { FundAdminStatusBadge } from '@/components/admin/workflow-stage-badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { type FundWorkflowStage } from '@/lib/types/workflow'
import {
	runFundAdminAction,
	transitionMentorApplicationWorkflow,
} from '@/server/actions/workflow'

type Transition = {
	toStage: string
	label: string
	description: string
}

type FundAdminAction = {
	key:
		| 'APPROVE_AND_REQUEST_CONFIRMATION'
		| 'WAITLIST'
		| 'REJECT'
		| 'REOPEN_REVIEW'
		| 'RESTART_WORKFLOW'
		| 'MARK_CONFIRMED'
		| 'MARK_REGISTERED_AND_ACTIVE'
		| 'MARK_COMPLETED'
		| 'MARK_NO_SHOW_OR_DROPPED'
		| 'CLOSE_OUT'
	label: string
	description: string
	requiresRegistrationStatus?: boolean
}

interface WorkflowActionPanelProps {
	applicationId: string
	applicationType: 'FUND' | 'MENTOR'
	currentStage: string
	currentRecordStatus?: string | null
	transitions?: Transition[]
}

function toFundWorkflowStage(value: string): FundWorkflowStage {
	return (value.toUpperCase() as FundWorkflowStage) || 'SUBMITTED'
}

function getFundAdminActions(stage: FundWorkflowStage): FundAdminAction[] {
	switch (stage) {
		case 'SUBMITTED':
		case 'IN_REVIEW':
			return [
				{
					key: 'APPROVE_AND_REQUEST_CONFIRMATION',
					label: 'Approve and Request Confirmation',
					description:
						'Approve this athlete and send the confirmation request email.',
				},
				{
					key: 'WAITLIST',
					label: 'Put on Hold',
					description: 'Keep this application in the review pool for later.',
				},
				{
					key: 'REJECT',
					label: 'Reject Application',
					description: 'Mark this application as not moving forward.',
				},
			]
		case 'WAITLISTED':
			return [
				{
					key: 'APPROVE_AND_REQUEST_CONFIRMATION',
					label: 'Approve and Request Confirmation',
					description: 'Move this held application forward.',
				},
				{
					key: 'REOPEN_REVIEW',
					label: 'Move Back to Review',
					description: 'Bring this application back into active review.',
				},
				{
					key: 'RESTART_WORKFLOW',
					label: 'Restart Workflow from Beginning',
					description:
						'Reset this application to the start of admin review and clear prior lifecycle progress.',
				},
				{
					key: 'CLOSE_OUT',
					label: 'Close Out',
					description: 'Close this held application without moving it forward.',
				},
			]
		case 'AWAITING_CONFIRMATION':
			return [
				{
					key: 'MARK_CONFIRMED',
					label: 'Mark Athlete Confirmed',
					description: 'The athlete replied and is ready to be registered.',
				},
				{
					key: 'WAITLIST',
					label: 'Put on Hold',
					description: 'Move this athlete back to the hold bucket.',
				},
				{
					key: 'RESTART_WORKFLOW',
					label: 'Restart Workflow from Beginning',
					description:
						'Restart this athlete at review so confirmation and outreach can be rerun cleanly.',
				},
				{
					key: 'CLOSE_OUT',
					label: 'Close Out',
					description: 'Use when the athlete does not confirm or backs out.',
				},
			]
		case 'CONFIRMED':
		case 'REGISTRATION_IN_PROGRESS':
		case 'REGISTERED':
		case 'ONBOARDING_IN_PROGRESS':
			return [
				{
					key: 'MARK_REGISTERED_AND_ACTIVE',
					label: 'Mark Registered and Active',
					description:
						'Registration is done, Slack invite is sent, and mentorship handoff is complete.',
					requiresRegistrationStatus: true,
				},
				{
					key: 'RESTART_WORKFLOW',
					label: 'Restart Workflow from Beginning',
					description:
						'Move this athlete back to review and reset this cycle before processing again.',
				},
				{
					key: 'CLOSE_OUT',
					label: 'Close Out',
					description: 'Use when the athlete backs out before becoming active.',
				},
			]
		case 'ACTIVE_IN_PROGRAM':
			return [
				{
					key: 'MARK_COMPLETED',
					label: 'Archive as Completed',
					description: 'The athlete raced and this cycle is complete.',
				},
				{
					key: 'MARK_NO_SHOW_OR_DROPPED',
					label: 'Mark No Show / Dropped',
					description:
						'The athlete did not make it to the start or dropped out.',
				},
				{
					key: 'RESTART_WORKFLOW',
					label: 'Restart Workflow from Beginning',
					description:
						'Restart this athlete at review to rerun lifecycle actions for this cycle.',
				},
			]
		case 'DECLINED':
		case 'CLOSED':
			return [
				{
					key: 'REOPEN_REVIEW',
					label: 'Reopen Application',
					description: 'Move this application back into review.',
				},
				{
					key: 'RESTART_WORKFLOW',
					label: 'Restart Workflow from Beginning',
					description:
						'Reset this application back to review and clear prior workflow milestones.',
				},
			]
		case 'NO_LONGER_ACTIVE':
		case 'NO_SHOW_OR_DROPPED':
			return [
				{
					key: 'RESTART_WORKFLOW',
					label: 'Restart Workflow from Beginning',
					description:
						'Use when this athlete should be processed from the beginning again.',
				},
			]
		default:
			return []
	}
}

export function WorkflowActionPanel({
	applicationId,
	applicationType,
	currentStage,
	currentRecordStatus,
	transitions,
}: WorkflowActionPanelProps) {
	const router = useRouter()
	const readOnly = useAdminReadOnly()
	const disabledMeta = adminDisabledProps(
		readOnly,
		'Read-only mode: changes are disabled',
	)
	const [pending, startTransition] = useTransition()
	const [sendEmail, setSendEmail] = useState(true)
	const [registrationStatus, setRegistrationStatus] = useState<
		'ADMIN_REGISTERED' | 'SELF_REGISTERED'
	>('ADMIN_REGISTERED')

	const fundStage = toFundWorkflowStage(currentStage)
	const fundActions = useMemo(() => getFundAdminActions(fundStage), [fundStage])
	const mentorActions = useMemo(() => transitions ?? [], [transitions])

	if (applicationType === 'FUND' && fundActions.length === 0) {
		return (
			<div className="rounded-lg border border-dashed p-4">
				<p className="text-muted-foreground text-sm">
					No admin actions are available for this athlete right now.
				</p>
			</div>
		)
	}

	if (applicationType === 'MENTOR' && mentorActions.length === 0) {
		return (
			<div className="rounded-lg border border-dashed p-4">
				<p className="text-muted-foreground text-sm">
					No actions are available from <strong>{currentStage}</strong>.
				</p>
			</div>
		)
	}

	function runFundAction(action: FundAdminAction['key']) {
		if (readOnly) {
			toast.error('Read-only mode: changes are disabled.')
			return
		}

		startTransition(async () => {
			const fd = new FormData()
			fd.append('applicationId', applicationId)
			fd.append('action', action)
			fd.append('sendEmail', String(sendEmail))
			fd.append('registrationStatus', registrationStatus)

			const result = await runFundAdminAction(fd)

			if (result?.success) {
				toast.success('Application updated')
				router.refresh()
			} else {
				toast.error(result?.error || 'Unable to update application')
			}
		})
	}

	function runMentorTransition(toStage: string) {
		if (readOnly) {
			toast.error('Read-only mode: changes are disabled.')
			return
		}

		startTransition(async () => {
			const fd = new FormData()
			fd.append('applicationId', applicationId)
			fd.append('toStage', toStage)
			fd.append('sendEmail', String(sendEmail))

			const result = await transitionMentorApplicationWorkflow(fd)

			if (result?.success) {
				toast.success('Stage updated')
				router.refresh()
			} else {
				toast.error(result?.error || 'Unable to update stage')
			}
		})
	}

	return (
		<div className="space-y-3 rounded-lg border p-4">
			<div className="space-y-1">
				<h3 className="text-sm font-semibold">
					{applicationType === 'FUND' ? 'Admin Actions' : 'Next Actions'}
				</h3>
				{applicationType === 'FUND' ? (
					<div className="flex items-center gap-2 text-xs">
						<span className="text-muted-foreground">Current status:</span>
						<FundAdminStatusBadge
							stage={currentStage}
							status={currentRecordStatus}
						/>
					</div>
				) : (
					<p className="text-muted-foreground text-xs">
						Current stage: <strong>{currentStage}</strong>
					</p>
				)}
			</div>

			<div className="rounded-md border px-3 py-3">
				<div className="flex items-start gap-3">
					<Checkbox
						id="workflow-send-email"
						checked={sendEmail}
						onCheckedChange={(v) => setSendEmail(Boolean(v))}
						disabled={pending || !!disabledMeta.disabled}
						className="mt-0.5"
					/>
					<div className="space-y-1">
						<div className="flex flex-wrap items-center gap-2">
							<Label
								htmlFor="workflow-send-email"
								className="text-sm font-medium"
							>
								Notify athlete by email
							</Label>
							<span className="text-muted-foreground border-border/70 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-[0.12em] uppercase">
								{sendEmail ? 'On' : 'Off'}
							</span>
						</div>
						<p className="text-muted-foreground text-xs leading-relaxed">
							If this action has a standard athlete email, send it
							automatically. Internal-only updates will not send anything.
						</p>
					</div>
				</div>
			</div>

			<div className="space-y-2">
				{applicationType === 'FUND'
					? fundActions.map((action) => (
							<div
								key={action.key}
								className="flex flex-col gap-2 rounded-md border p-3"
							>
								<div>
									<p className="text-sm font-medium">{action.label}</p>
									<p className="text-muted-foreground text-xs">
										{action.description}
									</p>
								</div>

								{action.requiresRegistrationStatus ? (
									<div className="space-y-1">
										<Label className="text-xs">Registration Method</Label>
										<select
											value={registrationStatus}
											onChange={(e) =>
												setRegistrationStatus(
													e.target.value as
														| 'ADMIN_REGISTERED'
														| 'SELF_REGISTERED',
												)
											}
											className="rounded border px-2 py-1 text-xs"
										>
											<option value="ADMIN_REGISTERED">
												Registered by admin
											</option>
											<option value="SELF_REGISTERED">
												Registered by athlete
											</option>
										</select>
									</div>
								) : null}

								<Button
									size="sm"
									onClick={() => runFundAction(action.key)}
									disabled={pending || !!disabledMeta.disabled}
									title={disabledMeta.title}
								>
									{pending ? 'Saving...' : action.label}
								</Button>
							</div>
						))
					: mentorActions.map((action) => (
							<div
								key={action.toStage}
								className="flex flex-col gap-2 rounded-md border p-3"
							>
								<div>
									<p className="text-sm font-medium">{action.label}</p>
									<p className="text-muted-foreground text-xs">
										{action.description}
									</p>
								</div>

								<Button
									size="sm"
									onClick={() => runMentorTransition(action.toStage)}
									disabled={pending || !!disabledMeta.disabled}
									title={disabledMeta.title}
								>
									{pending ? 'Saving...' : action.label}
								</Button>
							</div>
						))}
			</div>
		</div>
	)
}

export default WorkflowActionPanel
