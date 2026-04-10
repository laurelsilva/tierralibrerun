import { and, inArray, isNull, or, sql } from 'drizzle-orm'
import { Activity } from 'lucide-react'
import Link from 'next/link'
import {
	AdminDataTable,
	AdminPageHeader,
	WorkflowStageBadge,
} from '@/components/admin'
import { type ColumnHeader } from '@/components/admin/admin-data-table'
import { Button } from '@/components/ui/button'
import { toMysqlDateTime } from '@/lib/dates'
import { db, fundApplications } from '@/server/db'
import { syncPastRaceFundApplications } from '@/server/workflow/service'

type ActiveAthleteRow = {
	id: string
	userId: string
	name: string
	email: string
	race: string
	raceDate: Date | null
	raceLocation: string | null
	workflowStage: string
	registrationStatus: string
}

function raceSeriesName(race: string) {
	const [series] = race.split(' - ')
	return series?.trim() || race
}

function startOfToday() {
	const now = new Date()
	now.setHours(0, 0, 0, 0)
	return now
}

function formatRaceDate(value: Date | null) {
	if (!value) return 'Date TBD'
	return new Date(value).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})
}

export default async function ActiveFundAthletesPage() {
	await syncPastRaceFundApplications()
	const today = startOfToday()
	const todayMysql = toMysqlDateTime(today)

	const rows = await db
		.select({
			id: fundApplications.id,
			userId: fundApplications.userId,
			name: fundApplications.name,
			email: fundApplications.email,
			race: fundApplications.race,
			raceDate: fundApplications.raceDate,
			raceLocation: fundApplications.raceLocation,
			workflowStage: fundApplications.workflowStage,
			registrationStatus: fundApplications.registrationStatus,
		})
		.from(fundApplications)
		.where(
			and(
				inArray(fundApplications.workflowStage, [
					'REGISTERED',
					'ONBOARDING_IN_PROGRESS',
					'ACTIVE_IN_PROGRAM',
				]),
				or(
					isNull(fundApplications.raceDate),
					sql`${fundApplications.raceDate} >= ${todayMysql || '0000-01-01 00:00:00'}`,
				),
			),
		)
		.orderBy(
			sql`coalesce(${fundApplications.raceDate}, '9999-12-31') asc`,
			fundApplications.createdAt,
		)

	const grouped = rows.reduce(
		(acc, athlete) => {
			const series = raceSeriesName(athlete.race)
			if (!acc[series]) acc[series] = []
			acc[series].push(athlete)
			return acc
		},
		{} as Record<string, ActiveAthleteRow[]>,
	)

	const groups = Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]))

	const columns: ColumnHeader[] = [
		{ key: 'athlete', content: 'Participant', className: 'font-medium' },
		{ key: 'stage', content: 'Workflow Stage' },
		{ key: 'date', content: 'Race Date' },
		{ key: 'location', content: 'Location' },
		{ key: 'actions', content: '', align: 'right' },
	]

	return (
		<div className="space-y-6">
			<AdminPageHeader
				backHref="/admin"
				backLabel="Back to Admin"
				title="Active Participants"
				description="Participants with upcoming races who are registered, onboarding, or active in the program."
				icon={<Activity className="h-6 w-6" />}
				accent="green"
				actions={
					<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
						<Button asChild variant="outline">
							<Link href="/admin/fund-applications">Athlete Applications</Link>
						</Button>
					</div>
				}
			/>

			<div className="space-y-6">

				{groups.length === 0 ? (
					<div className="text-muted-foreground rounded-xl border py-8 text-center text-sm">
						No active participants with upcoming races.
					</div>
				) : (
					<div className="space-y-5">
						{groups.map(([series, athletes]) => (
							<section
								key={series}
								className="bg-card/60 border-border/70 rounded-xl border px-4 py-4"
							>
								<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
									<div>
										<p className="text-muted-foreground text-xs font-medium tracking-[0.12em] uppercase">
											Race Series
										</p>
										<h2 className="text-foreground text-lg font-semibold">
											{series}
										</h2>
									</div>
									<div className="text-muted-foreground text-sm">
										{athletes.length}{' '}
										{athletes.length === 1 ? 'participant' : 'participants'}
									</div>
								</div>

								<AdminDataTable
									columns={columns}
									rows={athletes.map((athlete) => ({
										id: athlete.id,
										cells: [
											{
												key: 'athlete',
												content: (
													<div className="flex flex-col gap-0.5">
														<Link
															href={`/admin/users/${athlete.userId}`}
															className="text-foreground hover:text-primary font-medium hover:underline"
														>
															{athlete.name}
														</Link>
														<span className="text-muted-foreground text-xs">
															{athlete.email}
														</span>
													</div>
												),
											},
											{
												key: 'stage',
												content: (
													<WorkflowStageBadge
														applicationType="FUND"
														stage={athlete.workflowStage || 'SUBMITTED'}
													/>
												),
											},
											{
												key: 'date',
												content: (
													<span className="text-sm">
														{formatRaceDate(athlete.raceDate)}
													</span>
												),
											},
											{
												key: 'location',
												content: (
													<span className="text-sm">
														{athlete.raceLocation || 'Location TBD'}
													</span>
												),
											},
											{
												key: 'actions',
												align: 'right',
												content: (
													<Button asChild variant="ghost" size="sm">
														<Link href={`/admin/applications/${athlete.id}`}>View</Link>
													</Button>
												),
											},
										],
									}))}
									emptyState={null}
								/>
							</section>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
