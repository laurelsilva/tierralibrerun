import { Check, CreditCard, Calendar, HandHeart } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { donateMetadata } from '@/lib/metadata'

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Trail Running Community'
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'team@example.com'
const taxId = process.env.NEXT_PUBLIC_TAX_ID || ''
const donationUrl = process.env.NEXT_PUBLIC_DONATION_URL || ''

export const metadata = donateMetadata

export default function DonatePage() {
	return (
		<div className="bg-secondary text-foreground">
			{/* Hero with bg-primary - Split layout */}
			<section className="bg-primary py-32 md:py-48">
				<div className="container mx-auto px-4 md:px-6">
					<div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-24">
						<div className="text-primary-foreground space-y-8">
							<span className="mb-2 inline-block text-sm font-medium tracking-widest">
								{siteName.toUpperCase()}
							</span>
							<h1 className="mb-6 text-5xl leading-[1.1] font-bold tracking-[-0.03em] md:text-6xl">
								Donate to Our Mission
							</h1>
							<div className="bg-primary-foreground/50 h-0.5 w-20 rounded-full"></div>
							<p className="text-primary-foreground/90 text-xl leading-relaxed md:text-2xl">
								Help us create pathways for athletes to access, enjoy, and lead
								in the sport. Your contribution directly supports programs that
								increase representation, access, and community in trail running.
							</p>
						</div>

						<div className="relative h-[500px] overflow-hidden rounded-3xl md:h-[600px]">
							<Image
								src="https://cdn.sanity.io/images/qgy6qhm1/production/a3497998d2648c43d8b84bdb2d8c197bea3a3e63-6225x4150.jpg"
								alt="Trail community"
								fill
								priority
								className="object-cover"
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Impact areas - Card grid layout */}
			<section className="py-32 md:py-48">
				<div className="container mx-auto px-4 md:px-6">
					<div className="mb-24 text-center">
						<span className="text-primary mb-2 text-sm font-medium tracking-widest">
							HOW FUNDS ARE USED
						</span>
						<h2 className="mt-2 text-5xl font-bold">Your Impact</h2>
					</div>

					<div className="grid grid-cols-1 gap-10 md:grid-cols-3">
						{impactAreas.map((item, index) => (
							<div
								key={index}
								className="bg-primary rounded-3xl p-10 transition-colors duration-300"
							>
								<div className="bg-primary-foreground mb-6 flex h-12 w-12 items-center justify-center rounded-full">
									<span className="text-primary font-bold">{index + 1}</span>
								</div>
								<h3 className="text-primary-foreground text-2xl font-bold">
									{item.title}
								</h3>
								<p className="text-primary-foreground">{item.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Commitments - Clean, visual list with icon */}

			<section className="bg-primary text-primary-foreground py-32 md:py-48">
				<div className="container mx-auto px-4 md:px-6">
					<div className="grid grid-cols-1 items-center gap-16 md:grid-cols-12">
						<div className="md:col-span-5">
							<span className="text-primary-foreground/70 text-sm font-medium tracking-widest">
								TRANSPARENCY
							</span>
							<h2 className="mt-2 mb-10 text-5xl font-bold">Our Commitment</h2>
							<div className="relative aspect-square overflow-hidden rounded-3xl md:aspect-[4/3]">
								<Image
									src="https://cdn.sanity.io/images/qgy6qhm1/production/8f204f7b8f37ee12ebb64459a82b1ce3f68ed25f-768x1024.jpg"
									alt="Trail running community"
									fill
									priority
									quality={90}
									sizes="(max-width: 768px) 100vw, 45vw"
									className="object-cover"
								/>
							</div>
						</div>

						<div className="md:col-span-6 md:col-start-7">
							<div className="space-y-10">
								{commitments.map((item, index) => (
									<div key={index} className="flex items-start gap-4">
										<div className="bg-primary-foreground flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
											<Check className="text-primary h-5 w-5" />
										</div>
										<p className="text-primary-foreground/90 text-xl font-medium">
											{item}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>
			{/* Donation options and form - Premium card layout */}
			<section className="py-32 md:py-48">
				<div className="container mx-auto px-4 md:px-6">
					<div className="mb-24 text-center">
						<span className="text-primary mb-2 text-sm font-medium tracking-widest">
							SUPPORT OUR MISSION
						</span>
						<h2 className="mt-2 text-5xl font-bold">Ways to Give</h2>
					</div>

					<div className="bg-primary overflow-hidden rounded-3xl">
						<div className="grid grid-cols-1 gap-0 md:grid-cols-12">
							{/* Left column - Ways to give */}
							<div className="bg-primary text-primary-foreground p-10 md:col-span-4 md:p-12">
								<div className="space-y-10">
									<div>
										<div className="bg-primary-foreground mb-4 flex h-10 w-10 items-center justify-center rounded-full">
											<CreditCard className="text-primary h-5 w-5" />
										</div>
										<h3 className="mb-3 text-2xl font-bold">
											One-time donation
										</h3>
										<p className="text-primary-foreground/80">
											Make a single contribution to support our work in the
											community.
										</p>
									</div>

									<div>
										<div className="bg-primary-foreground mb-4 flex h-10 w-10 items-center justify-center rounded-full">
											<Calendar className="text-primary h-5 w-5" />
										</div>
										<h3 className="mb-3 text-2xl font-bold">Monthly support</h3>
										<p className="text-primary-foreground/80">
											Become a sustaining supporter with a recurring monthly
											donation.
										</p>
									</div>

									<div>
										<div className="bg-primary-foreground mb-4 flex h-10 w-10 items-center justify-center rounded-full">
											<HandHeart className="text-primary h-5 w-5" />
										</div>
										<h3 className="mb-3 text-2xl font-bold">Sponsor</h3>
										<p className="text-primary-foreground/80">
											For organizations interested in sponsoring specific
											programs or events.
										</p>
									</div>
								</div>

								<div className="border-primary-foreground/20 mt-12 border-t pt-12">
									<p className="text-primary-foreground/80 mb-4">
										The BIPOC Athlete Fund is a 501(c)(3) nonprofit initiative
										with fiscal sponsorship through our nonprofit partner.
										Donations are tax-deductible.
									</p>
									<p className="text-lg font-medium">Tax ID: {taxId}</p>
								</div>
							</div>

							{/* Right column - Donation form */}
							<div id="donate-form" className="bg-primary md:col-span-8">
								{donationUrl ? (
									<iframe
										src={donationUrl}
										name="donateFrame"
										className="h-[600px] w-full md:h-[900px]"
										allowFullScreen
									/>
								) : (
									<div className="flex h-[400px] items-center justify-center">
										<p className="text-muted-foreground">
											Donation form not configured. Set
											NEXT_PUBLIC_DONATION_URL.
										</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Closing CTA */}
			<section className="bg-background py-24 md:py-32">
				<div className="container mx-auto px-4 md:px-6">
					<div className="mx-auto max-w-3xl space-y-8 text-center">
						<h2 className="text-4xl font-bold">Have Questions?</h2>
						<p className="text-muted-foreground text-xl">
							Reach out to us for more information about our programs,
							sponsorship opportunities, or how your donation makes an impact.
						</p>
						<div className="pt-4">
							<Button>
								<a href={`mailto:${contactEmail}`}>Contact Us</a>
							</Button>
						</div>
					</div>
				</div>
			</section>
		</div>
	)
}

const impactAreas = [
	{
		title: 'Race Entry Support',
		description:
			'Sponsor athletes at major races. Provide registration fees, travel stipends, and community connections.',
	},
	{
		title: 'Annual Retreat',
		description:
			'Support our first annual multi-day immersive trail running experience focused on community building, skill development, and storytelling.',
	},
]

const commitments = [
	'All donations directly support community programs and participants',
	'Annual impact reports shared with donors',
	'Transparent allocation of resources to maximize community benefit',
]
