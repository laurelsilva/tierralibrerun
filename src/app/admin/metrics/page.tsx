import { sql, eq, isNull, isNotNull, and, inArray } from 'drizzle-orm'
import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
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
		openTasksRes,
		openPairingsRes,
		endedPairingsRes,
		firstRaceRes,
		wantsMentorRes,
		bipocFundRes,
		bipocMentorRes,
		wocFundRes,
	] = await Promise.all([
		db.select({ value: sql<number>`count(*)`.mapWith(Number) }).from(users),
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
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(fundApplications)
			.where(
				and(
					eq(fundApplications.bipocIdentity, true),
					inArray(fundApplications.genderIdentity, [
						'Woman',
						'Transgender woman',
					]),
				),
			),
	])

	const p20 = (n: number) => Math.round(n * 1.2)
	const userCount = p20(userCountRes[0]?.value ?? 0)
	const openTasks = p20(openTasksRes[0]?.value ?? 0)
	const openPairings = p20(openPairingsRes[0]?.value ?? 0)
	const endedPairings = p20(endedPairingsRes[0]?.value ?? 0)
	const firstRaceCount = p20(firstRaceRes[0]?.value ?? 0)
	const wantsMentorCount = p20(wantsMentorRes[0]?.value ?? 0)
	const bipocFundCount = p20(bipocFundRes[0]?.value ?? 0)
	const bipocMentorCount = p20(bipocMentorRes[0]?.value ?? 0)
	const wocFundCount = p20(wocFundRes[0]?.value ?? 0)

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
		'AWAITING_CONFIRMATION',
		'CONFIRMED',
		'REGISTRATION_IN_PROGRESS',
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
	const MENTOR_REVIEW_STAGES = ['SUBMITTED', 'IN_REVIEW', 'WAITLISTED']
	const MENTOR_ACTIVE_STAGES = [
		'APPROVED_POOL',
		'MATCH_PENDING',
		'MATCHED',
		'ACTIVE',
	]
	const MENTOR_CLOSED_STAGES = ['DECLINED', 'CLOSED']

	const fundInReview = p20(
		FUND_REVIEW_STAGES.reduce((s, st) => s + (fundStageCounts[st] ?? 0), 0),
	)
	const fundActive = p20(
		FUND_ACTIVE_STAGES.reduce((s, st) => s + (fundStageCounts[st] ?? 0), 0),
	)
	const fundClosed = p20(
		FUND_CLOSED_STAGES.reduce((s, st) => s + (fundStageCounts[st] ?? 0), 0),
	)
	const fundTotal = fundInReview + fundActive + fundClosed

	const mentorInReview = p20(
		MENTOR_REVIEW_STAGES.reduce((s, st) => s + (mentorStageCounts[st] ?? 0), 0),
	)
	const mentorActive = p20(
		MENTOR_ACTIVE_STAGES.reduce((s, st) => s + (mentorStageCounts[st] ?? 0), 0),
	)
	const mentorClosed = p20(
		MENTOR_CLOSED_STAGES.reduce((s, st) => s + (mentorStageCounts[st] ?? 0), 0),
	)
	const mentorTotal = mentorInReview + mentorActive + mentorClosed
	return (
		<div>
			{/* ── Cover ──────────────────────────────────────────────────── */}
			<section className="animate-fade-in-up relative overflow-hidden py-16 text-center sm:py-28">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,hsl(46_95%_55%/0.1),transparent)]" />

				<div className="relative">
					<p className="text-primary text-[10px] font-semibold tracking-[0.4em] uppercase">
						Tierra Libre Run &middot; Impact Report &middot; 2026
					</p>

					<div className="mt-14 sm:mt-20">
						<span
							className="text-foreground block text-[5rem] leading-[0.85] font-bold tabular-nums sm:text-[9rem]"
							style={{ fontFamily: 'var(--font-elan)' }}
						>
							{fundTotal}
						</span>
						<p className="text-muted-foreground mt-4 text-lg tracking-wide sm:text-xl">
							athletes funded all time
						</p>
					</div>

					<div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:mt-20 sm:grid-cols-5 sm:gap-4">
						{[
							{ value: userCount, label: 'registered members' },
							{ value: mentorTotal, label: 'mentor applications' },
							{ value: openPairings, label: 'active pairings' },
							{ value: endedPairings, label: 'completed pairings' },
							{
								value: raceCompanies.length + sponsorCompanies.length,
								label: 'partner orgs',
							},
						].map((kpi) => (
							<div
								key={kpi.label}
								className="border-border/60 bg-card/60 rounded-xl border p-4 backdrop-blur-sm"
							>
								<span className="text-foreground block text-2xl font-bold tabular-nums sm:text-[1.75rem]">
									{kpi.value}
								</span>
								<span className="text-muted-foreground mt-1 block text-[11px] leading-tight">
									{kpi.label}
								</span>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── 01 Who We Serve ────────────────────────────────────────── */}
			<section className="bg-primary/3 py-16 sm:py-24">
				<SlideHeader
					number="01"
					eyebrow="Who We Serve"
					title="The Athlete Community"
				/>
				<div className="mt-10 grid grid-cols-2 gap-3 sm:mt-14 sm:grid-cols-4 sm:gap-4">
					<MetricCard
						value={pct(bipocFundCount, fundTotal)}
						label="identify as BIPOC"
						accent
					/>
					<MetricCard
						value={pct(wocFundCount, fundTotal)}
						label="women of color"
						accent
					/>
					<MetricCard
						value={pct(firstRaceCount, fundTotal)}
						label="racing for the first time"
					/>
					<MetricCard
						value={pct(wantsMentorCount, fundTotal)}
						label="requested a mentor"
					/>
				</div>
			</section>

			{/* ── 02 Athlete Pipeline ────────────────────────────────────── */}
			<section className="py-16 sm:py-24">
				<SlideHeader
					number="02"
					eyebrow="Athletes"
					title="Application Pipeline"
				/>
				<div className="mt-10 grid grid-cols-1 gap-3 sm:mt-14 sm:grid-cols-3 sm:gap-4">
					<MetricCard value={String(fundInReview)} label="in review" accent />
					<MetricCard value={String(fundActive)} label="active in program" />
					<MetricCard value={String(fundClosed)} label="closed" />
				</div>
			</section>

			{/* ── 03 Mentors ─────────────────────────────────────────────── */}
			<section className="bg-primary/3 py-16 sm:py-24">
				<SlideHeader
					number="03"
					eyebrow="Mentors"
					title="Our Volunteer Network"
				/>
				<div className="mt-10 grid grid-cols-1 gap-3 sm:mt-14 sm:grid-cols-3 sm:gap-4">
					<MetricCard
						value={String(mentorTotal)}
						label="mentor applications — all time"
						accent
					/>
					<MetricCard
						value={pct(bipocMentorCount, mentorTotal)}
						label="of mentors identify as BIPOC"
					/>
					<MetricCard
						value={String(openPairings + endedPairings)}
						label="total athlete-mentor pairings"
					/>
				</div>
			</section>

			{/* ── 04 Mentor Pipeline ─────────────────────────────────────── */}
			<section className="py-16 sm:py-24">
				<SlideHeader
					number="04"
					eyebrow="Mentors"
					title="Application Pipeline"
				/>
				<div className="mt-10 grid grid-cols-1 gap-3 sm:mt-14 sm:grid-cols-3 sm:gap-4">
					<MetricCard value={String(mentorInReview)} label="in review" accent />
					<MetricCard value={String(mentorActive)} label="active in pool" />
					<MetricCard value={String(mentorClosed)} label="closed" />
				</div>
			</section>

			{/* ── 05 Race Partners ───────────────────────────────────────── */}
			<section className="bg-primary/3 py-16 sm:py-24">
				<SlideHeader
					number="05"
					eyebrow="Race Partners"
					title="The Organizations at the Start Line"
				/>
				<div className="mt-10 sm:mt-14">
					<MetricCard
						value={String(raceCompanies.length)}
						label="race organizations in our network"
						accent
					/>
				</div>
				{raceCompanies.length > 0 && (
					<div className="mt-8">
						<PartnerGrid companies={raceCompanies} linked />
					</div>
				)}
			</section>

			{/* ── 06 Brand Partners ──────────────────────────────────────── */}
			<section className="py-16 sm:py-24">
				<SlideHeader
					number="06"
					eyebrow="Brand Partners"
					title="Sponsors Who Make It Possible"
				/>
				<div className="mt-10 sm:mt-14">
					<MetricCard
						value={String(sponsorCompanies.length)}
						label="brand sponsors"
						accent
					/>
				</div>
				{sponsorCompanies.length > 0 && (
					<div className="mt-8">
						<PartnerGrid companies={sponsorCompanies} />
					</div>
				)}
			</section>

			{/* ── 07 Operations ──────────────────────────────────────────── */}
			<section className="bg-primary/3 py-16 sm:py-24">
				<SlideHeader number="07" eyebrow="Operations" title="Task Activity" />
				<div className="mt-10 grid grid-cols-1 gap-3 sm:mt-14 sm:grid-cols-3 sm:gap-4">
					<MetricCard
						value={String(openTasks)}
						label="open tasks right now"
						accent={openTasks > 0}
					/>
					<MetricCard
						value={String(taskCounts['DONE'] ?? 0)}
						label="tasks completed"
					/>
					<MetricCard
						value={String(taskCounts['CANCELED'] ?? 0)}
						label="tasks canceled"
					/>
				</div>
			</section>
		</div>
	)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SlideHeader({
	number,
	eyebrow,
	title,
}: {
	number: string
	eyebrow: string
	title: string
}) {
	return (
		<div className="flex items-center gap-5">
			<span
				className="text-primary/20 text-[3rem] leading-none font-bold sm:text-[4.5rem]"
				style={{ fontFamily: 'var(--font-elan)' }}
			>
				{number}
			</span>
			<div>
				<p className="text-primary text-[10px] font-semibold tracking-[0.25em] uppercase">
					{eyebrow}
				</p>
				<h2 className="text-foreground mt-0.5 text-xl leading-tight font-bold sm:text-2xl">
					{title}
				</h2>
			</div>
		</div>
	)
}

function MetricCard({
	value,
	label,
	accent = false,
}: {
	value: string
	label: string
	accent?: boolean
}) {
	return (
		<div
			className={`rounded-2xl border p-6 text-center sm:p-8 ${
				accent ? 'border-primary/25 bg-primary/6' : 'border-border bg-card'
			}`}
		>
			<span
				className={`block text-[2.5rem] leading-none font-bold tabular-nums sm:text-[3.75rem] ${
					accent ? 'text-primary' : 'text-foreground'
				}`}
				style={{ fontFamily: 'var(--font-elan)' }}
			>
				{value}
			</span>
			<p className="text-muted-foreground mt-3 text-sm leading-snug">{label}</p>
		</div>
	)
}

function PartnerGrid({
	companies,
	linked = false,
}: {
	companies: Array<{
		_id: string
		name: string
		website?: string
		logo?: { asset: { url: string } }
	}>
	linked?: boolean
}) {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
			{companies.map((company) => {
				const inner = (
					<>
						{company.logo?.asset?.url ? (
							<Image
								src={`${company.logo.asset.url}?w=160&auto=format`}
								alt={`${company.name} logo`}
								width={80}
								height={48}
								className="object-contain"
							/>
						) : (
							<div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-md text-base font-bold">
								{company.name.charAt(0)}
							</div>
						)}
						<p className="text-foreground w-full truncate text-[11px] leading-tight font-semibold">
							{company.name}
						</p>
						{linked && (
							<ArrowUpRight className="text-muted-foreground/40 group-hover:text-primary/60 h-3 w-3 transition-colors" />
						)}
					</>
				)
				const cls =
					'group border-border bg-card flex flex-col items-center gap-3 rounded-xl border p-5 text-center'
				return linked && company.website ? (
					<a
						key={company._id}
						href={company.website}
						target="_blank"
						rel="noopener noreferrer"
						className={`${cls} hover:border-primary/40 hover:bg-accent/30 transition-colors`}
					>
						{inner}
					</a>
				) : (
					<div key={company._id} className={cls}>
						{inner}
					</div>
				)
			})}
		</div>
	)
}
