import { currentUser } from '@clerk/nextjs/server'
import { CheckCircle, ArrowRight, Home, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserApplicationStatus } from '../actions'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getUserFromClerkID } from '@/server/auth/user'

export const metadata = {
	title: 'Application Submitted | Trail Running Community',
	robots: {
		index: false,
		follow: false,
		googleBot: {
			index: false,
			follow: false,
		},
	},
}

export default async function ApplicationSuccessPage() {
	const user = await currentUser()
	const dbUser = await getUserFromClerkID()

	if (!user || !dbUser) {
		redirect('/?auth=sign-in')
	}

	const applicationStatus = await getUserApplicationStatus(dbUser.id)

	return (
		<main className="bg-background text-foreground min-h-screen">
			<div className="container mx-auto px-4 py-12 md:px-6 lg:py-20">
				<div className="mx-auto max-w-2xl">
					{/* Success header */}
					<div className="mb-10 text-center">
						<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
							<CheckCircle className="h-8 w-8" />
						</div>
						<h1 className="mb-3 text-3xl font-bold tracking-tight">
							Application Submitted
						</h1>
						<p className="text-muted-foreground text-lg">
							Thank you for applying to the BIPOC Athlete Fund. We&apos;ve
							received your application.
						</p>
					</div>

					{/* What happens next */}
					<div className="space-y-8">
						<div>
							<h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">
								What happens next
							</h2>
							<div className="space-y-4">
								{[
									{
										title: 'Application Review',
										desc: 'Our team reads every application carefully. We review for alignment with our mission, community engagement, and mentorship interest.',
									},
									{
										title: 'We Follow Up by Email',
										desc: "Whether you're accepted or not, you'll hear from us. We respect the time you put into this application.",
									},
									{
										title: 'If Accepted',
										desc: "We'll handle your race registration, connect you with a mentor (if you opted in), and welcome you into the Trail Running Community community.",
									},
									{
										title: 'Race Day and Beyond',
										desc: "The finish line is just the beginning. We'll be cheering you on and we hope you'll stay connected with the community.",
									},
								].map((step, i) => (
									<div
										key={step.title}
										className="flex gap-4 rounded-lg border p-4"
									>
										<span className="text-muted-foreground mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
											{i + 1}
										</span>
										<div>
											<p className="text-sm font-medium">{step.title}</p>
											<p className="text-muted-foreground mt-0.5 text-sm">
												{step.desc}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>

						<Separator />

						{/* Contact */}
						<div className="text-center">
							<p className="text-muted-foreground text-sm">
								Questions? Reach out at{' '}
								<a
									href="mailto:team@example.com"
									className="text-primary font-medium"
								>
									team@example.com
								</a>
							</p>
						</div>

						{/* Actions */}
						<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
							<Button asChild size="lg" className="gap-2">
								<Link href="/dashboard?tab=applications">
									<LayoutDashboard className="h-4 w-4" />
									View Your Applications
								</Link>
							</Button>
							{applicationStatus.remainingApplications > 0 && (
								<Button
									asChild
									variant="outline"
									size="lg"
									className="gap-2"
								>
									<Link href="/fund/apply">
										Apply for Another Race
										<ArrowRight className="h-4 w-4" />
									</Link>
								</Button>
							)}
							<Button asChild variant="ghost" size="lg" className="gap-2">
								<Link href="/">
									<Home className="h-4 w-4" />
									Home
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}
