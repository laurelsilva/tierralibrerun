import { and, desc, eq } from 'drizzle-orm'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getMentorApplicationStatus } from '../actions'
import {
	ActivityLogSection,
	WorkflowActionPanel,
	WorkflowStageBadge,
	MentorApplicationDeleteWithRedirect,
	EmailSender,
} from '@/components/admin'
import {
	AdminDetailHeader,
	AdminDetailSection,
	AdminKeyValueGrid,
	AdminLabeledText,
	AdminDetailActions,
} from '@/components/admin/admin-detail'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatLongDate } from '@/lib/dates'
import { initialsFromName } from '@/lib/utils'
import { getAvatarUrlFromClerkId } from '@/server/clerk/avatar'
import { db, emailLogs, users } from '@/server/db'
import { getMentorWorkflowContext } from '@/server/workflow/service'

interface Params {
	id: string
}

interface Props {
	params: Promise<Params>
}

const formatDate = formatLongDate

function mentorPrefLabel(value: string | null | undefined) {
	if (!value || value === 'no-preference') return 'No preference'
	if (value === 'same-gender') return 'Prefers same-gender mentees'
	return value
}

function yesNoPill(value: boolean) {
	return value ? (
		<span className="bg-secondary text-secondary-foreground inline-flex rounded-md px-2 py-1 text-xs font-medium">
			Yes
		</span>
	) : (
		<span className="bg-muted text-muted-foreground inline-flex rounded-md px-2 py-1 text-xs font-medium">
			No
		</span>
	)
}

