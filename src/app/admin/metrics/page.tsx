import { sql, eq, isNull, inArray } from 'drizzle-orm'
import { Users, ClipboardList, Handshake, TrendingUp, Heart, Star } from 'lucide-react'
import { AdminStatsGrid } from '@/components/admin'
import { db, fundApplications, mentorshipMatches } from '@/server/db'

export default async function MetricsPage() {
	const [
		activeAthletesRes,
		pendingReviewRes,
		activeMentorshipsRes,
		bipocAthletesRes,
		firstRaceRes,
		wantsMentorRes,
		fundTotalRes,
	] = await Promise.all([
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(fundApplications)
			.where(eq(fundApplications.workflowStage, 'ACTIVE_IN_PROGRAM')),
		db
			.select({ value: sql<number>`count(*)`.mapWith(Number) })
			.from(fundApplications)
			.where(inArray(fundApplications.workflowStage, ['SUBMITTED', 'IN_REVIEW'])),
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
		db.select({ value: sql<number>`count(*)`.mapWith(Number) }).from(fundApplications),
	])

	const activeAthletes = activeAthletesRes[0]?.value ?? 0
	const pendingReview = pendingReviewRes[0]?.value ?? 0
	const activeMentorships = activeMentorshipsRes[0]?.value ?? 0
	const bipocAthletes = bipocAthletesRes[0]?.value ?? 0
	const firstRace = firstRaceRes[0]?.value ?? 0
	const wantsMentor = wantsMentorRes[0]?.value ?? 0
	const fundTotal = fundTotalRes[0]?.value ?? 0

	const pct = (n: number) =>
		fundTotal > 0 ? `${Math.round((n / fundTotal) * 100)}% of applicants` : ''

	return (
		<div className="space-y-12">
			<div>
				<h1 className="text-3xl font-bold">Metrics</h1>
				<p className="text-muted-foreground mt-1">Program health at a glance.</p>
			</div>

			<section>
				<h2 className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">
					Right Now
				</h2>
				<AdminStatsGrid
					columns={3}
					items={[
						{
							label: 'Athletes Active',
							value: activeAthletes,
							icon: <Star className="h-5 w-5" />,
							variant: 'green',
							hint: 'Currently in program',
						},
						{
							label: 'Pending Review',
							value: pendingReview,
							icon: <ClipboardList className="h-5 w-5" />,
							variant: pendingReview > 0 ? 'amber' : 'default',
							hint: 'Submitted or in review',
						},
						{
							label: 'Active Mentorships',
							value: activeMentorships,
							icon: <Handshake className="h-5 w-5" />,
							variant: 'purple',
							hint: 'Current pairings',
						},
					]}
				/>
			</section>

			<section>
				<h2 className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">
					Who We Serve
				</h2>
				<AdminStatsGrid
					columns={3}
					items={[
						{
							label: 'BIPOC Athletes',
							value: bipocAthletes,
							icon: <Users className="h-5 w-5" />,
							variant: 'amber',
							hint: pct(bipocAthletes),
						},
						{
							label: 'First-Time Racers',
							value: firstRace,
							icon: <TrendingUp className="h-5 w-5" />,
							variant: 'green',
							hint: pct(firstRace),
						},
						{
							label: 'Requested Mentorship',
							value: wantsMentor,
							icon: <Heart className="h-5 w-5" />,
							variant: 'purple',
							hint: pct(wantsMentor),
						},
					]}
				/>
			</section>
		</div>
	)
}
