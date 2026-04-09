import { currentUser } from '@clerk/nextjs/server'
import { CheckCircle, Heart, Users } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getUserFromClerkID } from '@/server/auth/user'

export const metadata = {
	title: 'Mentor Application Submitted | Trail Running Community',
	robots: {
		index: false,
		follow: false,
		googleBot: {
			index: false,
			follow: false,
		},
	},
}

export default async function MentorApplicationSuccessPage() {
	// Get current user and their application status
	const user = await currentUser()
	const dbUser = await getUserFromClerkID()

	if (!user || !dbUser) {
		redirect('/?auth=sign-in')
	}

	return (
		<main className="bg-background text-foreground">
			<section className="bg-primary py-16 md:py-24">
				<div className="container mx-auto px-4 md:px-6">
					<div className="mx-auto max-w-2xl text-center">
						<div className="bg-primary-foreground text-primary mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
							<Heart className="h-8 w-8" />
						</div>
						<h1 className="text-primary-foreground mb-6 text-4xl font-bold md:text-5xl">
							Thank You for Applying!
						</h1>
						<div className="bg-primary-foreground mx-auto mb-8 h-1 w-20 rounded"></div>
						<p className="text-primary-foreground/90 text-xl leading-relaxed">
							Your mentor application has been successfully submitted. We're
							excited about the possibility of you joining our mentor community!
						</p>
					</div>
				</div>
			</section>

			<section className="bg-background py-16 md:py-24">
				<div className="container mx-auto px-4 md:px-6">
					<div className="border-border bg-card mx-auto max-w-3xl rounded-xl border p-8 shadow-sm">
						<div className="mb-8 text-center">
							<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
								<CheckCircle className="h-8 w-8" />
							</div>
							<h2 className="text-card-foreground mb-2 text-2xl font-bold">
								Application Successfully Received
							</h2>
							<p className="text-muted-foreground">
								We've received your mentor application and are excited to review
								it.
							</p>
						</div>

						<div className="bg-muted mb-8 space-y-4 rounded-lg p-6">
							<h3 className="text-lg font-medium">What happens next?</h3>
							<div className="space-y-3">
								<p className="text-muted-foreground">
									<strong>Review Process:</strong> Our team will review your
									application within 1-2 weeks.
								</p>
								<p className="text-muted-foreground">
									<strong>Athlete Assignment:</strong> We'll email you with
									details about your athlete mentee.
								</p>
								<p className="text-muted-foreground">
									<strong>Start Mentoring:</strong> Begin building meaningful
									connections and supporting fellow athletes!
								</p>
							</div>
						</div>

						{/* Community Impact */}
						<div className="bg-primary/5 border-primary/20 mb-8 rounded-lg border p-6">
							<div className="flex items-start gap-4">
								<div className="bg-primary text-primary-foreground flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg">
									<Users className="h-6 w-6" />
								</div>
								<div>
									<h3 className="text-primary mb-2 text-lg font-medium">
										You're Building Something Special
									</h3>
									<p className="text-muted-foreground text-sm leading-relaxed">
										By becoming a mentor, you're not just supporting individual
										athletes - you're helping transform trail running into a
										more inclusive, welcoming sport. Every connection you make,
										every piece of encouragement you offer, and every barrier
										you help someone overcome contributes to a movement that's
										bigger than any single race or athlete.
									</p>
								</div>
							</div>
						</div>

						<div className="text-center">
							<p className="text-muted-foreground mb-6">
								Have questions about the mentor program? Email us at{' '}
								<a
									href="mailto:team@example.com"
									className="text-primary underline"
								>
									team@example.com
								</a>
							</p>
							<div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
								<Button asChild variant="default">
									<Link href="/dashboard">View Your Dashboard</Link>
								</Button>
								<Button asChild variant="outline">
									<Link href="/fund">See Athlete Fund</Link>
								</Button>
								<Button asChild variant="outline">
									<Link href="/">Return to Home</Link>
								</Button>
							</div>
						</div>
					</div>
				</div>
			</section>
		</main>
	)
}
