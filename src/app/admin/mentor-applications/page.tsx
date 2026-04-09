import { sql, desc, inArray } from 'drizzle-orm'
import { UserCheck } from 'lucide-react'
import Link from 'next/link'
import { WorkflowStageBadge, AdminStatsGrid } from '@/components/admin'
import {
	AdminDataTable,
	type ColumnHeader,
} from '@/components/admin/admin-data-table'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Button } from '@/components/ui/button'
import { db, mentorApplications } from '@/server/db'

function toUpperStage(stage?: string | null) {
	return (stage || 'SUBMITTED').toUpperCase()
}

function buildRows(
	items: Array<{
		id: string
		name: string
		email: string
		workflowStage: string | null
		createdAt: Date
		userId: string
		motivationToMentor: string | null
		mentorshipExperience: string | null
	}>,
) {
	return items.map((r) => ({
		id: r.id,
		cells: [
			{
				key: 'applicant',
				content: (
					<div className="flex flex-col gap-0.5">
						<Link
							href={`/admin/users/${r.userId}`}
							className="text-foreground hover:text-primary font-medium hover:underline"
						>
							{r.name}
						</Link>
						<span className="text-muted-foreground text-xs">{r.email}</span>
					</div>
				),
			},
			{
				key: 'focus',
				content: (
					<p className="text-muted-foreground max-w-md truncate text-sm">
						{r.motivationToMentor || 'Not specified'}
					</p>
				),
				hideOnMobile: true,
			},
			{
				key: 'experience',
				content: r.mentorshipExperience ? (
					<span className="bg-secondary text-secondary-foreground inline-flex rounded-md px-2 py-1 text-xs font-medium">
						Experienced mentor
					</span>
				) : (
					<span className="bg-muted text-muted-foreground inline-flex rounded-md px-2 py-1 text-xs font-medium">
						First-time mentor
					</span>
				),
				hideOnMobile: true,
			},
			{
				key: 'stage',
				content: (
					<WorkflowStageBadge
						applicationType="MENTOR"
						stage={r.workflowStage || 'SUBMITTED'}
					/>
				),
			},
			{
				key: 'applied',
				content: (
					<span className="text-muted-foreground text-sm whitespace-nowrap">
						{new Date(r.createdAt).toLocaleDateString('en-US', {
							month: 'short',
							day: 'numeric',
							year: 'numeric',
						})}
					</span>
				),
			},
			{
				key: 'view',
				align: 'right' as const,
				content: (
					<Button asChild variant="ghost" size="sm">
						<Link href={`/admin/mentor-applications/${r.id}`}>View</Link>
					</Button>
				),
			},
		],
	}))
}

