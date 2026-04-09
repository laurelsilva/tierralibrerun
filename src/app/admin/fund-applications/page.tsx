'use server'

import { CreditCard } from 'lucide-react'
import Link from 'next/link'
import {
	FundAdminStatusBadge,
	RegistrationStatusBadge,
} from '@/components/admin'
import {
	AdminDataTable,
	type ColumnHeader,
} from '@/components/admin/admin-data-table'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Button } from '@/components/ui/button'
import {
	type FundWorkflowStage,
	getFundOperationalBucket,
} from '@/lib/types/workflow'
import {
	getFundApplicationsPage,
} from '@/server/admin/service'

type SearchParams = Record<string, string | string[] | undefined>

export default async function FundApplicationsPage({
	searchParams,
}: {
	searchParams?: Promise<SearchParams>
}) {
	const sp = searchParams ? await searchParams : undefined

	const q = readString(sp?.q)
	const firstRace = readBoolean(sp?.firstRace)
	const year = readInt(sp?.year)

	const needsReviewResult = await getFundApplicationsPage(
		{ showAll: true },
		{
			q: q || undefined,
			workflowStages: ['SUBMITTED', 'IN_REVIEW', 'WAITLISTED'],
			firstRace: typeof firstRace === 'boolean' ? firstRace : undefined,
			year: year || undefined,
		},
	)

	const pageResult = await getFundApplicationsPage(
		{ showAll: true },
		{
			q: q || undefined,
			excludeWorkflowStages: ['SUBMITTED', 'IN_REVIEW', 'WAITLISTED'],
			firstRace: typeof firstRace === 'boolean' ? firstRace : undefined,
			year: year || undefined,
		},
	)

	const columns: ColumnHeader[] = [
		{ key: 'applicant', content: 'Applicant', className: 'font-medium' },
		{ key: 'race', content: 'Race' },
		{ key: 'status', content: 'Status' },
		{ key: 'actions', content: '', align: 'right' },
	]

	const buildRows = (items: typeof pageResult.items) =>
		items.map((r) => {
			return {
				id: r.id,
				cells: [
					{
						key: 'applicant',
						content: (
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center gap-2">
									<Link
										href={`/admin/users/${r.userId}`}
										className="text-foreground hover:text-primary font-medium hover:underline"
									>
										{r.name}
									</Link>
									{r.firstRace && (
										<span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[10px] font-medium">
											1st
										</span>
									)}
									{r.bipocIdentity && (
										<span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[10px] font-medium">
											BIPOC
										</span>
									)}
									{r.wantsMentor && (
										<span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[10px] font-medium">
										Mentor
									</span>
								)}
							</div>
							</div>
						),
					},
					{
						key: 'race',
						content: (
							<div className="max-w-sm space-y-1">
								<p className="text-foreground text-sm">{r.race}</p>
								<p className="text-muted-foreground text-xs">
									{formatRaceDate(r.raceDate)}
								</p>
							</div>
						),
					},
					{
						key: 'status',
						content: (
							<div className="flex flex-col gap-1">
								<FundAdminStatusBadge
									stage={r.workflowStage || 'SUBMITTED'}
									status={r.status}
								/>
								<RegistrationStatusBadge status={r.registrationStatus} />
							</div>
						),
					},
					{
						key: 'actions',
						align: 'right' as const,
						content: (
							<Button asChild variant="ghost" size="sm">
								<Link href={`/admin/applications/${r.id}`}>View</Link>
							</Button>
						),
					},
				],
			}
		})

	const waitingOnAthleteItems = pageResult.items.filter(
		(i) =>
			getFundOperationalBucket(toFundWorkflowStage(i.workflowStage), {
				status: i.status,
			}) === 'WAITING_ON_ATHLETE',
	)
	const readyForRegistrationItems = pageResult.items.filter(
		(i) =>
			getFundOperationalBucket(toFundWorkflowStage(i.workflowStage), {
				status: i.status,
			}) ===
			'READY_FOR_REGISTRATION',
	)
	const activeItems = pageResult.items.filter(
		(i) =>
			getFundOperationalBucket(toFundWorkflowStage(i.workflowStage), {
				status: i.status,
			}) === 'ACTIVE',
	)
	const completedItems = pageResult.items.filter(
		(i) =>
			getFundOperationalBucket(toFundWorkflowStage(i.workflowStage), {
				status: i.status,
			}) === 'ARCHIVED',
	)
	const rejectedItems = pageResult.items.filter(
		(i) =>
			getFundOperationalBucket(toFundWorkflowStage(i.workflowStage), {
				status: i.status,
			}) === 'REJECTED',
	)

	return (
		<div className="space-y-8">
			<AdminPageHeader
				backHref="/admin"
				backLabel="Back to Admin"
				title="Athlete Applications"
				description="Review incoming applications and move accepted athletes through confirmation, registration, and onboarding."
				icon={<CreditCard className="h-6 w-6" />}
				accent="amber"
				actions={
					<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
						<Button asChild variant="outline">
							<Link href="/admin/fund-athletes/active">Active Participants</Link>
						</Button>
					</div>
				}
			/>

			<div className="space-y-7">
				{/* Priority: Pending Applications */}
				<section className="border-border/70 bg-card/40 space-y-4 rounded-2xl border p-4 md:p-5">
					<div className="space-y-1">
						<div className="flex items-center gap-3">
							<h2 className="text-foreground text-lg font-semibold">
								Needs Review
							</h2>
							<span className="bg-primary text-primary-foreground inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-sm font-bold">
								{needsReviewResult.total}
							</span>
						</div>
						<p className="text-muted-foreground text-sm">
							New and held applications waiting on an admin decision.
						</p>
					</div>

					{needsReviewResult.items.length === 0 ? (
						<div className="text-muted-foreground rounded-xl border py-8 text-center text-sm">
							No applications need review.
						</div>
					) : (
						<div className="bg-background/60 rounded-xl border border-border/60 px-4 py-5">
							<AdminDataTable
								columns={columns}
								rows={buildRows(needsReviewResult.items)}
								emptyState={null}
							/>
						</div>
					)}
				</section>

				{/* History: Reviewed Applications */}
				<section className="border-border/70 bg-card/40 space-y-4 rounded-2xl border p-4 md:p-5">
					<div className="space-y-1">
						<h2 className="text-foreground text-lg font-semibold">
							Operations Buckets
						</h2>
						<p className="text-muted-foreground text-sm">
							Simplified buckets for accepted athletes and completed race cycles.
						</p>
					</div>

					<div className="space-y-4">
						<details className="bg-background/55 rounded-xl border border-border/60" open>
							<summary className="cursor-pointer px-4 py-3 select-none">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<h3 className="text-foreground font-semibold">
											Awaiting Athlete Confirmation
										</h3>
										<span className="bg-muted text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-2 text-xs font-medium">
											{waitingOnAthleteItems.length}
										</span>
									</div>
									<p className="text-muted-foreground text-sm">
										Approved athletes who still need to reply with final attendance confirmation details.
									</p>
								</div>
							</summary>
							<div className="space-y-3 px-4 pb-4">
								<AdminDataTable
									columns={columns}
									rows={buildRows(waitingOnAthleteItems)}
									emptyState={
										<div className="text-muted-foreground text-sm">
											No athletes are waiting on confirmation on this page.
										</div>
									}
								/>
							</div>
						</details>

						<details className="bg-background/55 rounded-xl border border-border/60" open>
							<summary className="cursor-pointer px-4 py-3 select-none">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<h3 className="text-foreground font-semibold">
											Ready for Registration
										</h3>
										<span className="bg-muted text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-2 text-xs font-medium">
											{readyForRegistrationItems.length}
										</span>
									</div>
									<p className="text-muted-foreground text-sm">
										Athletes who confirmed and now need admin registration and handoff.
									</p>
								</div>
							</summary>
							<div className="space-y-3 px-4 pb-4">
								<AdminDataTable
									columns={columns}
									rows={buildRows(readyForRegistrationItems)}
									emptyState={
										<div className="text-muted-foreground text-sm">
											No athletes are waiting for registration on this page.
										</div>
									}
								/>
							</div>
						</details>

						<details className="bg-background/55 rounded-xl border border-border/60" open>
							<summary className="cursor-pointer px-4 py-3 select-none">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<h3 className="text-foreground font-semibold">
											Active Athletes
										</h3>
										<span className="bg-muted text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-2 text-xs font-medium">
											{activeItems.length}
										</span>
									</div>
									<p className="text-muted-foreground text-sm">
										Registered athletes with an upcoming race or active mentorship handoff.
									</p>
								</div>
							</summary>
							<div className="space-y-3 px-4 pb-4">
								<AdminDataTable
									columns={columns}
									rows={buildRows(activeItems)}
									emptyState={
										<div className="text-muted-foreground text-sm">
											No active athletes on this page.
										</div>
									}
								/>
							</div>
						</details>

						<details className="bg-background/55 rounded-xl border border-border/60" open>
							<summary className="cursor-pointer px-4 py-3 select-none">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<h3 className="text-foreground font-semibold">
											Completed Athletes
										</h3>
										<span className="bg-muted text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-2 text-xs font-medium">
											{completedItems.length}
										</span>
									</div>
									<p className="text-muted-foreground text-sm">
										Athletes whose race cycle is complete after registration, onboarding, and participation.
									</p>
								</div>
							</summary>
							<div className="space-y-3 px-4 pb-4">
								<AdminDataTable
									columns={columns}
									rows={buildRows(completedItems)}
									emptyState={
										<div className="text-muted-foreground text-sm">
											No completed athletes on this page.
										</div>
									}
								/>
							</div>
						</details>

						<details className="bg-background/55 rounded-xl border border-border/60">
							<summary className="cursor-pointer px-4 py-3 select-none">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<h3 className="text-foreground font-semibold">
											Rejected Athletes
										</h3>
										<span className="bg-muted text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-2 text-xs font-medium">
											{rejectedItems.length}
										</span>
									</div>
									<p className="text-muted-foreground text-sm">
										Applications that are not moving forward. Deleted applications do not appear here.
									</p>
								</div>
							</summary>
							<div className="space-y-3 px-4 pb-4">
								<AdminDataTable
									columns={columns}
									rows={buildRows(rejectedItems)}
									emptyState={
										<div className="text-muted-foreground text-sm">
											No rejected applications on this page.
										</div>
									}
								/>
							</div>
						</details>

						<div className="border-t pt-4">
							<div className="text-muted-foreground text-sm">
								Showing all {pageResult.total} reviewed applications.
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	)
}

/* =========================================
   Helpers
   ========================================= */

function toFundWorkflowStage(value: string | null | undefined): FundWorkflowStage {
	return ((value || 'SUBMITTED').toUpperCase() as FundWorkflowStage) || 'SUBMITTED'
}

function formatRaceDate(value: Date | null) {
	if (!value) return 'Date TBD'
	return new Date(value).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})
}

function readString(v: string | string[] | undefined): string | null {
	if (typeof v === 'string') return v
	if (Array.isArray(v)) return v[0] ?? null
	return null
}

function readInt(v: string | string[] | undefined): number | null {
	const s = readString(v)
	if (!s) return null
	const n = Number(s)
	return Number.isFinite(n) ? n : null
}

function readBoolean(v: string | string[] | undefined): boolean | null {
	const s = readString(v)
	if (s === 'true') return true
	if (s === 'false') return false
	return null
}
