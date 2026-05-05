import { Shield, AlertTriangle, Mail } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'team@tierralibre.run'

export const metadata = {
	title: 'Code of Conduct | Tierra Libre Run',
	description:
		'How we expect everyone in the Tierra Libre Run community to show up, on the trails and online.',
}

export default function CodeOfConductPage() {
	return (
		<main className="bg-background text-foreground">
			{/* Hero */}
			<section className="bg-primary py-24 md:py-32">
				<div className="container mx-auto px-4 md:px-6">
					<div className="mx-auto max-w-3xl text-center">
						<div className="bg-primary-foreground text-primary mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full">
							<Shield className="h-8 w-8" />
						</div>
						<h1 className="text-primary-foreground mb-6 text-5xl font-bold leading-tight md:text-6xl">
							Code of Conduct
						</h1>
						<p className="text-primary-foreground/90 text-xl leading-relaxed">
							Short version: be a good person, take care of people around you, and leave places better than you found them. Here is what that means in practice.
						</p>
					</div>
				</div>
			</section>

			{/* Content */}
			<section className="py-20 md:py-32">
				<div className="container mx-auto px-4 md:px-6">
					<div className="mx-auto max-w-3xl space-y-20">

						{/* Who This Applies To */}
						<div>
							<h2 className="mb-6 text-3xl font-bold">Who This Applies To</h2>
							<p className="text-muted-foreground text-lg leading-relaxed">
								This applies to everyone participating in Tierra Libre Run, including athletes, mentors, volunteers, and staff. It covers all Tierra Libre Run spaces: Slack, social media, group runs, races, and any event we organize or attend as a community.
							</p>
						</div>

						{/* Expected Behavior */}
						<div>
							<h2 className="mb-6 text-3xl font-bold">How We Show Up</h2>
							<ul className="space-y-5 text-lg text-muted-foreground leading-relaxed">
								<li className="flex gap-4">
									<span className="text-primary font-bold mt-0.5">01</span>
									<span><strong className="text-foreground">Respect people.</strong> Treat everyone with basic dignity. Address people the way they ask to be addressed.</span>
								</li>
								<li className="flex gap-4">
									<span className="text-primary font-bold mt-0.5">02</span>
									<span><strong className="text-foreground">Stay on trail, literally and figuratively.</strong> Do not undermine, exclude, or talk over others. This community exists because runners of color have been excluded from mainstream trail culture. Act accordingly.</span>
								</li>
								<li className="flex gap-4">
									<span className="text-primary font-bold mt-0.5">03</span>
									<span><strong className="text-foreground">Keep shared information private.</strong> What people share in this community stays here unless they explicitly say otherwise.</span>
								</li>
								<li className="flex gap-4">
									<span className="text-primary font-bold mt-0.5">04</span>
									<span><strong className="text-foreground">Leave no trace.</strong> Practice Leave No Trace on every run. Pack out what you pack in. Stay on trail. Respect the land.</span>
								</li>
								<li className="flex gap-4">
									<span className="text-primary font-bold mt-0.5">05</span>
									<span><strong className="text-foreground">No one gets left behind.</strong> On group runs, wait at trail junctions. Check in on slower runners. Look out for each other in remote areas.</span>
								</li>
								<li className="flex gap-4">
									<span className="text-primary font-bold mt-0.5">06</span>
									<span><strong className="text-foreground">Take feedback seriously.</strong> If someone tells you that your behavior caused harm, listen. You do not have to agree, but you do have to take it seriously.</span>
								</li>
							</ul>
						</div>

						{/* What Is Not Okay */}
						<div>
							<div className="flex items-center gap-3 mb-6">
								<AlertTriangle className="text-primary h-6 w-6 shrink-0" />
								<h2 className="text-3xl font-bold">What Is Not Okay</h2>
							</div>
							<p className="text-muted-foreground text-lg leading-relaxed mb-8">
								The following behaviors will result in removal from the community, temporary or permanent depending on severity:
							</p>
							<ul className="space-y-4 text-lg text-muted-foreground leading-relaxed">
								<li className="flex gap-3">
									<span className="text-primary mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary block" />
									<span>Harassment, discrimination, or intimidation of any kind</span>
								</li>
								<li className="flex gap-3">
									<span className="text-primary mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary block" />
									<span>Sexual harassment or unwanted contact</span>
								</li>
								<li className="flex gap-3">
									<span className="text-primary mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary block" />
									<span>Slurs, hate speech, or derogatory comments targeting any person or group</span>
								</li>
								<li className="flex gap-3">
									<span className="text-primary mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary block" />
									<span>Sharing someone's personal information without their permission</span>
								</li>
								<li className="flex gap-3">
									<span className="text-primary mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary block" />
									<span>Unsolicited comments about body size, pace, gear, food, or fitness level</span>
								</li>
								<li className="flex gap-3">
									<span className="text-primary mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary block" />
									<span>Abandoning slower runners in unsafe trail conditions</span>
								</li>
								<li className="flex gap-3">
									<span className="text-primary mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary block" />
									<span>Damaging trails or violating Leave No Trace principles</span>
								</li>
								<li className="flex gap-3">
									<span className="text-primary mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary block" />
									<span>Deliberate disruption of events, conversations, or community spaces</span>
								</li>
							</ul>
						</div>

						{/* Reporting */}
						<div>
							<div className="flex items-center gap-3 mb-6">
								<Mail className="text-primary h-6 w-6 shrink-0" />
								<h2 className="text-3xl font-bold">Reporting an Issue</h2>
							</div>
							<p className="text-muted-foreground text-lg leading-relaxed mb-6">
								If someone's behavior makes you uncomfortable or violates these guidelines, contact us. All reports are taken seriously. In an emergency, call 911 first.
							</p>
							<div className="bg-card rounded-2xl border border-border p-8 space-y-4">
								<p className="text-lg">
									<strong>Email: </strong>
									<a href={`mailto:${contactEmail}`} className="text-primary underline underline-offset-2">
										{contactEmail}
									</a>
								</p>
								<p className="text-muted-foreground text-base">
									At events: find any Tierra Libre Run staff or volunteer.
								</p>
								<p className="text-muted-foreground text-base">
									We will respond within 24 hours and handle every report with confidentiality.
								</p>
							</div>
						</div>

						{/* Consequences */}
						<div>
							<h2 className="mb-6 text-3xl font-bold">Consequences</h2>
							<div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
								<p>Consequences are proportional to the severity and pattern of behavior:</p>
								<ul className="space-y-3 mt-4">
									<li className="flex gap-3">
										<span className="text-primary font-bold mt-0.5">1.</span>
										<span><strong className="text-foreground">Conversation.</strong> For minor or first-time issues, we have a direct conversation about impact and expectations.</span>
									</li>
									<li className="flex gap-3">
										<span className="text-primary font-bold mt-0.5">2.</span>
										<span><strong className="text-foreground">Temporary removal.</strong> For repeated or serious violations, removal from community spaces for a defined period.</span>
									</li>
									<li className="flex gap-3">
										<span className="text-primary font-bold mt-0.5">3.</span>
										<span><strong className="text-foreground">Permanent removal.</strong> For severe violations or a clear pattern of harmful behavior.</span>
									</li>
								</ul>
							</div>
						</div>

						<div className="border-t border-border pt-12 text-muted-foreground text-sm space-y-2">
							<p><strong>Last updated:</strong> May 2026</p>
							<p>Questions about these guidelines? Email us at <a href={`mailto:${contactEmail}`} className="text-primary underline underline-offset-2">{contactEmail}</a>.</p>
						</div>

					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="bg-primary text-primary-foreground py-16 md:py-24">
				<div className="container mx-auto px-4 text-center md:px-6">
					<div className="mx-auto max-w-xl space-y-6">
						<h2 className="text-3xl font-bold">Ready to be part of it?</h2>
						<p className="text-primary-foreground/80 text-lg">
							Explore the programs and apply to join the Tierra Libre Run community.
						</p>
						<div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
							<Button size="lg" variant="outline" asChild>
								<Link href="/fund">Athlete Fund</Link>
							</Button>
							<Button size="lg" variant="outline" asChild>
								<Link href="/mentor">Mentor Program</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>
		</main>
	)
}
