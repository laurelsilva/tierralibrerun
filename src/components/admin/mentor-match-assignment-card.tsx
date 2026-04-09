'use client'

import {
	CircleAlert,
	ExternalLink,
	ShieldAlert,
	ShieldCheck,
	UserX,
	type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
	adminDisabledProps,
	useAdminReadOnly,
} from '@/components/admin/admin-mode'
import { MentorPairingEmailButton } from '@/components/admin/mentor-pairing-email-button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { formatLongDate } from '@/lib/dates'
import { cn, initialsFromName } from '@/lib/utils'
import { assignFundApplicationMentor, unassignFundApplicationMentor } from '@/server/actions/workflow'
import { type MentorAssignmentOption } from '@/server/workflow/service'

interface MentorMatchAssignmentCardProps {
	fundApplicationId: string
	athleteName: string
	athleteEmail: string
	wantsMentor: boolean
	currentMatch: MentorAssignmentOption | null
	mentorOptions: MentorAssignmentOption[]
	hiddenConflictCount: number
	canAssign: boolean
	disabledReason?: string | null
}

type NoticeTone = 'success' | 'warning' | 'info' | 'neutral'

type PreferenceGuidance = {
	icon: LucideIcon
	tone: NoticeTone
	title: string
	description: string
	details: string[]
	actionLabel?: string
}

const formatDate = formatLongDate

function athleteCountLabel(count: number) {
	if (count === 0) return 'No athletes assigned'
	if (count === 1) return '1 athlete assigned'
	return `${count} athletes assigned`
}

function noticeClassName(tone: NoticeTone) {
	switch (tone) {
		case 'success':
			return 'border-border/70 bg-secondary/45 text-foreground'
		case 'warning':
			return 'border-border/70 bg-accent/55 text-foreground'
		case 'info':
			return 'border-border/70 bg-muted/45 text-foreground'
		default:
			return 'border-border/70 bg-background/80 text-foreground'
	}
}

function noticeIconClassName(tone: NoticeTone) {
	switch (tone) {
		case 'success':
			return 'border-border/60 bg-background text-primary'
		case 'warning':
			return 'border-border/60 bg-background text-accent-foreground'
		case 'info':
			return 'border-border/60 bg-background text-muted-foreground'
		default:
			return 'border-border/60 bg-background text-muted-foreground'
	}
}

function compatibilityBadgeVariant(
	status: MentorAssignmentOption['compatibilityStatus'],
) {
	return status === 'aligned' ? ('secondary' as const) : ('outline' as const)
}

function buildPreferenceGuidance({
	selectedMentor,
	hiddenConflictCount,
	showPreferenceConflicts,
}: {
	selectedMentor: MentorAssignmentOption | null
	hiddenConflictCount: number
	showPreferenceConflicts: boolean
}): PreferenceGuidance {
	if (selectedMentor) {
		if (selectedMentor.compatibilityStatus === 'aligned') {
			return {
				icon: ShieldCheck,
				tone: 'success',
				title: 'Preference fit looks good',
				description:
					'This mentor fits the stated same-gender preferences that were available in the applications.',
				details: selectedMentor.compatibilityDetails,
			}
		}

		if (selectedMentor.compatibilityStatus === 'needs_review') {
			return {
				icon: CircleAlert,
				tone: 'info',
				title: 'Preference fit needs a quick review',
				description:
					'The system could not fully verify the preference because some gender information is missing or unclear.',
				details: selectedMentor.compatibilityDetails,
			}
		}

		return {
			icon: ShieldAlert,
			tone: 'warning',
			title: 'Preference mismatch',
			description:
				'This pairing goes against a stated same-gender preference. You can still save it, but only as an intentional override.',
			details: selectedMentor.compatibilityDetails,
		}
	}

	if (hiddenConflictCount > 0 && !showPreferenceConflicts) {
		return {
			icon: CircleAlert,
			tone: 'neutral',
			title: `${hiddenConflictCount} ${
				hiddenConflictCount === 1 ? 'mentor is' : 'mentors are'
			} hidden by preference`,
			description:
				'The list is filtered to show the clearest fits first. Reveal the hidden mentors only if you want to review a mismatch intentionally.',
			details: [],
			actionLabel: 'Show hidden mentors',
		}
	}

	if (hiddenConflictCount > 0 && showPreferenceConflicts) {
		return {
			icon: CircleAlert,
			tone: 'info',
			title: 'All active mentors are visible',
			description:
				'Some of the visible mentors do not match a stated same-gender preference, so review the fit before saving.',
			details: [],
			actionLabel: 'Hide mismatches',
		}
	}

	return {
		icon: ShieldCheck,
		tone: 'success',
		title: 'No gender preference conflicts detected',
		description:
			'The active mentor pool does not currently surface any same-gender preference conflicts for this athlete.',
		details: [],
	}
}

