import {
	Shield,
	Users,
	MessageCircle,
	Heart,
	Leaf,
	TrendingUp,
	MapPin,
	AlertTriangle,
	BookOpen,
	Mail
} from 'lucide-react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'

// Custom components for better organization

function CommunitySection({
	title,
	children
}: {
	title: string
	children: React.ReactNode
}) {
	return (
		<div className="mb-12">
			<h3 className="mt-12 mb-6 text-2xl font-medium tracking-tight">
				{title}
			</h3>
			{children}
		</div>
	)
}

export const metadata = {
	title: 'Code of Conduct | Trail Running Community',
	description:
		'Our community guidelines for creating accountable, inclusive spaces where all athletes can thrive.'
}

export default function CodeOfConductPage() {
	return (
		<main className="bg-background text-foreground">
			{/* Hero Section */}
			<section className="bg-primary py-24 md:py-32">
				<div className="container mx-auto px-4 md:px-6">
					<div className="mx-auto max-w-4xl text-center">
						<div className="bg-primary-foreground text-primary mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full">
							<Shield className="h-10 w-10" />
						</div>
						<h1 className="text-primary-foreground mb-12 text-5xl leading-tight font-bold md:text-7xl">
							Code of Conduct
						</h1>
						<p className="text-primary-foreground text-xl leading-relaxed md:text-2xl">
						Creating accountable, inclusive spaces where all athletes
						can thrive
						</p>
					</div>
				</div>
			</section>

			{/* Main Content */}
			<section className="py-16 md:py-24">
				<div className="container mx-auto px-4 md:px-6">
					<div className="mx-auto max-w-4xl">
						<h2 className="mt-16 mb-12 text-5xl font-bold">Our Mission</h2>

						<p className="mb-12 text-2xl leading-relaxed">
							Trail Running Community builds community where athletes
							thrive. We create spaces for authentic connection, share
							resources, and support each other's growth on the trails and
							beyond.
						</p>

						<p className="text-muted-foreground mb-12 text-center text-lg leading-relaxed">
							This Code of Conduct applies everywhere we gather—online
							platforms, group runs, races, community meetings, and any space
							representing our community. We welcome all athletes,
							including queer, trans, immigrant, and disabled community members.
						</p>

						<h2 className="mt-20 mb-12 text-5xl font-bold">Our Values</h2>

						<div className="grid grid-cols-1 gap-16 md:grid-cols-2">
							<div className="bg-card rounded-3xl p-10 text-center shadow-sm">
								<div className="mb-6 flex justify-center">
									<Users className="text-primary h-8 w-8" />
								</div>
								<h3 className="mb-6 text-3xl font-bold">Representation</h3>
								<p className="text-muted-foreground text-xl leading-relaxed">
								Athletes deserve to see themselves leading in trail
								running. We amplify diverse voices and celebrate all our
								stories, especially centering queer, trans, immigrant, and
								disabled athletes.
								</p>
							</div>

							<div className="bg-card rounded-3xl p-10 text-center shadow-sm">
								<div className="mb-6 flex justify-center">
									<Heart className="text-primary h-8 w-8" />
								</div>
								<h3 className="mb-6 text-3xl font-bold">Community</h3>
								<p className="text-muted-foreground text-xl leading-relaxed">
									Trail running is better together. We build real relationships
									through shared miles and honest conversations.
								</p>
							</div>

							<div className="bg-card rounded-3xl p-10 text-center shadow-sm">
								<div className="mb-6 flex justify-center">
									<BookOpen className="text-primary h-8 w-8" />
								</div>
								<h3 className="mb-6 text-3xl font-bold">Access</h3>
								<p className="text-muted-foreground text-xl leading-relaxed">
									Money shouldn't determine who gets to race. We remove barriers
									and fund opportunities for athletes who need support.
								</p>
							</div>

							<div className="bg-card rounded-3xl p-10 text-center shadow-sm">
								<div className="mb-6 flex justify-center">
									<MessageCircle className="text-primary h-8 w-8" />
								</div>
								<h3 className="mb-6 text-3xl font-bold">Community Care</h3>
								<p className="text-muted-foreground text-xl leading-relaxed">
									We share knowledge, encouragement, and practical advice.
									Everyone learns from someone, everyone teaches someone.
								</p>
							</div>

							<div className="bg-card rounded-3xl p-10 text-center shadow-sm">
								<div className="mb-6 flex justify-center">
									<Leaf className="text-primary h-8 w-8" />
								</div>
								<h3 className="mb-6 text-3xl font-bold">Land Respect</h3>
								<p className="text-muted-foreground text-xl leading-relaxed">
									We honor Indigenous heritage on every trail and practice Leave
									No Trace principles everywhere we run.
								</p>
							</div>

							<div className="bg-card rounded-3xl p-10 text-center shadow-sm">
								<div className="mb-6 flex justify-center">
									<TrendingUp className="text-primary h-8 w-8" />
								</div>
								<h3 className="mb-6 text-3xl font-bold">Growth</h3>
								<p className="text-muted-foreground text-xl leading-relaxed">
									Every athlete starts somewhere. We meet people where they are
									and support their journey forward, recognizing the unique
									challenges faced by immigrants, first-generation athletes, and
									those new to outdoor spaces.
								</p>
							</div>
						</div>

						<h2 className="mt-20 mb-12 text-5xl font-bold">
							How We Build Community
						</h2>

						<p className="mb-12 text-xl leading-relaxed">
							Here's what you can expect when you join our community and how we
							support each other:
						</p>

						<CommunitySection title="On the Trails">
							<ul className="mb-8 space-y-6 text-lg">
								<li>
									<strong className="font-medium">
										Support for ALL Paces:
									</strong>{' '}
									We wait for slower runners at trail junctions and ensure
									everyone has someone to run and chat with
								</li>
								<li>
									<strong className="font-medium">Celebrate Everyone:</strong>{' '}
									Every finish time matters, whether you're first place or back
									of pack. Showing up is the victory
								</li>
								<li>
									<strong className="font-medium">Safety First:</strong> We
									share local trail knowledge, safety tips, and make sure no one
									gets left behind in unsafe situations
								</li>
							</ul>
						</CommunitySection>

						<CommunitySection title="In Conversations">
							<ul className="mb-8 space-y-6 text-lg">
								<li>
									<strong className="font-medium">Respect Identity:</strong> Use
									the names and pronouns people share with you—if you're unsure,
									it's okay to ask politely
								</li>
								<li>
									<strong className="font-medium">Listen to Learn:</strong>{' '}
									Listen more than you speak, especially about others'
									experiences of trail running and life
								</li>
								<li>
									<strong className="font-medium">Ask with Care:</strong> Ask
									questions to understand, not to challenge someone's reality or
									lived experience
								</li>
								<li>
									<strong className="font-medium">Honor Privacy:</strong> Keep
									personal stories confidential unless given clear permission to
									share
								</li>
							</ul>
						</CommunitySection>

						<CommunitySection title="In Our Community">
							<ul className="mb-8 space-y-6 text-lg">
								<li>
								<strong className="font-medium">Center Voices of Color:</strong>{' '}
								We prioritize perspectives of people of color in discussions about trail
									running, equity, and community building
								</li>
								<li>
									<strong className="font-medium">Make Space:</strong> If you
									speak up often, make room for quieter voices. If you rarely
									share, we want to hear from you
								</li>
								<li>
									<strong className="font-medium">Growth Mindset:</strong>{' '}
									Accept feedback gracefully when someone points out harm—we're
									all learning
								</li>
								<li>
									<strong className="font-medium">Impact Over Intent:</strong>{' '}
									Focus on how actions affect others, not just what you meant to
									do
								</li>
							</ul>
						</CommunitySection>

						<h2 className="mt-20 mb-12 text-5xl font-bold">
							Community Boundaries
						</h2>

						<p className="mb-12 text-xl leading-relaxed">
							These behaviors harm our community and are not tolerated:
						</p>

						<div className="space-y-8">
							<div className="bg-card rounded-3xl p-10 shadow-sm">
								<div className="mb-6 flex items-center">
									<AlertTriangle className="text-primary mr-3 h-6 w-6" />
									<h4 className="text-lg font-bold">
										Harassment & Discrimination
									</h4>
								</div>
								<ul className="space-y-4 text-base leading-7">
									<li>
										• Discriminatory comments about race, gender, sexuality,
										religion, ability, or body size
									</li>
									<li>• Sexual harassment of any kind</li>
									<li>• Following someone who's asked for space</li>
									<li>• Deliberately using wrong names or pronouns</li>
									<li>
										• Hate speech, slurs, or derogatory language targeting any
										group
									</li>
									<li>
										• Erasing or dismissing intersectional experiences within
										our community of color
									</li>
									<li>
										• Discriminatory comments about immigration status, accent,
										or English proficiency
									</li>
									<li>
										• Questioning someone's "authenticity" based on mixed-race
										identity, skin tone, or cultural expression
									</li>
								</ul>
							</div>

							<div className="bg-card rounded-3xl p-10 shadow-sm">
								<div className="mb-6 flex items-center">
									<AlertTriangle className="text-primary mr-3 h-6 w-6" />
									<h4 className="text-lg font-bold">Disruptive Behavior</h4>
								</div>
								<ul className="space-y-4 text-base leading-7">
									<li>
										• Dominating conversations or refusing to let others speak
									</li>
									<li>
										• Sharing others' personal information without permission
									</li>
									<li>
										• Centering yourself when others are sharing their
										experiences, especially about racism, transphobia,
										homophobia, or other forms of discrimination
									</li>
									<li>
										• Demanding "proof" when someone describes discrimination
										they've faced, especially regarding intersectional
										experiences
									</li>
									<li>
										• Outing someone's LGBTQ+ status, immigration status, or
										other personal information
									</li>
									<li>• Disrupting community events or online discussions</li>
								</ul>
							</div>

							<div className="bg-card rounded-3xl p-10 shadow-sm">
								<div className="mb-6 flex items-center">
									<MapPin className="text-primary mr-3 h-6 w-6" />
									<h4 className="text-lg font-bold">Trail & Event Behavior</h4>
								</div>
								<ul className="space-y-4 text-base leading-7">
									<li>• Leaving slower runners behind in unsafe situations</li>
									<li>
										• Damaging trails or leaving trash (violating Leave No
										Trace)
									</li>
									<li>
										• Unsolicited comments about others' pace, gear choices, or
										race results
									</li>
									<li>
										• Promoting diet culture or making food rules for others
									</li>
									<li>
										• Body shaming or commenting on eating habits, especially
										targeting cultural foods or dietary practices
									</li>
									<li>
										• Making assumptions about someone's fitness level, running
										experience, or outdoor knowledge based on their identities
									</li>
								</ul>
							</div>
						</div>

						<h2 className="mt-20 mb-12 text-5xl font-bold">
							Access & Inclusion
						</h2>

						<p className="mb-12 text-xl leading-relaxed">
							Trail running should be for everyone. We work to remove barriers
							through:
						</p>

						<div className="bg-card rounded-3xl p-10 shadow-sm">
							<div className="mb-6 flex items-center">
								<BookOpen className="text-primary mr-3 h-6 w-6" />
								<h4 className="text-lg font-bold">How We Create Access</h4>
							</div>
							<ul className="space-y-5 text-base leading-7">
								<li>
									<strong>Financial Support:</strong> Race entries, gear, and
									travel funding through our Athlete Fund
								</li>
								<li>
									<strong>Clear Communication:</strong> We use plain language
									and explain trail running terms for newcomers
								</li>
								<li>
									<strong>Digital Accessibility:</strong> Our content works with
									screen readers and other assistive technologies, and we
									provide translation support when possible
								</li>
								<li>
									<strong>Custom Solutions:</strong> We problem-solve
									accommodations together when you need support, recognizing
									that queer, trans, immigrant, and disabled athletes may
									face unique barriers
								</li>
							</ul>

							<p className="text-muted-foreground mt-6 text-base leading-7 italic">
								Need accommodations to participate? Email team@example.com.
								We're here to figure it out together.
							</p>
						</div>

						<h2 className="mt-20 mb-12 text-5xl font-bold">
							Honoring the Land
						</h2>

						<p className="mb-12 text-xl leading-relaxed">
							Every trail we run has been stewarded by Indigenous communities
							for thousands of years. We honor this by:
						</p>

						<div className="bg-card rounded-3xl p-10 shadow-sm">
							<div className="mb-6 flex items-center">
								<Leaf className="text-primary mr-3 h-6 w-6" />
								<h4 className="text-lg font-bold">
									Land Stewardship Commitments
								</h4>
							</div>
							<ul className="space-y-5 text-base leading-7">
								<li>
									<strong>Learn Local History:</strong> We educate ourselves
									about the Indigenous peoples whose ancestral lands we run on
								</li>
								<li>
									<strong>Support Indigenous Athletes:</strong> We actively
									include and support Indigenous athletes through our programs
								</li>
								<li>
									<strong>Leave No Trace:</strong> We practice trail stewardship
									principles on every run—pack out trash, stay on trail, respect
									wildlife
								</li>
								<li>
									<strong>Amplify Voices:</strong> We center Indigenous
									perspectives in conversations about land use and environmental
									justice
								</li>
							</ul>
						</div>

						<h2 className="mt-20 mb-12 text-5xl font-bold">
							When Things Go Wrong
						</h2>

						<p className="mb-12 text-xl leading-relaxed">
							If someone's behavior makes you uncomfortable or violates these
							guidelines, please let us know. Every report helps us build a
							better community.
						</p>

						<div className="bg-card rounded-3xl p-10 shadow-sm">
							<div className="mb-6 flex items-center">
								<Mail className="text-primary mr-3 h-6 w-6" />
								<h4 className="text-lg font-bold">Reporting & Response</h4>
							</div>
							<div className="space-y-8">
								<div>
									<h4 className="mb-4 text-lg font-bold">How to Report</h4>
									<ul className="mb-6 space-y-3 text-base leading-7">
										<li>
											<strong>Email:</strong>{' '}
											<a
												href="mailto:team@example.com"
												className="text-primary underline">
												team@example.com
											</a>
										</li>
										<li>
											<strong>At events:</strong> Find any team member wearing a
											Trail Running Community shirt
										</li>
										<li>
											<strong>Online:</strong> Use platform report features or
											message moderators directly
										</li>
									</ul>

									<p className="mb-6 text-base font-medium">
										<strong>In an emergency:</strong> Call 911 or local
										emergency services first.
									</p>
								</div>

								<div>
									<h4 className="mb-4 text-lg font-bold">What We'll Do</h4>
									<ul className="space-y-3 text-base leading-7">
										<li>
											• Respond within 24 hours (immediately for urgent
											situations)
										</li>
										<li>• Investigate thoroughly and fairly</li>
										<li>• Take action to stop harmful behavior</li>
										<li>• Support the person who was harmed</li>
										<li>• Follow up to ensure the situation is resolved</li>
									</ul>
								</div>
							</div>
						</div>

						<h2 className="mt-20 mb-12 text-5xl font-bold">Consequences</h2>

						<p className="mb-12 text-xl leading-relaxed">
							Depending on the situation, consequences may include:
						</p>

						<div className="space-y-8">
							<div className="bg-card rounded-3xl p-10 shadow-sm">
								<div className="mb-6 flex items-center">
									<MessageCircle className="text-primary mr-3 h-6 w-6" />
									<h4 className="text-lg font-bold">Community Conversation</h4>
								</div>
								<p className="text-base leading-7">
									Discussion about impact and expectations for minor issues or
									first-time problems. We believe in education and growth when
									possible.
								</p>
							</div>

							<div className="bg-card rounded-3xl p-10 shadow-sm">
								<div className="mb-6 flex items-center">
									<AlertTriangle className="text-primary mr-3 h-6 w-6" />
									<h4 className="text-lg font-bold">Temporary Break</h4>
								</div>
								<p className="text-base leading-7">
									1 week to 6 months away from community spaces for repeated or
									serious violations. Time to reflect and demonstrate changed
									behavior.
								</p>
							</div>

							<div className="bg-card rounded-3xl p-10 shadow-sm">
								<div className="mb-6 flex items-center">
									<Shield className="text-primary mr-3 h-6 w-6" />
									<h4 className="text-lg font-bold">Permanent Removal</h4>
								</div>
								<p className="text-base leading-7">
									Banned from all community spaces for severe violations or
									pattern of harmful behavior. Community safety comes first.
								</p>
							</div>
						</div>

						<p className="text-muted-foreground mt-12 text-center text-lg italic">
							We prioritize education and accountability, but the safety of our
							community members comes first.
						</p>

						<h2 className="mt-20 mb-12 text-5xl font-bold">Growing Together</h2>

						<p className="text-muted-foreground mb-12 text-center text-xl leading-relaxed">
							This Code of Conduct evolves as our community grows. We welcome
							your feedback on how to make these guidelines more effective and
							inclusive for all athletes, including our queer, trans,
							immigrant, and disabled community members.
						</p>

						<div className="bg-card rounded-3xl p-10 shadow-sm">
							<div className="mb-6 flex items-center">
								<Mail className="text-primary mr-3 h-6 w-6" />
								<h4 className="text-lg font-bold">Join the Conversation</h4>
							</div>
							<p className="mb-6 text-base leading-7">
								Email us at{' '}
								<a
									href="mailto:team@example.com"
									className="text-primary font-medium underline">
									team@example.com
								</a>{' '}
								with suggestions, questions, or stories about how these
								guidelines work in practice.
							</p>

							<div className="text-muted-foreground space-y-3 text-sm">
								<p>
									<strong>Last updated:</strong> July 2025
								</p>
								<p>
									<strong>Inspired by:</strong> Disability justice principles
									(Sins Invalid), adrienne maree brown's work, and community
									frameworks from Black In Neuro and Game Devs of Color Expo.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Contact CTA */}
			<section className="bg-primary text-primary-foreground py-16 md:py-24">
				<div className="container mx-auto px-4 text-center md:px-6">
					<div className="mx-auto max-w-3xl">
						<h2 className="mb-12 text-5xl font-bold">Questions or Concerns?</h2>
						<p className="text-primary-foreground mb-12 text-2xl leading-relaxed">
							We're here to support our community. If you have questions about
							these guidelines or need to report an issue, please reach out.
						</p>

						<div className="flex flex-col justify-center gap-4 sm:flex-row">
							<Button size="lg" variant="outline" asChild>
								<Link href="/dashboard">Return to Community</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>
		</main>
	)
}
