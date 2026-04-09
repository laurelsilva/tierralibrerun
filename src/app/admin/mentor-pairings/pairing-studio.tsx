'use client'

import {
	ArrowRight,
	CalendarDays,
	CheckCircle2,
	ChevronDown,
	CircleAlert,
	ExternalLink,
	Search,
	ShieldCheck,
	UserRoundPlus,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
	adminDisabledProps,
	useAdminReadOnly,
} from '@/components/admin/admin-mode'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCompactDate, formatLongDate } from '@/lib/dates'
import { cn, initialsFromName } from '@/lib/utils'
import { assignFundApplicationMentor } from '@/server/actions/workflow'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PairingAthlete = {
	applicationId: string
	userId: string
	name: string
	email: string
	race: string
	raceDate: Date | null
	workflowStage: string
	genderIdentity: string | null
	mentorGenderPreference: string | null
	wantsMentor: boolean
	locationRegion: string | null
	avatarUrl: string | null
	currentMentor: {
		applicationId: string
		name: string
		avatarUrl: string | null
		matchedAt: Date | null
	} | null
}

export type PairingMentor = {
	applicationId: string
	userId: string
	name: string
	email: string
	workflowStage: string
	genderIdentity: string | null
	mentorGenderPreference: string | null
	specialExpertise: string | null
	preferredCommunicationStyle: string | null
	locationRegion: string | null
	avatarUrl: string | null
	currentAthletes: Array<{
		applicationId: string
		userId: string
		name: string
		race: string
		raceDate: Date | null
		wantsMentor: boolean
		avatarUrl: string | null
		matchedAt: Date | null
	}>
	pastAthletes: Array<{
		applicationId: string
		userId: string
		name: string
		race: string
		raceDate: Date | null
		avatarUrl: string | null
		matchedAt: Date | null
		endedAt: Date | null
	}>
}

