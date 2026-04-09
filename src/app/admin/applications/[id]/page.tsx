import { and, desc, eq } from 'drizzle-orm'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserApplicationStatus } from '../../../fund/apply/actions'
import {
	ActivityLogSection,
	FundAdminStatusBadge,
	RegistrationStatusBadge,
	WorkflowActionPanel,
	RaceDetailsDisplay,
	ApplicationDeleteWithRedirect,
} from '@/components/admin'
import {
	AdminDetailHeader,
	AdminDetailSection,
	AdminKeyValueGrid,
	AdminLabeledText,
	AdminDetailActions,
} from '@/components/admin/admin-detail'
import { CopyApplicationInformationButton } from '@/components/admin/copy-application-information-button'
import EmailSender from '@/components/admin/email-sender'
import { MentorMatchAssignmentCard } from '@/components/admin/mentor-match-assignment-card'
import { UpdateFundApplicationRaceForm } from '@/components/admin/update-fund-application-race-form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { formatLongDate } from '@/lib/dates'
import { getAllRaceOptionsForApplication } from '@/lib/sanity/queries'
import {
	FUND_ADMIN_STATUS_LABELS,
	getFundAdminStatus,
	type FundWorkflowStage,
} from '@/lib/types/workflow'
import { initialsFromName } from '@/lib/utils'
import { getAvatarUrlFromClerkId } from '@/server/clerk/avatar'
import { db, emailLogs, users } from '@/server/db'
import {
	canAssignMentorToFundApplicationStage,
	getFundMentorAssignmentContext,
	getFundWorkflowContext,
} from '@/server/workflow/service'

interface Params {
	id: string
}

interface Props {
	params: Promise<Params>
}

const formatDate = formatLongDate

function formatSlackDate(value: Date | string | null | undefined) {
	if (!value) return 'Date TBD'
	return new Date(value).toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	})
}

function normalizeSlackText(
	value: string | null | undefined,
	fallback = 'Not specified',
) {
	if (!value) return fallback

	const normalized = value
		.replace(/\r\n/g, '\n')
		.replace(/\u00a0/g, ' ')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim()

	return normalized || fallback
}

function yesNoPill(value: boolean) {
	return value ? (
		<span className="bg-primary/15 text-primary inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
			Yes
		</span>
	) : (
		<span className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
			No
		</span>
	)
}

function mentorPreferenceLabel(preference: string | null | undefined) {
	if (!preference || preference === 'no-preference') return 'No preference'
	if (preference === 'same-gender') return 'Prefers same-gender mentor'
	return preference
}

function toFundWorkflowStage(
	value: string | null | undefined,
): FundWorkflowStage {
	return (
		((value || 'SUBMITTED').toUpperCase() as FundWorkflowStage) || 'SUBMITTED'
	)
}

function buildSlackApplicationMessage({
	email,
	age,
	zipcode,
	bipocIdentity,
	genderIdentity,
	raceName,
	raceDate,
	raceLocation,
	aboutThem,
	accessToTrailRunning,
	whyThisRace,
	theRipple,
}: {
	email: string
	age: number | null
	zipcode: string | null
	bipocIdentity: boolean
	genderIdentity: string | null
	raceName: string
	raceDate: Date | string | null | undefined
	raceLocation: string | null
	aboutThem: string | null
	accessToTrailRunning: string | null
	whyThisRace: string | null
	theRipple: string | null
}) {
	const bold = (value: string) => `**${value}**`

	return [
		bold('Email'),
		normalizeSlackText(email),
		`Age ${age ?? 'Not specified'}`,
		'',
		bold('ZIP/Postal Code'),
		normalizeSlackText(zipcode),
		'',
		`BIPOC Identity ${bipocIdentity ? 'Yes' : 'No'}`,
		`Gender Identity ${normalizeSlackText(genderIdentity)}`,
		'',
		bold('Race & Registration'),
		normalizeSlackText(raceName),
		formatSlackDate(raceDate),
		normalizeSlackText(raceLocation, 'Location TBD'),
		'',
		bold('About Them'),
		normalizeSlackText(aboutThem),
		'',
		bold('Access to Trail Running'),
		normalizeSlackText(accessToTrailRunning),
		'',
		bold('Why This Race'),
		normalizeSlackText(whyThisRace),
		'',
		bold('The Ripple'),
		normalizeSlackText(theRipple),
	].join('\n')
}

