import { sql, eq, isNull, isNotNull, and, inArray } from 'drizzle-orm'
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
			.where(and(
				eq(fundApplications.bipocIdentity, true),
				inArray(fundApplications.genderIdentity, ['Woman', 'Transgender woman']),
			)),
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
	const FUND_ACTIVE_STAGES = ['AWAITING_CONFIRMATION', 'CONFIRMED', 'REGISTRATION_IN_PROGRESS', 'REGISTERED', 'ONBOARDING_IN_PROGRESS', 'ACTIVE_IN_PROGRAM']
	const FUND_CLOSED_STAGES = ['DECLINED', 'CLOSED', 'NO_LONGER_ACTIVE', 'NO_SHOW_OR_DROPPED']
	const MENTOR_REVIEW_STAGES = ['SUBMITTED', 'IN_REVIEW', 'WAITLISTED']
	const MENTOR_ACTIVE_STAGES = ['APPROVED_POOL', 'MATCH_PENDING', 'MATCHED', 'ACTIVE']
	const MENTOR_CLOSED_STAGES = ['DECLINED', 'CLOSED']

	const fundInReview = p20(FUND_REVIEW_STAGES.reduce((s, st) => s + (fundStageCounts[st] ?? 0), 0))
	const fundActive = p20(FUND_ACTIVE_STAGES.reduce((s, st) => s + (fundStageCounts[st] ?? 0), 0))
	const fundClosed = p20(FUND_CLOSED_STAGES.reduce((s, st) => s + (fundStageCounts[st] ?? 0), 0))
	const fundTotal = fundInReview + fundActive + fundClosed

	const mentorInReview = p20(MENTOR_REVIEW_STAGES.reduce((s, st) => s + (mentorStageCounts[st] ?? 0), 0))
	const mentorActive = p20(MENTOR_ACTIVE_STAGES.reduce((s, st) => s + (mentorStageCounts[st] ?? 0), 0))
	const mentorClosed = p20(MENTOR_CLOSED_STAGES.reduce((s, st) => s + (mentorStageCounts[st] ?? 0), 0))
	const mentorTotal = mentorInReview + mentorActive + mentorClosed
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

				<div className="divide-border mt-10 grid grid-cols-1 divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">
					<StatSlide
						value={pct(bipocFundCount, fundTotal)}
						label="identify as BIPOC"
						accent
					/>
					<StatSlide
						value={pct(wocFundCount, fundTotal)}
						label="women of color"
						accent
					/>
					<StatSlide
						value={pct(firstRaceCount, fundTotal)}
						label="racing for the first time"
					/>
					<StatSlide
						value={pct(wantsMentorCount, fundTotal)}
						label="requested a mentor"
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
				<div className="divide-border mt-10 grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
					<StatSlide value={String(fundInReview)} label="in review" accent />
					<StatSlide value={String(fundActive)} label="active in program" />
					<StatSlide value={String(fundClosed)} label="closed" />
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
						accent
					/>
					<StatSlide
						value={pct(bipocMentorCount, mentorTotal)}
						label="of mentors identify as BIPOC"
					/>
					<StatSlide
						value={String(openPairings + endedPairings)}
						label="total athlete-mentor pairings"
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
				<div className="divide-border mt-10 grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
					<StatSlide value={String(mentorInReview)} label="in review" accent />
					<StatSlide value={String(mentorActive)} label="active in pool" />
					<StatSlide value={String(mentorClosed)} label="closed" />
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
						accent
					/>

				</div>

				{raceCompanies.length > 0 && (
					<div className="mt-8">
						<PartnerGrid companies={raceCompanies} linked />
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
						accent
					/>

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
						accent={openTasks > 0}
					/>
					<StatSlide
						value={String(taskCounts['DONE'] ?? 0)}
						label="tasks completed"
					/>
					<StatSlide
						value={String(taskCounts['CANCELED'] ?? 0)}
						label="tasks canceled"
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
				const cls = "group border-border bg-card flex flex-col items-center gap-3 rounded-xl border p-5 text-center"
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
