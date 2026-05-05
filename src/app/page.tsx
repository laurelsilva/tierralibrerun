import { ArrowRight, Heart, Users } from 'lucide-react'
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
								NONPROFIT TRAIL ACCESS INITIATIVE
							</span>
							<div
								className="animate-fade-in-up space-y-10 md:space-y-12"
								style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
							>
								<h1
									className="animate-fade-in-up mb-6 text-5xl leading-[1.1] font-bold tracking-[-0.03em] md:text-6xl lg:text-7xl"
									style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
								>
									Where BIPOC Athletes Get to the Start Line.
								</h1>
								<p
									className="text-primary-foreground/90 animate-fade-in-up text-xl leading-relaxed md:text-2xl"
									style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
								>
									Tierra Libre Run funds race entries and pairs runners of color with experienced mentors. Everything we build is organized around a single, concrete goal: your trail race.
								</p>
								<div
									className="animate-fade-in-up flex flex-col gap-4 pt-2 sm:flex-row sm:gap-4"
									style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
								>
									<Button size="lg" variant="outline" asChild>
										<Link href="/fund">
											Apply for Race Entry
											<ArrowRight className="ml-2 h-5 w-5" />
										</Link>
									</Button>
									<Button size="lg" variant="outline" asChild>
										<Link href="/donate">Support Our Work</Link>
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
										alt="Tierra Libre trail running community"
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
									OUR APPROACH
								</span>
								<h2 className="text-4xl font-bold md:text-5xl lg:text-6xl">
									The trail race is the goal. We build everything around it.
								</h2>
							</div>
							<div className="space-y-7">
								<p className="text-muted-foreground text-lg leading-[1.7] md:text-xl md:leading-[1.7]">
									Trail running is built around a specific moment: the race. A date on the calendar. A distance. A start line and a finish line.
								</p>
								<p className="text-muted-foreground text-lg leading-[1.7] md:text-xl md:leading-[1.7]">
									Tierra Libre Run is a nonprofit initiative{' '}
									<strong className="text-foreground font-semibold">
										created and led by people of color.
									</strong>
									{' '}We organize our work around that race moment: funded entry, matched mentor, community at the aid station. Everything with a clear start and a clear finish.
								</p>
								<blockquote className="border-primary bg-primary/10 rounded-r-2xl border-l-4 py-4 pl-6">
									<p className="text-foreground text-lg italic md:text-xl">
										"We are not a run club. We are not a collective. We are trail access infrastructure, built to be precise, durable, and led by the communities we serve."
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
							OUR PROGRAMS
						</span>
						<h2 className="mb-8 text-4xl font-bold md:text-5xl lg:text-6xl">
							Two Programs. One Goal.
						</h2>
						<p className="text-primary-foreground/90 max-w-3xl text-lg leading-relaxed md:text-xl">
							The Athlete Fund and Mentor Program are built to work together, removing the financial barrier and pairing every funded athlete with someone who has been there before.
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
												Athlete Fund
											</span>
										</div>
										<h3 className="mb-4 text-2xl leading-tight font-bold text-white md:text-3xl lg:text-4xl">
											Your Race Entry. Covered.
										</h3>
										<p className="mb-6 max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">
											Select a race from our partner network and apply. If accepted, we cover your registration fee entirely.
										</p>
										<Button
											variant="outline"
											size="lg"
											className="border-white/30 bg-transparent text-white hover:bg-white hover:text-black"
											asChild
										>
											<Link href="/fund">
												Learn About the Fund
												<ArrowRight className="ml-2 h-5 w-5" />
											</Link>
										</Button>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Program 2 - Mentor Program */}
					<div className="group relative overflow-hidden rounded-3xl">
						<div className="relative h-[50vh] lg:h-[65vh]">
							<Image
								src="https://cdn.sanity.io/images/qgy6qhm1/production/8f204f7b8f37ee12ebb64459a82b1ce3f68ed25f-768x1024.jpg"
								alt="Mentorship Program"
								fill
								loading="lazy"
								quality={85}
								sizes="100vw"
								className="object-cover transition-transform duration-500 group-hover:scale-105"
							/>
							<div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
							<div className="absolute right-0 bottom-0 left-0 p-8 lg:p-10">
								<div className="mx-auto max-w-4xl">
									<div className="mb-4 inline-flex items-center gap-3 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
										<Users className="h-4 w-4 text-white" />
										<span className="text-xs font-bold tracking-wider text-white uppercase">
											Mentor Program
										</span>
									</div>
									<h3 className="mb-3 text-xl leading-tight font-bold text-white md:text-2xl">
										Someone Who Has Been There.
									</h3>
									<p className="mb-4 max-w-2xl text-sm leading-relaxed text-white/90 md:text-base">
										Every funded athlete is paired with an experienced mentor of color who has been there before and is ready to help you get to the finish line.
									</p>
									<Button
										variant="outline"
										size="sm"
										className="border-white/30 bg-transparent text-white hover:bg-white hover:text-black"
										asChild
									>
										<Link href="/mentor">About the Mentor Program</Link>
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
							Race Partners &amp; Supporters
						</span>
						<h2 className="mb-5 text-3xl font-bold md:text-4xl">
							The Network Behind the Work
						</h2>
						<p className="text-muted-foreground mx-auto max-w-2xl text-lg">
							Race directors and brand partners who share our commitment to expanding access and making space for runners of color in trail running.
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
									Partner with us.
								</h3>
								<p className="text-primary-foreground/80 text-lg leading-relaxed md:text-xl">
									Race directors: offer supported entries through the Athlete Fund. Brands: co-fund access and reach a community that is new to the sport and here to stay. We build the infrastructure. Together, we expand it.
								</p>
							</div>
							<div className="flex justify-start lg:justify-end">
								<a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'team@tierralibre.run'}?subject=Partnership%20Inquiry`}>
									<Button size="lg" variant="outline" className="text-lg">
										Get In Touch
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
