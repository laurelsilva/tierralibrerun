import { DollarSign, Heart } from 'lucide-react'
import Link from 'next/link'
import { getUserApplicationStatus } from './actions'
import ApplicationForm from './application-form'

import { Button } from '@/components/ui/button'
import { fundApplyMetadata } from '@/lib/metadata'
import { getAllRaceOptionsForApplication } from '@/lib/sanity/queries'
import { FUND_WORKFLOW_LABELS, type FundWorkflowStage } from '@/lib/types/workflow'
import { requireOnboardedUser } from '@/server/auth'
import { getUserType, getUserPermissions } from '@/server/auth/roles'

export const metadata = {
	...fundApplyMetadata,
	robots: {
		index: false,
		follow: false,
		googleBot: {
			index: false,
			follow: false,
		},
	},
}

export default async function ApplyPage() {
	const dbUser = await requireOnboardedUser({ next: '/fund/apply' })

	// Check user permissions - only people of color can apply for funding
	const userType = await getUserType()
	const permissions = getUserPermissions(userType)

	if (!permissions.canApplyForFunding) {
		return (
			<main className="bg-background text-foreground">
				<section className="bg-primary py-16 md:py-24">
					<div className="container mx-auto px-4 md:px-6">
						<div className="mx-auto max-w-2xl text-center">
							<div className="bg-primary-foreground text-primary mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
								<DollarSign className="h-8 w-8" />
							</div>
							<h1 className="text-primary-foreground mb-6 text-4xl font-bold md:text-5xl">
								Athlete Fund
							</h1>
							<div className="bg-primary-foreground mx-auto mb-8 h-1 w-20 rounded"></div>
							<p className="text-primary-foreground/90 text-xl leading-relaxed">
								Thank you for your interest in our funding program!
							</p>
						</div>
					</div>
				</section>

				<section className="bg-background py-16 md:py-24">
					<div className="container mx-auto px-4 md:px-6">
						<div className="border-border bg-card mx-auto max-w-3xl rounded-xl border p-8 text-center shadow-sm">
							<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
								<Heart className="h-8 w-8" />
							</div>
							<h2 className="text-card-foreground mb-4 text-2xl font-bold">
								Funding for Athletes
							</h2>
							<p className="text-muted-foreground mb-6 text-lg leading-relaxed">
							The race funding program is specifically designed to support
							athletes by providing sponsored race entries and
							removing financial barriers
								to participation.
							</p>
							<p className="text-muted-foreground mb-8">
								If you're an ally who wants to support our mission, you can make
								a donation to help fund race entries for athletes.
							</p>
							<div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
								<Button asChild>
									<Link href="/donate">Support Through Donations</Link>
								</Button>
								<Button variant="outline" asChild>
									<Link href="/fund">Learn About Our Mission</Link>
								</Button>
								<Button variant="outline" asChild>
									<Link href="/dashboard">Return to Dashboard</Link>
								</Button>
							</div>
						</div>
					</div>
				</section>
			</main>
		)
	}

	// Get user information to pre-fill the form
	const userData = {
		name: dbUser.name ?? '',
		email: dbUser.email,
		userId: dbUser.id,
	}

	// Get user's application status for this year
	const applicationStatus = await getUserApplicationStatus(dbUser.id)

	// Get available race options
	const raceOptions = await getAllRaceOptionsForApplication()

	const workflowLabel = (stage: string | null | undefined, fallback: string) => {
		const normalized = String(stage || '').toUpperCase() as FundWorkflowStage
		return FUND_WORKFLOW_LABELS[normalized] || fallback
	}

	return (
		<main className="bg-background text-foreground min-h-screen">
			<div className="container mx-auto px-4 py-8 md:px-6 lg:py-12">
				<div className="mx-auto max-w-6xl">
					{applicationStatus.remainingApplications > 0 ? (
						<>
							{/* Compact recent apps banner */}
							{applicationStatus.applicationCount > 0 && (
								<div className="mx-auto mb-6 max-w-2xl rounded-lg border px-5 py-4">
									<div className="flex flex-wrap items-center justify-between gap-3">
										<p className="text-muted-foreground text-sm">
											You have {applicationStatus.applicationCount} recent{' '}
											{applicationStatus.applicationCount === 1
												? 'application'
												: 'applications'}
										</p>
										<Button variant="outline" size="sm" asChild>
											<Link href="/dashboard?tab=applications">
												View in Dashboard
											</Link>
										</Button>
									</div>
								</div>
							)}
							<ApplicationForm
								userData={userData}
								applicationStatus={applicationStatus}
								raceOptions={raceOptions}
							/>
						</>
					) : (
						<div className="bg-card mx-auto max-w-2xl rounded-xl p-8 text-center shadow-sm">
							<h3 className="mb-4 text-xl font-medium">
								Application Limit Reached
							</h3>
							<p className="text-muted-foreground mb-6">
								You have submitted an application in the last 6 months. You
								can submit your next application 6 months after your most
								recent submission.
							</p>
							<p className="text-muted-foreground text-sm">
								{applicationStatus.applications.length > 0 &&
									(() => {
										const lastApplication = applicationStatus.applications[0]
										if (lastApplication && lastApplication.createdAt) {
											const lastApplicationDate = new Date(
												lastApplication.createdAt,
											)
											const nextEligibleDate = new Date(lastApplicationDate)
											nextEligibleDate.setMonth(
												nextEligibleDate.getMonth() + 6,
											)
											return `You can submit your next application on ${nextEligibleDate.toLocaleDateString()}.`
										}
										return null
									})()}
							</p>
						</div>
					)}
				</div>
			</div>
		</main>
	)
}