export default async function MentorApplicationDetailPage(props: Props) {
	const params = await props.params

	const workflowContext = await getMentorWorkflowContext(params.id)
	if (!workflowContext) {
		redirect('/admin')
	}

	const { application, stage, transitions, tasks, events } = workflowContext

	const [userInfo] = await db
		.select()
		.from(users)
		.where(eq(users.id, application.userId))
	const clerkAvatarUrl = await getAvatarUrlFromClerkId(userInfo?.clerkId)
	const avatarUrl = clerkAvatarUrl || userInfo?.profileImageUrl || null
	const avatarInitials = initialsFromName(application.name || application.email)

	const [applicationStatus, applicationEmailLogs] = await Promise.all([
		getMentorApplicationStatus(application.userId),
		db
			.select({
				id: emailLogs.id,
				emailType: emailLogs.emailType,
				recipientEmail: emailLogs.recipientEmail,
				status: emailLogs.status,
				sentAt: emailLogs.sentAt,
			})
			.from(emailLogs)
			.where(
				and(
					eq(emailLogs.applicationId, application.id),
					eq(emailLogs.applicationType, 'MENTOR'),
				),
			)
			.orderBy(desc(emailLogs.sentAt)),
	])
	const openTasks = tasks.filter((task) => task.status === 'OPEN')

	return (
		<div className="space-y-6">
			<Link
				href="/admin/mentor-applications"
				className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
			>
				<ChevronLeft className="h-4 w-4" />
				Back to Mentor Applications
			</Link>

			<AdminDetailHeader
				title={application.name}
				subtitle={`Applied ${formatDate(application.createdAt)}`}
				avatar={
					<Avatar className="border-border/60 h-12 w-12 border">
						{avatarUrl ? (
							<AvatarImage src={avatarUrl} alt={`${application.name} avatar`} />
						) : null}
						<AvatarFallback className="text-xs font-semibold">
							{avatarInitials}
						</AvatarFallback>
					</Avatar>
				}
				status={
					<WorkflowStageBadge
						applicationType="MENTOR"
						stage={stage}
						size="md"
					/>
				}
				actions={
					<div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
						<Button asChild variant="outline" size="sm">
							<Link href={`/admin/users/${application.userId}`}>
								Open User Profile
							</Link>
						</Button>
						<EmailSender
							applicationId={application.id}
							applicantName={application.name}
							recipientEmail={application.email}
							applicationType="MENTOR"
							status={
								application.status as
									| 'APPROVED'
									| 'WAITLISTED'
									| 'REJECTED'
									| 'PENDING'
							}
							triggerLabel="Send Email"
						/>
					</div>
				}
			/>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="bg-card rounded-xl border p-4">
					<p className="text-muted-foreground text-xs font-medium uppercase">
						Stage
					</p>
					<div className="mt-2">
						<WorkflowStageBadge
							applicationType="MENTOR"
							stage={stage}
							size="md"
						/>
					</div>
				</div>
				<div className="bg-card rounded-xl border p-4">
					<p className="text-muted-foreground text-xs font-medium uppercase">
						Open Tasks
					</p>
					<p className="text-foreground mt-1 text-2xl font-semibold">
						{openTasks.length}
					</p>
				</div>
				<div className="bg-card rounded-xl border p-4">
					<p className="text-muted-foreground text-xs font-medium uppercase">
						Applied This Year
					</p>
					<div className="mt-2">
						{yesNoPill(applicationStatus.hasApplicationThisYear)}
					</div>
				</div>
				<div className="bg-card rounded-xl border p-4">
					<p className="text-muted-foreground text-xs font-medium uppercase">
						Total Mentor Applications
					</p>
					<p className="text-foreground mt-1 text-2xl font-semibold">
						{applicationStatus.applications.length}
					</p>
				</div>
			</div>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
				<div className="order-2 space-y-6 xl:order-1">
					<AdminDetailSection
						title="Mentor Profile"
						description="Who this mentor is and how to contact them."
					>
						<AdminKeyValueGrid
							items={[
								{ key: 'name', label: 'Full Name', value: application.name },
								{ key: 'email', label: 'Email', value: application.email },
								{
									key: 'pronouns',
									label: 'Pronouns',
									value: userInfo?.pronouns || 'Not specified',
								},
								{
									key: 'region',
									label: 'Region',
									value: userInfo?.locationRegion || 'Not specified',
								},
								{
									key: 'gender',
									label: 'Gender Identity',
									value: application.genderIdentity || 'Not specified',
								},
								{
									key: 'mentorPreference',
									label: 'Mentee Preference',
									value: mentorPrefLabel(application.mentorGenderPreference),
								},
								{
									key: 'hearAbout',
									label: 'Heard About Program',
									value: application.hearAboutProgram || 'Not specified',
								},
							]}
							columns={2}
						/>
					</AdminDetailSection>

					<AdminDetailSection
						title="Mentoring Narrative"
						description="Core responses for fit, communication, and support style."
					>
						<div className="space-y-5">
							<AdminLabeledText label="Motivation to Mentor">
								{application.motivationToMentor || 'Not specified'}
							</AdminLabeledText>
							<AdminKeyValueGrid
								items={[
									{
										key: 'communicationStyle',
										label: 'Preferred Communication Style',
										value:
											application.preferredCommunicationStyle ||
											'Not specified',
									},
									{
										key: 'availability',
										label: 'Availability',
										value: application.availability || 'Not specified',
									},
								]}
								columns={2}
							/>
							{application.additionalInfo && (
								<AdminLabeledText label="Additional Information">
									{application.additionalInfo}
								</AdminLabeledText>
							)}
						</div>
					</AdminDetailSection>

					<AdminDetailSection
						title="Running & Mentorship Background"
						description="Experience context for mentor readiness and matching."
					>
						<div className="space-y-5">
							<AdminLabeledText label="Running Experience">
								{userInfo?.runningExperience || 'Not specified'}
							</AdminLabeledText>
							<AdminLabeledText label="Previous Mentorship Experience">
								{application.mentorshipExperience || 'Not specified'}
							</AdminLabeledText>
							<AdminLabeledText label="Special Expertise">
								{application.specialExpertise || 'Not specified'}
							</AdminLabeledText>
						</div>
					</AdminDetailSection>

					<AdminDetailSection
						title="Account Information"
						description="Identity fields and account metadata."
					>
						<AdminKeyValueGrid
							items={[
								{
									key: 'userId',
									label: 'User ID',
									value: application.userId,
									mono: true,
								},
								...(userInfo
									? [
											{
												key: 'clerkId',
												label: 'Clerk ID',
												value: userInfo.clerkId,
												mono: true,
											},
											{
												key: 'accountCreated',
												label: 'Account Created',
												value: formatDate(userInfo.createdAt),
											},
										]
									: []),
							]}
							columns={2}
						/>
					</AdminDetailSection>
				</div>

				<aside className="order-1 xl:order-2">
					<div className="space-y-6 xl:sticky xl:top-6">
						<AdminDetailSection
							title="Next Workflow Actions"
							description="Move this mentor application forward one stage at a time."
						>
							<WorkflowActionPanel
								applicationId={application.id}
								applicationType="MENTOR"
								currentStage={stage}
								transitions={transitions}
							/>
						</AdminDetailSection>

						<AdminDetailSection
							title="Open Tasks"
							description="Checklist items still open."
						>
							<ul className="space-y-2">
								{openTasks.map((task) => (
									<li
										key={task.id}
										className="border-border/60 bg-muted/40 rounded-md border px-3 py-2"
									>
										<p className="text-sm font-medium">{task.title}</p>
										{task.description && (
											<p className="text-muted-foreground mt-1 text-xs">
												{task.description}
											</p>
										)}
									</li>
								))}
								{openTasks.length === 0 && (
									<li className="text-muted-foreground text-sm">
										No open tasks.
									</li>
								)}
							</ul>
						</AdminDetailSection>

						<ActivityLogSection
							applicationType="MENTOR"
							workflowEvents={events}
							emailLogs={applicationEmailLogs}
						/>
					</div>
				</aside>
			</div>

			<AdminDetailActions className="pt-2">
				<div>
					<Button variant="outline" asChild>
						<Link href="/admin/mentor-applications">
							Back to Mentor Applications
						</Link>
					</Button>
				</div>
				<MentorApplicationDeleteWithRedirect
					applicationId={application.id}
					applicantName={application.name}
					email={application.email}
					redirectTo="/admin/mentor-applications"
				/>
			</AdminDetailActions>
		</div>
	)
}