export default async function ApplicationDetailPage(props: Props) {
	const params = await props.params
	const workflowContext = await getFundWorkflowContext(params.id)
	if (!workflowContext) {
		redirect('/admin')
	}

	const { application, stage, events } = workflowContext

	const [userInfo] = await db
		.select()
		.from(users)
		.where(eq(users.id, application.userId))
	const clerkAvatarUrl = await getAvatarUrlFromClerkId(userInfo?.clerkId)
	const avatarUrl = clerkAvatarUrl || userInfo?.profileImageUrl || null
	const avatarInitials = initialsFromName(application.name || application.email)

	const [
		applicationStatus,
		raceOptions,
		mentorAssignmentContext,
		applicationEmailLogs,
	] = await Promise.all([
		getUserApplicationStatus(application.userId),
		getAllRaceOptionsForApplication(),
		getFundMentorAssignmentContext(application.id),
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
					eq(emailLogs.applicationType, 'FUND'),
				),
			)
			.orderBy(desc(emailLogs.sentAt)),
	])

	const matchingRace = raceOptions?.find(
		(option) =>
			`${option.raceSeries.name} - ${option.distance}` === application.race,
	)

	const raceOptionItems = Array.from(
		new Set(
			(raceOptions ?? []).map(
				(option) => `${option.raceSeries.name} - ${option.distance}`,
			),
		),
	)
		.sort((a, b) => a.localeCompare(b))
		.map((value) => ({ value, label: value }))

	const raceName = application.race
	const raceDate = application.raceDate || matchingRace?.raceSeries?.date
	const raceDateLabel = formatDate(raceDate)
	const raceLocation =
		application.raceLocation ||
		matchingRace?.raceSeries?.location ||
		'Location TBD'
	const submittedLabel = formatDate(application.createdAt)
	const slackApplicationMessage = buildSlackApplicationMessage({
		email: application.email,
		age: application.age,
		zipcode: application.zipcode,
		bipocIdentity: Boolean(application.bipocIdentity),
		genderIdentity: application.genderIdentity,
		raceName,
		raceDate,
		raceLocation,
		aboutThem: application.reason,
		accessToTrailRunning: application.experience,
		whyThisRace: application.goals,
		theRipple: application.communityContribution,
	})
	const fundStage = toFundWorkflowStage(stage)
	const adminStatus = getFundAdminStatus(fundStage, {
		status: application.status,
	})
	const canAssignMentor = canAssignMentorToFundApplicationStage(fundStage)
	const mentorAssignmentDisabledReason = canAssignMentor
		? null
		: 'Mentor pairing opens once the athlete has been approved and moved into the active race workflow.'
	const mentorshipStatusLabel = application.wantsMentor
		? 'Requested'
		: 'Not requested'
	const mentorPreferenceText = application.wantsMentor
		? mentorPreferenceLabel(application.mentorGenderPreference)
		: 'No mentor requested'
	const supportNotes = [
		{
			key: 'mentorship-expectations',
			label: 'Mentorship expectations',
			value: application.tierraLibreContribution,
		},
		{
			key: 'other-support',
			label: 'Other support needed',
			value: application.additionalAssistanceNeeds,
		},
		{
			key: 'gear-needs',
			label: 'Gear needs',
			value: application.gearNeeds,
			eyebrow: 'Legacy field',
		},
	].filter(
		(
			item,
		): item is {
			key: string
			label: string
			value: string
			eyebrow?: string
		} => Boolean(item.value),
	)

	return (
		<div className="space-y-6">
			<Link
				href="/admin/fund-applications"
				className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
			>
				<ChevronLeft className="h-4 w-4" />
				Back to Athlete Applications
			</Link>

			<AdminDetailHeader
				title={application.name}
				subtitle={`${raceName} • Applied ${submittedLabel}`}
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
					<div className="flex flex-wrap items-center gap-2">
						<FundAdminStatusBadge
							stage={stage}
							status={application.status}
							size="md"
						/>
						<RegistrationStatusBadge
							status={application.registrationStatus || 'PENDING'}
						/>
					</div>
				}
				actions={
					<div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
						<CopyApplicationInformationButton text={slackApplicationMessage} />
						<Button asChild variant="outline" size="sm">
							<Link href={`/admin/users/${application.userId}`}>
								Open User Profile
							</Link>
						</Button>
						<EmailSender
							applicationId={application.id}
							applicantName={application.name}
							recipientEmail={application.email}
							status={
								application.status as
									| 'APPROVED'
									| 'WAITLISTED'
									| 'REJECTED'
									| 'PENDING'
							}
							applicationWorkflowStage={stage}
							applicationRecordStatus={application.status}
							defaultTokens={{
								raceName,
								raceDate: raceDateLabel,
								raceLocation,
								wantsMentor: application.wantsMentor,
								mentorGenderPreference: application.mentorGenderPreference,
							}}
							triggerLabel="Send Email"
						/>
					</div>
				}
			/>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="bg-card rounded-xl border p-4">
					<p className="text-muted-foreground text-xs font-medium uppercase">
						Admin Status
					</p>
					<p className="text-foreground mt-1 text-2xl font-semibold">
						{FUND_ADMIN_STATUS_LABELS[adminStatus]}
					</p>
				</div>
				<div className="bg-card rounded-xl border p-4">
					<p className="text-muted-foreground text-xs font-medium uppercase">
						Registration Status
					</p>
					<div className="mt-2">
						<RegistrationStatusBadge
							status={application.registrationStatus || 'PENDING'}
						/>
					</div>
				</div>
				<div className="bg-card rounded-xl border p-4">
					<p className="text-muted-foreground text-xs font-medium uppercase">
						Remaining This Cycle
					</p>
					<p className="text-foreground mt-1 text-2xl font-semibold">
						{applicationStatus.remainingApplications}
					</p>
				</div>
				<div className="bg-card rounded-xl border p-4">
					<p className="text-muted-foreground text-xs font-medium uppercase">
						Races Applied (6 Months)
					</p>
					<p className="text-foreground mt-1 text-2xl font-semibold">
						{applicationStatus.appliedRaces.length}
					</p>
				</div>
			</div>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
				<div className="order-2 space-y-6 xl:order-1">
					<AdminDetailSection
						title="Athlete Profile"
						description="Who this applicant is and how to contact them."
					>
						<AdminKeyValueGrid
							items={[
								{
									key: 'fullName',
									label: 'Full Name',
									value: (
										<Link
											href={`/admin/users/${application.userId}`}
											className="text-primary font-medium hover:underline"
										>
											{application.name}
										</Link>
									),
								},
								{ key: 'email', label: 'Email', value: application.email },
								{
									key: 'age',
									label: 'Age',
									value: application.age || 'Not specified',
								},
								{
									key: 'zip',
									label: 'ZIP/Postal Code',
									value: application.zipcode || 'Not specified',
								},
								{
									key: 'bipoc',
									label: 'BIPOC Identity',
									value: yesNoPill(Boolean(application.bipocIdentity)),
								},
								{
									key: 'gender',
									label: 'Gender Identity',
									value: application.genderIdentity || 'Not specified',
								},
								{
									key: 'referral',
									label: 'Referral Source',
									value: application.referralSource || 'Not specified',
								},
								{
									key: 'submitted',
									label: 'Submitted',
									value: submittedLabel,
								},
							]}
							columns={2}
						/>
					</AdminDetailSection>

					<AdminDetailSection
						title="Race & Registration"
						description="Race details and registration progress."
					>
						<div className="space-y-4">
							<div>
								<p className="text-muted-foreground mb-2 text-sm font-medium">
									Race Selection
								</p>
								<RaceDetailsDisplay
									raceString={application.race}
									raceOptions={raceOptions}
								/>
							</div>

							<AdminKeyValueGrid
								items={[
									{
										key: 'registrationStatus',
										label: 'Registration Status',
										value: (
											<RegistrationStatusBadge
												status={application.registrationStatus || 'PENDING'}
												size="md"
											/>
										),
									},
									{
										key: 'firstTrail',
										label: 'First Trail Race?',
										value: yesNoPill(Boolean(application.firstRace)),
									},
									{
										key: 'raceDate',
										label: 'Race Date',
										value: raceDateLabel,
									},
									{
										key: 'raceLocation',
										label: 'Race Location',
										value: raceLocation,
									},
								]}
								columns={2}
							/>

							<div>
								<p className="text-muted-foreground mb-2 text-sm font-medium">
									Change Race
								</p>
								<UpdateFundApplicationRaceForm
									applicationId={application.id}
									currentRace={application.race}
									raceOptions={raceOptionItems}
								/>
							</div>
						</div>
					</AdminDetailSection>

					<AdminDetailSection
						title="Application Narrative"
						description="Core responses used for funding decisions."
					>
						<div className="space-y-5">
							<AdminLabeledText label="About Them">
								{application.reason || 'Not specified'}
							</AdminLabeledText>
							<AdminLabeledText label="Access to Trail Running">
								{application.experience || 'Not specified'}
							</AdminLabeledText>
							<AdminLabeledText label="Why This Race">
								{application.goals || 'Not specified'}
							</AdminLabeledText>
							<AdminLabeledText label="The Ripple">
								{application.communityContribution || 'Not specified'}
							</AdminLabeledText>
						</div>
					</AdminDetailSection>

					<AdminDetailSection
						title="Mentorship & Support"
						description="Pair the athlete well, then use their notes to shape the relationship and support plan."
					>
						<div className="space-y-6">
							{/* Context row — request + preference (pairing status lives in the card below) */}
							<div className="grid gap-3 md:grid-cols-2">
								<div className="border-border/70 bg-muted/20 rounded-xl border p-4">
									<p className="text-muted-foreground text-[11px] font-medium tracking-[0.1em] uppercase">
										Mentorship request
									</p>
									<div className="mt-2 flex items-center gap-2">
										<p className="text-base font-semibold">
											{mentorshipStatusLabel}
										</p>
										<Badge
											variant={
												application.wantsMentor ? 'secondary' : 'outline'
											}
										>
											{application.wantsMentor
												? 'Athlete asked for it'
												: 'Optional'}
										</Badge>
									</div>
									<p className="text-muted-foreground mt-2 text-sm leading-relaxed">
										{application.wantsMentor
											? 'Pair with someone who can offer useful guidance through the race build and weekend.'
											: 'A mentor can still be assigned if the team believes it would help.'}
									</p>
								</div>

								<div className="border-border/70 bg-muted/20 rounded-xl border p-4">
									<p className="text-muted-foreground text-[11px] font-medium tracking-[0.1em] uppercase">
										Stated preference
									</p>
									<p className="mt-2 text-base font-semibold">
										{mentorPreferenceText}
									</p>
									<p className="text-muted-foreground mt-2 text-sm leading-relaxed">
										Preference checks are handled in the pairing flow so
										conflicts are visible before anything is saved.
									</p>
								</div>
							</div>

							{/* Support context — shown before pairing controls so admin reads athlete needs first */}
							<div className="space-y-3">
								<div className="space-y-1">
									<h3 className="text-sm font-semibold">Support context</h3>
									<p className="text-muted-foreground text-sm leading-relaxed">
										Review these notes before choosing a mentor — they shape the
										tone, cadence, and practical support of the pairing.
									</p>
								</div>

								{supportNotes.length > 0 ? (
									<div className="grid gap-3 md:grid-cols-2">
										{supportNotes.map((item) => (
											<div
												key={item.key}
												className="border-border/70 bg-muted/20 rounded-xl border p-4"
											>
												<div className="flex flex-wrap items-center gap-2">
													<p className="text-sm font-semibold">{item.label}</p>
													{item.eyebrow ? (
														<Badge variant="outline">{item.eyebrow}</Badge>
													) : null}
												</div>
												<p className="text-muted-foreground mt-2 text-sm leading-relaxed whitespace-pre-line">
													{item.value}
												</p>
											</div>
										))}
									</div>
								) : (
									<div className="border-border/70 bg-muted/15 rounded-xl border border-dashed px-4 py-5">
										<p className="text-sm font-medium">
											No additional mentorship or support notes were provided.
										</p>
										<p className="text-muted-foreground mt-1 text-sm leading-relaxed">
											You can still pair a mentor based on race fit, experience,
											and the athlete&apos;s overall application context.
										</p>
									</div>
								)}
							</div>

							{/* Pairing workspace — the actual assignment controls */}
							<MentorMatchAssignmentCard
								fundApplicationId={application.id}
								athleteName={application.name}
								athleteEmail={application.email}
								wantsMentor={Boolean(application.wantsMentor)}
								currentMatch={mentorAssignmentContext.currentMatch}
								mentorOptions={mentorAssignmentContext.mentorOptions}
								hiddenConflictCount={
									mentorAssignmentContext.hiddenConflictCount
								}
								canAssign={canAssignMentor}
								disabledReason={mentorAssignmentDisabledReason}
							/>
						</div>
					</AdminDetailSection>

					<AdminDetailSection
						title="Account & Eligibility History"
						description="Eligibility checks and account context."
					>
						<AdminKeyValueGrid
							items={[
								{
									key: 'applicationCount',
									label: 'Applications Used',
									value: `${applicationStatus.applicationCount}/1`,
								},
								{
									key: 'remainingApplications',
									label: 'Available Applications',
									value: applicationStatus.remainingApplications,
								},
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

						{applicationStatus.appliedRaces.length > 0 && (
							<div className="border-border/70 bg-muted/40 rounded-lg border p-4">
								<p className="text-muted-foreground mb-3 text-sm font-medium">
									Applied Races (Last 6 Months)
								</p>
								<div className="flex flex-wrap gap-2">
									{applicationStatus.appliedRaces.map((race, index) => (
										<span
											key={`${race}-${index}`}
											className={`rounded-md px-2.5 py-1 text-xs font-medium ${
												race === application.race
													? 'border-primary/30 bg-primary/15 text-primary border'
													: 'bg-muted text-muted-foreground'
											}`}
										>
											{race}
										</span>
									))}
								</div>
							</div>
						)}
					</AdminDetailSection>
				</div>

				<aside className="order-1 xl:order-2">
					<div className="space-y-6 xl:sticky xl:top-6">
						<AdminDetailSection
							title="Admin Actions"
							description="Use the smallest set of actions needed to move this athlete forward."
						>
							<WorkflowActionPanel
								applicationId={application.id}
								applicationType="FUND"
								currentStage={stage}
								currentRecordStatus={application.status}
							/>
						</AdminDetailSection>

						<ActivityLogSection
							applicationType="FUND"
							workflowEvents={events}
							emailLogs={applicationEmailLogs}
						/>
					</div>
				</aside>
			</div>

			<AdminDetailActions className="pt-2">
				<div>
					<Button variant="outline" asChild>
						<Link href="/admin/fund-applications">
							Back to Athlete Applications
						</Link>
					</Button>
				</div>
				<ApplicationDeleteWithRedirect
					applicationId={application.id}
					applicantName={application.name}
					race={application.race}
					redirectTo="/admin/fund-applications"
				/>
			</AdminDetailActions>
		</div>
	)
}
