import { and, desc, eq } from 'drizzle-orm'
import { ChevronLeft, Users, Mail } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
	WorkflowStageBadge,
	AdminDataTable,
	AdminStatsGrid,
	UserDeleteAction,
} from '@/components/admin'
import {
	AdminDetailHeader,
	AdminDetailSection,
	AdminKeyValueGrid,
	AdminDetailActions,
	AdminSplitGrid,
	AdminLabeledText,
} from '@/components/admin/admin-detail'
import { CreateMentorFundApplicationAction } from '@/components/admin/create-mentor-fund-application-action'
import { UserFundLimitExemptionToggle } from '@/components/admin/user-fund-limit-exemption-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { initialsFromName } from '@/lib/utils'
import { getAvatarUrlFromClerkId } from '@/server/clerk/avatar'

import {
	db,
	users as usersTable,
	fundApplications,
	mentorApplications,
	mentorshipMatches,
} from '@/server/db'

interface Params {
	id: string
}

interface Props {
	params: Promise<Params>
}

export default async function AdminUserDetailPage(props: Props) {
	const { id } = await props.params

	// Auth handled by AdminLayout

	// Load user
	const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id))
	if (!user) {
		redirect('/admin/users')
	}

	// Load related data
	const fundApps = await db
		.select()
		.from(fundApplications)
		.where(eq(fundApplications.userId, id))
		.orderBy(desc(fundApplications.createdAt))

	const mentorApps = await db
		.select()
		.from(mentorApplications)
		.where(eq(mentorApplications.userId, id))
		.orderBy(desc(mentorApplications.createdAt))

	const mentorPairings = await db
		.select({
			matchId: mentorshipMatches.id,
			mentorApplicationId: mentorshipMatches.mentorApplicationId,
			fundApplicationId: mentorshipMatches.fundApplicationId,
			menteeName: fundApplications.name,
			menteeEmail: fundApplications.email,
			menteeRace: fundApplications.race,
			menteeRaceDate: fundApplications.raceDate,
			matchedAt: mentorshipMatches.createdAt,
			endedAt: mentorshipMatches.endedAt,
		})
		.from(mentorshipMatches)
		.innerJoin(
			mentorApplications,
			and(
				eq(mentorApplications.id, mentorshipMatches.mentorApplicationId),
				eq(mentorApplications.userId, id),
			),
		)
		.innerJoin(
			fundApplications,
			eq(fundApplications.id, mentorshipMatches.fundApplicationId),
		)
		.orderBy(desc(mentorshipMatches.createdAt))

	const activeMentorshipPairings = mentorPairings.filter(
		(pairing) => pairing.endedAt === null,
	)
	const pastMentorshipPairings = mentorPairings.filter(
		(pairing) => pairing.endedAt !== null,
	)

	// Stats
	const stats = [
		{
			label: 'Athlete Applications',
			value: fundApps.length,
			variant: 'amber' as const,
			icon: <Users className="h-5 w-5" />,
		},
		{
			label: 'Mentor Applications',
			value: mentorApps.length,
			variant: 'purple' as const,
		},
		{
			label: 'Active Mentees',
			value: activeMentorshipPairings.length,
			variant: activeMentorshipPairings.length > 0 ? ('green' as const) : ('muted' as const),
		},
		{
			label: 'Onboarding',
			value: user.onboardingCompleted ? 'Completed' : 'Not completed',
			variant: user.onboardingCompleted
				? ('green' as const)
				: ('muted' as const),
		},
	]

	const displayName = user.name || user.email
	const clerkAvatarUrl = await getAvatarUrlFromClerkId(user.clerkId)
	const avatarUrl = clerkAvatarUrl || user.profileImageUrl || null
	const avatarInitials = initialsFromName(displayName)

	return (
		<div className="space-y-6 md:space-y-8">
			<div className="mb-2">
				<Link
					href="/admin/users"
					className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
				>
					<ChevronLeft className="h-4 w-4" />
					Back to Users
				</Link>
			</div>

			<AdminDetailHeader
				title={displayName}
				subtitle={`Joined ${new Date(user.createdAt).toLocaleDateString()}`}
				avatar={
					<Avatar className="border-border/60 h-12 w-12 border">
						{avatarUrl ? (
							<AvatarImage src={avatarUrl} alt={`${displayName} avatar`} />
						) : null}
						<AvatarFallback className="text-xs font-semibold">
							{avatarInitials}
						</AvatarFallback>
					</Avatar>
				}
				status={
					<div className="flex flex-wrap items-center gap-2 text-xs">
						<StatusPill
							label={
								user.userType ? user.userType.toUpperCase() : 'TYPE NOT SET'
							}
							colorClass={
								user.userType === 'bipoc'
									? 'bg-primary/15 text-primary'
									: user.userType === 'ally'
										? 'bg-secondary text-secondary-foreground'
										: 'bg-muted text-muted-foreground'
							}
						/>
						<StatusPill
							label={
								user.onboardingCompleted
									? 'Onboarding complete'
									: 'Onboarding incomplete'
							}
							colorClass={
								user.onboardingCompleted
									? 'bg-secondary text-secondary-foreground'
									: 'bg-muted text-muted-foreground'
							}
						/>
						<StatusPill
							label={
								user.acceptedCodeOfConduct ? 'Code accepted' : 'Code pending'
							}
							colorClass={
								user.acceptedCodeOfConduct
									? 'bg-secondary text-secondary-foreground'
									: 'bg-muted text-muted-foreground'
							}
						/>
						<StatusPill
							label={
								user.newsletterSubscribed
									? 'Newsletter subscribed'
									: 'Newsletter unsubscribed'
							}
							colorClass={
								user.newsletterSubscribed
									? 'bg-secondary text-secondary-foreground'
									: 'bg-muted text-muted-foreground'
							}
						/>
					</div>
				}
				actions={
					<div className="flex items-center gap-2">
						<UserDeleteAction
							userName={displayName}
							userId={user.id}
							clerkId={user.clerkId}
						/>
					</div>
				}
			/>

			<AdminStatsGrid items={stats} columns={4} />

			<AdminSplitGrid
				gap="xl"
				left={
					<>
						<AdminDetailSection title="Profile">
							<AdminKeyValueGrid
								items={[
									{
										key: 'name',
										label: 'Name',
										value: user.name || 'Not provided',
									},
									{ key: 'email', label: 'Email', value: user.email },
									{
										key: 'userType',
										label: 'User Type',
										value: user.userType || 'Not provided',
									},
									{
										key: 'fundApplicationLimitExempt',
										label: 'Athlete 6-Month Limit Exempt',
										value: user.fundApplicationLimitExempt ? 'Yes' : 'No',
									},
									{
										key: 'age',
										label: 'Age',
										value: user.age ?? 'Not set',
									},
									{
										key: 'genderIdentity',
										label: 'Gender Identity',
										value: user.genderIdentity || 'Not provided',
									},
									{
										key: 'pronouns',
										label: 'Pronouns',
										value: user.pronouns || 'Not provided',
									},
									{
										key: 'region',
										label: 'Region',
										value: user.locationRegion || 'Not provided',
									},
									{
										key: 'hearAbout',
										label: 'How They Heard About Us',
										value: user.hearAbout || 'Not provided',
									},
								]}
								columns={2}
							/>

							<div className="mt-4">
								<div className="text-muted-foreground mb-2 text-sm font-medium">
									Athlete Limit Exception
								</div>
								<UserFundLimitExemptionToggle
									userId={user.id}
									initialValue={!!user.fundApplicationLimitExempt}
								/>
							</div>

							{user.runningExperience && (
								<AdminLabeledText label="Running Experience">
									{user.runningExperience}
								</AdminLabeledText>
							)}
						</AdminDetailSection>

						<AdminDetailSection title="Account & IDs">
							<AdminKeyValueGrid
								items={[
									{
										key: 'userId',
										label: 'User ID',
										value: user.id,
										mono: true,
									},
									{
										key: 'clerkId',
										label: 'Clerk ID',
										value: user.clerkId,
										mono: true,
									},
									{
										key: 'createdAt',
										label: 'Created At',
										value: new Date(user.createdAt).toLocaleString(),
									},
									{
										key: 'updatedAt',
										label: 'Last Updated',
										value: new Date(user.updatedAt).toLocaleString(),
									},
								]}
								columns={2}
							/>
						</AdminDetailSection>
					</>
				}
				right={
					<>
						<AdminDetailSection title="Program Signals">
							<AdminKeyValueGrid
								items={[
									{
										key: 'onboarding',
										label: 'Onboarding Completed',
										value: user.onboardingCompleted ? 'Yes' : 'No',
									},
									{
										key: 'codeOfConduct',
										label: 'Accepted Code of Conduct',
										value: user.acceptedCodeOfConduct ? 'Yes' : 'No',
									},
									{
										key: 'slack',
										label: 'Slack Joined',
										value: user.slackJoined ? 'Yes' : 'No',
									},
									{
										key: 'strava',
										label: 'Strava Joined',
										value: user.stravaJoined ? 'Yes' : 'No',
									},
									{
										key: 'instagram',
										label: 'Instagram Followed',
										value: user.instagramFollowed ? 'Yes' : 'No',
									},
									{
										key: 'newsletter',
										label: 'Newsletter Subscribed',
										value: user.newsletterSubscribed ? 'Yes' : 'No',
									},
									{
										key: 'donation',
										label: 'Donation Completed',
										value: user.donationCompleted ? 'Yes' : 'No',
									},
								]}
								columns={2}
							/>
						</AdminDetailSection>
					</>
				}
			/>

			{/* Athlete Applications */}
			<AdminDetailSection
				title="Athlete Applications"
				description="Athlete applications submitted by this user."
			>
				<div className="flex justify-end">
					<CreateMentorFundApplicationAction
						userId={user.id}
						userName={displayName}
					/>
				</div>
				<AdminDataTable
					columns={[
						{ key: 'race', content: 'Race', className: 'font-medium' },
						{ key: 'status', content: 'Status' },
						{ key: 'submitted', content: 'Submitted' },
						{ key: 'actions', content: 'View', align: 'right' },
					]}
					rows={fundApps.map((a) => ({
						id: a.id,
						cells: [
							{
								key: 'race',
								content: (
									<div className="flex flex-col">
										<div>{a.race}</div>
										<div className="text-muted-foreground mt-0.5 text-xs">
											{a.firstRace
												? 'First trail race'
												: 'Has trail race history'}
										</div>
									</div>
								),
							},
							{
								key: 'status',
								content: (
									<WorkflowStageBadge
										applicationType="FUND"
										stage={a.workflowStage || 'SUBMITTED'}
									/>
								),
							},
							{
								key: 'submitted',
								content: (
									<div className="text-sm">
										{new Date(a.createdAt).toLocaleString()}
									</div>
								),
							},
							{
								key: 'actions',
								align: 'right' as const,
								content: (
									<Link
										href={`/admin/applications/${a.id}`}
										className="text-primary hover:underline"
									>
										View
									</Link>
								),
							},
						],
					}))}
					emptyState={
						<div className="text-muted-foreground text-sm">
							No athlete applications from this user yet.
						</div>
					}
				/>
			</AdminDetailSection>

			{/* Mentor Applications */}
			<AdminDetailSection
				title="Mentor Applications"
				description="Mentor applications submitted by this user."
			>
				<AdminDataTable
					columns={[
						{ key: 'status', content: 'Status' },
						{ key: 'submitted', content: 'Submitted' },
						{ key: 'actions', content: 'View', align: 'right' },
					]}
					rows={mentorApps.map((a) => ({
						id: a.id,
						cells: [
							{
								key: 'status',
								content: (
									<WorkflowStageBadge
										applicationType="MENTOR"
										stage={a.workflowStage || 'SUBMITTED'}
									/>
								),
							},
							{
								key: 'submitted',
								content: (
									<div className="text-sm">
										{new Date(a.createdAt).toLocaleString()}
									</div>
								),
							},
							{
								key: 'actions',
								align: 'right' as const,
								content: (
									<Link
										href={`/admin/mentor-applications/${a.id}`}
										className="text-primary hover:underline"
									>
										View
										<span className="sr-only"> mentor application</span>
									</Link>
								),
							},
						],
					}))}
					emptyState={
						<div className="text-muted-foreground text-sm">
							No mentor applications from this user yet.
						</div>
					}
				/>
			</AdminDetailSection>

			{/* Mentorship Pairings */}
			<AdminDetailSection
				title="Mentorship Pairings"
				description="Mentees this mentor is currently supporting and past pairings."
			>
				<div className="space-y-6">
					<div>
						<h3 className="mb-2 text-sm font-semibold tracking-wide uppercase">
							Active Mentees
						</h3>
						<AdminDataTable
							columns={[
								{ key: 'mentee', content: 'Mentee', className: 'font-medium' },
								{ key: 'race', content: 'Race' },
								{ key: 'matchedAt', content: 'Matched' },
								{ key: 'actions', content: 'View', align: 'right' },
							]}
							rows={activeMentorshipPairings.map((pairing) => ({
								id: pairing.matchId,
								cells: [
									{
										key: 'mentee',
										content: (
											<div className="flex flex-col">
												<div>{pairing.menteeName}</div>
												<div className="text-muted-foreground mt-0.5 text-xs">
													{pairing.menteeEmail}
												</div>
											</div>
										),
									},
									{
										key: 'race',
										content: (
											<div className="flex flex-col">
												<div>{pairing.menteeRace}</div>
												<div className="text-muted-foreground mt-0.5 text-xs">
													{pairing.menteeRaceDate
														? new Date(
																pairing.menteeRaceDate,
															).toLocaleDateString()
														: 'Date not set'}
												</div>
											</div>
										),
									},
									{
										key: 'matchedAt',
										content: (
											<div className="text-sm">
												{new Date(pairing.matchedAt).toLocaleString()}
											</div>
										),
									},
									{
										key: 'actions',
										align: 'right' as const,
										content: (
											<Link
												href={`/admin/applications/${pairing.fundApplicationId}`}
												className="text-primary hover:underline"
											>
												View
											</Link>
										),
									},
								],
							}))}
							emptyState={
								<div className="text-muted-foreground text-sm">
									No active mentees for this mentor right now.
								</div>
							}
						/>
					</div>

					<div>
						<h3 className="mb-2 text-sm font-semibold tracking-wide uppercase">
							Past Mentorship Pairings
						</h3>
						<AdminDataTable
							columns={[
								{ key: 'mentee', content: 'Mentee', className: 'font-medium' },
								{ key: 'race', content: 'Race' },
								{ key: 'matchedAt', content: 'Matched' },
								{ key: 'endedAt', content: 'Ended' },
								{ key: 'actions', content: 'View', align: 'right' },
							]}
							rows={pastMentorshipPairings.map((pairing) => ({
								id: pairing.matchId,
								cells: [
									{
										key: 'mentee',
										content: (
											<div className="flex flex-col">
												<div>{pairing.menteeName}</div>
												<div className="text-muted-foreground mt-0.5 text-xs">
													{pairing.menteeEmail}
												</div>
											</div>
										),
									},
									{
										key: 'race',
										content: (
											<div className="flex flex-col">
												<div>{pairing.menteeRace}</div>
												<div className="text-muted-foreground mt-0.5 text-xs">
													{pairing.menteeRaceDate
														? new Date(
																pairing.menteeRaceDate,
															).toLocaleDateString()
														: 'Date not set'}
												</div>
											</div>
										),
									},
									{
										key: 'matchedAt',
										content: (
											<div className="text-sm">
												{new Date(pairing.matchedAt).toLocaleString()}
											</div>
										),
									},
									{
										key: 'endedAt',
										content: (
											<div className="text-sm">
												{pairing.endedAt
													? new Date(pairing.endedAt).toLocaleString()
													: '—'}
											</div>
										),
									},
									{
										key: 'actions',
										align: 'right' as const,
										content: (
											<Link
												href={`/admin/applications/${pairing.fundApplicationId}`}
												className="text-primary hover:underline"
											>
												View
											</Link>
										),
									},
								],
							}))}
							emptyState={
								<div className="text-muted-foreground text-sm">
									No past mentorship pairings yet.
								</div>
							}
						/>
					</div>
				</div>
			</AdminDetailSection>

			<AdminDetailActions className="pt-2">
				<div className="flex items-center gap-2">
					<Button variant="outline" asChild>
						<Link href="/admin/users">Back to Users</Link>
					</Button>
					<Button variant="secondary" asChild>
						<a
							href={`mailto:${user.email}`}
							className="inline-flex items-center gap-2"
						>
							<Mail className="h-4 w-4" />
							Email {user.name ? user.name.split(' ')[0] : user.email}
						</a>
					</Button>
				</div>

				<UserDeleteAction
					userName={displayName}
					userId={user.id}
					clerkId={user.clerkId}
				/>
			</AdminDetailActions>
		</div>
	)
}

function StatusPill({
	label,
	colorClass,
}: {
	label: string
	colorClass: string
}) {
	return <span className={`rounded px-2 py-0.5 ${colorClass}`}>{label}</span>
}
