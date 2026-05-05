import { currentUser } from '@clerk/nextjs/server'
import { ArrowRight, Calendar, MessageCircle, Flag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AuthButton } from '@/components/auth/auth-button'
import { Button } from '@/components/ui/button'
import { buildOnboardingPath } from '@/lib/onboarding-routing'
import { getUserType } from '@/server/auth/roles'

export const metadata = {
	title: 'Mentor Program | Tierra Libre Run',
	description:
		'The Tierra Libre Run Mentor Program pairs runners of color preparing for their first trail race with experienced mentors of color. A real relationship, a finite commitment, centered on race day.',
}

export default async function MentorPage() {
	const user = await currentUser()
	const isSignedIn = !!user
	const userType = await getUserType()
	const mentorOnboardingHref = buildOnboardingPath('/mentor/apply')

	return (
		<main className="text-foreground">
			{/* Hero Section */}
			<section className="bg-primary text-primary-foreground relative overflow-hidden">
				<div className="container mx-auto px-6 md:px-8 lg:px-12">
					<div className="grid items-center gap-16 py-24 md:gap-20 md:py-36 lg:min-h-[90vh] lg:grid-cols-12 lg:gap-24 lg:py-40">
						{/* Content - LEFT side */}
						<div className="order-2 lg:order-1 lg:col-span-6">
							<span className="text-primary-foreground/60 mb-2 inline-block text-sm font-medium tracking-widest">
								TIERRA LIBRE, MENTOR PROGRAM
							</span>
							<div className="space-y-10 md:space-y-12">
								<h1 className="mb-6 text-5xl leading-[1.1] font-bold tracking-[-0.03em] md:text-6xl lg:text-7xl">
									Lead the Next Athlete Into the Sport.
								</h1>
								<p className="text-primary-foreground/90 text-xl leading-relaxed md:text-2xl">
									You've been on the trails. You know what it took to get there. The Tierra Libre Run Mentor Program pairs you with a funded runner of color preparing for their first trail race. Your experience becomes their foundation.
								</p>
								<div className="flex flex-col gap-4 pt-2 sm:flex-row sm:gap-4">
									{isSignedIn ? (
										userType === 'bipoc' ? (
											<Button
												variant="outline"
												size="lg"
												className="w-full sm:w-auto"
												asChild
											>
												<Link href="/mentor/apply">
													Apply to Mentor
													<ArrowRight className="ml-2 h-5 w-5" />
												</Link>
											</Button>
										) : userType === 'ally' ? (
											<Button
												variant="outline"
												size="lg"
												className="w-full sm:w-auto"
												asChild
											>
												<Link href="/donate">Support Our Work</Link>
											</Button>
										) : (
											<AuthButton
												action="sign-up"
												label="Complete Your Profile"
												size="lg"
												variant="outline"
												redirectTo={mentorOnboardingHref}
												className="w-full sm:w-auto"
											/>
										)
									) : (
										<AuthButton
											action="sign-up"
											label="Apply to Mentor"
											size="lg"
											variant="outline"
											redirectTo="/mentor/apply"
											className="w-full sm:w-auto"
										/>
									)}
									<Button
										variant="outline"
										size="lg"
										className="w-full sm:w-auto"
										asChild
									>
										<Link href="/fund">Learn About the Athlete Fund</Link>
									</Button>
								</div>
							</div>
						</div>

						{/* Image - RIGHT side */}
						<div className="order-1 lg:order-2 lg:col-span-6">
							<div className="relative h-[50vh] sm:h-[55vh] md:h-[65vh] lg:h-[75vh] overflow-hidden rounded-3xl shadow-2xl">
								<Image
									src="https://cdn.sanity.io/images/qgy6qhm1/production/65b8c2fab3e156b79ca5feb3e9ae9bb8cda0d57f-2880x1920.jpg"
									alt="runners of color on a group run"
									fill
									priority
									fetchPriority="high"
									quality={85}
									sizes="(min-width: 1024px) 41vw, (min-width: 768px) 50vw, 100vw"
									className="object-cover"
								/>
								<div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* What Mentorship Is Section */}
			<section className="bg-secondary py-28 md:py-44 lg:py-60">
				<div className="container mx-auto px-6 md:px-8 lg:px-12">
					<div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-28">
						{/* Large Image */}
						<div className="relative h-[60vh] w-full overflow-hidden rounded-3xl shadow-2xl lg:h-[75vh]">
							<Image
								src="https://cdn.sanity.io/images/qgy6qhm1/production/8f204f7b8f37ee12ebb64459a82b1ce3f68ed25f-768x1024.jpg"
								alt="runner of color on the trails"
								fill
								loading="lazy"
								quality={80}
								className="object-cover"
								sizes="(max-width: 1024px) 100vw, 50vw"
							/>
							<div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
						</div>

						{/* Content */}
						<div className="space-y-12 lg:pl-12">
							<div className="space-y-6">
								<span className="text-primary mb-2 inline-block text-sm font-medium tracking-widest">
									THE PROGRAM
								</span>
								<h2 className="text-4xl font-bold md:text-5xl lg:text-6xl">
									What the Program Is
								</h2>
							</div>
							<div className="space-y-7">
								<p className="text-muted-foreground text-lg leading-[1.7] md:text-xl md:leading-[1.7]">
									The Mentor Program pairs runners of color preparing for their first trail race with experienced mentors who have completed the race experience themselves.
								</p>
								<p className="text-muted-foreground text-lg leading-[1.7] md:text-xl md:leading-[1.7]">
									The match is organized around one race: your athlete's. From pairing to race day, mentors and athletes share a defined goal. The relationship frequently continues past it.
								</p>
								<blockquote className="border-primary bg-primary/10 rounded-r-2xl border-l-4 py-4 pl-6">
									<p className="text-foreground text-lg italic md:text-xl">
										"When you mentor, you give the next athlete something you may not have had: someone who looks like them who has already done it."
									</p>
								</blockquote>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works - Race-Centered Model */}
			<section className="bg-primary text-primary-foreground py-28 md:py-44 lg:py-60">
				<div className="container mx-auto px-6 md:px-8 lg:px-12">
					<div className="mb-20 md:mb-28">
						<span className="text-primary-foreground/60 mb-6 inline-block text-sm font-medium tracking-widest">
							THE STRUCTURE
						</span>
						<h2 className="mb-8 text-4xl font-bold md:text-5xl lg:text-6xl">
							How the Mentorship Works
						</h2>
						<p className="text-primary-foreground/90 max-w-3xl text-lg leading-relaxed md:text-xl">
							Everything is organized around the athlete's race. That race date is the anchor. It defines the timeline, the commitment, and the arc of the relationship.
						</p>
					</div>

					<div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
						{/* Step 1 */}
						<div className="bg-primary-foreground/10 rounded-3xl p-10">
							<div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
								<MessageCircle className="h-6 w-6 text-primary-foreground" />
							</div>
							<div className="mb-3 text-xs font-bold tracking-widest text-primary-foreground/60 uppercase">
								Step One
							</div>
							<h3 className="mb-4 text-2xl font-bold">Apply and Share Your Background</h3>
							<p className="text-primary-foreground/80 leading-relaxed">
								Tell us about your trail running experience, the races you've done, what you've learned, and how you want to show up for a new athlete. We match based on goals, communication style, and fit.
							</p>
						</div>

						{/* Step 2 */}
						<div className="bg-primary-foreground/10 rounded-3xl p-10">
							<div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
								<Calendar className="h-6 w-6 text-primary-foreground" />
							</div>
							<div className="mb-3 text-xs font-bold tracking-widest text-primary-foreground/60 uppercase">
								Step Two
							</div>
							<h3 className="mb-4 text-2xl font-bold">Get Matched to an Athlete</h3>
							<p className="text-primary-foreground/80 leading-relaxed">
								You are paired with a funded runner of color who has been accepted into the fund and is preparing for a specific race. The race date is your shared horizon. The relationship begins from there.
							</p>
						</div>

						{/* Step 3 */}
						<div className="bg-primary-foreground/10 rounded-3xl p-10">
							<div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
								<Flag className="h-6 w-6 text-primary-foreground" />
							</div>
							<div className="mb-3 text-xs font-bold tracking-widest text-primary-foreground/60 uppercase">
								Step Three
							</div>
							<h3 className="mb-4 text-2xl font-bold">Carry Them to Race Day</h3>
							<p className="text-primary-foreground/80 leading-relaxed">
								Regular check-ins. Training questions. Course prep and race week guidance. At select races, you may join them on the course or at the aid station. The goal: your athlete crosses the finish line ready for the next one.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* What You Bring + What You Get */}
			<section className="bg-secondary py-28 md:py-44 lg:py-60">
				<div className="container mx-auto px-6 md:px-8 lg:px-12">
					<div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-28">
						{/* Content */}
						<div className="space-y-12">
							<div className="space-y-6">
								<span className="text-primary mb-2 inline-block text-sm font-medium tracking-widest">
									MENTOR ELIGIBILITY
								</span>
								<h2 className="text-4xl font-bold md:text-5xl">
									What you bring. What you get.
								</h2>
							</div>
							<div className="space-y-7">
								<p className="text-muted-foreground text-lg leading-[1.7] md:text-xl md:leading-[1.7]">
									You do not need to be an elite athlete. You need trail race experience and the willingness to share what you know with someone who is just beginning.
								</p>

								<div className="space-y-4 pt-2">
									<p className="text-foreground font-semibold text-sm tracking-widest uppercase">You bring:</p>
									{[
										'You identify as a person of color',
										'You have completed at least one trail race',
										'You can commit to regular check-ins through the program cycle',
										'You show up as a person, not just a resource',
									].map((item) => (
										<div key={item} className="flex items-start gap-4">
											<div className="bg-primary/20 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
												<div className="bg-primary h-2 w-2 rounded-full" />
											</div>
											<p className="text-foreground text-lg leading-[1.7]">{item}</p>
										</div>
									))}
								</div>

								<div className="bg-primary/10 border border-primary/20 rounded-2xl p-8 space-y-4">
									<p className="text-foreground font-semibold text-sm tracking-widest uppercase">What you get:</p>
									<p className="text-foreground text-lg leading-[1.7]">
										Active Tierra Libre Run mentors receive up to three covered race entries per calendar year through our race partner network. Your entries are funded the same way we fund the athletes you support.
									</p>
								</div>
							</div>
						</div>

						{/* Large Image */}
						<div className="relative h-[60vh] w-full overflow-hidden rounded-3xl shadow-2xl lg:h-[75vh]">
							<Image
								src="https://cdn.sanity.io/images/qgy6qhm1/production/62bce742704dde09d7adabd7b64c4dce86044c8e-4000x6000.jpg"
								alt="Trail runner on mountain trail"
								fill
								loading="lazy"
								quality={80}
								className="object-cover"
								sizes="(max-width: 1024px) 100vw, 50vw"
							/>
							<div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="bg-primary text-primary-foreground py-32 md:py-48">
				<div className="container mx-auto px-6 text-center md:px-8 lg:px-12">
					<div className="mx-auto max-w-4xl space-y-10">
						<span className="text-primary-foreground/60 inline-block text-sm font-medium tracking-widest">
							READY TO MENTOR
						</span>
						<h2 className="text-5xl font-bold leading-[1.1] md:text-6xl lg:text-7xl">
							Your experience is the infrastructure.
						</h2>
						<p className="text-primary-foreground/90 mx-auto max-w-3xl text-xl leading-relaxed md:text-2xl">
							Every runner of color who crosses a finish line carries the knowledge that someone like them made it possible. Apply to mentor and help us build what trail running has been missing.
						</p>

						<div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
							{isSignedIn ? (
								userType === 'bipoc' ? (
									<Button
										size="lg"
										variant="outline"
										className="w-full sm:w-auto"
										asChild
									>
										<Link href="/mentor/apply">
											Apply to Mentor
											<ArrowRight className="ml-2 h-5 w-5" />
										</Link>
									</Button>
								) : userType === 'ally' ? (
									<>
										<Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
											<Link href="/donate">Support the Fund</Link>
										</Button>
										<Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
											<Link href="/fund">About the Athlete Fund</Link>
										</Button>
									</>
								) : (
									<AuthButton
										action="sign-up"
										label="Complete Your Profile to Apply"
										size="lg"
										variant="outline"
										redirectTo={mentorOnboardingHref}
										className="w-full sm:w-auto"
									/>
								)
							) : (
								<AuthButton
									action="sign-up"
									label="Apply to Mentor"
									size="lg"
									variant="outline"
									redirectTo="/mentor/apply"
									className="w-full sm:w-auto"
								/>
							)}
						</div>

						<p className="text-primary-foreground/60 text-sm pt-4">
							Questions about the program?{' '}
							<a
								href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'team@tierralibre.run'}`}
								className="text-primary-foreground underline underline-offset-2 hover:text-primary-foreground/90 transition-colors"
							>
								Get in touch.
							</a>
						</p>
					</div>
				</div>
			</section>
		</main>
	)
}