type Compatibility = {
	status: 'aligned' | 'needs_review' | 'conflict'
	label: string
	summary: string
	requiresPreferenceOverride: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDate = formatLongDate
const compactDate = formatCompactDate

function countLabel(count: number, singular: string, plural = `${singular}s`) {
	return `${count} ${count === 1 ? singular : plural}`
}

function mentorSummary(mentor: PairingMentor) {
	if (mentor.specialExpertise?.trim()) return mentor.specialExpertise.trim()
	if (mentor.preferredCommunicationStyle?.trim()) {
		return mentor.preferredCommunicationStyle.trim()
	}
	return 'Available for mentorship'
}

function isRacePast(raceDate: Date | string | null | undefined) {
	if (!raceDate) return false
	const d = new Date(raceDate)
	d.setHours(23, 59, 59, 999)
	return d < new Date()
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

function evaluateCompatibility(
	athlete: PairingAthlete,
	mentor: PairingMentor,
): Compatibility {
	const athleteGender = normalizeGenderForPreference(athlete.genderIdentity)
	const mentorGender = normalizeGenderForPreference(mentor.genderIdentity)
	const athletePreference = normalizeGenderPreference(
		athlete.mentorGenderPreference,
	)
	const mentorPreference = normalizeGenderPreference(
		mentor.mentorGenderPreference,
	)

	const requiresSameGender =
		athletePreference === 'same-gender' || mentorPreference === 'same-gender'
	const sameKnownGender =
		Boolean(athleteGender) &&
		Boolean(mentorGender) &&
		athleteGender === mentorGender

	if (!requiresSameGender) {
		return {
			status: 'aligned',
			label: 'Good fit',
			summary: 'No same-gender preference conflict.',
			requiresPreferenceOverride: false,
		}
	}

	if (!athleteGender || !mentorGender) {
		return {
			status: 'needs_review',
			label: 'Review',
			summary: 'Same-gender preference exists but profile data is incomplete.',
			requiresPreferenceOverride: false,
		}
	}

	if (sameKnownGender) {
		return {
			status: 'aligned',
			label: 'Aligned',
			summary: 'Respects the stated same-gender preference.',
			requiresPreferenceOverride: false,
		}
	}

	return {
		status: 'conflict',
		label: 'Conflict',
		summary: 'Conflicts with a stated same-gender preference.',
		requiresPreferenceOverride: true,
	}
}

function compareAthletes(left: PairingAthlete, right: PairingAthlete) {
	if (left.currentMentor && !right.currentMentor) return 1
	if (!left.currentMentor && right.currentMentor) return -1
	if (left.wantsMentor !== right.wantsMentor) return left.wantsMentor ? -1 : 1

	const leftDate = left.raceDate
		? new Date(left.raceDate).getTime()
		: Number.MAX_SAFE_INTEGER
	const rightDate = right.raceDate
		? new Date(right.raceDate).getTime()
		: Number.MAX_SAFE_INTEGER
	if (leftDate !== rightDate) return leftDate - rightDate

	return left.name.localeCompare(right.name)
}

function nextSelectionId(athletes: PairingAthlete[]) {
	return (
		athletes.find((athlete) => !athlete.currentMentor)?.applicationId ?? null
	)
}

function sortedCurrentAthletes(mentor: PairingMentor) {
	return [...mentor.currentAthletes].sort((left, right) => {
		const leftDate = left.raceDate
			? new Date(left.raceDate).getTime()
			: Number.MAX_SAFE_INTEGER
		const rightDate = right.raceDate
			? new Date(right.raceDate).getTime()
			: Number.MAX_SAFE_INTEGER

		if (leftDate !== rightDate) return leftDate - rightDate
		return left.name.localeCompare(right.name)
	})
}

function mentorSearchText(mentor: PairingMentor) {
	return [
		mentor.name,
		mentor.specialExpertise,
		mentor.preferredCommunicationStyle,
		...mentor.currentAthletes.map((athlete) => athlete.name),
	]
		.filter(Boolean)
		.join(' ')
		.toLowerCase()
}

const DEFAULT_COMPATIBILITY: Compatibility = {
	status: 'aligned',
	label: 'Ready',
	summary: 'Pick an athlete to view mentor fit.',
	requiresPreferenceOverride: false,
}

// ---------------------------------------------------------------------------
// Compatibility dot indicator
// ---------------------------------------------------------------------------

function CompatibilityDot({ status }: { status: Compatibility['status'] }) {
	return (
		<span
			className={cn(
				'inline-block size-2 rounded-full',
				status === 'aligned' && 'bg-emerald-500',
				status === 'needs_review' && 'bg-amber-400',
				status === 'conflict' && 'bg-red-400',
			)}
		/>
	)
}

// ---------------------------------------------------------------------------
// Active Pairings Panel (replaces dialog)
// ---------------------------------------------------------------------------

function MentorAthleteRow({
	athlete,
	variant,
}: {
	athlete: {
		applicationId: string
		name: string
		race: string
		raceDate: Date | null
		avatarUrl: string | null
		endedAt?: Date | null
	}
	variant: 'active' | 'race-passed' | 'ended'
}) {
	return (
		<Link
			href={`/admin/applications/${athlete.applicationId}`}
			className={cn(
				'group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition',
				variant === 'active' && 'hover:bg-accent/50',
				variant === 'race-passed' && 'hover:bg-accent/50 opacity-50',
				variant === 'ended' && 'hover:bg-accent/30 opacity-40',
			)}
		>
			<Avatar className="size-5 shrink-0">
				{athlete.avatarUrl ? (
					<AvatarImage src={athlete.avatarUrl} alt={athlete.name} />
				) : null}
				<AvatarFallback className="text-[8px]">
					{initialsFromName(athlete.name)}
				</AvatarFallback>
			</Avatar>
			<div className="min-w-0 flex-1">
				<p className="truncate text-xs leading-tight">{athlete.name}</p>
				<p className="text-muted-foreground truncate text-[10px] leading-tight">
					{variant === 'race-passed' ? (
						<span className="text-amber-600 dark:text-amber-400">
							Race passed · {compactDate(athlete.raceDate)}
						</span>
					) : (
						<>
							{athlete.race} · {compactDate(athlete.raceDate)}
						</>
					)}
				</p>
			</div>
		</Link>
	)
}

function ActivePairingsPanel({ mentors }: { mentors: PairingMentor[] }) {
	const mentorsWithHistory = mentors
		.filter(
			(mentor) =>
				mentor.currentAthletes.length > 0 || mentor.pastAthletes.length > 0,
		)
		.sort(
			(left, right) =>
				right.currentAthletes.length - left.currentAthletes.length ||
				left.name.localeCompare(right.name),
		)

	const openMentors = mentors
		.filter(
			(mentor) =>
				mentor.currentAthletes.length === 0 && mentor.pastAthletes.length === 0,
		)
		.sort((left, right) => left.name.localeCompare(right.name))

	const totalActive = mentors.reduce(
		(sum, m) => sum + m.currentAthletes.length,
		0,
	)
	const totalPast = mentors.reduce((sum, m) => sum + m.pastAthletes.length, 0)
	const activeMentorCount = mentors.filter(
		(m) => m.currentAthletes.length > 0,
	).length

	return (
		<div className="space-y-6">
			{/* Summary */}
			<div className="space-y-1">
				<p className="text-muted-foreground text-sm">
					<span className="text-foreground font-semibold">{totalActive}</span>{' '}
					active {totalActive === 1 ? 'pair' : 'pairs'} across{' '}
					<span className="text-foreground font-semibold">
						{activeMentorCount}
					</span>{' '}
					{activeMentorCount === 1 ? 'mentor' : 'mentors'}
					{openMentors.length > 0 && (
						<>
							{' · '}
							<span className="text-foreground font-semibold">
								{openMentors.length}
							</span>{' '}
							unassigned
						</>
					)}
					{totalPast > 0 && (
						<>
							{' · '}
							<span className="text-muted-foreground/70">{totalPast} past</span>
						</>
					)}
				</p>
				<p className="text-muted-foreground/70 text-xs">
					Mentorship ends automatically when the athlete&apos;s race date
					passes.
				</p>
			</div>

			{/* Mentor cards in a responsive grid */}
			{mentorsWithHistory.length > 0 && (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{mentorsWithHistory.map((mentor) => {
						const activeAthletes = sortedCurrentAthletes(mentor).filter(
							(a) => !isRacePast(a.raceDate),
						)
						const racePassedAthletes = sortedCurrentAthletes(mentor).filter(
							(a) => isRacePast(a.raceDate),
						)
						const hasPast = mentor.pastAthletes.length > 0

						return (
							<div
								key={mentor.applicationId}
								className="border-border/60 rounded-xl border p-4"
							>
								{/* Mentor header */}
								<div className="flex items-center gap-2.5">
									<Avatar className="border-border/60 size-8 border">
										{mentor.avatarUrl ? (
											<AvatarImage src={mentor.avatarUrl} alt={mentor.name} />
										) : null}
										<AvatarFallback className="bg-secondary text-secondary-foreground text-[10px] font-semibold">
											{initialsFromName(mentor.name)}
										</AvatarFallback>
									</Avatar>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium">
											{mentor.name}
										</p>
										<p className="text-muted-foreground text-[11px]">
											{mentor.currentAthletes.length > 0
												? countLabel(mentor.currentAthletes.length, 'active')
												: 'No active'}
											{hasPast && (
												<span className="text-muted-foreground/50">
													{' · '}
													{mentor.pastAthletes.length} past
												</span>
											)}
										</p>
									</div>
									<Link
										href={`/admin/mentor-applications/${mentor.applicationId}`}
										className="text-muted-foreground hover:text-foreground transition"
									>
										<ExternalLink className="size-3.5" />
									</Link>
								</div>

								{/* Active mentees */}
								{activeAthletes.length > 0 && (
									<div className="mt-3 space-y-0.5">
										{activeAthletes.map((athlete) => (
											<MentorAthleteRow
												key={athlete.applicationId}
												athlete={athlete}
												variant="active"
											/>
										))}
									</div>
								)}

								{/* Race-passed mentees */}
								{racePassedAthletes.length > 0 && (
									<div
										className={cn(
											'space-y-0.5',
											activeAthletes.length > 0 ? 'mt-1' : 'mt-3',
										)}
									>
										{racePassedAthletes.map((athlete) => (
											<MentorAthleteRow
												key={athlete.applicationId}
												athlete={athlete}
												variant="race-passed"
											/>
										))}
									</div>
								)}

								{/* Past mentees */}
								{hasPast && (
									<div
										className={cn(
											'space-y-0.5',
											activeAthletes.length > 0 || racePassedAthletes.length > 0
												? 'border-border/40 mt-3 border-t pt-2'
												: 'mt-3',
										)}
									>
										{mentor.pastAthletes.map((athlete, idx) => (
											<MentorAthleteRow
												key={`${athlete.applicationId}-${idx}`}
												athlete={athlete}
												variant="ended"
											/>
										))}
									</div>
								)}
							</div>
						)
					})}
				</div>
			)}

			{/* Unassigned mentors */}
			{openMentors.length > 0 && (
				<div className="space-y-3">
					<h3 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
						Unassigned mentors
					</h3>
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
						{openMentors.map((mentor) => (
							<Link
								key={mentor.applicationId}
								href={`/admin/mentor-applications/${mentor.applicationId}`}
								className="border-border/60 hover:bg-accent/30 flex items-center gap-2.5 rounded-xl border px-4 py-3 transition"
							>
								<Avatar className="border-border/60 size-8 border">
									{mentor.avatarUrl ? (
										<AvatarImage src={mentor.avatarUrl} alt={mentor.name} />
									) : null}
									<AvatarFallback className="bg-secondary text-secondary-foreground text-[10px] font-semibold">
										{initialsFromName(mentor.name)}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">{mentor.name}</p>
									<p className="text-muted-foreground truncate text-xs">
										{mentorSummary(mentor)}
									</p>
								</div>
								<ExternalLink className="text-muted-foreground size-3.5 shrink-0" />
							</Link>
						))}
					</div>
				</div>
			)}

			{mentorsWithHistory.length === 0 && openMentors.length === 0 && (
				<div className="text-muted-foreground py-16 text-center text-sm">
					No mentors in the active pool yet.
				</div>
			)}
		</div>
	)
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface MentorPairingStudioProps {
	initialMentors: PairingMentor[]
	initialAthletes: PairingAthlete[]
}

export function MentorPairingStudio({
	initialMentors,
	initialAthletes,
}: MentorPairingStudioProps) {
	const router = useRouter()
	const readOnly = useAdminReadOnly()
	const disabledMeta = adminDisabledProps(
		readOnly,
		'Read-only mode: changes are disabled',
	)

	const [mentors, setMentors] = useState(initialMentors)
	const [athletes, setAthletes] = useState(initialAthletes)
	const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(
		nextSelectionId(initialAthletes),
	)
	const [athleteQuery, setAthleteQuery] = useState('')
	const [mentorQuery, setMentorQuery] = useState('')
	const [showConflictMentors, setShowConflictMentors] = useState(false)
	const [overrideRequest, setOverrideRequest] = useState<{
		athleteId: string
		mentorId: string
	} | null>(null)
	const [pending, startTransition] = useTransition()

	const unpairedAthletes = athletes
		.filter((athlete) => !athlete.currentMentor)
		.sort(compareAthletes)
	const pairedAthletes = athletes
		.filter((athlete) => athlete.currentMentor)
		.sort(compareAthletes)
	const requestedCount = unpairedAthletes.filter(
		(athlete) => athlete.wantsMentor,
	).length
	const openMentorCount = mentors.filter(
		(mentor) => mentor.currentAthletes.length === 0,
	).length

	const athleteSearch = athleteQuery.trim().toLowerCase()
	const mentorSearch = mentorQuery.trim().toLowerCase()

	const visibleUnpairedAthletes = unpairedAthletes.filter((athlete) => {
		if (!athleteSearch) return true
		return (
			athlete.name.toLowerCase().includes(athleteSearch) ||
			athlete.race.toLowerCase().includes(athleteSearch)
		)
	})

	useEffect(() => {
		if (visibleUnpairedAthletes.length === 0) {
			setSelectedAthleteId(null)
			return
		}

		if (
			selectedAthleteId &&
			visibleUnpairedAthletes.some(
				(athlete) => athlete.applicationId === selectedAthleteId,
			)
		) {
			return
		}

		setSelectedAthleteId(visibleUnpairedAthletes[0]?.applicationId ?? null)
	}, [selectedAthleteId, visibleUnpairedAthletes])

	const selectedAthlete =
		visibleUnpairedAthletes.find(
			(athlete) => athlete.applicationId === selectedAthleteId,
		) ?? null

	const mentorCards = mentors
		.map((mentor) => ({
			mentor,
			compatibility: selectedAthlete
				? evaluateCompatibility(selectedAthlete, mentor)
				: DEFAULT_COMPATIBILITY,
		}))
		.filter(({ mentor }) => {
			if (!mentorSearch) return true
			return mentorSearchText(mentor).includes(mentorSearch)
		})
		.sort((left, right) => {
			const rank: Record<Compatibility['status'], number> = {
				aligned: 0,
				needs_review: 1,
				conflict: 2,
			}

			if (
				rank[left.compatibility.status] !== rank[right.compatibility.status]
			) {
				return (
					rank[left.compatibility.status] - rank[right.compatibility.status]
				)
			}

			if (
				left.mentor.currentAthletes.length !==
				right.mentor.currentAthletes.length
			) {
				return (
					left.mentor.currentAthletes.length -
					right.mentor.currentAthletes.length
				)
			}

			return left.mentor.name.localeCompare(right.mentor.name)
		})

	const safeMentorCards = mentorCards.filter(
		({ compatibility }) => compatibility.status !== 'conflict',
	)
	const visibleMentorCards =
		showConflictMentors || safeMentorCards.length === 0
			? mentorCards
			: safeMentorCards
	const hiddenConflictCount = mentorCards.length - visibleMentorCards.length

	function updateLocalPairing(athleteId: string, mentorId: string) {
		const athlete = athletes.find((item) => item.applicationId === athleteId)
		const mentor = mentors.find((item) => item.applicationId === mentorId)
		if (!athlete || !mentor) return

		const matchedAt = new Date()

		const nextAthletes = athletes
			.map((item) => {
				if (item.applicationId !== athleteId) return item
				return {
					...item,
					currentMentor: {
						applicationId: mentor.applicationId,
						name: mentor.name,
						avatarUrl: mentor.avatarUrl,
						matchedAt,
					},
				}
			})
			.sort(compareAthletes)

		const nextMentors = mentors
			.map((item) => {
				if (item.applicationId !== mentorId) return item
				return {
					...item,
					currentAthletes: sortedCurrentAthletes({
						...item,
						currentAthletes: [
							...item.currentAthletes,
							{
								applicationId: athlete.applicationId,
								userId: athlete.userId,
								name: athlete.name,
								race: athlete.race,
								raceDate: athlete.raceDate,
								wantsMentor: athlete.wantsMentor,
								avatarUrl: athlete.avatarUrl,
								matchedAt,
							},
						],
					}),
				}
			})
			.sort(
				(left, right) =>
					left.currentAthletes.length - right.currentAthletes.length ||
					left.name.localeCompare(right.name),
			)

		setAthletes(nextAthletes)
		setMentors(nextMentors)
		setShowConflictMentors(false)

		const nextId = nextSelectionId(nextAthletes)
		setSelectedAthleteId(nextId)
	}

	function submitAssignment(
		athleteId: string,
		mentorId: string,
		allowPreferenceOverride = false,
	) {
		startTransition(async () => {
			const formData = new FormData()
			formData.set('fundApplicationId', athleteId)
			formData.set('mentorApplicationId', mentorId)
			if (allowPreferenceOverride) {
				formData.set('allowPreferenceOverride', 'true')
			}

			const result = await assignFundApplicationMentor(formData)

			if (!result.success) {
				toast.error(result.error || 'Unable to save mentor pairing.')
				return
			}

			updateLocalPairing(athleteId, mentorId)
			toast.success('Mentor pairing saved.')
			router.refresh()
		})
	}

	function attemptAssignment(athlete: PairingAthlete, mentor: PairingMentor) {
		const compatibility = evaluateCompatibility(athlete, mentor)
		if (compatibility.requiresPreferenceOverride) {
			setOverrideRequest({
				athleteId: athlete.applicationId,
				mentorId: mentor.applicationId,
			})
			return
		}

		submitAssignment(athlete.applicationId, mentor.applicationId)
	}

	const overrideAthlete = overrideRequest
		? (athletes.find(
				(athlete) => athlete.applicationId === overrideRequest.athleteId,
			) ?? null)
		: null
	const overrideMentor = overrideRequest
		? (mentors.find(
				(mentor) => mentor.applicationId === overrideRequest.mentorId,
			) ?? null)
		: null

	return (
		<>
			<div className="space-y-6">
				{/* ── Page header ────────────────────────────────────────── */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight">
							Mentor Pairings
						</h1>
						<p className="text-muted-foreground mt-1 text-sm">
							{unpairedAthletes.length > 0 ? (
								<>
									<span className="text-foreground font-medium">
										{unpairedAthletes.length}
									</span>{' '}
									waiting
									{requestedCount > 0 && <> ({requestedCount} requested)</>}
									{' · '}
									<span className="text-foreground font-medium">
										{openMentorCount}
									</span>{' '}
									mentors open
									{' · '}
									<span className="text-foreground font-medium">
										{pairedAthletes.length}
									</span>{' '}
									active pairs
								</>
							) : (
								<>
									All athletes paired{' · '}
									<span className="text-foreground font-medium">
										{pairedAthletes.length}
									</span>{' '}
									active pairs
								</>
							)}
						</p>
					</div>
				</div>

				{/* ── Tabs ───────────────────────────────────────────────── */}
				<Tabs defaultValue="assign">
					<TabsList>
						<TabsTrigger value="assign">
							<Users className="size-3.5" />
							Assignment
							{unpairedAthletes.length > 0 && (
								<Badge
									variant="secondary"
									className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-[10px]"
								>
									{unpairedAthletes.length}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="pairings">
							<ShieldCheck className="size-3.5" />
							Active Pairings
						</TabsTrigger>
					</TabsList>

					{/* ── Assignment tab ──────────────────────────────────── */}
					<TabsContent value="assign" className="mt-6">
						{unpairedAthletes.length === 0 && !athleteSearch ? (
							<div className="border-border/60 bg-card rounded-xl border py-16 text-center">
								<div className="mx-auto max-w-sm space-y-3">
									<div className="bg-secondary/60 mx-auto flex size-12 items-center justify-center rounded-full">
										<CheckCircle2 className="text-primary size-6" />
									</div>
									<p className="text-lg font-medium">All athletes are paired</p>
									<p className="text-muted-foreground text-sm">
										No one is waiting for a mentor right now. Check the Active
										Pairings tab to review current matches.
									</p>
								</div>
							</div>
						) : (
							<div className="grid gap-6 lg:grid-cols-2">
								{/* ── Left column: Athletes ──────────────── */}
								<div className="min-w-0">
									<div className="mb-3 flex items-center justify-between gap-3">
										<h2 className="text-sm font-medium">
											Athletes waiting
											<span className="text-muted-foreground ml-1.5 font-normal">
												{visibleUnpairedAthletes.length}
											</span>
										</h2>
									</div>

									<div className="relative mb-3">
										<Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
										<Input
											value={athleteQuery}
											onChange={(e) => setAthleteQuery(e.target.value)}
											placeholder="Search name or race…"
											className="bg-background h-9 rounded-lg pl-9 text-sm"
										/>
									</div>

									<ScrollArea className="h-[min(68vh,780px)]">
										<div className="space-y-1 pr-3">
											{visibleUnpairedAthletes.length === 0 ? (
												<div className="text-muted-foreground py-12 text-center text-sm">
													{unpairedAthletes.length === 0
														? 'Everyone is paired.'
														: 'No athletes match this search.'}
												</div>
											) : (
												visibleUnpairedAthletes.map((athlete) => {
													const selected =
														athlete.applicationId ===
														selectedAthlete?.applicationId

													return (
														<button
															key={athlete.applicationId}
															type="button"
															onClick={() =>
																setSelectedAthleteId(athlete.applicationId)
															}
															className={cn(
																'group w-full rounded-lg border px-3 py-2.5 text-left transition',
																selected
																	? 'border-primary/30 bg-primary/8 shadow-sm'
																	: 'hover:bg-accent/40 border-transparent',
															)}
														>
															<div className="flex items-center gap-3">
																<Avatar className="border-border/50 size-9 border">
																	{athlete.avatarUrl ? (
																		<AvatarImage
																			src={athlete.avatarUrl}
																			alt={athlete.name}
																		/>
																	) : null}
																	<AvatarFallback className="bg-secondary text-secondary-foreground text-[10px] font-semibold">
																		{initialsFromName(athlete.name)}
																	</AvatarFallback>
																</Avatar>
																<div className="min-w-0 flex-1">
																	<div className="flex items-center gap-2">
																		<p className="truncate text-sm font-medium">
																			{athlete.name}
																		</p>
																		{athlete.wantsMentor && (
																			<span className="bg-primary/15 text-primary-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
																				Requested
																			</span>
																		)}
																	</div>
																	<div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
																		<span className="truncate">
																			{athlete.race}
																		</span>
																		<span className="shrink-0">·</span>
																		<span className="shrink-0">
																			{compactDate(athlete.raceDate)}
																		</span>
																	</div>
																</div>
																{selected && (
																	<ArrowRight className="text-primary size-4 shrink-0" />
																)}
															</div>
														</button>
													)
												})
											)}
										</div>
									</ScrollArea>
								</div>

								{/* ── Right column: Mentor assignment ────── */}
								<div className="min-w-0">
									{selectedAthlete ? (
										<div className="space-y-5">
											{/* Context bar for the selected athlete */}
											<div className="border-primary/20 bg-primary/5 rounded-xl border p-4">
												<div className="flex items-center gap-3">
													<Avatar className="border-primary/20 size-10 border">
														{selectedAthlete.avatarUrl ? (
															<AvatarImage
																src={selectedAthlete.avatarUrl}
																alt={selectedAthlete.name}
															/>
														) : null}
														<AvatarFallback className="bg-primary/10 text-foreground text-xs font-semibold">
															{initialsFromName(selectedAthlete.name)}
														</AvatarFallback>
													</Avatar>
													<div className="min-w-0 flex-1">
														<p className="truncate text-sm font-semibold">
															Assigning mentor to {selectedAthlete.name}
														</p>
														<div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
															<span>{selectedAthlete.race}</span>
															<span>
																{formatDate(selectedAthlete.raceDate)}
															</span>
															{selectedAthlete.mentorGenderPreference ===
																'same-gender' && (
																<span className="font-medium text-amber-600 dark:text-amber-400">
																	Same-gender pref
																</span>
															)}
														</div>
													</div>
													<Button
														asChild
														variant="ghost"
														size="sm"
														className="text-muted-foreground shrink-0"
													>
														<Link
															href={`/admin/applications/${selectedAthlete.applicationId}`}
														>
															<ExternalLink className="size-3.5" />
														</Link>
													</Button>
												</div>
											</div>

											{/* Mentor search + conflict toggle */}
											<div className="flex items-center gap-2">
												<div className="relative flex-1">
													<Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
													<Input
														value={mentorQuery}
														onChange={(e) => setMentorQuery(e.target.value)}
														placeholder="Search mentors…"
														className="bg-background h-9 rounded-lg pl-9 text-sm"
													/>
												</div>
												{hiddenConflictCount > 0 && (
													<Button
														variant="ghost"
														size="sm"
														className="text-muted-foreground shrink-0 text-xs"
														onClick={() => setShowConflictMentors((c) => !c)}
													>
														{showConflictMentors
															? 'Hide conflicts'
															: `+${hiddenConflictCount} hidden`}
														<ChevronDown
															className={cn(
																'ml-1 size-3 transition',
																showConflictMentors && 'rotate-180',
															)}
														/>
													</Button>
												)}
											</div>

											{/* Conflict notice */}
											{hiddenConflictCount > 0 && !showConflictMentors && (
												<div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
													<CircleAlert className="size-3.5 shrink-0" />
													{hiddenConflictCount} mentor
													{hiddenConflictCount !== 1 && 's'} hidden due to
													preference conflicts.
												</div>
											)}

											{/* Mentor list */}
											<ScrollArea className="h-[min(56vh,640px)]">
												<div className="space-y-2 pr-3">
													{visibleMentorCards.length === 0 ? (
														<div className="text-muted-foreground py-12 text-center text-sm">
															No mentors match this search.
														</div>
													) : (
														visibleMentorCards.map(
															({ mentor, compatibility }) => (
																<div
																	key={mentor.applicationId}
																	className={cn(
																		'group rounded-xl border p-4 transition',
																		compatibility.status === 'conflict'
																			? 'border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20'
																			: compatibility.status === 'needs_review'
																				? 'border-amber-200 bg-amber-50/40 dark:border-amber-900/30 dark:bg-amber-950/15'
																				: 'border-border/60 bg-card hover:border-border',
																	)}
																>
																	<div className="flex items-start gap-3">
																		<Avatar className="border-border/50 size-10 border">
																			{mentor.avatarUrl ? (
																				<AvatarImage
																					src={mentor.avatarUrl}
																					alt={mentor.name}
																				/>
																			) : null}
																			<AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
																				{initialsFromName(mentor.name)}
																			</AvatarFallback>
																		</Avatar>
																		<div className="min-w-0 flex-1">
																			<div className="flex items-center gap-2">
																				<p className="truncate text-sm font-medium">
																					{mentor.name}
																				</p>
																				<CompatibilityDot
																					status={compatibility.status}
																				/>
																				<span className="text-muted-foreground text-xs">
																					{compatibility.label}
																				</span>
																			</div>
																			<p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
																				{mentorSummary(mentor)}
																			</p>
																			<div className="mt-2 flex flex-wrap items-center gap-2">
																				{mentor.currentAthletes.length === 0 ? (
																					<span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
																						<UserRoundPlus className="size-3" />
																						No athletes yet
																					</span>
																				) : (
																					<span className="text-muted-foreground text-xs">
																						{countLabel(
																							mentor.currentAthletes.length,
																							'athlete',
																						)}
																					</span>
																				)}
																				{mentor.currentAthletes.length > 0 && (
																					<div className="flex -space-x-1.5">
																						{mentor.currentAthletes
																							.slice(0, 4)
																							.map((a) => (
																								<Avatar
																									key={a.applicationId}
																									className="border-card size-5 border"
																								>
																									{a.avatarUrl ? (
																										<AvatarImage
																											src={a.avatarUrl}
																											alt={a.name}
																										/>
																									) : null}
																									<AvatarFallback className="text-[7px]">
																										{initialsFromName(a.name)}
																									</AvatarFallback>
																								</Avatar>
																							))}
																						{mentor.currentAthletes.length >
																							4 && (
																							<span className="text-muted-foreground flex size-5 items-center justify-center rounded-full bg-neutral-200 text-[8px] dark:bg-neutral-700">
																								+
																								{mentor.currentAthletes.length -
																									4}
																							</span>
																						)}
																					</div>
																				)}
																			</div>
																		</div>
																		<div className="flex shrink-0 items-center gap-1">
																			<Button
																				size="sm"
																				onClick={() =>
																					attemptAssignment(
																						selectedAthlete,
																						mentor,
																					)
																				}
																				disabled={pending || readOnly}
																				className="h-8 rounded-lg px-3 text-xs"
																				{...disabledMeta}
																			>
																				{pending ? 'Saving…' : `Pair`}
																			</Button>
																			<Button
																				asChild
																				variant="ghost"
																				size="sm"
																				className="text-muted-foreground h-8 w-8 p-0"
																			>
																				<Link
																					href={`/admin/mentor-applications/${mentor.applicationId}`}
																				>
																					<ExternalLink className="size-3.5" />
																				</Link>
																			</Button>
																		</div>
																	</div>
																</div>
															),
														)
													)}
												</div>
											</ScrollArea>
										</div>
									) : (
										<div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
											Select an athlete to begin pairing.
										</div>
									)}
								</div>
							</div>
						)}
					</TabsContent>

					{/* ── Active Pairings tab ─────────────────────────────── */}
					<TabsContent value="pairings" className="mt-6">
						<ActivePairingsPanel mentors={mentors} />
					</TabsContent>
				</Tabs>
			</div>

			{/* ── Override confirmation ────────────────────────────────── */}
			<AlertDialog
				open={Boolean(overrideRequest)}
				onOpenChange={(open) => {
					if (!open) setOverrideRequest(null)
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirm preference override</AlertDialogTitle>
						<AlertDialogDescription>
							{overrideAthlete && overrideMentor ? (
								<>
									Pairing <strong>{overrideAthlete.name}</strong> with{' '}
									<strong>{overrideMentor.name}</strong> conflicts with a stated
									same-gender preference. Only continue if this is intentional.
								</>
							) : (
								'This pairing conflicts with a stated same-gender preference.'
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (!overrideRequest) return
								submitAssignment(
									overrideRequest.athleteId,
									overrideRequest.mentorId,
									true,
								)
								setOverrideRequest(null)
							}}
						>
							Continue with override
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
