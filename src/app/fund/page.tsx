import { currentUser } from '@clerk/nextjs/server'
import {
	DollarSign,
	Users,
	Archive,
	ArrowRight,
	BookOpen,
	CheckCircle2,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AuthButton } from '@/components/auth/auth-button'
import CompanyLogo from '@/components/company-logo'
import { Button } from '@/components/ui/button'
import { fundMetadata } from '@/lib/metadata'
import { buildOnboardingPath } from '@/lib/onboarding-routing'
import { getRaceCompanies, getSponsorCompanies } from '@/lib/sanity/queries'
import { getUserType } from '@/server/auth/roles'

export const metadata = fundMetadata

export default async function AthletesFund() {
	const user = await currentUser()
	const isSignedIn = !!user
	const userType = await getUserType()
	const fundOnboardingHref = buildOnboardingPath('/fund/apply')

	// Fetch all sponsor companies and race companies
	const sponsorCompanies = await getSponsorCompanies()
	const raceCompanies = await getRaceCompanies()

	const racePartners = raceCompanies

	return (
		<main className="text-foreground">
			{/* Hero Section - Elevated design */}
			<section className="bg-primary text-primary-foreground relative overflow-hidden">
				<div className="container mx-auto px-6 md:px-8 lg:px-12">
					<div className="grid items-center gap-16 py-24 md:gap-20 md:py-36 lg:min-h-[90vh] lg:grid-cols-12 lg:gap-24 lg:py-40">
						{/* Overlapped images - on LEFT side (flipped from home page) */}
						<div className="order-1 lg:col-span-6">
							<div className="relative h-[50vh] sm:h-[55vh] md:h-[65vh] lg:h-[75vh]">
								{/* Main card - different rotation */}
								<div className="absolute top-0 left-0 h-[72%] w-[82%] rotate-2 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/15">
									<Image
										src="https://cdn.sanity.io/images/qgy6qhm1/production/5181d98df9431951a47407e912c9c8fd0c75d746-6000x4000.jpg"
										alt="Women athletes on the trails"
										fill
										priority
										fetchPriority="high"
										quality={85}
										sizes="(min-width: 1024px) 41vw, (min-width: 768px) 50vw, 100vw"
										className="object-cover"
									/>
								</div>

								{/* Accent card - different position and rotation */}
								<div className="absolute right-0 bottom-0 h-[62%] w-[72%] -rotate-3 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/15">
									<Image
										src="https://cdn.sanity.io/images/qgy6qhm1/production/a45f825b787fb22c4301e874a402dc76009daf7d-6000x4000.jpg"
										alt="Women of color in trail running community"
										fill
										quality={80}
										sizes="(min-width: 1024px) 36vw, (min-width: 768px) 50vw, 100vw"
										className="object-cover"
									/>
								</div>
							</div>
						</div>

						{/* Content - on RIGHT side */}
						<div className="order-2 lg:col-span-6">
							<span className="text-primary-foreground/60 mb-2 inline-block text-sm font-medium tracking-widest">
								TRAIL ACCESS PLATFORM
							</span>
							<div className="space-y-10 md:space-y-12">
								<h1 className="mb-6 text-5xl leading-[1.1] font-bold tracking-[-0.03em] md:text-6xl">
									The BIPOC Athlete Fund
								</h1>
								<p className="text-primary-foreground/90 text-xl leading-relaxed md:text-2xl">
									We’re building a trail access platform for athletes. Choose a
									race from our partner network and apply. If you’re accepted,
									we cover your entry and connect you to mentorship and
									community care so you can show up, prepare, and feel
									belonging.
								</p>
								<div className="flex flex-col gap-4 pt-2 sm:flex-row sm:gap-4">
									<Button
										variant="outline"
										size="lg"
										className="w-full sm:w-auto"
										asChild
									>
										<Link href="/races">View Supported Races</Link>
									</Button>
									{isSignedIn ? (
										userType === 'bipoc' ? (
											<Button
												variant="outline"
												size="lg"
												className="w-full sm:w-auto"
												asChild
											>
												<Link href="/fund/apply">Apply for Race Entry</Link>
											</Button>
										) : userType === 'ally' ? (
											<Button
												variant="outline"
												size="lg"
												className="w-full sm:w-auto"
												asChild
											>
												<Link href="/donate">Support Our Athletes</Link>
											</Button>
										) : (
											<AuthButton
												action="sign-up"
												label="Complete Your Profile"
												variant="outline"
												size="lg"
												redirectTo={fundOnboardingHref}
												className="w-full sm:w-auto"
											/>
										)
									) : (
										<AuthButton
											action="sign-up"
											label="Create Account"
											variant="outline"
											size="lg"
											redirectTo="/fund/apply"
											className="w-full sm:w-auto"
										/>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Purpose Section - Large image with content */}
			<section className="bg-secondary py-28 md:py-44 lg:py-60">
				<div className="container mx-auto px-6 md:px-8 lg:px-12">
					<div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-28">
						{/* Large Image */}
						<div className="relative h-[60vh] w-full overflow-hidden rounded-3xl shadow-2xl lg:h-[75vh]">
							<Image
								src="https://cdn.sanity.io/images/qgy6qhm1/production/d7e38d983bc3a21cf5201eb7a2e9afda6f02d40a-6000x4000.jpg"
								alt="Athletes breaking barriers on the trails"
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
									THE IDEA
								</span>
								<h2 className="text-4xl font-bold md:text-5xl">
									More Than a Bib
								</h2>
							</div>
							<div className="space-y-7">
								<p className="text-muted-foreground text-lg leading-[1.7] md:text-xl md:leading-[1.7]">
									Trail running can be life giving, but it hasn’t been equally
									accessible. Cost matters. So do the barriers you don’t always
									see: not knowing where to start, not seeing yourself
									represented, and walking into a start line feeling like you
									have to do it alone.
								</p>
								<p className="text-muted-foreground text-lg leading-[1.7] md:text-xl md:leading-[1.7]">
									This fund is built to change what access feels like. We work
									with race partners throughout the year to lower hurdles and
									raise the level of support, so your first start can become a
									lasting part of the sport.
								</p>
								<p className="text-muted-foreground text-lg leading-[1.7] md:text-xl md:leading-[1.7]">
									You’ll find mentorship, course previews, and in person support
									at select races. The goal is simple: show up, prepare, and
									feel belonging.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* What We Provide - Redesigned with asymmetric layout */}
			<section className="bg-primary text-primary-foreground py-28 md:py-44 lg:py-60">
				<div className="container mx-auto px-6 md:px-8 lg:px-12">
					<div className="mb-24 md:mb-32">
						<span className="text-primary-foreground/60 mb-6 inline-block text-sm font-medium tracking-widest">
							THE EXPERIENCE
						</span>
						<h2 className="mb-8 text-4xl font-bold md:text-5xl">
							What You Get
						</h2>
						<p className="text-primary-foreground/90 max-w-3xl text-base leading-relaxed md:text-lg">
							This is more than entry coverage. It starts with a thoughtful
							application and a questionnaire that helps us get to know you and
							how we can support you. If you’re accepted, we cover your entry,
							connect you to mentorship, and bring you into community so you can
							show up, prepare, and feel belonging.
						</p>
					</div>

					{/* Item 1 - Race Entry - Large hero image with overlay text */}
					<div className="mb-20 md:mb-32">
						<div className="relative overflow-hidden rounded-3xl">
							<div className="relative h-[60vh] md:h-[70vh] lg:h-[80vh]">
								<Image
									src="https://cdn.sanity.io/images/qgy6qhm1/production/fa06fb91c43a5e32e2053cc820e1ba58e8e8de8d-6000x4000.jpg"
									alt="Race entry support"
									fill
									loading="lazy"
									quality={85}
									sizes="100vw"
									className="object-cover"
								/>
								<div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />
								<div className="absolute right-0 bottom-0 left-0 p-8 md:p-12 lg:p-16">
									<div className="mx-auto max-w-4xl">
										<div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/20 px-5 py-2 backdrop-blur-sm">
											<DollarSign className="h-5 w-5 text-white" />
											<span className="text-sm font-bold tracking-wider text-white uppercase">
												Race Entry
											</span>
										</div>
										<h3 className="mb-4 text-2xl leading-tight font-bold text-white md:text-3xl">
											Your Entry Is Covered
										</h3>
										<p className="max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">
											Once you’re accepted, we take care of your registration so
											you can focus on training, learning, and showing up with
											confidence.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Item 2 & 3 - Side by side split */}
					<div className="mb-20 grid grid-cols-1 gap-8 md:mb-32 lg:grid-cols-2 lg:gap-12">
						{/* Community */}
						<div className="group relative overflow-hidden rounded-3xl">
							<div className="relative h-[50vh] lg:h-[65vh]">
								<Image
									src="https://cdn.sanity.io/images/qgy6qhm1/production/59a3ef86bb3ff23d94b09407e4205aa1f9f3a148-4000x6000.jpg"
									alt="Community integration"
									fill
									loading="lazy"
									quality={85}
									sizes="(max-width: 1024px) 100vw, 50vw"
									className="object-cover transition-transform duration-500 group-hover:scale-105"
								/>
								<div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
								<div className="absolute right-0 bottom-0 left-0 p-8 lg:p-10">
									<div className="mb-4 inline-flex items-center gap-3 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
										<Archive className="h-4 w-4 text-white" />
										<span className="text-xs font-bold tracking-wider text-white uppercase">
											Community
										</span>
									</div>
									<h3 className="mb-3 text-xl leading-tight font-bold text-white md:text-2xl">
										Find Your People
									</h3>
									<p className="text-sm leading-relaxed text-white/90 md:text-base">
										Join our Slack and connect with other athletes through
										community runs and meetups around select races.
									</p>
								</div>
							</div>
						</div>

						{/* Mentorship */}
						<div className="group relative overflow-hidden rounded-3xl">
							<div className="relative h-[50vh] lg:h-[65vh]">
								<Image
									src="https://cdn.sanity.io/images/qgy6qhm1/production/62bce742704dde09d7adabd7b64c4dce86044c8e-4000x6000.jpg"
									alt="Mentorship and guidance"
									fill
									loading="lazy"
									quality={85}
									sizes="(max-width: 1024px) 100vw, 50vw"
									className="object-cover transition-transform duration-500 group-hover:scale-105"
								/>
								<div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
								<div className="absolute right-0 bottom-0 left-0 p-8 lg:p-10">
									<div className="mb-4 inline-flex items-center gap-3 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
										<BookOpen className="h-4 w-4 text-white" />
										<span className="text-xs font-bold tracking-wider text-white uppercase">
											Mentorship
										</span>
									</div>
									<h3 className="mb-3 text-xl leading-tight font-bold text-white md:text-2xl">
										Guidance That’s Real
									</h3>
									<p className="text-sm leading-relaxed text-white/90 md:text-base">
										Get paired with an experienced mentor. This is not coaching.
										It is a relationship with someone you can trust for
										questions about training, nutrition, course preparation, and
										race week nerves.
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Item 4 - In-Person Support - Full width with offset content */}
					<div className="relative">
						<div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
							<div className="lg:col-span-7">
								<div className="relative h-[55vh] overflow-hidden rounded-3xl lg:h-[70vh]">
									<Image
										src="https://cdn.sanity.io/images/qgy6qhm1/production/d359ed693a780036082bad3f0520b55c572152c6-4000x6000.jpg"
										alt="In-person race support"
										fill
										loading="lazy"
										quality={85}
										sizes="(max-width: 1024px) 100vw, 60vw"
										className="object-cover"
									/>
								</div>
							</div>
							<div className="flex items-center lg:col-span-5">
								<div className="space-y-6">
									<div className="bg-primary-foreground/10 inline-flex items-center gap-3 rounded-full px-5 py-2">
										<Users className="h-5 w-5" />
										<span className="text-sm font-bold tracking-wider uppercase">
											Race Day Support
										</span>
									</div>
									<h3 className="text-3xl leading-tight font-bold md:text-4xl">
										Support on Race Week
									</h3>
									<div className="space-y-4">
										<p className="text-primary-foreground/90 text-base leading-relaxed md:text-lg">
											We’ll help you feel ready with course previews, guidance,
											and community energy. At select races, we show up in big
											ways with our partners, including aid station presence,
											finish line support, and in person connection before and
											during race week.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works - Enhanced with large image */}
			<section className="bg-secondary py-28 md:py-44 lg:py-60">
				<div className="container mx-auto px-6 md:px-8 lg:px-12">
					<div className="mb-20 text-center md:mb-28">
						<span className="text-primary mb-6 inline-block text-sm font-medium tracking-widest">
							WHO THIS IS FOR
						</span>
						<h2 className="mb-8 text-4xl font-bold md:text-5xl">
							Who Can Apply
						</h2>
						<p className="text-muted-foreground mx-auto max-w-3xl text-base leading-relaxed md:text-lg">
							This fund is for athletes who want support getting into trail
							running or staying in it. If you are looking for entry support,
							mentorship, and community care, you are in the right place.
						</p>
					</div>

					<div className="mx-auto max-w-5xl">
						<div className="relative h-[420px] w-full overflow-hidden rounded-3xl shadow-2xl md:h-[520px]">
							<Image
								src="https://cdn.sanity.io/images/qgy6qhm1/production/53ad5b8250ec74f9895cedc666d6aac23ed26b3e-6000x4000.jpg"
								alt="Community support and connection"
								fill
								loading="lazy"
								quality={80}
								className="object-cover"
								sizes="(max-width: 1024px) 100vw, 896px"
							/>
							<div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
						</div>
					</div>

					{/* Requirements Card */}
					<div className="bg-card border-border mx-auto mt-20 max-w-5xl rounded-3xl border p-12 shadow-sm md:mt-28 md:p-20">
						<div className="mb-12 text-center">
							<h4 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
								Eligibility
							</h4>
							<p className="text-muted-foreground text-lg leading-[1.7] md:text-xl">
								This fund supports athletes who:
							</p>
						</div>

						<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
							<div className="flex items-start gap-5">
								<div className="bg-primary/20 flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
									<CheckCircle2 className="text-primary h-5 w-5" />
								</div>
								<p className="text-foreground pt-1 text-lg leading-[1.7]">
									Identify as a person of color, including Black and Indigenous
									athletes
								</p>
							</div>

							<div className="flex items-start gap-5">
								<div className="bg-primary/20 flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
									<CheckCircle2 className="text-primary h-5 w-5" />
								</div>
								<p className="text-foreground pt-1 text-lg leading-[1.7]">
									New to trail running, doing your first trail race, or looking
									for support to stay in the sport
								</p>
							</div>

							<div className="flex items-start gap-5">
								<div className="bg-primary/20 flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
									<CheckCircle2 className="text-primary h-5 w-5" />
								</div>
								<p className="text-foreground pt-1 text-lg leading-[1.7]">
									We prioritize applicants with underrepresented identities
									within communities of color, including women, LGBTQ+ people,
									immigrants, and people with disabilities
								</p>
							</div>

							<div className="flex items-start gap-5">
								<div className="bg-primary/20 flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
									<CheckCircle2 className="text-primary h-5 w-5" />
								</div>
								<p className="text-foreground pt-1 text-lg leading-[1.7]">
									Engage with the community when possible through Slack and race
									connections
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Race Partners - Redesigned with more prominence */}
			<section className="bg-secondary py-28 md:py-44 lg:py-60">
				<div className="container mx-auto px-6 md:px-8 lg:px-12">
					<div className="mx-auto max-w-7xl">
						<div className="mb-20 text-center md:mb-28">
							<span className="text-primary mb-6 inline-block text-xs font-bold tracking-[0.25em] uppercase md:text-sm">
								Race Partners
							</span>
							<h2 className="mb-8 text-5xl leading-[1.1] font-bold tracking-tight md:text-6xl lg:text-7xl">
								Our Partner Races
							</h2>
							<p className="text-muted-foreground mx-auto max-w-3xl text-lg leading-[1.7] md:text-xl md:leading-[1.7]">
								Our partners host races across the Pacific Northwest and beyond.
								They share our values and help expand the sport by making space
								for athletes. Supported entries through the Athlete Fund come
								from these partner organizations.
							</p>
							<div className="mt-10">
								<Link href="/races">
									<Button variant="outline" size="lg">
										View Supported Races
										<ArrowRight className="ml-2 h-5 w-5" />
									</Button>
								</Link>
							</div>
						</div>

						{racePartners.length > 0 ? (
							<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
								{racePartners.map((partner) => (
									<div
										key={partner._id}
										className="bg-card border-border group flex flex-col rounded-3xl border p-10 shadow-sm"
									>
										{/* Logo and Name */}
										<div className="mb-8 flex flex-col items-center">
											<div className="mb-4 flex items-center justify-center">
												{partner.logo ? (
													<CompanyLogo
														logo={partner.logo}
														companyName={partner.name}
														width={100}
														height={100}
													/>
												) : (
													<div className="bg-primary-foreground/20 flex h-24 w-24 items-center justify-center rounded-full">
														<span className="text-primary-foreground text-2xl font-bold">
															{partner.name.charAt(0)}
														</span>
													</div>
												)}
											</div>
											<h3 className="text-center text-xl font-bold tracking-tight md:text-2xl">
												{partner.name}
											</h3>
										</div>

										{/* Description */}
										<div className="mb-6 flex-1">
											{partner.description ? (
												<p className="text-muted-foreground text-base leading-[1.7]">
													{partner.description}
												</p>
											) : partner.name.includes('Daybreak') ? (
												<p className="text-muted-foreground text-base leading-[1.7]">
													Daybreak Racing specializes in challenging, original
													courses set in spectacular Pacific Northwest
													locations. The Oregon-based company prioritizes
													participant safety, inclusive race atmosphere, and
													professional organization while maintaining old-school
													charm.
												</p>
											) : partner.name.includes('Wonderland') ? (
												<p className="text-muted-foreground text-base leading-[1.7]">
													Wonderland Running creates memorable races in magical
													Pacific Northwest locations, operating since 2019 with
													a focus on community and exploration.
												</p>
											) : (
												<p className="text-muted-foreground text-base leading-[1.7]">
													Partnering with Trail Running Community to expand
													access to trail running for athletes.
												</p>
											)}
										</div>

										{/* Link */}
										{partner.website && (
											<div className="mt-auto">
												<a
													href={partner.website}
													target="_blank"
													rel="noopener noreferrer"
													className="text-primary hover:text-primary/80 group inline-flex items-center gap-2 font-semibold transition-colors"
												>
													<span>Learn More</span>
													<svg
														className="h-4 w-4 transition-transform group-hover:translate-x-1"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M17 8l4 4m0 0l-4 4m4-4H3"
														/>
													</svg>
												</a>
											</div>
										)}
									</div>
								))}
							</div>
						) : (
							<div className="bg-card border-border rounded-3xl border p-12 text-center shadow-sm">
								<p className="text-muted-foreground text-lg leading-[1.7]">
									We’re still building the race calendar with directors and
									organizations who share our values. Check back soon for new
									race opportunities.
								</p>
							</div>
						)}
					</div>
				</div>
			</section>

			{/* Brand Support */}
			{sponsorCompanies.length > 0 && (
				<section className="bg-secondary py-28 md:py-44 lg:py-60">
					<div className="container mx-auto px-6 md:px-8 lg:px-12">
						<div className="mx-auto max-w-5xl">
							<div className="mb-10 text-center md:mb-14">
								<span className="text-primary mb-6 inline-block text-xs font-bold tracking-[0.25em] uppercase md:text-sm">
									Brand Support
								</span>
								<h2 className="text-5xl leading-[1.1] font-bold tracking-tight md:text-6xl">
									Our Supporters
								</h2>
								<p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
									These brands believe in the power of investing in BIPOC
									athletes—their support makes our fund possible.
								</p>
							</div>

							<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
								{sponsorCompanies.map((sponsor) => (
									<div
										key={sponsor._id}
										className="bg-card border-border flex flex-col items-center gap-8 rounded-2xl border px-8 py-12 shadow-sm"
									>
										<div className="flex h-20 w-full items-center justify-center">
											{sponsor.logo?.asset?.url ? (
												<Image
													src={`${sponsor.logo.asset.url}?w=280&auto=format`}
													alt={`${sponsor.name} logo`}
													width={140}
													height={80}
													className="h-16 w-auto max-w-35 object-contain opacity-70 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
												/>
											) : (
												<div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
													<span className="text-muted-foreground text-xl font-bold">
														{sponsor.name.charAt(0)}
													</span>
												</div>
											)}
										</div>
										<p className="text-foreground text-center text-base font-semibold tracking-tight">
											{sponsor.name}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</section>
			)}

			{/* Why This Matters - Large image section */}
			<section className="bg-primary text-primary-foreground py-28 md:py-44 lg:py-60">
				<div className="container mx-auto px-6 md:px-8 lg:px-12">
					<div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-28">
						<div className="space-y-12">
							<div className="space-y-6">
								<span className="text-primary-foreground/60 mb-2 inline-block text-xs font-bold tracking-[0.25em] uppercase md:text-sm">
									OUR INVITATION
								</span>
								<h2 className="text-5xl leading-[1.1] font-bold tracking-tight md:text-6xl lg:text-7xl">
									Belonging Is the Goal
								</h2>
							</div>
							<div className="space-y-7">
								<p className="text-primary-foreground/90 text-lg leading-[1.7] md:text-xl md:leading-[1.7]">
									Trail Running Community is created and led by people of color.
									We believe our community deserves more than access. We deserve
									power, joy, and a real home in trail running.
								</p>
								<p className="text-primary-foreground/90 text-lg leading-[1.7] md:text-xl md:leading-[1.7]">
									This fund is one way we show up for each other. The bigger
									vision is a trail access platform for belonging, where you can
									learn, ask questions, and build relationships that last beyond
									a single race.
								</p>
								<p className="text-primary-foreground/90 text-lg leading-[1.7] md:text-xl md:leading-[1.7]">
									You do not have to already be a trail runner to belong here.
									If you are curious, we are ready to welcome you.
								</p>
							</div>
						</div>

						<div className="relative h-[500px] w-full overflow-hidden rounded-3xl shadow-2xl lg:order-first lg:h-[700px]">
							<Image
								src="https://cdn.sanity.io/images/qgy6qhm1/production/8f204f7b8f37ee12ebb64459a82b1ce3f68ed25f-768x1024.jpg"
								alt="Athletes in community"
								fill
								loading="lazy"
								quality={80}
								className="object-cover"
								sizes="(max-width: 1024px) 100vw, 50vw"
							/>
							<div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section - Enhanced */}
			<section className="bg-primary text-primary-foreground py-28 md:py-44 lg:py-60">
				<div className="container mx-auto px-6 text-center md:px-8 lg:px-12">
					<div className="mx-auto max-w-4xl">
						<h2 className="mb-10 text-5xl leading-[1.1] font-bold tracking-tight md:text-6xl lg:text-7xl">
							Ready to Start?
						</h2>
						<p className="text-primary-foreground/90 mb-16 text-lg leading-[1.7] md:text-xl md:leading-[1.7]">
							Start by exploring the races in our partner network and choosing
							one that feels right for you. If you are an ally, your donation
							helps keep this work going, including entries, mentorship, and
							community care. The Athlete Fund is a 501(c)(3) nonprofit
							initiative with fiscal sponsorship through our nonprofit partner.
							Donations are tax deductible.{' '}
							{process.env.NEXT_PUBLIC_TAX_ID || ''}.
						</p>
						<div className="mb-20 flex flex-col justify-center gap-4 sm:flex-row md:mb-24">
							{userType === 'bipoc' && (
								<Button variant="outline" size="lg" asChild>
									<Link href="/fund/apply">Apply for Race Entry</Link>
								</Button>
							)}
							{userType === 'bipoc' && (
								<Button variant="outline" size="lg" asChild>
									<Link href="/mentor">Become a Mentor</Link>
								</Button>
							)}
							<Button variant="outline" size="lg" asChild>
								<Link href="/donate">Donate to Fund</Link>
							</Button>
						</div>

						{/* Final image */}
						<div className="relative mx-auto mt-12 h-[350px] w-full overflow-hidden rounded-3xl shadow-2xl md:h-[450px] lg:h-[500px]">
							<Image
								src="https://cdn.sanity.io/images/qgy6qhm1/production/a73b0cd33703ef55da09ae681bd7df1487653a8e-6000x4000.jpg"
								alt="Athletes finishing strong"
								fill
								loading="lazy"
								quality={80}
								className="object-cover"
								sizes="(max-width: 1024px) 100vw, 896px"
							/>
							<div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
						</div>
					</div>
				</div>
			</section>
		</main>
	)
}
