import { currentUser } from '@clerk/nextjs/server'
import { Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AuthButton } from '@/components/auth/auth-button'
import { Button } from '@/components/ui/button'
import { buildOnboardingPath } from '@/lib/onboarding-routing'

import { getUserType } from '@/server/auth/roles'

export const metadata = {
	title: 'Mentor Program | Trail Running Community',
	description:
		'Join our mentor program to support athletes on their trail running journey. Share what you have learned, build community, and help create spaces where we can all thrive.',
}

export default async function MentorPage() {
	const user = await currentUser()
	const isSignedIn = !!user
	const userType = await getUserType()
	const mentorOnboardingHref = buildOnboardingPath('/mentor/apply')

	return (
		<main className="text-foreground">
			{/* Hero Section */}
			<section className="bg-primary py-32 md:py-48">
				<div className="container mx-auto px-4 md:px-6">
					<div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-24">
						<div className="text-primary-foreground space-y-8">
							<span className="mb-2 inline-block text-sm font-medium tracking-widest">
								TIERRA LIBRE RUN
							</span>
							<h1 className="mb-6 text-5xl leading-[1.1] font-bold tracking-[-0.03em] md:text-6xl">
								Mentor Program
							</h1>

							<p className="text-primary-foreground/90 text-xl leading-relaxed md:text-2xl">
								Community powered mentorship led by athletes. Share what
								you have learned, show up with someone new to the trails, and
								help build the spaces where we can all thrive.
							</p>

							<div className="pt-4">
								<div className="flex flex-wrap items-center gap-4">
									{isSignedIn ? (
										userType === 'bipoc' ? (
											<Button size={'lg'} variant={'outline'}>
												<Link href="/mentor/apply">Apply to Mentor</Link>
											</Button>
										) : userType === 'ally' ? (
											<Button size={'lg'} variant={'outline'}>
												<Link href="/donate">Support Our Mission</Link>
											</Button>
										) : (
											<AuthButton
												action="sign-up"
												label="Complete Your Profile"
												size={'lg'}
												variant={'outline'}
												redirectTo={mentorOnboardingHref}
											/>
										)
									) : (
										<div className="flex flex-col items-start">
											<AuthButton
												action="sign-up"
												label="Create Account to Apply"
												size={'lg'}
												variant={'outline'}
												redirectTo="/mentor/apply"
											/>
										</div>
									)}
									<Button asChild size="lg" variant="outline">
										<Link href="/blog">
											Read: Our Mentorship Story
										</Link>
									</Button>
								</div>
							</div>
						</div>

						<div className="relative h-[500px] overflow-hidden rounded-3xl md:h-[600px]">
							<Image
								src="https://cdn.sanity.io/images/qgy6qhm1/production/65b8c2fab3e156b79ca5feb3e9ae9bb8cda0d57f-2880x1920.jpg"
								alt="Trail runners on a group run"
								fill
								className="object-cover"
								priority
							/>
						</div>
					</div>
				</div>
			</section>

			{/* What is Mentoring Section */}
			<section className="bg-secondary py-16 md:py-24">
				<div className="container mx-auto px-4 md:px-6">
					<div className="mx-auto max-w-3xl text-center">
						<h2 className="mb-6 text-3xl font-bold">
							Mentorship That Feels Like Belonging
						</h2>
						<p className="text-muted-foreground text-lg leading-relaxed">
							Our mentor program connects athletes who have been on the
							trails for a while with funded athletes preparing for their first
							trail race. This is not about coaching or perfect plans. It is
							about a steady relationship, practical guidance, and having
							someone in your corner as you learn the rhythms of trail running.
						</p>
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className="bg-primary text-primary-foreground py-16 md:py-24">
				<div className="container mx-auto px-4 md:px-6">
					<div className="mx-auto max-w-2xl text-center">
						<h2 className="mb-8 text-3xl font-bold">How It Works</h2>
						<div className="space-y-6">
							<div className="bg-primary-foreground/10 rounded-lg p-4">
								<h3 className="mb-2 text-lg font-semibold">
									1. Tell Us About You
								</h3>
								<p className="text-primary-foreground/80">
									Share your trail running experience, what you care about, and
									how you want to show up for others
								</p>
							</div>
							<div className="bg-primary-foreground/10 rounded-lg p-4">
								<h3 className="mb-2 text-lg font-semibold">
									2. Get Matched With Care
								</h3>
								<p className="text-primary-foreground/80">
									We pair you with a funded athlete preparing for their first
									trail race based on goals, communication style, and fit
								</p>
							</div>
							<div className="bg-primary-foreground/10 rounded-lg p-4">
								<h3 className="mb-2 text-lg font-semibold">
									3. Build A Real Connection
								</h3>
								<p className="text-primary-foreground/80">
									Offer encouragement, answer questions, and help them feel
									ready to show up, prepare, and feel belonging
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="bg-primary text-primary-foreground py-32 md:py-48">
				<div className="container mx-auto px-4 text-center md:px-6">
					<div className="mx-auto max-w-3xl">
						<div className="bg-primary-foreground/10 text-primary-foreground mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
							<Heart className="h-8 w-8" />
						</div>
						<h2 className="mb-8 text-5xl font-bold">Ready to Mentor?</h2>
						<p className="text-primary-foreground/90 mb-12 text-xl leading-relaxed">
							Your experience can make the next person feel less alone and more
							ready to step into this sport with confidence. That is the power
							of community built by us, for us.
						</p>

						<div className="mb-12 flex flex-col justify-center gap-6 sm:flex-row">
							{isSignedIn ? (
								userType === 'bipoc' ? (
									<Button size="lg" variant="outline">
										<Link href="/mentor/apply">Apply to Mentor</Link>
									</Button>
								) : userType === 'ally' ? (
									<>
										<Button size="lg" variant="outline">
											<Link href="/donate">Support Our Athletes</Link>
										</Button>
										<Button size="lg" variant="outline">
											<Link href="/fund">Learn About Our Fund</Link>
										</Button>
									</>
								) : (
									<AuthButton
										action="sign-up"
										label="Complete Your Profile"
										size="lg"
										variant="outline"
										redirectTo={mentorOnboardingHref}
									/>
								)
							) : (
								<AuthButton
									action="sign-up"
									label="Create Account to Apply"
									size="lg"
									variant="outline"
									redirectTo="/mentor/apply"
								/>
							)}
						</div>

						<p className="text-primary-foreground/70 text-sm">
							Questions? Email us at{' '}
							<a
								href="mailto:team@example.com"
								className="text-primary-foreground underline"
							>
								team@example.com
							</a>
						</p>
					</div>
				</div>
			</section>
		</main>
	)
}