function NoticeBlock({
	icon: Icon,
	tone,
	title,
	description,
	action,
	children,
}: {
	icon: LucideIcon
	tone: NoticeTone
	title: string
	description: string
	action?: ReactNode
	children?: ReactNode
}) {
	return (
		<div className={cn('rounded-xl border p-3', noticeClassName(tone))}>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex min-w-0 items-start gap-3">
					<div
						className={cn(
							'flex size-9 shrink-0 items-center justify-center rounded-full border',
							noticeIconClassName(tone),
						)}
					>
						<Icon className="size-4" />
					</div>
					<div className="min-w-0 space-y-1">
						<p className="text-sm font-semibold">{title}</p>
						<p className="text-xs leading-relaxed opacity-80">{description}</p>
					</div>
				</div>
				{action ? <div className="shrink-0">{action}</div> : null}
			</div>
			{children ? <div className="mt-3 pl-12">{children}</div> : null}
		</div>
	)
}

function PreviewField({ label, value }: { label: string; value: string }) {
	return (
		<div className="border-border/60 bg-background/70 rounded-lg border px-3 py-2.5">
			<p className="text-muted-foreground text-[11px] font-medium tracking-[0.08em] uppercase">
				{label}
			</p>
			<p className="mt-1 text-sm leading-relaxed">{value}</p>
		</div>
	)
}

