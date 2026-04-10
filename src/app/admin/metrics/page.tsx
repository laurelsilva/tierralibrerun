import { sql, eq, isNull, isNotNull, inArray } from 'drizzle-orm'
import {
	Users,
	ClipboardList,
	Handshake,
	TrendingUp,
	Heart,
	MapPin,
	Route,
	CheckCircle2,
	UserCheck,
	Trophy,
	Star,
	ArrowUpRight,
} from 'lucide-react'
import Image from 'next/image'
import { AdminStatsGrid } from '@/components/admin'
import {
	db,
	fundApplications,
	mentorApplications,
	mentorshipMatches,
} from '@/server/db'
import { getRaceCompanies } from '@/lib/sanity/queries'
import { client } from '@/lib/sanity/client'

const ACCEPTED_STAGES = [
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

const ACTIVE_MENTOR_STAGES = ['APPROVED_POOL', 'MATCH_PENDING', 'MATCHED', 'ACTIVE']

export default async function MetricsPage() {
	const [
		totalApplicationsRes,
		acceptedRes,
		declinedRes,
		pendingReviewRes,
		activeAthletesRes,
		activeMentorshipsRes,
		completedMentorshipsRes,
		bipocAthletesRes,
		firstRaceRes,
		wantsMentorRes,
		totalMentorAppsRes,
		activeMentorsRes,
		bipocMentorsRes,
	] = await Promise.all([
		db.select({ value: sql<number>`count(*)`.mapWith(Number) }).from(fundApplications),
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(fundApplications)
			.where(inArray(fundApplications.workflowStage, ACCEPTED_STAGES)),
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(fundApplications)
			.where(eq(fundApplications.workflowStage, 'DECLINED')),
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(fundApplications)
			.where(inArray(fundApplications.workflowStage, ['SUBMITTED', 'IN_REVIEW', 'WAITLISTED'])),
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(fundApplications)
			.where(eq(fundApplications.workflowStage, 'ACTIVE_IN_PROGRAM')),
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
			.where(eq(fundApplications.bipocIdentity, true)),
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(fundApplications)
			.where(eq(fundApplications.firstRace, true)),
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(fundApplications)
			.where(eq(fundApplications.wantsMentor, true)),
		db.select({ value: sql<number>`count(*)`.mapWith(Number) }).from(mentorApplications),
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(mentorApplications)
			.where(inArray(mentorApplications.workflowStage, ACTIVE_MENTOR_STAGES)),
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(mentorApplications)
			.where(eq(mentorApplications.bipocIdentity, true)),
	])

	const totalApplications = totalApplicationsRes[0]?.value ?? 0
	const accepted = acceptedRes[0]?.value ?? 0
	const declined = declinedRes[0]?.value ?? 0
	const pendingReview = pendingReviewRes[0]?.value ?? 0
	const activeAthletes = activeAthletesRes[0]?.value ?? 0
	const activeMentorships = activeMentorshipsRes[0]?.value ?? 0
	const completedMentorships = completedMentorshipsRes[0]?.value ?? 0
	const bipocAthletes = bipocAthletesRes[0]?.value ?? 0
	const firstRace = firstRaceRes[0]?.value ?? 0
	const wantsMentor = wantsMentorRes[0]?.value ?? 0
	const totalMentorApps = totalMentorAppsRes[0]?.value ?? 0
	const activeMentors = activeMentorsRes[0]?.value ?? 0
	const bipocMentors = bipocMentorsRes[0]?.value ?? 0

	const reviewed = accepted + declined
	const acceptanceRate = reviewed > 0 ? Math.round((accepted / reviewed) * 100) : 0
	const pct = (n: number, base = totalApplications) =>
		base > 0 ? `${Math.round((n / base) * 100)}%` : '—'

	const [raceCompanies, distanceDataRaw] = await Promise.all([
		getRaceCompanies(),
		client.fetch<{ total: number }>(`{
			"total": count(*[_type == "raceDistance" && raceSeries->date >= "2026-01-01" && raceSeries->date < "2027-01-01"])
		}`),
	])

	const distances2026 = distanceDataRaw?.total ?? 0

	return (
		<div className="space-y-12 pb-12">

			{/* ── Page header ───────────────────────────────────────── */}
			<div className="animate-fade-in-up border-b border-border pb-8">
				<div className="mb-2 flex items-center gap-2">
					<span className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
						Impact Report
					</span>
					<span className="h-px w-6 bg-primary/40" />
					<span className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
						2025 – 2026
					</span>
				</div>
				<h1 className="text-4xl font-bold tracking-tight">
					Measuring Our Mission
				</h1>
				<p className="mt-2 max-w-2xl text-base text-muted-foreground">
					We fund race entries, connect athletes with mentors, and work alongside
					race organizations to build belonging at the start line. Here is the work.
				</p>
			</div>

			{/* ══════════════════════════════════════════════════════
			 01 — ATHLETES
			 ══════════════════════════════════════════════════════ */}
			<section>
				{/* Section label */}
				<div className="mb-6 flex items-center gap-4">
					<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
						01
					</span>
					<div>
						<h2 className="text-xl font-bold leading-none">Athletes</h2>
						<p className="mt-0.5 text-sm text-muted-foreground">
							Funded entries · gear & resources · mentorship · community
						</p>
					</div>
				</div>

				<div className="space-y-8">
					{/* 2025 proof */}
					<div className="rounded-xl border border-border bg-accent/30 p-5">
						<div className="mb-4 flex items-center justify-between">
							<p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
								2025 Season
							</p>
							<span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
								Historical
							</span>
						</div>
						<AdminStatsGrid
							columns={4}
							items={[
								{
									label: 'Runners Funded',
									value: 80,
									icon: <Trophy className="h-5 w-5" />,
									variant: 'amber',
									hint: 'Reached the start line',
								},
								{
									label: 'Women of Color',
									value: 82,
									icon: <Users className="h-5 w-5" />,
									variant: 'purple',
									hint: 'Of funded race entries',
								},
								{
									label: 'First-Time Finishers',
									value: '60%',
									icon: <TrendingUp className="h-5 w-5" />,
									variant: 'green',
									hint: 'Had never raced before',
								},
								{
									label: 'Gear & Resources',
									value: 48,
									icon: <Heart className="h-5 w-5" />,
									variant: 'default',
									hint: 'Athletes supported with gear',
								},
							]}
						/>
					</div>

					{/* 2026 live pipeline */}
					<div>
						<div className="mb-3 flex items-center justify-between">
							<p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
								2026 Program
							</p>
							<span className="flex items-center gap-1.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
								<span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
								Live
							</span>
						</div>
						<AdminStatsGrid
							columns={4}
							items={[
								{
									label: 'Total Applications',
									value: totalApplications,
									icon: <ClipboardList className="h-5 w-5" />,
									variant: 'default',
									hint: 'All-time',
								},
								{
									label: 'Acceptance Rate',
									value: `${acceptanceRate}%`,
									icon: <CheckCircle2 className="h-5 w-5" />,
									variant: 'amber',
									hint: `${accepted} accepted · ${declined} declined`,
								},
								{
									label: 'In Review',
									value: pendingReview,
									icon: <ClipboardList className="h-5 w-5" />,
									variant: pendingReview > 0 ? 'amber' : 'default',
									hint: 'Awaiting decision',
								},
								{
									label: 'Active Athletes',
									value: activeAthletes,
									icon: <UserCheck className="h-5 w-5" />,
									variant: 'green',
									hint: 'Currently in program',
								},
							]}
						/>
					</div>

					{/* Cohort breakdown */}
					<div>
						<p className="mb-3 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
							Who We Serve
							{totalApplications > 0 && (
								<span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground/60">
									— {totalApplications} total applicants
								</span>
							)}
						</p>
						<AdminStatsGrid
							columns={3}
							items={[
								{
									label: 'BIPOC Athletes',
									value: bipocAthletes,
									icon: <Users className="h-5 w-5" />,
									variant: 'amber',
									hint: `${pct(bipocAthletes)} of applicants`,
								},
								{
									label: 'First-Time Racers',
									value: firstRace,
									icon: <TrendingUp className="h-5 w-5" />,
									variant: 'green',
									hint: `${pct(firstRace)} of applicants`,
								},
								{
									label: 'Requested Mentorship',
									value: wantsMentor,
									icon: <Heart className="h-5 w-5" />,
									variant: 'purple',
									hint: `${pct(wantsMentor)} of applicants`,
								},
							]}
						/>
					</div>
				</div>
			</section>

			{/* ── Divider ────────────────────────────────────────── */}
			<div className="flex items-center gap-4">
				<div className="h-px flex-1 bg-border" />
			</div>

			{/* ══════════════════════════════════════════════════════
			 02 — RACE PARTNERS
			 ══════════════════════════════════════════════════════ */}
			<section>
				<div className="mb-6 flex items-center gap-4">
					<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
						02
					</span>
					<div>
						<h2 className="text-xl font-bold leading-none">Race Partners</h2>
						<p className="mt-0.5 text-sm text-muted-foreground">
							Organizations building access alongside us at their events
						</p>
					</div>
				</div>

				<div className="space-y-6">
					<AdminStatsGrid
						columns={3}
						items={[
							{
								label: 'Partner Organizations',
								value: raceCompanies.length,
								icon: <MapPin className="h-5 w-5" />,
								variant: 'amber',
								hint: 'Race companies in our network',
							},
							{
								label: '2026 Distances',
								value: distances2026,
								icon: <Route className="h-5 w-5" />,
								variant: 'default',
								hint: 'Race distances available this year',
							},
							{
								label: 'Active Mentorships',
								value: activeMentorships,
								icon: <Handshake className="h-5 w-5" />,
								variant: 'green',
								hint: 'Athletes paired with mentors',
							},
						]}
					/>

					{/* Partner logo wall */}
					{raceCompanies.length > 0 && (
						<div className="rounded-xl border border-border bg-card p-5">
							<p className="mb-4 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
								Our Partners
							</p>
							<div className="flex flex-wrap gap-3">
								{raceCompanies.map((company) => (
									<a
										key={company._id}
										href={company.website ?? '#'}
										target="_blank"
										rel="noopener noreferrer"
										className="group flex items-center gap-2.5 rounded-lg border border-border bg-background px-3.5 py-2.5 transition-colors hover:border-primary/40 hover:bg-accent/40"
									>
										{company.logo?.asset?.url ? (
											<Image
												src={`${company.logo.asset.url}?w=80&h=80&fit=fill&auto=format`}
												alt={`${company.name} logo`}
												width={32}
												height={32}
												className="rounded object-contain"
											/>
										) : (
											<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
												{company.name.charAt(0)}
											</div>
										)}
										<div className="min-w-0">
											<p className="truncate text-sm font-medium leading-tight">{company.name}</p>
										</div>
										<ArrowUpRight className="ml-auto h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-50" />
									</a>
								))}
							</div>
						</div>
					)}
				</div>
			</section>

			{/* ── Divider ────────────────────────────────────────── */}
			<div className="flex items-center gap-4">
				<div className="h-px flex-1 bg-border" />
			</div>

			{/* ══════════════════════════════════════════════════════
			 03 — MENTORS
			 ══════════════════════════════════════════════════════ */}
			<section>
				<div className="mb-6 flex items-center gap-4">
					<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
						03
					</span>
					<div>
						<h2 className="text-xl font-bold leading-none">Mentors</h2>
						<p className="mt-0.5 text-sm text-muted-foreground">
							Experienced runners who volunteer their time, knowledge, and care
						</p>
					</div>
				</div>

				<AdminStatsGrid
					columns={4}
					items={[
						{
							label: 'Mentor Applications',
							value: totalMentorApps,
							icon: <ClipboardList className="h-5 w-5" />,
							variant: 'default',
							hint: 'All-time',
						},
						{
							label: 'Active Mentors',
							value: activeMentors,
							icon: <Star className="h-5 w-5" />,
							variant: 'amber',
							hint: 'Approved, matched, or active',
						},
						{
							label: 'Completed Pairings',
							value: completedMentorships,
							icon: <CheckCircle2 className="h-5 w-5" />,
							variant: 'green',
							hint: 'Mentorships finished',
						},
						{
							label: 'BIPOC Mentors',
							value: bipocMentors,
							icon: <Users className="h-5 w-5" />,
							variant: 'purple',
							hint: totalMentorApps > 0
								? `${Math.round((bipocMentors / totalMentorApps) * 100)}% of mentors`
								: '—',
						},
					]}
				/>
			</section>

		</div>
	)
}
