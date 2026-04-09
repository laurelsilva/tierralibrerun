import { Users, Heart, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { getUserMentorApplicationStatus } from './actions'
import MentorApplicationForm from './mentor-application-form'
import { Button } from '@/components/ui/button'
import {
	MENTOR_WORKFLOW_LABELS,
	type MentorWorkflowStage,
} from '@/lib/types/workflow'
import { requireOnboardedUser } from '@/server/auth'
import { getUserType } from '@/server/auth/roles'

export const metadata = {
	title: 'Become a Mentor | Trail Running Community',
	description:
		'Join our mentor program to support athletes on their journey. Help build community and share your passion for trail running.',
	robots: {
		index: false,
		follow: false,
		googleBot: {
			index: false,
			follow: false,
		},
	},
}

export default async function MentorApplicationPage() {
	const dbUser = await requireOnboardedUser({ next: '/mentor/apply' })

	// Check user type - only people of color can apply to be mentors
	const userType = await getUserType()

	if (userType !== 'bipoc') {
		return (
			<main className="bg-background text-foreground">
				<section className="bg-primary py-16 md:py-24">
					<div className="container mx-auto px-4 md:px-6">
						<div className="mx-auto max-w-2xl text-center">
							<div className="bg-primary-foreground text-primary mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
								<Heart className="h-8 w-8" />
							</div>
							<h1 className="text-primary-foreground mb-6 text-4xl font-bold md:text-5xl">
								Mentor Program
							</h1>
							<div className="bg-primary-foreground mx-auto mb-8 h-1 w-20 rounded"></div>
							<p className="text-primary-foreground/90 text-xl leading-relaxed">
								Thank you for your interest in mentoring!
							</p>
						</div>
					</div>
				</section>

				<section className="bg-background py-16 md:py-24">
					<div className="container mx-auto px-4 md:px-6">
						<div className="border-border bg-card mx-auto max-w-3xl rounded-xl border p-8 text-center shadow-sm">
							<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
								<Users className="h-8 w-8" />
							</div>
							<h2 className="text-card-foreground mb-4 text-2xl font-bold">
								Mentorship for Athletes
							</h2>
							<p className="text-muted-foreground mb-6 text-lg leading-relaxed">
						Our mentor program pairs athletes further along in their
						trail running journey with newcomers from our community. This
						peer-to-peer mentorship ensures authentic connections and shared
						understanding of what it means to be a person of color in trail running.
							</p>
							<p className="text-muted-foreground mb-8">
								As an ally, you can still support our mission in other
								meaningful ways!
							</p>
							<div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
								<Button asChild>
									<Link href="/donate">Support Through Donations</Link>
								</Button>
								<Button variant="outline" asChild>
									<Link href="/fund">Learn About Our Athlete Fund</Link>
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

	// Get user's mentor application status for this year
	const applicationStatus = await getUserMentorApplicationStatus(dbUser.id)
	const mentorWorkflowLabel = (stage: string | null | undefined, fallback: string) => {
		const normalized = String(stage || '').toUpperCase() as MentorWorkflowStage
		return MENTOR_WORKFLOW_LABELS[normalized] || fallback
	}

	return (
		<main className="bg-background text-foreground">
			{/* Hero Section */}
			<section className="bg-primary text-primary-foreground py-16 md:py-24">
				<div className="container mx-auto px-4 md:px-6">
					<div className="mx-auto max-w-3xl text-center">
						<div className="bg-primary-foreground/10 text-primary-foreground mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
							<Heart className="h-8 w-8" />
						</div>
						<h1 className="mb-6 text-4xl font-bold md:text-5xl">
							Become a Mentor
						</h1>
						<div className="bg-primary-foreground/50 mx-auto mb-6 h-1 w-20 rounded"></div>
						<p className="text-xl leading-relaxed">
							Support athletes experiencing their first trail race through
							our Athlete Fund. Share your passion, build community, and help
							others discover the joy of trail running.
						</p>
					</div>
				</div>
			</section>

			{/* Application Form Section */}
			<section className="py-16 md:py-24">
				<div className="container mx-auto px-4 md:px-6">
					<div className="mx-auto max-w-3xl">
						{/* Application Status Check */}
						{applicationStatus.hasApplicationThisYear ? (
							<div className="bg-card mb-8 rounded-xl p-8 text-center shadow-sm">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
									<CheckCircle className="h-8 w-8" />
								</div>
								<h3 className="mb-4 text-xl font-medium">
									Application Already Submitted
								</h3>
								<p className="text-muted-foreground mb-6">
									You have already submitted a mentor application for{' '}
									{new Date().getFullYear()}. We'll be in touch soon about your
									application status!
								</p>
								<p className="text-muted-foreground text-sm">
									Application status:{' '}
									<span>
										{mentorWorkflowLabel(
											applicationStatus.latestApplication?.workflowStage,
											'Submitted',
										)}
									</span>
								</p>
								<div className="mt-6">
									<Button variant="outline" asChild>
										<Link href="/dashboard">View Your Dashboard</Link>
									</Button>
								</div>
							</div>
						) : (
							<>
								{/* Welcome Message */}
								<div className="bg-primary/5 border-primary/20 mb-8 rounded-xl border p-6">
									<h3 className="text-primary mb-3 text-lg font-medium">
										Ready to mentor?
									</h3>
									<p className="text-muted-foreground text-sm leading-relaxed">
										This application helps us understand how you'd like to
										support fellow athletes. There's no "right" answer - we
										welcome anyone who wants to help build an inclusive trail
										running community.
									</p>
								</div>

								{/* Application Form */}
								<div className="bg-card rounded-xl p-8 shadow-sm">
									<MentorApplicationForm userData={userData} />
								</div>
							</>
						)}
					</div>
				</div>
			</section>
		</main>
	)
}