export function MentorMatchAssignmentCard({
	fundApplicationId,
	athleteName,
	athleteEmail,
	wantsMentor,
	currentMatch,
	mentorOptions,
	hiddenConflictCount,
	canAssign,
	disabledReason,
}: MentorMatchAssignmentCardProps) {
	const router = useRouter()
	const readOnly = useAdminReadOnly()
	const disabledMeta = adminDisabledProps(
		readOnly,
		'Read-only mode: changes are disabled',
	)
	const [pending, startTransition] = useTransition()
	const [selectedMentorId, setSelectedMentorId] = useState(
		currentMatch?.applicationId || '',
	)
	const [showPreferenceConflicts, setShowPreferenceConflicts] = useState(false)
	const [allowPreferenceOverride, setAllowPreferenceOverride] = useState(false)

	const visibleMentorOptions = mentorOptions.filter(
		(mentor) =>
			showPreferenceConflicts ||
			!mentor.hiddenByDefault ||
			mentor.isCurrentMatch,
	)
	const hasVisibleMentorOptions = visibleMentorOptions.length > 0
	const hasMentorOptions = mentorOptions.length > 0

	const selectedMentor =
		mentorOptions.find((mentor) => mentor.applicationId === selectedMentorId) ||
		null
	const preferenceGuidance = buildPreferenceGuidance({
		selectedMentor,
		hiddenConflictCount,
		showPreferenceConflicts,
	})
	const selectionChanged =
		Boolean(selectedMentorId) &&
		selectedMentorId !== (currentMatch?.applicationId || '')
	const saveDisabled =
		!canAssign ||
		pending ||
		!selectedMentorId ||
		!selectionChanged ||
		(selectedMentor?.requiresPreferenceOverride && !allowPreferenceOverride) ||
		!!disabledMeta.disabled

	useEffect(() => {
		setAllowPreferenceOverride(false)
	}, [selectedMentorId])

	function handleAssignMentor() {
		if (!selectionChanged) return
		if (readOnly) {
			toast.error('Read-only mode: changes are disabled.')
			return
		}

		startTransition(async () => {
			const formData = new FormData()
			formData.append('fundApplicationId', fundApplicationId)
			formData.append('mentorApplicationId', selectedMentorId)
			formData.append(
				'allowPreferenceOverride',
				String(allowPreferenceOverride),
			)

			const result = await assignFundApplicationMentor(formData)

			if (result.success) {
				toast.success(
					currentMatch
						? 'Mentor pairing updated.'
						: 'Mentor paired to athlete.',
				)
				router.refresh()
				return
			}

			toast.error(result.error || 'Unable to save mentor pairing.')
		})
	}

	function handleRemoveMentor() {
		if (!currentMatch) return
		if (readOnly) {
			toast.error('Read-only mode: changes are disabled.')
			return
		}

		startTransition(async () => {
			const result = await unassignFundApplicationMentor(fundApplicationId)

			if (result.success) {
				toast.success('Mentor removed from athlete.')
				setSelectedMentorId('')
				router.refresh()
				return
			}

			toast.error(result.error || 'Unable to remove mentor.')
		})
	}

	return (
		<div className="border-border/70 bg-card/75 space-y-4 rounded-2xl border p-4 shadow-sm">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-1.5">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="text-sm font-semibold">Pairing Workspace</h3>
						<Badge variant={currentMatch ? 'secondary' : 'outline'}>
							{currentMatch
								? 'Paired'
								: wantsMentor
									? 'Needs pairing'
									: 'Optional pairing'}
						</Badge>
					</div>
					<p className="text-muted-foreground max-w-2xl text-xs leading-relaxed">
						Review the current match, compare active mentors, and save only when
						the fit is clear. Pairings here replace the open match but preserve
						the previous history.
					</p>
				</div>
				{currentMatch?.matchedAt ? (
					<div className="border-border/70 bg-background/80 text-muted-foreground rounded-full border px-3 py-1 text-xs">
						Matched on {formatDate(currentMatch.matchedAt)}
					</div>
				) : null}
			</div>

			<div className="border-border/70 bg-card/75 rounded-xl border p-4">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="min-w-0 space-y-3">
						<p className="text-muted-foreground text-[11px] font-medium tracking-[0.12em] uppercase">
							Current pairing
						</p>
						{currentMatch ? (
							<div className="flex min-w-0 items-start gap-3">
								<Avatar className="border-border/60 size-12 border">
									{currentMatch.avatarUrl ? (
										<AvatarImage
											src={currentMatch.avatarUrl}
											alt={`${currentMatch.name} avatar`}
										/>
									) : null}
									<AvatarFallback className="text-xs font-semibold">
										{initialsFromName(currentMatch.name)}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0 space-y-1.5">
									<div>
										<p className="truncate text-sm font-semibold">
											{currentMatch.name}
										</p>
										<p className="text-muted-foreground truncate text-xs">
											{currentMatch.email}
										</p>
									</div>
									<div className="flex flex-wrap gap-2">
										<Badge variant="outline">
											{athleteCountLabel(currentMatch.assignedAthleteCount)}
										</Badge>
										<Badge variant="outline">
											{currentMatch.workflowStageLabel}
										</Badge>
									</div>
								</div>
							</div>
						) : (
							<div className="border-border/70 bg-background/70 rounded-lg border border-dashed px-3 py-3">
								<p className="text-sm font-medium">No mentor is paired yet.</p>
								<p className="text-muted-foreground mt-1 text-xs leading-relaxed">
									{wantsMentor
										? 'Choose a mentor below once the fit feels right.'
										: 'This athlete did not explicitly request mentorship, but you can still pair someone when it makes sense.'}
								</p>
							</div>
						)}
					</div>

					{currentMatch ? (
						<div className="space-y-2 lg:max-w-sm">
							<p className="text-muted-foreground text-xs leading-relaxed">
								Once the pairing is set, send the introduction so both people
								start from the same thread.
							</p>
							<MentorPairingEmailButton
								fundApplicationId={fundApplicationId}
								athleteName={athleteName}
								athleteEmail={athleteEmail}
								mentorName={currentMatch.name}
								mentorEmail={currentMatch.email}
							/>
							<Button
								size="sm"
								variant="ghost"
								className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full gap-1.5"
								onClick={handleRemoveMentor}
								disabled={pending || !!disabledMeta.disabled}
							>
								<UserX className="size-3.5" />
								{pending ? 'Removing...' : 'Remove mentor'}
							</Button>
						</div>
					) : null}
				</div>
			</div>

			{!canAssign ? (
				<NoticeBlock
					icon={CircleAlert}
					tone="neutral"
					title="Pairing is not available yet"
					description={
						disabledReason ||
						'Move the athlete into the approved race workflow before assigning a mentor.'
					}
				/>
			) : !hasMentorOptions ? (
				<NoticeBlock
					icon={CircleAlert}
					tone="neutral"
					title="No active mentors are available"
					description="Approve a mentor into the active pool or return a matched mentor to the pool first."
				/>
			) : (
				<div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(340px,1fr)]">
					<div className="border-border/70 bg-card/75 space-y-4 rounded-xl border p-4">
						<div className="space-y-1.5">
							<p className="text-sm font-semibold">Choose a mentor</p>
							<p className="text-muted-foreground text-xs leading-relaxed">
								Only active mentor applications appear here. People who also
								have athlete records remain eligible as long as their mentor
								application is active.
							</p>
						</div>

						<div className="space-y-2">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<Label
									htmlFor="mentor-match-select"
									className="text-xs font-medium"
								>
									Active mentor
								</Label>
								{hiddenConflictCount > 0 ? (
									<Button
										type="button"
										size="sm"
										variant="ghost"
										className="h-auto px-2 py-1 text-[11px]"
										onClick={() =>
											setShowPreferenceConflicts((current) => !current)
										}
									>
										{showPreferenceConflicts
											? 'Hide mismatches'
											: `Show ${hiddenConflictCount} hidden`}
									</Button>
								) : null}
							</div>
							<Select
								value={selectedMentorId}
								onValueChange={setSelectedMentorId}
								disabled={
									pending || !!disabledMeta.disabled || !hasVisibleMentorOptions
								}
							>
								<SelectTrigger
									id="mentor-match-select"
									className="bg-background h-11 w-full"
									title={disabledMeta.title}
								>
									<SelectValue
										placeholder={
											hasVisibleMentorOptions
												? 'Choose a mentor to review'
												: 'No visible mentors until hidden options are shown'
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{visibleMentorOptions.map((mentor) => (
										<SelectItem
											key={mentor.applicationId}
											value={mentor.applicationId}
										>
											<div className="flex min-w-0 items-center gap-2">
												<Avatar className="border-border/60 size-7 border">
													{mentor.avatarUrl ? (
														<AvatarImage
															src={mentor.avatarUrl}
															alt={`${mentor.name} avatar`}
														/>
													) : null}
													<AvatarFallback className="text-[10px] font-semibold">
														{initialsFromName(mentor.name)}
													</AvatarFallback>
												</Avatar>
												<span className="flex min-w-0 flex-col">
													<span className="truncate font-medium">
														{mentor.name}
													</span>
													<span className="text-muted-foreground truncate text-xs">
														{mentor.compatibilityLabel} •{' '}
														{athleteCountLabel(mentor.assignedAthleteCount)}
														{mentor.isCurrentMatch ? ' • Current pairing' : ''}
													</span>
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="border-border/70 bg-background/70 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-3">
							<p className="text-muted-foreground max-w-lg text-xs leading-relaxed">
								{selectionChanged
									? 'Saving will replace the current open pairing and keep the previous match in history.'
									: 'Select a different mentor to update the current pairing.'}
							</p>
							<Button
								size="sm"
								onClick={handleAssignMentor}
								disabled={saveDisabled}
								title={disabledMeta.title}
							>
								{pending
									? 'Saving...'
									: currentMatch
										? 'Update pairing'
										: 'Assign mentor'}
							</Button>
						</div>
					</div>

					<div className="border-border/70 bg-card/75 rounded-xl border p-4">
						<div className="space-y-4">
							<NoticeBlock
								icon={preferenceGuidance.icon}
								tone={preferenceGuidance.tone}
								title={preferenceGuidance.title}
								description={preferenceGuidance.description}
								action={
									preferenceGuidance.actionLabel ? (
										<Button
											type="button"
											size="sm"
											variant="outline"
											onClick={() =>
												setShowPreferenceConflicts((current) => !current)
											}
										>
											{preferenceGuidance.actionLabel}
										</Button>
									) : null
								}
							>
								{preferenceGuidance.details.length > 0 ? (
									<ul className="space-y-1">
										{preferenceGuidance.details.map((detail) => (
											<li
												key={detail}
												className="text-xs leading-relaxed opacity-80"
											>
												{detail}
											</li>
										))}
									</ul>
								) : null}

								{selectedMentor?.requiresPreferenceOverride ? (
									<div className="mt-3 border-t border-current/10 pt-3">
										<div className="flex items-start gap-3">
											<Checkbox
												id="mentor-preference-override"
												checked={allowPreferenceOverride}
												onCheckedChange={(value) =>
													setAllowPreferenceOverride(Boolean(value))
												}
											/>
											<div className="space-y-1">
												<Label
													htmlFor="mentor-preference-override"
													className="text-sm font-medium"
												>
													Allow this override for the pairing
												</Label>
												<p className="text-xs leading-relaxed opacity-80">
													Use this only when you have a clear reason to pair
													outside the stated preference.
												</p>
											</div>
										</div>
									</div>
								) : null}
							</NoticeBlock>

							{selectedMentor ? (
								<div className="space-y-4">
									<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
										<div className="flex min-w-0 items-start gap-3">
											<Avatar className="border-border/60 size-14 border">
												{selectedMentor.avatarUrl ? (
													<AvatarImage
														src={selectedMentor.avatarUrl}
														alt={`${selectedMentor.name} avatar`}
													/>
												) : null}
												<AvatarFallback className="text-sm font-semibold">
													{initialsFromName(selectedMentor.name)}
												</AvatarFallback>
											</Avatar>
											<div className="min-w-0 space-y-2">
												<div>
													<p className="truncate text-base font-semibold">
														{selectedMentor.name}
													</p>
													<p className="text-muted-foreground truncate text-sm">
														{selectedMentor.email}
													</p>
												</div>
												<div className="flex flex-wrap gap-2">
													<Badge
														variant={compatibilityBadgeVariant(
															selectedMentor.compatibilityStatus,
														)}
													>
														{selectedMentor.compatibilityLabel}
													</Badge>
													<Badge variant="outline">
														{selectedMentor.workflowStageLabel}
													</Badge>
													{selectedMentor.isCurrentMatch ? (
														<Badge variant="secondary">Current pairing</Badge>
													) : null}
												</div>
											</div>
										</div>

										<div className="flex flex-wrap gap-2">
											<Button asChild size="sm" variant="outline">
												<Link
													href={`/admin/mentor-applications/${selectedMentor.applicationId}`}
												>
													<ExternalLink className="size-3.5" />
													Mentor application
												</Link>
											</Button>
											<Button asChild size="sm" variant="ghost">
												<Link href={`/admin/users/${selectedMentor.userId}`}>
													<ExternalLink className="size-3.5" />
													User profile
												</Link>
											</Button>
										</div>
									</div>

									<div className="grid gap-3 sm:grid-cols-2">
										<PreviewField
											label="Communication"
											value={
												selectedMentor.preferredCommunicationStyle ||
												'Not specified'
											}
										/>
										<PreviewField
											label="Region / identity"
											value={
												[
													selectedMentor.locationRegion,
													selectedMentor.genderIdentity,
												]
													.filter(Boolean)
													.join(' • ') || 'Not specified'
											}
										/>
										<PreviewField
											label="Current mentor load"
											value={athleteCountLabel(
												selectedMentor.assignedAthleteCount,
											)}
										/>
										<PreviewField
											label="Program stage"
											value={selectedMentor.workflowStageLabel}
										/>
									</div>

									{selectedMentor.specialExpertise ? (
										<PreviewField
											label="Special expertise"
											value={selectedMentor.specialExpertise}
										/>
									) : null}
								</div>
							) : (
								<div className="border-border/70 bg-background/60 flex min-h-56 items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center">
									<div className="max-w-sm space-y-2">
										<p className="text-sm font-semibold">
											Preview the mentor fit
										</p>
										<p className="text-muted-foreground text-sm leading-relaxed">
											Choose a mentor to see their avatar, current load,
											communication style, and overall fit before saving the
											pairing.
										</p>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
