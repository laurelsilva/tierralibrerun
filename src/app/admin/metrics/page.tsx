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

const ACTIVE_MENTOR_STAGES = [
	'APPROVED_POOL',
	'MATCH_PENDING',
	'MATCHED',
	'ACTIVE',
]

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
			.where(
				inArray(fundApplications.workflowStage, ['SUBMITTED', 'IN_REVIEW', 'WAITLISTED']),
			),
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
		<div className="space-y-10">
			<div>
				<h1 className="text-3xl font-bold">Impact</h1>
				<p className="text-muted-foreground mt-1">
					Measuring the work we do — for our athletes, our partners, and our mentors.
				</p>
			</div>

			{/* ── ATHLETES ─────────────────────────────────────────── */}
			<section className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-6 md:p-8">
				<div className="mb-6 flex items-start gap-4 border-b border-emerald-200/50 pb-5">
					<div className="shrink-0 rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
						<Trophy className="h-5 w-5" />
					</div>
					<div>
						<h2 className="text-lg font-bold text-emerald-900">Athletes</h2>
						<p className="mt-0.5 text-sm text-emerald-800/70">
							We fund race entries, provide gear, and connect athletes with mentors —
							lowering every barrier between a runner and the start line.
						</p>
					</div>
				</div>

				<div className="space-y-7">
					<div>
						<p className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase">
							2025 Season — Historical
						</p>
						<AdminStatsGrid
							columns={4}
							items={[
								{
									label: 'Runners Funded',
									value: 80,
									icon: <CheckCircle2 className="h-5 w-5" />,
									variant: 'green',
									hint: 'Reached the start line',
								},
								{
									label: 'Women of Color',
									value: 82,
									icon: <Users className="h-5 w-5" />,
									variant: 'amber',
									hint: 'Of funded race entries',
								},
								{
									label: 'First-Time Finishers',
									value: '60%',
									icon: <TrendingUp className="h-5 w-5" />,
									variant: 'purple',
									hint: 'Had never raced before',
								},
								{
									label: 'Gear & Resources',
									value: 48,
									icon: <Heart className="h-5 w-5" />,
									variant: 'blue',
									hint: 'Athletes supported with gear',
								},
							]}
						/>
					</div>

					<div>
						<p className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase">
							2026 Program — Live
						</p>
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
									variant: 'green',
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

					<div>
						<p className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase">
							Who We Serve — {totalApplications} Applicants Total
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

			{/* ── RACE PARTNERS ────────────────────────────────────── */}
			<section className="rounded-2xl border border-sky-200/70 bg-sky-50/40 p-6 md:p-8">
				<div className="mb-6 flex items-start gap-4 border-b border-sky-200/50 pb-5">
					<div className="shrink-0 rounded-xl bg-sky-100 p-2.5 text-sky-700">
						<MapPin className="h-5 w-5" />
					</div>
					<div>
						<h2 className="text-lg font-bold text-sky-900">Race Partners</h2>
						<p className="mt-0.5 text-sm text-sky-800/70">
							We collaborate with race organizations to build access and belonging at
							their events — hosting aid stations and community activations for our
							rathletes and the greater trail community.
						</p>
					</div>
				</div>

				<div className="space-y-7">
					<AdminStatsGrid
						columns={3}
						items={[
							{
								label: 'Race Partners',
								value: raceCompanies.length,
								icon: <MapPin className="h-5 w-5" />,
								variant: 'blue',
								hint: 'Organizations in our network',
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
								variant: 'purple',
								hint: 'Athletes paired with mentors',
							},
						]}
					/>

					{raceCompanies.length > 0 && (
						<div>
							<p className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase">
								Partner Organizations
							</p>
							<div className="flex flex-wrap gap-3">
								{raceCompanies.map((company) => (
									<div
										key={company._id}
										className="flex items-center gap-2.5 rounded-xl border border-sky-200/60 bg-white px-3.5 py-2.5 shadow-sm"
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
											<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-sky-100 text-xs font-bold text-sky-700">
												{company.name.charAt(0)}
											</div>
										)}
										<span className="text-sm font-medium text-sky-900">{company.name}</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</section>

			{/* ── MENTORS ──────────────────────────────────────────── */}
			<section className="rounded-2xl border border-violet-200/70 bg-violet-50/40 p-6 md:p-8">
				<div className="mb-6 flex items-start gap-4 border-b border-violet-200/50 pb-5">
					<div className="shrink-0 rounded-xl bg-violet-100 p-2.5 text-violet-700">
						<Star className="h-5 w-5" />
					</div>
					<div>
						<h2 className="text-lg font-bold text-violet-900">Mentors</h2>
						<p className="mt-0.5 text-sm text-violet-800/70">
							Our mentors are experienced trail runners who volunteer their time to
							guide and support athletes — building relationships that last long after
							race day.
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
							icon: <UserCheck className="h-5 w-5" />,
							variant: 'purple',
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
							variant: 'amber',
							hint: totalMentorApps > 0 ? `${Math.round((bipocMentors / totalMentorApps) * 100)}% of mentors` : '',
						},
					]}
				/>
			</section>
		</div>
	)
}