export default async function MentorApplicationsPage() {
	const allMentorApplications = await db
		.select({
			id: mentorApplications.id,
			name: mentorApplications.name,
			email: mentorApplications.email,
			workflowStage: mentorApplications.workflowStage,
			createdAt: mentorApplications.createdAt,
			userId: mentorApplications.userId,
			motivationToMentor: mentorApplications.motivationToMentor,
			mentorshipExperience: mentorApplications.mentorshipExperience,
		})
		.from(mentorApplications)
		.orderBy(desc(mentorApplications.createdAt))

	const [{ value: totalApplicationsCount } = { value: 0 }] = await db
		.select({ value: sql<number>`count(*)`.mapWith(Number) })
		.from(mentorApplications)

	const [{ value: pendingApplicationsCount } = { value: 0 }] = await db
		.select({ value: sql<number>`count(*)`.mapWith(Number) })
		.from(mentorApplications)
		.where(
			inArray(mentorApplications.workflowStage, ['SUBMITTED', 'IN_REVIEW']),
		)

	const [{ value: approvedApplicationsCount } = { value: 0 }] = await db
		.select({ value: sql<number>`count(*)`.mapWith(Number) })
		.from(mentorApplications)
		.where(
			inArray(mentorApplications.workflowStage, [
				'APPROVED_POOL',
				'MATCH_PENDING',
				'MATCHED',
				'ACTIVE',
			]),
		)

	const [{ value: declinedApplicationsCount } = { value: 0 }] = await db
		.select({ value: sql<number>`count(*)`.mapWith(Number) })
		.from(mentorApplications)
		.where(inArray(mentorApplications.workflowStage, ['DECLINED']))

	const needsReview = allMentorApplications.filter((r) => {
		const stage = toUpperStage(r.workflowStage)
		return stage === 'SUBMITTED' || stage === 'IN_REVIEW'
	})

	const activeOrMatched = allMentorApplications.filter((r) => {
		const stage = toUpperStage(r.workflowStage)
		return (
			stage === 'APPROVED_POOL' ||
			stage === 'MATCH_PENDING' ||
			stage === 'MATCHED' ||
			stage === 'ACTIVE'
		)
	})

	const declined = allMentorApplications.filter((r) => {
		const stage = toUpperStage(r.workflowStage)
		return stage === 'DECLINED'
	})

	const other = allMentorApplications.filter((r) => {
		const stage = toUpperStage(r.workflowStage)
		return ![
			'SUBMITTED',
			'IN_REVIEW',
			'APPROVED_POOL',
			'MATCH_PENDING',
			'MATCHED',
			'ACTIVE',
			'DECLINED',
		].includes(stage)
	})

	const columns: ColumnHeader[] = [
		{ key: 'applicant', content: 'Applicant', className: 'font-medium' },
		{ key: 'focus', content: 'Why They Mentor', hideOnMobile: true },
		{ key: 'experience', content: 'Experience', hideOnMobile: true },
		{ key: 'stage', content: 'Status' },
		{ key: 'applied', content: 'Applied' },
		{ key: 'view', content: '', align: 'right' },
	]

	return (
		<div className="space-y-6">
			<AdminPageHeader
				backHref="/admin"
				backLabel="Back to Admin"
				title="Mentor Applications"
				description="Review new mentor applications and track approved mentors."
				icon={<UserCheck className="h-6 w-6" />}
				accent="purple"
				actions={
					<Button asChild variant="outline">
						<Link href="/admin/mentor-pairings">Open Pairing Workspace</Link>
					</Button>
				}
			/>

			<AdminStatsGrid
				items={[
					{
						label: 'Total',
						value: totalApplicationsCount,
						variant: 'muted',
					},
					{
						label: 'Needs Review',
						value: pendingApplicationsCount,
						variant: 'amber',
					},
					{
						label: 'In Program',
						value: approvedApplicationsCount,
						variant: 'green',
					},
					{
						label: 'Declined',
						value: declinedApplicationsCount,
						variant: 'red',
					},
				]}
				columns={4}
				compact
			/>

			<section className="space-y-3">
				<div className="flex items-center gap-3">
					<h2 className="text-foreground text-lg font-semibold">
						Needs Review
					</h2>
					<span className="bg-primary text-primary-foreground inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold">
						{needsReview.length}
					</span>
				</div>
				<AdminDataTable
					columns={columns}
					rows={buildRows(needsReview)}
					emptyState={
						<div className="text-muted-foreground text-sm">
							No mentor applications need review.
						</div>
					}
				/>
			</section>

			<section className="space-y-4">
				<details className="group" open>
					<summary className="cursor-pointer list-none select-none">
						<div className="space-y-1">
							<h2 className="text-foreground text-lg font-semibold">
								Reviewed Applications
							</h2>
							<p className="text-muted-foreground text-sm">
								Applications already reviewed.
							</p>
						</div>
					</summary>

					<div className="mt-4 space-y-4">
						<details
							className="bg-muted/20 border-border/60 rounded-xl border"
							open
						>
							<summary className="cursor-pointer px-4 py-3 select-none">
								<div className="flex items-center gap-2">
									<h3 className="text-foreground font-medium">In Program</h3>
									<span className="bg-muted text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-2 text-xs font-medium">
										{activeOrMatched.length}
									</span>
								</div>
							</summary>
							<div className="px-4 pb-4">
								<AdminDataTable
									columns={columns}
									rows={buildRows(activeOrMatched)}
									emptyState={
										<div className="text-muted-foreground text-sm">
											No mentors in program on this page.
										</div>
									}
								/>
							</div>
						</details>

						<details
							className="bg-muted/20 border-border/60 rounded-xl border"
							open
						>
							<summary className="cursor-pointer px-4 py-3 select-none">
								<div className="flex items-center gap-2">
									<h3 className="text-foreground font-medium">Declined</h3>
									<span className="bg-muted text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-2 text-xs font-medium">
										{declined.length}
									</span>
								</div>
							</summary>
							<div className="px-4 pb-4">
								<AdminDataTable
									columns={columns}
									rows={buildRows(declined)}
									emptyState={
										<div className="text-muted-foreground text-sm">
											No declined mentor applications on this page.
										</div>
									}
								/>
							</div>
						</details>

						{other.length > 0 && (
							<details className="bg-muted/20 border-border/60 rounded-xl border">
								<summary className="cursor-pointer px-4 py-3 select-none">
									<div className="flex items-center gap-2">
										<h3 className="text-foreground font-medium">
											Other Statuses
										</h3>
										<span className="bg-muted text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-2 text-xs font-medium">
											{other.length}
										</span>
									</div>
								</summary>
								<div className="px-4 pb-4">
									<AdminDataTable
										columns={columns}
										rows={buildRows(other)}
										emptyState={null}
									/>
								</div>
							</details>
						)}
					</div>
				</details>
			</section>
		</div>
	)
}
