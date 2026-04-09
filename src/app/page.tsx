import { ArrowRight, Heart, Mountain, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { homeMetadata } from '@/lib/metadata'
import { getAllCompaniesForSponsors } from '@/lib/sanity/queries'

export const metadata = homeMetadata

export default async function Home() {
	// Fetch all companies for partners section
	const allCompanies = await getAllCompaniesForSponsors()

	return (
		<main className="text-foreground">
			{/* Hero Section - Matches fund/mentor/donate page pattern */}
			<section className="bg-primary text-primary-foreground relative overflow-hidden">
				<div className="container mx-auto px-6 md:px-8 lg:px-12">
					<div className="grid items-center gap-16 py-24 md:gap-20 md:py-36 lg:min-h-[90vh] lg:grid-cols-12 lg:gap-24 lg:py-40">
						{/* Content - LEFT side */}
						<div className="order-2 lg:order-1 lg:col-span-6">
							<span className="text-primary-foreground/60 animate-fade-in-up mb-2 inline-block text-sm font-medium tracking-widest">
								THE TRAIL ACCESS PLATFORM
							</span>
							<div
								className="animate-fade-in-up space-y-10 md:space-y-12"
								style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
							>
								<h1
									className="animate-fade-in-up mb-6 text-5xl leading-[1.1] font-bold tracking-[-0.03em] md:text-6xl lg:text-7xl"
									style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
								>
									Run Wild,{' '}
									<span className="text-primary-foreground/80">Run Free.</span>
								</h1>
								<p
									className="text-primary-foreground/90 animate-fade-in-up text-xl leading-relaxed md:text-2xl"
									style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
								>
								A nonprofit created and led by people of color. We fund race
								entries, provide mentorship, and build community so athletes
								can show up, prepare, and feel belonging.
								</p>
								<div
									className="animate-fade-in-up flex flex-col gap-4 pt-2 sm:flex-row sm:gap-4"
									style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
								>
									<Button size="lg" variant="outline" asChild>
										<Link href="/fund">
											Apply for Support
											<ArrowRight className="ml-2 h-5 w-5" />
										</Link>
									</Button>
									<Button size="lg" variant="outline" asChild>
										<Link href="/donate">Support Our Athletes</Link>
									</Button>
								</div>
							</div>
						</div>

						{/* Overlapped images - RIGHT side */}
						<div className="order-1 lg:order-2 lg:col-span-6">
							<div className="relative h-[50vh] sm:h-[55vh] md:h-[65vh] lg:h-[75vh]">
								{/* Main card - more tilt, animated */}
								<div className="animate-hero-tilt absolute top-0 right-0 h-[72%] w-[82%] -rotate-6 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/15 transition-transform duration-700 will-change-transform">
									<Image
										src="https://cdn.sanity.io/images/qgy6qhm1/production/0808a2eff7e220e5a1388048eec744a34130b288-6000x4000.jpg"
										alt="Trail runner on a ridge"
										fill
										priority
										fetchPriority="high"
										quality={85}
										sizes="(min-width: 1024px) 41vw, (min-width: 768px) 50vw, 100vw"
										className="object-cover"
									/>
								</div>

								{/* Accent card - more tilt, animated */}
								<div className="animate-hero-tilt-reverse absolute bottom-0 left-0 h-[62%] w-[72%] rotate-12 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/15 transition-transform duration-700 will-change-transform">
									<Image
										src="https://cdn.sanity.io/images/qgy6qhm1/production/27d494a084b28c73270946755e0811592b67bd22-4160x6240.jpg"
										alt="Trail Running Community trail running community"
										fill
										quality={80}
										sizes="(min-width: 1024px) 36vw, (min-width: 768px) 50vw, 100vw"
										className="object-cover"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Mission Section - Large image with content */}
			<section className="bg-secondary py-28 md:py-44 lg:py-60">
				<div className="container mx-auto px-6 md:px-8 lg:px-12">
					<div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-28">
						{/* Large Image */}
						<div className="relative h-[60vh] w-full overflow-hidden rounded-3xl shadow-2xl lg:h-[75vh]">
							<Image
								src="https://cdn.sanity.io/images/qgy6qhm1/production/7d98d83be1a19d08f8ecc41c0863e2da505827dd-1086x724.jpg"
								alt="Footprints camp group photo"
								fill
								loading="lazy"
								quality={80}
								className="object-cover"
								sizes="(max-width: 1024px) 100vw, 50vw"
							/>
							<div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
							<div className="absolute right-0 bottom-0 left-0 p-8 text-white">
								<p className="mb-2 font-mono text-sm tracking-wider uppercase opacity-80">
									Origin Story
								</p>
								<p className="text-lg font-bold">
									Catalyzed at Footprints Camp, Vermont
								</p>
							</div>
						</div>

						{/* Content */}
						<div className="space-y-12 lg:pl-12">
							<div className="space-y-6">
								<span className="text-primary mb-2 inline-block text-sm font-medium tracking-widest">
									OUR MISSION
								</span>
								<h2 className="text-4xl font-bold md:text-5xl lg:text-6xl">
									Advance access and belonging in trail running—so athletes
									lead, thrive, and stay.
								</h2>
							</div>
							<div className="space-y-7">
								<p className="text-muted-foreground text-lg leading-[1.7] md:text-xl md:leading-[1.7]">
									Trail Running Community is a{' '}
									<strong className="text-foreground font-semibold">
										created and led by people of color
									</strong>{' '}
									initiative rooted in a simple belief: the trails belong to
									everyone—and so does the power to shape the sport.
								</p>
								<p className="text-muted-foreground text-lg leading-[1.7] md:text-xl md:leading-[1.7]">
									Through funded race entries, mentorship, and community care,
									we turn "first starts" into lasting participation—and
									influence.
								</p>
								<blockquote className="border-primary bg-primary/10 rounded-r-2xl border-l-4 py-4 pl-6">
									<p className="text-foreground text-lg italic md:text-xl">
										"We're not just opening doors. We're building the support
										and community that keeps athletes on the trails—and
										in leadership."
									</p>
								</blockquote>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Programs Section - Full width with image overlays */}
			<section className="bg-primary text-primary-foreground py-28 md:py-44 lg:py-60">
				<div className="container mx-auto px-6 md:px-8 lg:px-12">
					<div className="mb-20 md:mb-28">
						<span className="text-primary-foreground/60 mb-6 inline-block text-sm font-medium tracking-widest">
							HOW WE WORK
						</span>
						<h2 className="mb-8 text-4xl font-bold md:text-5xl lg:text-6xl">
							Three Pillars of Support
						</h2>
						<p className="text-primary-foreground/90 max-w-3xl text-lg leading-relaxed md:text-xl">
							We remove barriers through race funding, mentorship connections,
							and community events—so you can show up, prepare, and feel
							belonging.
						</p>
					</div>

					{/* Program 1 - Athlete Fund - Large hero image */}
					<div className="mb-20 md:mb-32">
						<div className="relative overflow-hidden rounded-3xl">
							<div className="relative h-[60vh] md:h-[70vh] lg:h-[80vh]">
								<Image
									src="https://cdn.sanity.io/images/qgy6qhm1/production/9cad935ec22fa0b59b68eafa8cf3e916ad7b0618-7178x4788.jpg"
									alt="Athlete Fund - race entry support for athletes"
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
											<Heart className="h-5 w-5 text-white" />
											<span className="text-sm font-bold tracking-wider text-white uppercase">
												BIPOC Athlete Fund
											</span>
										</div>
										<h3 className="mb-4 text-2xl leading-tight font-bold text-white md:text-3xl lg:text-4xl">
											Your Entry Is Covered
										</h3>
										<p className="mb-6 max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">
											Cost shouldn't be the gatekeeper. We cover race
											registration fees entirely so athletes can focus on the
											finish line. Apply for funding and let us handle the rest.
										</p>
										<Button
											variant="outline"
											size="lg"
											className="border-white/30 bg-transparent text-white hover:bg-white hover:text-black"
											asChild
										>
											<Link href="/fund">
												Apply for Funding
												<ArrowRight className="ml-2 h-5 w-5" />
											</Link>
										</Button>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Programs 2 & 3 - Side by side */}
					<div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
						{/* Mentorship */}
						<div className="group relative overflow-hidden rounded-3xl">
							<div className="relative h-[50vh] lg:h-[65vh]">
								<Image
									src="https://cdn.sanity.io/images/qgy6qhm1/production/8f204f7b8f37ee12ebb64459a82b1ce3f68ed25f-768x1024.jpg"
									alt="Mentorship Platform"
									fill
									loading="lazy"
									quality={85}
									sizes="(max-width: 1024px) 100vw, 50vw"
									className="object-cover transition-transform duration-500 group-hover:scale-105"
								/>
								<div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
								<div className="absolute right-0 bottom-0 left-0 p-8 lg:p-10">
									<div className="mb-4 inline-flex items-center gap-3 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
										<Users className="h-4 w-4 text-white" />
										<span className="text-xs font-bold tracking-wider text-white uppercase">
											Mentorship
										</span>
									</div>
									<h3 className="mb-3 text-xl leading-tight font-bold text-white md:text-2xl">
										Guidance That's Real
									</h3>
									<p className="mb-4 text-sm leading-relaxed text-white/90 md:text-base">
									We match funded athletes with experienced mentors
									for practical planning, regular check-ins, and culturally
									grounded support.
									</p>
									<Button
										variant="outline"
										size="sm"
										className="border-white/30 bg-transparent text-white hover:bg-white hover:text-black"
										asChild
									>
										<Link href="/mentor">Meet Mentors</Link>
									</Button>
								</div>
							</div>
						</div>

						{/* Community Events */}
						<div className="group relative overflow-hidden rounded-3xl">
							<div className="relative h-[50vh] lg:h-[65vh]">
								<Image
									src="https://cdn.sanity.io/images/qgy6qhm1/production/0ea0350d4ab63be4a921202acb7cfc7b98ec1010-721x1092.jpg"
									alt="Community Events"
									fill
									loading="lazy"
									quality={85}
									sizes="(max-width: 1024px) 100vw, 50vw"
									className="object-cover transition-transform duration-500 group-hover:scale-105"
								/>
								<div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
								<div className="absolute right-0 bottom-0 left-0 p-8 lg:p-10">
									<div className="mb-4 inline-flex items-center gap-3 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
										<Mountain className="h-4 w-4 text-white" />
										<span className="text-xs font-bold tracking-wider text-white uppercase">
											Community
										</span>
									</div>
									<h3 className="mb-3 text-xl leading-tight font-bold text-white md:text-2xl">
										Find Your People
									</h3>
									<p className="mb-4 text-sm leading-relaxed text-white/90 md:text-base">
										Shakeouts, group runs, and learning spaces across the PNW
										that build belonging and keep people in the sport. All paces
										welcome.
									</p>
									<Button
										variant="outline"
										size="sm"
										className="border-white/30 bg-transparent text-white hover:bg-white hover:text-black"
										asChild
									>
										<Link href="/events">Join an Event</Link>
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Partners Section */}
			<section className="bg-secondary py-24 md:py-32">
				<div className="container mx-auto px-6 md:px-8 lg:px-12">
					<div className="mb-16 text-center">
						<span className="text-primary mb-4 inline-block text-sm font-medium tracking-widest uppercase">
							Our Partners
						</span>
						<h2 className="mb-5 text-3xl font-bold md:text-4xl">
							Organizations Moving the Sport Forward
						</h2>
						<p className="text-muted-foreground mx-auto max-w-2xl text-lg">
							Race directors, brands, and community partners committed to
							changing the landscape of trail running.
						</p>
					</div>

					{/* Logo Grid */}
					{allCompanies.length > 0 && (
						<div className="mb-16 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
							{allCompanies.map((company) => (
								<div
									key={company._id}
									className="bg-card border-border flex h-24 items-center justify-center rounded-xl border px-4"
								>
									{company.logo?.asset?.url ? (
										<Image
											src={company.logo.asset.url}
											alt={`${company.name || 'Partner'} logo`}
											width={140}
											height={70}
											className="h-14 w-auto max-w-[120px] object-contain opacity-70 grayscale"
										/>
									) : (
										<span className="text-muted-foreground text-center text-sm font-medium">
											{company.name || 'Partner'}
										</span>
									)}
								</div>
							))}
						</div>
					)}

					{/* Partner CTA */}
					<div className="bg-primary text-primary-foreground overflow-hidden rounded-3xl p-10 md:p-16 lg:p-20">
						<div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
							<div className="space-y-6">
								<h3 className="text-3xl font-bold md:text-4xl">
									Ready to move from intent to action?
								</h3>
								<p className="text-primary-foreground/80 text-lg leading-relaxed md:text-xl">
									Co-fund entries, host inclusive events, and share accountable
									impact. Let's work together to build a more equitable
									outdoors.
								</p>
							</div>
							<div className="flex justify-start lg:justify-end">
								<a href="mailto:team@example.com?subject=Partnership%20Inquiry">
									<Button size="lg" variant="outline" className="text-lg">
										Partner With Us
										<ArrowRight className="ml-2 h-5 w-5" />
									</Button>
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>
		</main>
	)
}
