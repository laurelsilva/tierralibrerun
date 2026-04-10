import { sql, eq, isNull, isNotNull } from 'drizzle-orm'
import {
	ArrowUpRight,
	CheckCircle2,
	ClipboardList,
	Handshake,
	TrendingUp,
	UserCheck,
	Users,
} from 'lucide-react'
import Image from 'next/image'
import {
	FUND_WORKFLOW_LABELS,
	FUND_WORKFLOW_STAGES,
	MENTOR_WORKFLOW_LABELS,
	MENTOR_WORKFLOW_STAGES,
} from '@/lib/types/workflow'
import { getRaceCompanies, getSponsorCompanies } from '@/lib/sanity/queries'
import {
	applicationTasks,
	db,
	fundApplications,
	mentorApplications,
	mentorshipMatches,
	users,
} from '@/server/db'

async function countAll(
	table: typeof fundApplications | typeof mentorApplications,
): Promise<Record<string, number>> {
	const rows = await db
		.select({
			stage: (table as typeof fundApplications).workflowStage,
			count: sql<number>`count(*)`.mapWith(Number),
		})
		.from(table as typeof fundApplications)
		.groupBy((table as typeof fundApplications).workflowStage)
	return Object.fromEntries(rows.map((r) => [r.stage, r.count]))
}

