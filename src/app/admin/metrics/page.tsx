import { sql, eq, isNull, isNotNull } from 'drizzle-orm'
import {
	Users,
	CreditCard,
	UserCheck,
	Handshake,
	CheckCircle2,
	ClipboardList,
	TrendingUp,
} from 'lucide-react'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { AdminStatsGrid } from '@/components/admin'
import {
	db,
	users,
	fundApplications,
	mentorApplications,
	mentorshipMatches,
	applicationTasks,
} from '@/server/db'
import {
	FUND_WORKFLOW_LABELS,
	FUND_WORKFLOW_STAGES,
	MENTOR_WORKFLOW_LABELS,
	MENTOR_WORKFLOW_STAGES,
} from '@/lib/types/workflow'

// ─── helpers ─────────────────────────────────────────────────────────────────

async function countAll<T extends { workflowStage: string }>(
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

// ─── page ────────────────────────────────────────────────────────────────────

export default async function MetricsPage() {
	// Top-line counts
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
		db.select({ value: sql<number>`count(*)`.mapWith(Number) }).from(fundApplications),
		db.select({ value: sql<number>`count(*)`.mapWith(Number) }).from(mentorApplications),
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

	const userCount = userCountRes[0]?.value ?? 0
	const fundTotal = fundTotalRes[0]?.value ?? 0
	const mentorTotal = mentorTotalRes[0]?.value ?? 0
	const openTasks = openTasksRes[0]?.value ?? 0
	const openPairings = openPairingsRes[0]?.value ?? 0
	const endedPairings = endedPairingsRes[0]?.value ?? 0
	const firstRaceCount = firstRaceRes[0]?.value ?? 0
	const wantsMentorCount = wantsMentorRes[0]?.value ?? 0
	const bipocFundCount = bipocFundRes[0]?.value ?? 0
	const bipocMentorCount = bipocMentorRes[0]?.value ?? 0

	// Stage breakdowns
	const [fundStageCounts, mentorStageCounts] = await Promise.all([
		countAll(fundApplications),
		countAll(mentorApplications),
	])

	// Task breakdown
	const taskStatusRows = await db
		.select({
			status: applicationTasks.status,
			count: sql<number>`count(*)`.mapWith(Number),
		})
		.from(applicationTasks)
		.groupBy(applicationTasks.status)
	const taskCounts = Object.fromEntries(taskStatusRows.map((r) => [r.status, r.count]))

	return (
		<div className="space-y-10">
			<div>
				<h1 className="text-3xl font-bold">Metrics</h1>
				<p className="text-muted-foreground mt-1">
					Program health across athletes, mentors, and pairings.
				</p>
			</div>

			{/* ── Top-line ─────────────────────────────────────────── */}
			<section>
				<h2 className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">
					Overview
				</h2>
				<AdminStatsGrid
					columns={4}
					items={[
						{
							label: 'Registered Users',
							value: userCount,
							icon: <Users className="h-5 w-5" />,
							variant: 'default',
						},
						{
							label: 'Athlete Applications',
							value: fundTotal,
							icon: <CreditCard className="h-5 w-5" />,
							variant: 'amber',
						},
						{
							label: 'Mentor Applications',
							value: mentorTotal,
							icon: <UserCheck className="h-5 w-5" />,
							variant: 'purple',
						},
						{
							label: 'Active Pairings',
							value: openPairings,
							icon: <Handshake className="h-5 w-5" />,
							variant: 'green',
							hint: `${endedPairings} ended`,
						},
					]}
				/>
			</section>

			{/* ── Athlete pipeline ─────────────────────────────────── */}
			<section>
				<h2 className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">
					Athlete Application Pipeline
				</h2>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{FUND_WORKFLOW_STAGES.map((stage) => {
						const count = fundStageCounts[stage] ?? 0
						const isActive = ['REGISTERED', 'ONBOARDING_IN_PROGRESS', 'ACTIVE_IN_PROGRAM'].includes(stage)
						const isReview = ['SUBMITTED', 'IN_REVIEW'].includes(stage)
						const isClosed = ['DECLINED', 'CLOSED', 'NO_LONGER_ACTIVE', 'NO_SHOW_OR_DROPPED'].includes(stage)
						return (
							<Card
								key={stage}
								className={`border-border/70 ${count === 0 ? 'opacity-50' : ''}`}
							>
								<CardHeader className="pb-1 pt-4">
									<div className="flex items-center justify-between">
										<CardDescription className="text-[11px] font-medium tracking-widest uppercase">
											{FUND_WORKFLOW_LABELS[stage]}
										</CardDescription>
										<span
											className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
												isReview
													? 'bg-primary/10 text-primary'
													: isActive
														? 'bg-secondary text-secondary-foreground'
														: isClosed
															? 'bg-muted text-muted-foreground'
															: 'bg-accent text-accent-foreground'
											}`}
										>
											{isReview ? 'review' : isActive ? 'active' : isClosed ? 'closed' : 'pipeline'}
										</span>
									</div>
									<CardTitle className="text-3xl font-bold">{count}</CardTitle>
								</CardHeader>
							</Card>
						)
					})}
				</div>
			</section>

			{/* ── Mentor pipeline ──────────────────────────────────── */}
			<section>
				<h2 className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">
					Mentor Application Pipeline
				</h2>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{MENTOR_WORKFLOW_STAGES.map((stage) => {
						const count = mentorStageCounts[stage] ?? 0
						const isActive = ['MATCHED', 'ACTIVE', 'APPROVED_POOL', 'MATCH_PENDING'].includes(stage)
						const isReview = ['SUBMITTED', 'IN_REVIEW'].includes(stage)
						const isClosed = ['DECLINED', 'CLOSED'].includes(stage)
						return (
							<Card
								key={stage}
								className={`border-border/70 ${count === 0 ? 'opacity-50' : ''}`}
							>
								<CardHeader className="pb-1 pt-4">
									<div className="flex items-center justify-between">
										<CardDescription className="text-[11px] font-medium tracking-widest uppercase">
											{MENTOR_WORKFLOW_LABELS[stage]}
										</CardDescription>
										<span
											className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
												isReview
													? 'bg-primary/10 text-primary'
													: isActive
														? 'bg-secondary text-secondary-foreground'
														: isClosed
															? 'bg-muted text-muted-foreground'
															: 'bg-accent text-accent-foreground'
											}`}
										>
											{isReview ? 'review' : isActive ? 'active' : isClosed ? 'closed' : 'pipeline'}
										</span>
									</div>
									<CardTitle className="text-3xl font-bold">{count}</CardTitle>
								</CardHeader>
							</Card>
						)
					})}
				</div>
			</section>

			{/* ── Athlete cohort breakdown ─────────────────────────── */}
			<section>
				<h2 className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">
					Athlete Cohort Breakdown
				</h2>
				<AdminStatsGrid
					columns={4}
					items={[
						{
							label: 'First Race Ever',
							value: firstRaceCount,
							icon: <TrendingUp className="h-5 w-5" />,
							variant: 'green',
							hint: fundTotal > 0 ? `${Math.round((firstRaceCount / fundTotal) * 100)}% of applicants` : '',
						},
						{
							label: 'Wants a Mentor',
							value: wantsMentorCount,
							icon: <Handshake className="h-5 w-5" />,
							variant: 'purple',
							hint: fundTotal > 0 ? `${Math.round((wantsMentorCount / fundTotal) * 100)}% of applicants` : '',
						},
						{
							label: 'BIPOC Athletes',
							value: bipocFundCount,
							icon: <Users className="h-5 w-5" />,
							variant: 'amber',
							hint: fundTotal > 0 ? `${Math.round((bipocFundCount / fundTotal) * 100)}% of applicants` : '',
						},
						{
							label: 'BIPOC Mentors',
							value: bipocMentorCount,
							icon: <UserCheck className="h-5 w-5" />,
							variant: 'amber',
							hint: mentorTotal > 0 ? `${Math.round((bipocMentorCount / mentorTotal) * 100)}% of mentors` : '',
						},
					]}
				/>
			</section>

			{/* ── Tasks ────────────────────────────────────────────── */}
			<section>
				<h2 className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">
					Tasks
				</h2>
				<AdminStatsGrid
					columns={3}
					items={[
						{
							label: 'Open Tasks',
							value: openTasks,
							icon: <ClipboardList className="h-5 w-5" />,
							variant: openTasks > 0 ? 'amber' : 'default',
						},
						{
							label: 'Completed Tasks',
							value: taskCounts['DONE'] ?? 0,
							icon: <CheckCircle2 className="h-5 w-5" />,
							variant: 'green',
						},
						{
							label: 'Canceled Tasks',
							value: taskCounts['CANCELED'] ?? 0,
							icon: <ClipboardList className="h-5 w-5" />,
							variant: 'muted',
						},
					]}
				/>
			</section>
		</div>
	)
}
