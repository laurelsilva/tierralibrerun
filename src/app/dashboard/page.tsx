import { UserButton, SignOutButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { and, desc, eq, inArray, isNull } from 'drizzle-orm'
import {
	Slack,
	Shield,
	CheckCircle,
	Plus,
	FileText,
	Heart,
	Mail,
	MessageCircle,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { getUserMentorApplicationStatus } from '@/app/mentor/apply/actions'
import { WorkflowStageBadge } from '@/components/admin'
import { ConfirmParticipationButton } from '@/components/fund/confirm-participation-button'
import { ModeToggle } from '@/components/toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatLongDate } from '@/lib/dates'
import { getBrandLinks } from '@/lib/email/brand'
import { dashboardMetadata } from '@/lib/metadata'
import { requireOnboardedUser } from '@/server/auth'
import { getUserType, getUserPermissions } from '@/server/auth/roles'
import {
	fundApplications,
	mentorApplications,
	mentorshipMatches,
	db,
} from '@/server/db'
import { syncPastRaceFundApplications } from '@/server/workflow/service'

export const metadata = dashboardMetadata

export default async function DashboardPage() {
	return (
		<div className="bg-background text-foreground min-h-screen">
			<main className="container mx-auto max-w-6xl px-4 py-12">
				<Suspense
					fallback={
						<div className="bg-card/50 h-40 animate-pulse rounded-xl" />
					}
				>
					<AccountOverview />
				</Suspense>
			</main>
		</div>
	)
}

async function AccountOverview() {
	await syncPastRaceFundApplications()
	const dbUser = await requireOnboardedUser({ next: '/dashboard' })
	const user = await currentUser()
	const userType = await getUserType()
	const permissions = getUserPermissions(userType)

	if (!user) {
		throw new Error('Authenticated dashboard request missing Clerk user')
	}

	const applications = permissions.showApplicationsTab
		? await db
				.select()
				.from(fundApplications)
				.where(eq(fundApplications.userId, dbUser.id))
				.orderBy(desc(fundApplications.createdAt))
		: []

	// Fetch active mentor matches for this user's fund applications
	const appIds = applications.map((a) => a.id)
	const mentorMatches =
		appIds.length > 0
			? await db
					.select({
						fundApplicationId: mentorshipMatches.fundApplicationId,
						mentorName: mentorApplications.name,
						mentorEmail: mentorApplications.email,
						mentorPronouns: mentorApplications.pronouns,
						mentorCommunicationStyle:
							mentorApplications.preferredCommunicationStyle,
					})
					.from(mentorshipMatches)
					.innerJoin(
						mentorApplications,
						eq(mentorshipMatches.mentorApplicationId, mentorApplications.id),
					)
					.where(
						and(
							inArray(mentorshipMatches.fundApplicationId, appIds),
							isNull(mentorshipMatches.endedAt),
						),
					)
			: []

	// Build a lookup map: fundApplicationId -> mentor info
	const mentorByAppId = new Map(
		mentorMatches.map((m) => [m.fundApplicationId, m]),
	)

	const mentorApplicationStatus = permissions.showApplicationsTab
		? await getUserMentorApplicationStatus(dbUser.id)
		: null

	const brand = getBrandLinks()
	const hasApprovedFundApplication = applications.some(
		(app) =>
			app.workflowStage === 'REGISTERED' ||
			app.workflowStage === 'ONBOARDING_IN_PROGRESS' ||
			app.workflowStage === 'ACTIVE_IN_PROGRAM' ||
			app.workflowStage === 'NO_LONGER_ACTIVE',
	)
	const hasApprovedMentorApplication =
		mentorApplicationStatus?.latestApplication?.workflowStage ===
			'APPROVED_POOL' ||
		mentorApplicationStatus?.latestApplication?.workflowStage ===
			'MATCH_PENDING' ||
		mentorApplicationStatus?.latestApplication?.workflowStage === 'MATCHED' ||
		mentorApplicationStatus?.latestApplication?.workflowStage === 'ACTIVE'
	const canReceiveSlackInvite =
		permissions.canAccessSlack &&
		(hasApprovedFundApplication || hasApprovedMentorApplication)

	const fullName =
		`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Athlete'
	const primaryEmail = user.emailAddresses.find(
		(email) => email.id === user.primaryEmailAddressId,
	)
	const email =
		primaryEmail?.emailAddress || user.emailAddresses[0]?.emailAddress || ''
	const isEmailVerified = primaryEmail?.verification?.status === 'verified'

	// Get first letter of first and last name for avatar fallback
	const initials =
		`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()

	// Calculate account age
	const accountCreatedDate = new Date(user.createdAt)
	const today = new Date()
	const accountAgeInDays = Math.floor(
		(today.getTime() - accountCreatedDate.getTime()) / (1000 * 60 * 60 * 24),
	)

	const formatDate = formatLongDate
	const latestFundApplication = applications[0] || null
	const latestFundNextStep = latestFundApplication
		? getFundNextStep(latestFundApplication.workflowStage || 'SUBMITTED')
		: null

	return (
		<div className="space-y-8">
			{/* Page Header with account age indicator */}
			<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div>
					<h1 className="mb-2 text-4xl font-bold">Athlete Dashboard</h1>
					<div className="bg-primary mb-3 h-1 w-20 rounded-full"></div>
					<p className="text-muted-foreground text-lg">
						Manage your account and trail running applications
					</p>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground text-sm">Member for:</span>
					<Badge variant="outline" className="font-medium">
						{accountAgeInDays} {accountAgeInDays === 1 ? 'day' : 'days'}
					</Badge>
				</div>
			</div>

			<Tabs
				defaultValue="overview"
				className="w-full"
				aria-label="Account sections"
			>
				<TabsList className="bg-primary/5 mb-4 max-w-full flex-nowrap overflow-x-auto rounded-xl p-1 whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] md:mb-6 [&::-webkit-scrollbar]:hidden">
					<TabsTrigger value="overview" className="flex-none shrink-0">
						Profile
					</TabsTrigger>
					{permissions.showApplicationsTab && (
						<TabsTrigger value="applications" className="flex-none shrink-0">
							Fund Applications
						</TabsTrigger>
					)}
					{permissions.showApplicationsTab && (
						<TabsTrigger value="mentor" className="flex-none shrink-0">
							Mentor Application
						</TabsTrigger>
					)}
					{permissions.showDonateTab && (
						<TabsTrigger value="donate" className="flex-none shrink-0">
							Donate
						</TabsTrigger>
					)}
					{permissions.showCommunityTab && (
						<TabsTrigger value="community" className="flex-none shrink-0">
							Community
						</TabsTrigger>
					)}
					<TabsTrigger value="account" className="flex-none shrink-0">
						Account Details
					</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value="overview" className="space-y-6">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-xl">Your Profile</CardTitle>
							<CardDescription>
								Your personal information and account overview
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col gap-6 md:flex-row">
								<div className="flex-1 space-y-6">
									<div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
										<div>
											<p className="text-sm leading-none font-medium">Name</p>
											<p className="text-muted-foreground mt-1 text-lg">
												{fullName}
											</p>
										</div>

										<div>
											<p className="text-sm leading-none font-medium">Email</p>
											<div className="mt-1 flex items-center gap-2">
												<p className="text-muted-foreground text-lg">{email}</p>
												{isEmailVerified ? (
													<Badge
														variant="outline"
														className="border-green-200 bg-green-50 text-green-700"
													>
														Verified
													</Badge>
												) : (
													<Badge
														variant="outline"
														className="border-amber-200 bg-amber-50 text-amber-700"
													>
														Unverified
													</Badge>
												)}
											</div>
										</div>

										<div>
											<p className="text-sm leading-none font-medium">
												Member Since
											</p>
											<p className="text-muted-foreground mt-1 text-lg">
												{formatDate(accountCreatedDate)}
											</p>
										</div>

										<div>
											<p className="text-sm leading-none font-medium">
												Username
											</p>
											<p className="text-muted-foreground mt-1 text-lg">
												{user.username || 'Not set'}
											</p>
										</div>
									</div>

									<div className="bg-primary/5 flex items-center gap-3 rounded-xl p-4">
										<div className="bg-primary/10 rounded-full p-2">
											<Shield className="text-primary h-5 w-5" />
										</div>
										<div>
											<p className="font-medium">Account Security</p>
											<p className="text-muted-foreground text-sm">
												{user.passwordEnabled
													? 'Password enabled'
													: 'No password set'}{' '}
												•
												{user.twoFactorEnabled
													? ' 2FA enabled'
													: ' 2FA disabled'}
											</p>
										</div>
									</div>
								</div>

								<div className="flex flex-col items-center justify-between border-t pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-8">
									<div className="relative">
										<Avatar className="border-primary/20 h-32 w-32 border-2">
											<AvatarImage
												src={user.imageUrl}
												alt={fullName}
												className="object-cover"
											/>
											<AvatarFallback className="text-3xl">
												{initials}
											</AvatarFallback>
										</Avatar>

										<div className="bg-card absolute -right-2 -bottom-2 rounded-full p-1 shadow-md">
											<UserButton
												afterSignOutUrl="/"
												appearance={{
													elements: {
														userButtonAvatarBox: 'h-10 w-10',
														userButtonTrigger: 'focus:ring-0',
													},
												}}
											/>
										</div>
									</div>

									<div className="mt-6 text-center">
										<p className="mb-1 font-medium">{fullName}</p>
										<p className="text-muted-foreground mb-4 text-sm">
											{email}
										</p>
										<p className="text-muted-foreground text-xs">
											Click avatar to manage account
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Applications Tab */}
				<TabsContent value="applications" className="space-y-6">
					<Card>
						<CardHeader>
							<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
								<div>
									<CardTitle className="text-xl">
										Race Funding Applications
									</CardTitle>
									<CardDescription>
										Track the status of your athlete fund applications
									</CardDescription>
								</div>
								{applications.length > 0 && (
									<Button asChild>
										<Link href="/fund/apply">
											<Plus className="mr-2 h-4 w-4" />
											New Application
										</Link>
									</Button>
								)}
							</div>
						</CardHeader>
						<CardContent>
							{applications.length > 0 ? (
								<div className="space-y-6">
									{latestFundApplication && latestFundNextStep && (
										<div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
											<p className="text-sm font-semibold">Current Next Step</p>
											<p className="mt-1 text-sm">{latestFundNextStep}</p>
										</div>
									)}
									{applications.map((application) => (
										<div
											key={application.id}
											className="hover:bg-card/50 rounded-xl border p-6 transition-colors"
										>
											<div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
												<div>
													<h3 className="text-lg font-medium">
														{application.race}
													</h3>
													<p className="text-muted-foreground text-sm">
														Applied on{' '}
														{formatDate(new Date(application.createdAt))}
													</p>
												</div>
												<WorkflowStageBadge
													applicationType="FUND"
													stage={application.workflowStage || 'SUBMITTED'}
												/>
											</div>

											<Separator className="my-4" />

											<div className="space-y-4">
												<div className="flex flex-wrap gap-3">
													<span className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium">
														{application.firstRace
															? 'First Trail Race'
															: 'Experienced Athlete'}
													</span>
													<span className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium">
														{application.wantsMentor
															? 'Wants Mentor'
															: 'No Mentor'}
													</span>
												</div>
												{(application.goals || application.reason) && (
													<div>
														<h4 className="text-muted-foreground mb-1 text-xs font-medium">
															Why This Race
														</h4>
														<p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
															{application.goals || application.reason}
														</p>
													</div>
												)}
											</div>

											<FundWorkflowMessage
												applicationId={application.id}
												stage={application.workflowStage || 'SUBMITTED'}
												confirmationDeadlineAt={
													application.confirmationDeadlineAt
												}
											/>

											{mentorByAppId.has(application.id) &&
												(() => {
													const mentor = mentorByAppId.get(application.id)!
													return (
														<div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
															<div className="mb-3 flex items-center gap-2">
																<Users className="h-4 w-4 text-green-600" />
																<p className="text-sm font-semibold">
																	Your Mentor
																</p>
															</div>
															<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
																<div>
																	<p className="text-muted-foreground text-xs font-medium">
																		Name
																	</p>
																	<p className="text-sm">
																		{mentor.mentorName}
																		{mentor.mentorPronouns && (
																			<span className="text-muted-foreground ml-1 text-xs">
																				({mentor.mentorPronouns})
																			</span>
																		)}
																	</p>
																</div>
																<div>
																	<p className="text-muted-foreground text-xs font-medium">
																		Email
																	</p>
																	<a
																		href={`mailto:${mentor.mentorEmail}`}
																		className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
																	>
																		<Mail className="h-3 w-3" />
																		{mentor.mentorEmail}
																	</a>
																</div>
																{mentor.mentorCommunicationStyle && (
																	<div className="sm:col-span-2">
																		<p className="text-muted-foreground text-xs font-medium">
																			Preferred Communication
																		</p>
																		<p className="inline-flex items-center gap-1 text-sm">
																			<MessageCircle className="h-3 w-3" />
																			{mentor.mentorCommunicationStyle}
																		</p>
																	</div>
																)}
															</div>
														</div>
													)
												})()}
										</div>
									))}
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-16 text-center">
									<div className="text-muted-foreground/30 relative mb-6 h-24 w-24">
										<FileText className="h-24 w-24" />
									</div>
									<h3 className="mb-2 text-xl font-medium">
										No Applications Yet
									</h3>
									<p className="text-muted-foreground mb-8 max-w-md">
										You haven't applied for any race funding. Start your journey
										by applying to one of our sponsored races.
									</p>
									<Button asChild size="lg">
										<Link href="/fund/apply">Apply for Race Funding</Link>
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Mentor Application Tab */}
				{permissions.showApplicationsTab && (
					<TabsContent value="mentor" className="space-y-6">
						<Card>
							<CardHeader>
								<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
									<div>
										<CardTitle className="text-xl">
											Mentor Application
										</CardTitle>
										<CardDescription>
											Support fellow athletes in their trail running journey
										</CardDescription>
									</div>
									{!mentorApplicationStatus?.hasApplicationThisYear && (
										<Button asChild>
											<Link href="/mentor/apply">
												<Users className="mr-2 h-4 w-4" />
												Apply to Mentor
											</Link>
										</Button>
									)}
								</div>
							</CardHeader>
							<CardContent>
								{mentorApplicationStatus?.hasApplicationThisYear &&
								mentorApplicationStatus.latestApplication ? (
									<div className="space-y-6">
										<div className="hover:bg-card/50 rounded-xl border p-6 transition-colors">
											<div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
												<div>
													<h3 className="text-lg font-medium">
														Mentor Application
													</h3>
													<p className="text-muted-foreground text-sm">
														Applied on{' '}
														{formatDate(
															new Date(
																mentorApplicationStatus.latestApplication
																	.createdAt,
															),
														)}
													</p>
												</div>
												<MentorApplicationStatus
													status={
														mentorApplicationStatus.latestApplication
															.workflowStage || 'SUBMITTED'
													}
												/>
											</div>

											<Separator className="my-4" />

											<div className="space-y-4">
												{(mentorApplicationStatus.latestApplication
													.workflowStage === 'APPROVED_POOL' ||
													mentorApplicationStatus.latestApplication
														.workflowStage === 'MATCH_PENDING' ||
													mentorApplicationStatus.latestApplication
														.workflowStage === 'MATCHED' ||
													mentorApplicationStatus.latestApplication
														.workflowStage === 'ACTIVE') && (
													<div className="rounded-lg border border-green-500/10 bg-green-500/5 p-3">
														<p className="flex items-center gap-2 text-sm">
															<CheckCircle className="h-4 w-4 text-green-500" />
															Congratulations! You've been approved as a mentor.
															Check your email for next steps and Slack invite.
														</p>
													</div>
												)}

												{(mentorApplicationStatus.latestApplication
													.workflowStage === 'SUBMITTED' ||
													mentorApplicationStatus.latestApplication
														.workflowStage === 'IN_REVIEW') && (
													<div className="rounded-lg border border-blue-500/10 bg-blue-500/5 p-3">
														<p className="flex items-center gap-2 text-sm">
															<FileText className="h-4 w-4 text-blue-500" />
															Your mentor application is being reviewed. We'll
															notify you via email when there's an update.
														</p>
													</div>
												)}

												{mentorApplicationStatus.latestApplication
													.workflowStage === 'WAITLISTED' && (
													<div className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-3">
														<p className="flex items-center gap-2 text-sm">
															<FileText className="h-4 w-4 text-amber-500" />
															You're on our mentor waitlist. We'll reach out
															when a mentoring opportunity becomes available.
														</p>
													</div>
												)}
											</div>
										</div>
									</div>
								) : (
									<div className="flex flex-col items-center justify-center py-16 text-center">
										<div className="text-muted-foreground/30 relative mb-6 h-24 w-24">
											<Users className="h-24 w-24" />
										</div>
										<h3 className="mb-2 text-xl font-medium">
											Become a Mentor
										</h3>
										<p className="text-muted-foreground mb-8 max-w-md">
											Share your trail running experience and support fellow
											athletes in their journey. Help build our inclusive
											community.
										</p>
										<div className="flex flex-col space-y-6">
											<Button asChild size="lg">
												<Link href="/mentor/apply">Apply to Be a Mentor</Link>
											</Button>
											<Button asChild variant="outline">
												<Link href="/mentor">Learn About Mentoring</Link>
											</Button>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				)}

				{/* Community Tab - Different content based on user type */}
				{permissions.showCommunityTab && (
					<TabsContent value="community" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-xl">
									{userType === 'ally'
										? 'Community Updates'
										: 'Community Connections'}
								</CardTitle>
								<CardDescription>
									{userType === 'ally'
										? 'Stay connected with our community'
										: 'Connect with fellow athletes'}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex flex-col gap-8">
									<div>
										<h3 className="mb-6 text-center text-lg font-medium">
											{userType === 'ally'
												? 'Stay Connected'
												: 'Connect with Our Community'}
										</h3>
									</div>

									<div
										className={`grid grid-cols-1 items-center gap-6 ${userType === 'ally' ? 'mx-auto max-w-md md:grid-cols-1' : 'md:grid-cols-3'}`}
									>
										{permissions.canAccessStrava && (
											<div className="flex flex-col items-center space-y-4 p-4 text-center">
												<a
													href={process.env.NEXT_PUBLIC_STRAVA_URL || '#'}
													target="_blank"
													rel="noopener noreferrer"
													className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FC4C02] px-5 py-3 font-medium text-white transition-colors duration-200 hover:bg-[#e44400]"
												>
													<svg
														width="20"
														height="20"
														fill="currentColor"
														xmlns="http://www.w3.org/2000/svg"
														viewBox="0 0 24 24"
													>
														<path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
													</svg>
													Join on Strava
												</a>
											</div>
										)}

										{canReceiveSlackInvite && brand.slackUrl && (
											<div className="flex flex-col items-center space-y-4 p-4 text-center">
												<a
													href={brand.slackUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4A154B] px-5 py-3 font-medium text-white transition-colors duration-200 hover:bg-[#3a0f3a]"
												>
													<Slack className="h-5 w-5" />
													Join Slack Chat
												</a>
											</div>
										)}

										{permissions.canAccessInstagram && (
											<div className="flex flex-col items-center space-y-4 p-4 text-center">
												<a
													href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || "#"}
													target="_blank"
													rel="noopener noreferrer"
													className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-500 px-5 py-3 font-medium text-white"
												>
													<svg
														width="20"
														height="20"
														fill="currentColor"
														xmlns="http://www.w3.org/2000/svg"
														viewBox="0 0 24 24"
													>
														<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
													</svg>
													Follow on Instagram
												</a>
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				)}

				{/* Donate Tab - Only for allies */}
				{permissions.showDonateTab && (
					<TabsContent value="donate" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-xl">Donate to Athletes</CardTitle>
								<CardDescription>
									Your donation directly supports race entry fees, travel, and
									community programs for athletes
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-6">
									<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
										<div className="bg-primary/5 rounded-xl p-6">
											<div className="flex items-start gap-4">
												<div className="bg-primary/10 mt-1 rounded-lg p-2">
													<Shield className="text-primary h-6 w-6" />
												</div>
												<div>
													<h3 className="mb-2 text-lg font-medium">$50</h3>
													<p className="text-muted-foreground text-sm">
														Supports gear and nutrition for one athlete
													</p>
												</div>
											</div>
										</div>

										<div className="bg-primary/5 rounded-xl p-6">
											<div className="flex items-start gap-4">
												<div className="bg-primary/10 mt-1 rounded-lg p-2">
													<CheckCircle className="text-primary h-6 w-6" />
												</div>
												<div>
													<h3 className="mb-2 text-lg font-medium">$250</h3>
													<p className="text-muted-foreground text-sm">
														Funds travel to a destination race
													</p>
												</div>
											</div>
										</div>

										<div className="bg-primary/5 rounded-xl p-6">
											<div className="flex items-start gap-4">
												<div className="bg-primary/10 mt-1 rounded-lg p-2">
													<Heart className="text-primary h-6 w-6" />
												</div>
												<div>
													<h3 className="mb-2 text-lg font-medium">$500</h3>
													<p className="text-muted-foreground text-sm">
														Sponsors a full race experience
													</p>
												</div>
											</div>
										</div>
									</div>

									<div className="bg-primary overflow-hidden rounded-lg">
										<iframe
											src={process.env.NEXT_PUBLIC_DONATION_URL || ""}
											name="donateFrame"
											className="h-[600px] w-full"
											allowFullScreen
										/>
									</div>

									<div className="bg-muted rounded-lg p-4">
										<p className="text-muted-foreground text-sm">
											The BIPOC Athlete Fund is a 501(c)(3) nonprofit initiative
											with fiscal sponsorship through our nonprofit partner.
											Donations are tax-deductible.{process.env.NEXT_PUBLIC_TAX_ID ? ` Tax ID: ${process.env.NEXT_PUBLIC_TAX_ID}` : ''}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				)}

				{/* Account Details Tab - New tab for detailed Clerk info */}
				<TabsContent value="account" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-xl">Account Details</CardTitle>
							<CardDescription>
								Comprehensive information about your user account
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-8">
								{/* Identity Information */}
								<div>
									<h3 className="mb-4 border-b pb-2 text-lg font-medium">
										Identity Information
									</h3>
									<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
										<div>
											<p className="text-muted-foreground text-sm font-medium">
												User ID
											</p>
											<p className="font-mono text-sm break-all">{user.id}</p>
										</div>

										<div>
											<p className="text-muted-foreground text-sm font-medium">
												External ID
											</p>
											<p className="font-mono text-sm">
												{user.externalId || 'None'}
											</p>
										</div>

										<div>
											<p className="text-muted-foreground text-sm font-medium">
												Created
											</p>
											<p>{formatDate(new Date(user.createdAt))}</p>
										</div>

										<div>
											<p className="text-muted-foreground text-sm font-medium">
												Last Updated
											</p>
											<p>
												{user.updatedAt
													? formatDate(new Date(user.updatedAt))
													: 'Never'}
											</p>
										</div>

										<div>
											<p className="text-muted-foreground text-sm font-medium">
												Last Sign In
											</p>
											<p>
												{user.lastSignInAt
													? formatDate(new Date(user.lastSignInAt))
													: 'Never'}
											</p>
										</div>
									</div>
								</div>

								{/* Security Information */}
								<div>
									<h3 className="mb-4 border-b pb-2 text-lg font-medium">
										Security Information
									</h3>
									<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
										<div>
											<p className="text-muted-foreground text-sm font-medium">
												Password Enabled
											</p>
											<p>{user.passwordEnabled ? 'Yes' : 'No'}</p>
										</div>

										<div>
											<p className="text-muted-foreground text-sm font-medium">
												Two-Factor Auth
											</p>
											<p>{user.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
										</div>

										<div>
											<p className="text-muted-foreground text-sm font-medium">
												Public Profile
											</p>
											<p>{user.publicMetadata ? 'Yes' : 'No'}</p>
										</div>
									</div>
								</div>

								{/* Email Addresses */}
								{user.emailAddresses && user.emailAddresses.length > 0 && (
									<div>
										<h3 className="mb-4 border-b pb-2 text-lg font-medium">
											Email Addresses
										</h3>
										<div className="space-y-3">
											{user.emailAddresses.map((email) => (
												<div
													key={email.id}
													className="flex items-center justify-between rounded-lg border p-3"
												>
													<div>
														<p className="font-medium">{email.emailAddress}</p>
														<p className="text-muted-foreground text-xs">
															ID: {email.id}
														</p>
													</div>
													<div className="flex items-center gap-2">
														{email.id === user.primaryEmailAddressId && (
															<Badge className="bg-primary/10 text-primary">
																Primary
															</Badge>
														)}
														<Badge variant="outline">
															{email.verification?.status || 'Unverified'}
														</Badge>
													</div>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Phone Numbers */}
								{user.phoneNumbers && user.phoneNumbers.length > 0 && (
									<div>
										<h3 className="mb-4 border-b pb-2 text-lg font-medium">
											Phone Numbers
										</h3>
										<div className="space-y-3">
											{user.phoneNumbers.map((phone) => (
												<div
													key={phone.id}
													className="flex items-center justify-between rounded-lg border p-3"
												>
													<div>
														<p className="font-medium">{phone.phoneNumber}</p>
														<p className="text-muted-foreground text-xs">
															ID: {phone.id}
														</p>
													</div>
													<div className="flex items-center gap-2">
														{phone.id === user.primaryPhoneNumberId && (
															<Badge className="bg-primary/10 text-primary">
																Primary
															</Badge>
														)}
														<Badge variant="outline">
															{phone.verification?.status || 'Unverified'}
														</Badge>
													</div>
												</div>
											))}
										</div>
									</div>
								)}
								{/* External Accounts */}
								{user.externalAccounts && user.externalAccounts.length > 0 && (
									<div>
										<h3 className="mb-4 border-b pb-2 text-lg font-medium">
											Connected Accounts
										</h3>
										<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
											{user.externalAccounts.map((account) => (
												<div
													key={account.id}
													className="flex items-center justify-between rounded-lg border p-3"
												>
													<div className="flex items-center gap-3">
														<div className="bg-primary/5 flex h-8 w-8 items-center justify-center rounded-full">
															<span className="text-xs font-medium uppercase">
																{account.provider.slice(0, 2)}
															</span>
														</div>
														<div>
															<p className="font-medium capitalize">
																{account.provider}
															</p>
															{account.emailAddress && (
																<p className="text-muted-foreground text-xs">
																	{account.emailAddress}
																</p>
															)}
														</div>
													</div>
													<p className="text-muted-foreground text-xs">
														ID: {account.externalId.slice(0, 8)}...
													</p>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Database Connection */}
								{dbUser && (
									<div>
										<h3 className="mb-4 border-b pb-2 text-lg font-medium">
											Database Connection
										</h3>
										<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
											<div>
												<p className="text-muted-foreground text-sm font-medium">
													Database ID
												</p>
												<p className="font-mono text-sm break-all">
													{dbUser.id}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground text-sm font-medium">
													Database Email
												</p>
												<p>{dbUser.email}</p>
											</div>
											<div>
												<p className="text-muted-foreground text-sm font-medium">
													Clerk ID (in DB)
												</p>
												<p className="font-mono text-sm break-all">
													{dbUser.clerkId}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground text-sm font-medium">
													DB Record Created
												</p>
												<p>{formatDate(new Date(dbUser.createdAt))}</p>
											</div>
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{/* Appearance Card */}
				<Card className="text-center">
					<CardContent className="pt-6">
						<div className="mx-auto max-w-sm">
							<h3 className="mb-2 text-lg font-medium">Appearance</h3>
							<p className="text-muted-foreground mb-4">
								Choose your preferred display mode.
							</p>
							<div className="flex justify-center">
								<ModeToggle />
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Sign Out Card */}
				<Card className="text-center">
					<CardContent className="pt-6">
						<div className="mx-auto max-w-sm">
							<p className="text-muted-foreground mb-4">
								Ready to leave? You can sign back in anytime.
							</p>
							<SignOutButton>
								<Button variant="outline" size="lg">
									Sign Out
								</Button>
							</SignOutButton>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

function FundWorkflowMessage({
	applicationId,
	stage,
	confirmationDeadlineAt,
}: {
	applicationId: string
	stage: string
	confirmationDeadlineAt: Date | string | null
}) {
	if (stage === 'AWAITING_CONFIRMATION') {
		return (
			<div className="mt-4 rounded-lg border border-blue-500/10 bg-blue-500/5 p-3">
				<p className="flex items-center gap-2 text-sm">
					<CheckCircle className="h-4 w-4 text-blue-500" />
					You are approved. Confirm participation to lock your spot.
				</p>
				{confirmationDeadlineAt && (
					<p className="text-muted-foreground mt-2 text-xs">
						Please confirm by{' '}
						{new Date(confirmationDeadlineAt).toLocaleString('en-US', {
							month: 'short',
							day: 'numeric',
							year: 'numeric',
							hour: 'numeric',
							minute: '2-digit',
						})}
						.
					</p>
				)}
				<div className="mt-3">
					<ConfirmParticipationButton applicationId={applicationId} />
				</div>
			</div>
		)
	}

	if (stage === 'CONFIRMED' || stage === 'REGISTRATION_IN_PROGRESS') {
		return (
			<div className="mt-4 rounded-lg border border-indigo-500/10 bg-indigo-500/5 p-3">
				<p className="flex items-center gap-2 text-sm">
					<FileText className="h-4 w-4 text-indigo-500" />
					Thanks for confirming. We are processing your race registration now.
				</p>
			</div>
		)
	}

	if (stage === 'REGISTERED' || stage === 'ONBOARDING_IN_PROGRESS') {
		return (
			<div className="mt-4 rounded-lg border border-green-500/10 bg-green-500/5 p-3">
				<p className="flex items-center gap-2 text-sm">
					<CheckCircle className="h-4 w-4 text-green-500" />
					Registration confirmed. Check your email for community onboarding
					steps.
				</p>
			</div>
		)
	}

	if (stage === 'ACTIVE_IN_PROGRAM') {
		return (
			<div className="mt-4 rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3">
				<p className="flex items-center gap-2 text-sm">
					<CheckCircle className="h-4 w-4 text-emerald-500" />
					You are fully active in the program. Welcome!
				</p>
			</div>
		)
	}

	if (stage === 'NO_LONGER_ACTIVE') {
		return (
			<div className="mt-4 rounded-lg border border-slate-500/10 bg-slate-500/5 p-3">
				<p className="flex items-center gap-2 text-sm">
					<CheckCircle className="h-4 w-4 text-slate-600" />
					Your race cycle is complete. You are no longer marked active.
				</p>
			</div>
		)
	}

	if (stage === 'NO_SHOW_OR_DROPPED') {
		return (
			<div className="mt-4 rounded-lg border border-orange-500/10 bg-orange-500/5 p-3">
				<p className="flex items-center gap-2 text-sm">
					<FileText className="h-4 w-4 text-orange-500" />
					This registration is marked as no-show or withdrawn before race day.
				</p>
			</div>
		)
	}

	if (stage === 'WAITLISTED') {
		return (
			<div className="mt-4 rounded-lg border border-amber-500/10 bg-amber-500/5 p-3">
				<p className="flex items-center gap-2 text-sm">
					<FileText className="h-4 w-4 text-amber-500" />
					You are currently waitlisted. We will email you if a spot opens.
				</p>
			</div>
		)
	}

	if (stage === 'DECLINED' || stage === 'CLOSED') {
		return (
			<div className="mt-4 rounded-lg border border-red-500/10 bg-red-500/5 p-3">
				<p className="flex items-center gap-2 text-sm">
					<FileText className="h-4 w-4 text-red-500" />
					This application is closed for this cycle.
				</p>
			</div>
		)
	}

	return (
		<div className="mt-4 rounded-lg border border-blue-500/10 bg-blue-500/5 p-3">
			<p className="flex items-center gap-2 text-sm">
				<FileText className="h-4 w-4 text-blue-500" />
				Your application is being reviewed. We will email you with updates.
			</p>
		</div>
	)
}

function getFundNextStep(stage: string) {
	switch (stage) {
		case 'AWAITING_CONFIRMATION':
			return 'Confirm participation to lock your funded race spot.'
		case 'CONFIRMED':
		case 'REGISTRATION_IN_PROGRESS':
			return 'No action needed right now. We are processing your registration.'
		case 'REGISTERED':
		case 'ONBOARDING_IN_PROGRESS':
			return 'Watch your email for Slack onboarding and community next steps.'
		case 'ACTIVE_IN_PROGRAM':
			return 'You are active. Focus on training and community check-ins.'
		case 'NO_LONGER_ACTIVE':
			return 'This race cycle is complete. You can still stay active in the community.'
		case 'NO_SHOW_OR_DROPPED':
			return 'This race was marked no-show/dropped. Reach out if this needs correction.'
		case 'WAITLISTED':
			return 'You are on the waitlist. We will contact you if a spot opens.'
		case 'DECLINED':
		case 'CLOSED':
			return 'This application is closed for this cycle.'
		case 'SUBMITTED':
		case 'IN_REVIEW':
		default:
			return 'Your application is in review. We will email updates as decisions are made.'
	}
}

function MentorApplicationStatus({ status }: { status: string }) {
	return <WorkflowStageBadge applicationType="MENTOR" stage={status} />
}
