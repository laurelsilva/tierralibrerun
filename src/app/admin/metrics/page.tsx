import { sql, eq, isNull, inArray } from 'drizzle-orm'
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
} from 'lucide-react'
import { AdminStatsGrid } from '@/components/admin'
import { db, fundApplications, mentorshipMatches } from '@/server/db'
import { client } from '@/lib/sanity/client'

// Stages that mean an athlete was accepted into the program
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

export default async function MetricsPage() {
	const [
		totalApplicationsRes,
		acceptedRes,
		declinedRes,
		pendingReviewRes,
		activeAthletesRes,
		activeMentorshipsRes,
		bipocAthletesRes,
		firstRaceRes,
		wantsMentorRes,
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
	])

	const totalApplications = totalApplicationsRes[0]?.value ?? 0
	const accepted = acceptedRes[0]?.value ?? 0
	const declined = declinedRes[0]?.value ?? 0
	const pendingReview = pendingReviewRes[0]?.value ?? 0
	const activeAthletes = activeAthletesRes[0]?.value ?? 0
	const activeMentorships = activeMentorshipsRes[0]?.value ?? 0
	const bipocAthletes = bipocAthletesRes[0]?.value ?? 0
	const firstRace = firstRaceRes[0]?.value ?? 0
	const wantsMentor = wantsMentorRes[0]?.value ?? 0

	const reviewed = accepted + declined
	const acceptanceRate = reviewed > 0 ? Math.round((accepted / reviewed) * 100) : 0

	const pct = (n: number, base = totalApplications) =>
		base > 0 ? `${Math.round((n / base) * 100)}%` : '—'

	// Sanity: partner companies + 2026 distances
	const [partnerDataRaw, distanceDataRaw] = await Promise.all([
		client.fetch<{ total: number }>(`{
			"total": count(*[_type == "company" && count(*[_type == "raceSeries" && company._ref == ^._id]) > 0])
		}`),
		client.fetch<{ total: number }>(`{
			"total": count(*[_type == "raceDistance" && raceSeries->date >= "2026-01-01" && raceSeries->date < "2027-01-01"])
		}`),
	])

	const partnerCompanies = partnerDataRaw?.total ?? 0
	const distances2026 = distanceDataRaw?.total ?? 0

	return (
		<div className="space-y-14">
			<div>
				<h1 className="text-3xl font-bold">Impact</h1>
				<p className="text-muted-foreground mt-1">What we've built and who we've served.</p>
			</div>

			{/* 2025 Season */}
			<section>
				<div className="mb-4 flex items-baseline gap-3">
					<h2 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
						2025 Season
					</h2>
					<span className="text-muted-foreground/50 text-[10px] uppercase tracking-widest">
						Historical
					</span>
				</div>
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
			</section>

			{/* 2026 Program */}
			<section>
				<div className="mb-4 flex items-baseline gap-3">
					<h2 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
						2026 Program
					</h2>
					<span className="text-muted-foreground/50 text-[10px] uppercase tracking-widest">
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
						{
							label: 'Active Mentorships',
							value: activeMentorships,
							icon: <Handshake className="h-5 w-5" />,
							variant: 'purple',
							hint: 'Current pairings',
						},
						{
							label: 'Partner Races',
							value: partnerCompanies,
							icon: <MapPin className="h-5 w-5" />,
							variant: 'blue',
							hint: 'Race organizers in network',
						},
						{
							label: '2026 Distances',
							value: distances2026,
							icon: <Route className="h-5 w-5" />,
							variant: 'default',
							hint: 'Race distances this year',
						},
					]}
				/>
			</section>

			{/* Who We Serve */}
			<section>
				<div className="mb-4 flex items-baseline gap-3">
					<h2 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
						Who We Serve
					</h2>
					<span className="text-muted-foreground/50 text-[10px] uppercase tracking-widest">
						{totalApplications} applicants total
					</span>
				</div>
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
			</section>
		</div>
	)
}