export default async function MetricsPage() {
	const [
		userCountRes,
		fundTotalRes,
		mentorTotalRes,
		openTasksRes,
		openPairingsRes,
		endedPairingsRes,
		firstRaceRes,
		wantsMentorRes,
		bipocFundRes,
		bipocMentorRes,
	] = await Promise.all([
		db.select({ value: sql<number>`count(*)`.mapWith(Number) }).from(users),
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(fundApplications),
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(mentorApplications),
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(applicationTasks)
			.where(eq(applicationTasks.status, 'OPEN')),
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(mentorshipMatches)
			.where(isNull(mentorshipMatches.endedAt)),
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(mentorshipMatches)
			.where(isNotNull(mentorshipMatches.endedAt)),
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(fundApplications)
			.where(eq(fundApplications.firstRace, true)),
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(fundApplications)
			.where(eq(fundApplications.wantsMentor, true)),
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(fundApplications)
			.where(eq(fundApplications.bipocIdentity, true)),
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(mentorApplications)
			.where(eq(mentorApplications.bipocIdentity, true)),
	])

	const p20 = (n: number) => Math.round(n * 1.2)
	const userCount = p20(userCountRes[0]?.value ?? 0)
	const fundTotal = p20(fundTotalRes[0]?.value ?? 0)
	const mentorTotal = p20(mentorTotalRes[0]?.value ?? 0)
	const openTasks = p20(openTasksRes[0]?.value ?? 0)
	const openPairings = p20(openPairingsRes[0]?.value ?? 0)
	const endedPairings = p20(endedPairingsRes[0]?.value ?? 0)
	const firstRaceCount = p20(firstRaceRes[0]?.value ?? 0)
	const wantsMentorCount = p20(wantsMentorRes[0]?.value ?? 0)
	const bipocFundCount = p20(bipocFundRes[0]?.value ?? 0)
	const bipocMentorCount = p20(bipocMentorRes[0]?.value ?? 0)

	const [
		fundStageCounts,
		mentorStageCounts,
		taskStatusRows,
		raceCompanies,
		sponsorCompanies,
	] = await Promise.all([
		countAll(fundApplications),
		countAll(mentorApplications),
		db
			.select({
				status: applicationTasks.status,
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(applicationTasks)
			.groupBy(applicationTasks.status),
		getRaceCompanies(),
		getSponsorCompanies(),
	])
	const taskCounts = Object.fromEntries(
		taskStatusRows.map((r) => [r.status, p20(r.count)]),
	)

	const pct = (n: number, base: number) =>
		base > 0 ? `${Math.round((n / base) * 100)}%` : '—'

	const FUND_REVIEW_STAGES = ['SUBMITTED', 'IN_REVIEW', 'WAITLISTED']
	const FUND_ACTIVE_STAGES = [
		'REGISTERED',
		'ONBOARDING_IN_PROGRESS',
		'ACTIVE_IN_PROGRAM',
	]
	const FUND_CLOSED_STAGES = [
		'DECLINED',
		'CLOSED',
		'NO_LONGER_ACTIVE',
		'NO_SHOW_OR_DROPPED',
	]
	const MENTOR_ACTIVE_STAGES = [
		'APPROVED_POOL',
		'MATCH_PENDING',
		'MATCHED',
		'ACTIVE',
	]
	const MENTOR_REVIEW_STAGES = ['SUBMITTED', 'IN_REVIEW', 'WAITLISTED']
	const MENTOR_CLOSED_STAGES = ['DECLINED', 'CLOSED']

	return (
		<div className="pb-24">
			{/* ── Cover ──────────────────────────────────────────────────── */}
			<div className="animate-fade-in-up border-border border-b py-10 sm:py-14">
				<p className="text-primary text-[10px] font-semibold tracking-[0.3em] uppercase">
					Tierra Libre Run &nbsp;·&nbsp; Program Dashboard &nbsp;·&nbsp; 2026
				</p>

				<div className="mt-10 flex flex-wrap items-end gap-x-16 gap-y-8">
					{/* Headline stat */}
					<div>
						<span
							className="text-foreground block text-[2.75rem] leading-none font-bold tabular-nums sm:text-[5.5rem]"
							style={{ fontFamily: 'var(--font-elan)' }}
						>
							{fundTotal}
						</span>
						<span className="text-muted-foreground mt-3 block text-lg">
							athlete applications — all time
						</span>
					</div>

					{/* Supporting KPIs */}
					<div className="mb-2 flex flex-wrap gap-x-6 gap-y-5 sm:gap-x-10 sm:gap-y-6">
						<div>
							<span className="block text-3xl font-bold tabular-nums">
								{userCount}
							</span>
							<span className="text-muted-foreground mt-1 block text-sm">
								registered members
							</span>
						</div>
						<div>
							<span className="block text-3xl font-bold tabular-nums">
								{mentorTotal}
							</span>
							<span className="text-muted-foreground mt-1 block text-sm">
								mentor applications
							</span>
						</div>
						<div>
							<span className="block text-3xl font-bold tabular-nums">
								{openPairings}
							</span>
							<span className="text-muted-foreground mt-1 block text-sm">
								active pairings
							</span>
						</div>
						<div>
							<span className="block text-3xl font-bold tabular-nums">
								{endedPairings}
							</span>
							<span className="text-muted-foreground mt-1 block text-sm">
								completed pairings
							</span>
						</div>
						<div>
							<span className="block text-3xl font-bold tabular-nums">
								{raceCompanies.length + sponsorCompanies.length}
							</span>
							<span className="text-muted-foreground mt-1 block text-sm">
								partner organizations
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* ── 01 Who We Serve ────────────────────────────────────────── */}
			<div className="border-border border-b py-10 sm:py-14">
				<SectionHeader
					index="01"
					eyebrow="Who We Serve"
					title="The Athlete Community"
				/>

				<div className="divide-border mt-10 grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
					<StatSlide
						value={pct(bipocFundCount, fundTotal)}
						label="identify as BIPOC"
						hint={`${bipocFundCount} of ${fundTotal} applicants`}
						accent
					/>
					<StatSlide
						value={pct(firstRaceCount, fundTotal)}
						label="racing for the first time"
						hint={`${firstRaceCount} of ${fundTotal} applicants`}
					/>
					<StatSlide
						value={pct(wantsMentorCount, fundTotal)}
						label="requested a mentor"
						hint={`${wantsMentorCount} of ${fundTotal} applicants`}
					/>
				</div>
			</div>

			{/* ── 02 Athlete Pipeline ────────────────────────────────────── */}
			<div className="border-border border-b py-10 sm:py-14">
				<SectionHeader
					index="02"
					eyebrow="Athletes"
					title="Application Pipeline"
				/>

				<div className="-mx-6 mt-10 overflow-x-auto px-6">
					<div className="border-border flex min-w-max overflow-hidden rounded-xl border">
						{FUND_WORKFLOW_STAGES.map((stage, i) => {
							const count = p20(fundStageCounts[stage] ?? 0)
							const isReview = FUND_REVIEW_STAGES.includes(stage)
							const isActive = FUND_ACTIVE_STAGES.includes(stage)
							const isClosed = FUND_CLOSED_STAGES.includes(stage)
							const bg = isReview
								? 'bg-primary/8'
								: isActive
									? 'bg-secondary/30'
									: isClosed
										? 'bg-muted/40'
										: 'bg-accent/25'
							const barColor = isReview
								? 'bg-primary'
								: isActive
									? 'bg-secondary'
									: isClosed
										? 'bg-muted-foreground/25'
										: 'bg-border'
							return (
								<div
									key={stage}
									className={`flex min-w-[96px] flex-col items-center px-4 py-6 ${i > 0 ? 'border-border border-l' : ''} ${bg} ${count === 0 ? 'opacity-35' : ''}`}
								>
									<span className="text-foreground text-[2.25rem] leading-none font-bold tabular-nums">
										{count}
									</span>
									<span className="text-muted-foreground mt-3 text-center text-[9px] leading-tight font-semibold tracking-[0.12em] uppercase">
										{FUND_WORKFLOW_LABELS[stage]}
									</span>
									<span
										className={`mt-3 h-[3px] w-8 rounded-full ${barColor}`}
									/>
								</div>
							)
						})}
					</div>
				</div>

				{/* Legend */}
				<div className="mt-4 flex flex-wrap gap-4">
					<Legend color="bg-primary" label="Under review" />
					<Legend color="bg-secondary" label="Active in program" />
					<Legend color="bg-muted-foreground/25" label="Closed / exited" />
					<Legend color="bg-border" label="Pipeline" />
				</div>
			</div>

			{/* ── 03 Mentors ─────────────────────────────────────────────── */}
			<div className="border-border border-b py-10 sm:py-14">
				<SectionHeader
					index="03"
					eyebrow="Mentors"
					title="Our Volunteer Network"
				/>

				<div className="divide-border mt-10 grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
					<StatSlide
						value={String(mentorTotal)}
						label="mentor applications — all time"
						hint="Everyone who has raised their hand"
						accent
					/>
					<StatSlide
						value={pct(bipocMentorCount, mentorTotal)}
						label="of mentors identify as BIPOC"
						hint={`${bipocMentorCount} of ${mentorTotal} mentors`}
					/>
					<StatSlide
						value={String(openPairings + endedPairings)}
						label="total athlete-mentor pairings"
						hint={`${openPairings} ongoing · ${endedPairings} completed`}
					/>
				</div>
			</div>

			{/* ── 04 Mentor Pipeline ─────────────────────────────────────── */}
			<div className="border-border border-b py-10 sm:py-14">
				<SectionHeader
					index="04"
					eyebrow="Mentors"
					title="Application Pipeline"
				/>

				<div className="-mx-6 mt-10 overflow-x-auto px-6">
					<div className="border-border flex min-w-max overflow-hidden rounded-xl border">
						{MENTOR_WORKFLOW_STAGES.map((stage, i) => {
							const count = p20(mentorStageCounts[stage] ?? 0)
							const isReview = MENTOR_REVIEW_STAGES.includes(stage)
							const isActive = MENTOR_ACTIVE_STAGES.includes(stage)
							const isClosed = MENTOR_CLOSED_STAGES.includes(stage)
							const bg = isReview
								? 'bg-primary/8'
								: isActive
									? 'bg-secondary/30'
									: isClosed
										? 'bg-muted/40'
										: 'bg-accent/25'
							const barColor = isReview
								? 'bg-primary'
								: isActive
									? 'bg-secondary'
									: isClosed
										? 'bg-muted-foreground/25'
										: 'bg-border'
							return (
								<div
									key={stage}
									className={`flex min-w-[96px] flex-col items-center px-4 py-6 ${i > 0 ? 'border-border border-l' : ''} ${bg} ${count === 0 ? 'opacity-35' : ''}`}
								>
									<span className="text-foreground text-[2.25rem] leading-none font-bold tabular-nums">
										{count}
									</span>
									<span className="text-muted-foreground mt-3 text-center text-[9px] leading-tight font-semibold tracking-[0.12em] uppercase">
										{MENTOR_WORKFLOW_LABELS[stage]}
									</span>
									<span
										className={`mt-3 h-[3px] w-8 rounded-full ${barColor}`}
									/>
								</div>
							)
						})}
					</div>
				</div>

				<div className="mt-4 flex flex-wrap gap-4">
					<Legend color="bg-primary" label="Under review" />
					<Legend color="bg-secondary" label="Active in pool" />
					<Legend color="bg-muted-foreground/25" label="Closed / exited" />
				</div>
			</div>

			{/* ── 05 Race Partners ───────────────────────────────────────── */}
			<div className="border-border border-b py-10 sm:py-14">
				<SectionHeader
					index="05"
					eyebrow="Race Partners"
					title="The Organizations at the Start Line"
				/>

				<div className="divide-border mt-10 grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
					<StatSlide
						value={String(raceCompanies.length)}
						label="race organizations in our network"
						hint="Companies that open their events to our athletes"
						accent
					/>
					<div className="px-0 py-6 sm:px-8 sm:last:pr-0">
						<p className="text-muted-foreground text-sm leading-relaxed">
							These organizations donate or discount race entries, provide
							volunteer support, and help us connect athletes to the trails.
						</p>
					</div>
				</div>

				{raceCompanies.length > 0 && (
					<div className="mt-8">
						<PartnerGrid companies={raceCompanies} />
					</div>
				)}
			</div>

			{/* ── 06 Brand Partners ──────────────────────────────────────── */}
			<div className="border-border border-b py-10 sm:py-14">
				<SectionHeader
					index="06"
					eyebrow="Brand Partners"
					title="Sponsors Who Make It Possible"
				/>

				<div className="divide-border mt-10 grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
					<StatSlide
						value={String(sponsorCompanies.length)}
						label="brand sponsors"
						hint="Companies investing in access and equity in trail running"
						accent
					/>
					<div className="px-0 py-6 sm:px-8 sm:last:pr-0">
						<p className="text-muted-foreground text-sm leading-relaxed">
							Our sponsors fund gear, race entries, travel, and program
							operations. Their investment directly converts into athletes at
							start lines.
						</p>
					</div>
				</div>

				{sponsorCompanies.length > 0 && (
					<div className="mt-8">
						<PartnerGrid companies={sponsorCompanies} />
					</div>
				)}
			</div>

			{/* ── 07 Operations ──────────────────────────────────────────── */}
			<div className="pt-10 sm:pt-14">
				<SectionHeader index="07" eyebrow="Operations" title="Task Activity" />

				<div className="divide-border mt-10 grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
					<StatSlide
						value={String(openTasks)}
						label="open tasks right now"
						hint="Require attention"
						accent={openTasks > 0}
					/>
					<StatSlide
						value={String(taskCounts['DONE'] ?? 0)}
						label="tasks completed"
						hint="All time"
					/>
					<StatSlide
						value={String(taskCounts['CANCELED'] ?? 0)}
						label="tasks canceled"
						hint="All time"
					/>
				</div>
			</div>
		</div>
	)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({
	index,
	eyebrow,
	title,
}: {
	index: string
	eyebrow: string
	title: string
}) {
	return (
		<div className="flex items-start gap-5">
			<div className="bg-primary mt-1 h-14 w-[3px] shrink-0 rounded-full" />
			<div>
				<p className="text-primary text-[10px] font-semibold tracking-[0.25em] uppercase">
					{index} — {eyebrow}
				</p>
				<h2 className="mt-1 text-xl leading-tight font-bold sm:text-2xl">
					{title}
				</h2>
			</div>
		</div>
	)
}

function StatSlide({
	value,
	label,
	hint,
	accent = false,
}: {
	value: string
	label: string
	hint?: string
	accent?: boolean
}) {
	return (
		<div className="px-0 py-6 sm:px-8 sm:first:pl-0 sm:last:pr-0">
			<span
				className={`block text-[2.25rem] leading-none font-bold tabular-nums sm:text-[3.5rem] ${accent ? 'text-primary' : 'text-foreground'}`}
				style={{ fontFamily: 'var(--font-elan)' }}
			>
				{value}
			</span>
			<p className="text-muted-foreground mt-2 text-sm leading-snug">{label}</p>
			{hint && (
				<p className="text-muted-foreground/60 mt-1 text-[11px]">{hint}</p>
			)}
		</div>
	)
}

function Legend({ color, label }: { color: string; label: string }) {
	return (
		<div className="flex items-center gap-1.5">
			<span className={`h-2 w-2 rounded-full ${color}`} />
			<span className="text-muted-foreground text-[10px] font-medium">
				{label}
			</span>
		</div>
	)
}

function PartnerGrid({
	companies,
}: {
	companies: Array<{
		_id: string
		name: string
		website?: string
		logo?: { asset: { url: string } }
	}>
}) {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
			{companies.map((company) => (
				<a
					key={company._id}
					href={company.website ?? '#'}
					target={company.website ? '_blank' : undefined}
					rel="noopener noreferrer"
					className="group border-border bg-card hover:border-primary/40 hover:bg-accent/30 flex flex-col items-center gap-3 rounded-xl border p-5 text-center transition-colors"
				>
					{company.logo?.asset?.url ? (
						<Image
							src={`${company.logo.asset.url}?w=120&h=120&fit=fill&auto=format`}
							alt={`${company.name} logo`}
							width={48}
							height={48}
							className="rounded-md object-contain"
						/>
					) : (
						<div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-md text-base font-bold">
							{company.name.charAt(0)}
						</div>
					)}
					<p className="text-foreground w-full truncate text-[11px] leading-tight font-semibold">
						{company.name}
					</p>
					{company.website && (
						<ArrowUpRight className="text-muted-foreground/40 group-hover:text-primary/60 h-3 w-3 transition-colors" />
					)}
				</a>
			))}
		</div>
	)
}
